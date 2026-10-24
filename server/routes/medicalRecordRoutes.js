import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/authMiddleware.js';
import { MedicalRecordService } from '../services/medicalRecordService.js';
import { SecureStorageService } from '../services/secureStorageService.js';
import { processMedicalDocument } from '../services/clinical/medicalPipelineService.js';
import { HealthSummaryService } from '../services/clinical/healthSummaryService.js';
import { validateDocument, MAX_FILE_SIZE_BYTES } from '../utils/documentValidator.js';
import { db } from '../db/database.js';
import { getOcrProvider } from '../services/ocr/ocrFactory.js';

export const medicalRecordRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 }
});

// ============================================================================
// 1. HOSPITAL VISITS
// ============================================================================

/**
 * POST /api/visits
 * Create or select an existing visit for a given clinical date and hospital
 */
medicalRecordRouter.post('/visits', requireAuth, (req, res, next) => {
  try {
    const { hospitalId, visitDate, physicianName, department, reasonForVisit, idempotencyKey } = req.body;

    if (!hospitalId || !visitDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Hospital ID and Visit Date (YYYY-MM-DD) are required.'
        }
      });
    }

    const visit = MedicalRecordService.createOrFindVisit(req.user.id, {
      hospitalId,
      visitDate,
      physicianName,
      department,
      reasonForVisit,
      idempotencyKey
    });

    res.status(201).json({
      success: true,
      data: visit
    });
  } catch (err) {
    if (err.message.includes('unauthorized') || err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: { code: 'HOSPITAL_NOT_FOUND', message: err.message }
      });
    }
    if (err.message.includes('Invalid visit date format')) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATE_FORMAT', message: err.message }
      });
    }
    next(err);
  }
});

// ============================================================================
// 2. TIMELINE (Genuine empty state when no records)
// ============================================================================

/**
 * GET /api/timeline
 * Retrieve chronological timeline of all visits and attached reports
 */
medicalRecordRouter.get('/timeline', requireAuth, (req, res, next) => {
  try {
    const timeline = MedicalRecordService.getUserTimeline(req.user.id);
    res.json({
      success: true,
      data: timeline,
      count: timeline.length
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 3. MEDICAL REPORTS
// ============================================================================

/**
 * GET /api/reports
 * List reports with optional category or text search filters
 */
medicalRecordRouter.get('/reports', requireAuth, (req, res, next) => {
  try {
    const { category, search } = req.query;
    const reports = MedicalRecordService.getUserReports(req.user.id, {
      category,
      searchQuery: search
    });

    res.json({
      success: true,
      data: reports,
      count: reports.length
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/reports
 * Attach a medical report to a hospital visit.
 * Accepts multipart/form-data with file or JSON with base64Content.
 * Idempotent, deduplicates by SHA-256 hash or idempotency key.
 */
medicalRecordRouter.post('/reports', requireAuth, upload.single('document'), async (req, res, next) => {
  try {
    let fileBuffer;
    let mimeType;
    let fileName;

    if (req.file) {
      fileBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
      fileName = req.file.originalname;
    } else if (req.body && req.body.base64Content) {
      fileBuffer = Buffer.from(req.body.base64Content, 'base64');
      mimeType = req.body.mimeType || 'application/pdf';
      fileName = req.body.fileName || 'uploaded_medical_report.pdf';
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FILE',
          message: "A medical document file ('document' or 'base64Content') is required."
        }
      });
    }

    const {
      visitId: providedVisitId,
      hospitalId,
      hospitalName,
      hospitalBranch,
      hospitalLocation,
      hospitalDepartment,
      visitDate,
      reportDate,
      title,
      category,
      physicianName,
      idempotencyKey,
      ocrResult: preOcr,
      aiAnalysis: preAi
    } = req.body;

    // Validate reportDate (must NOT default to upload time)
    const effectiveReportDate = reportDate || (visitDate && /^\d{4}-\d{2}-\d{2}$/.test(visitDate) ? visitDate : null);
    if (!effectiveReportDate || !/^\d{4}-\d{2}-\d{2}$/.test(effectiveReportDate)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REPORT_DATE',
          message: "Report date must be a valid 'YYYY-MM-DD' clinical date. Upload timestamp cannot be used as substitute."
        }
      });
    }

    // Resolve or create Visit
    let targetVisitId = providedVisitId;
    if (!targetVisitId) {
      // Must have hospital info
      let targetHospitalId = hospitalId;
      if (!targetHospitalId && hospitalName) {
        const hospital = MedicalRecordService.createOrSelectHospital(req.user.id, {
          name: hospitalName,
          branch: hospitalBranch,
          location: hospitalLocation,
          department: hospitalDepartment
        });
        targetHospitalId = hospital.id;
      }

      if (!targetHospitalId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_VISIT_OR_HOSPITAL',
            message: 'Must provide either visitId, or hospitalId/hospitalName + visitDate.'
          }
        });
      }

      const effectiveVisitDate = (visitDate && /^\d{4}-\d{2}-\d{2}$/.test(visitDate)) ? visitDate : reportDate;
      const visit = MedicalRecordService.createOrFindVisit(req.user.id, {
        hospitalId: targetHospitalId,
        visitDate: effectiveVisitDate,
        physicianName
      });
      targetVisitId = visit.id;
    }

    // Run OCR and Clinical Analysis if not provided
    let ocrResult = preOcr ? (typeof preOcr === 'string' ? JSON.parse(preOcr) : preOcr) : null;
    let aiAnalysis = preAi ? (typeof preAi === 'string' ? JSON.parse(preAi) : preAi) : null;
    const documentType = req.body.documentType || (category === 'Prescription' ? 'prescription' : 'lab_report');
    let processingStatus = req.body.status || req.body.processingStatus || (documentType === 'prescription' ? 'user_verified' : 'completed');
    let failureCode = null;
    let failureReason = null;

    if (!aiAnalysis) {
      try {
        aiAnalysis = await processMedicalDocument({
          fileBuffer,
          mimeType,
          ocrResult,
          overrideCategory: category || null,
          fileName,
          documentType
        });
        ocrResult = aiAnalysis.rawOcr || ocrResult;
      } catch (pipelineErr) {
        console.warn('[Report Ingestion Pipeline Warning]', pipelineErr.message);
        processingStatus = 'failed';
        failureCode = pipelineErr.code || 'PIPELINE_ERROR';
        failureReason = pipelineErr.message;
      }
    } else if (!ocrResult && aiAnalysis.rawOcr) {
      ocrResult = aiAnalysis.rawOcr;
    }

    // If still no ocrResult but we have a valid fileBuffer, execute OCR to persist verbatim text
    if (!ocrResult && fileBuffer) {
      try {
        const ocrProvider = getOcrProvider();
        ocrResult = await ocrProvider.processDocument(fileBuffer, mimeType, { fileName, overrideCategory: category || null });
      } catch (ocrErr) {
        console.warn('[Report Ingestion OCR Fallback Warning]', ocrErr.message);
      }
    }

    // Ingest and attach report
    const reportRecord = await MedicalRecordService.attachReport({
      userId: req.user.id,
      visitId: targetVisitId,
      title: title || (aiAnalysis?.documentType ? `${aiAnalysis.documentType} - ${effectiveReportDate}` : fileName),
      category: category || aiAnalysis?.documentType || 'Lab Report',
      reportDate: effectiveReportDate,
      fileBuffer,
      fileName,
      mimeType,
      idempotencyKey,
      ocrResult,
      aiAnalysis,
      processingStatus,
      failureCode,
      failureReason
    });

    res.status(201).json({
      success: true,
      data: reportRecord
    });
  } catch (err) {
    if (err.message.includes('unauthorized') || err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: err.message }
      });
    }
    next(err);
  }
});

/**
 * GET /api/reports/:id
 * Retrieve details for a specific report
 */
medicalRecordRouter.get('/reports/:id', requireAuth, (req, res, next) => {
  try {
    const report = MedicalRecordService.getReportById(req.user.id, req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REPORT_NOT_FOUND',
          message: 'Medical report not found or access denied.'
        }
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/reports/:id
 * Update metadata corrections for an existing report
 */
medicalRecordRouter.patch('/reports/:id', requireAuth, (req, res, next) => {
  try {
    const updated = MedicalRecordService.updateReportMetadata(req.user.id, req.params.id, req.body);
    res.json({
      success: true,
      data: updated
    });
  } catch (err) {
    if (err.message.includes('unauthorized') || err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: { code: 'REPORT_NOT_FOUND', message: err.message }
      });
    }
    next(err);
  }
});

/**
 * DELETE /api/reports/:id
 * Delete report with authorization and private file cleanup
 */
medicalRecordRouter.delete('/reports/:id', requireAuth, (req, res, next) => {
  try {
    const result = MedicalRecordService.deleteReport(req.user.id, req.params.id);
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    if (err.message.includes('unauthorized') || err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REPORT_NOT_FOUND',
          message: 'Medical report not found or unauthorized.'
        }
      });
    }
    next(err);
  }
});

/**
 * GET /api/reports/:id/download
 * Secure document download via Bearer token OR short-lived signed URL (?token=...)
 */
medicalRecordRouter.get('/reports/:id/download', (req, res, next) => {
  try {
    const reportId = req.params.id;
    let authenticatedUserId = null;

    // Check signed URL token in query parameter
    if (req.query.token) {
      const decoded = SecureStorageService.verifySignedToken(req.query.token, null, reportId);
      authenticatedUserId = decoded.sub;
    } else {
      // Check Bearer token in headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required. Provide Bearer token or valid signed ?token parameter.'
          }
        });
      }
      const token = authHeader.substring(7).trim();
      const decoded = SecureStorageService.verifySignedToken(token, null, reportId);
      authenticatedUserId = decoded.sub;
    }

    // Retrieve report to verify ownership and get storage path
    const report = db.prepare(`
      SELECT * FROM medical_reports WHERE id = ? AND user_id = ?
    `).get(reportId, authenticatedUserId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'The requested document does not exist or access is forbidden.'
        }
      });
    }

    // Read file from private vault with strict path isolation
    const fileBuffer = SecureStorageService.readFile(authenticatedUserId, report.file_storage_path);

    res.setHeader('Content-Type', report.mime_type || 'application/octet-stream');
    res.setHeader('Content-Length', fileBuffer.length);
    const disposition = req.query.download === '1' ? 'attachment' : 'inline';
    res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(report.file_name)}"`);
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    return res.end(fileBuffer);
  } catch (err) {
    if (err.message.includes('Invalid or expired download token') || err.message.includes('Access Denied')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: err.message
        }
      });
    }
    next(err);
  }
});

/**
 * GET /api/reports/:id/summary
 * Retrieve evidence-grounded health report summary in specified language ('en', 'te', 'hi')
 */
medicalRecordRouter.get('/reports/:id/summary', requireAuth, async (req, res, next) => {
  try {
    const summary = await HealthSummaryService.getOrGenerateSummary({
      userId: req.user.id,
      reportId: req.params.id,
      language: req.query.lang || 'en',
      forceRegenerate: false
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (err) {
    if (err.code === 'REPORT_NOT_FOUND' || err.status === 404) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REPORT_NOT_FOUND',
          message: err.message
        }
      });
    }
    next(err);
  }
});

/**
 * POST /api/reports/:id/summary/generate
 * Trigger fresh generation of evidence-grounded health report summary
 */
medicalRecordRouter.post('/reports/:id/summary/generate', requireAuth, async (req, res, next) => {
  try {
    const summary = await HealthSummaryService.getOrGenerateSummary({
      userId: req.user.id,
      reportId: req.params.id,
      language: req.body?.language || 'en',
      forceRegenerate: req.body?.force ?? true
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (err) {
    if (err.code === 'REPORT_NOT_FOUND' || err.status === 404) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REPORT_NOT_FOUND',
          message: err.message
        }
      });
    }
    next(err);
  }
});

