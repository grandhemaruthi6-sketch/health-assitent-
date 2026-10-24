import express from 'express';
import multer from 'multer';
import { processMedicalDocument, MedicalPipelineError } from '../services/clinical/medicalPipelineService.js';
import { DOCUMENT_CATEGORIES } from '../schemas/medicalDocumentSchema.js';
import { MAX_FILE_SIZE_BYTES } from '../utils/documentValidator.js';
import { ValidationError } from '../utils/documentValidator.js';
import { OcrProviderError } from '../services/ocr/ocrProvider.js';

export const clinicalRouter = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 }
});

/**
 * GET /api/clinical/categories
 * Returns supported document categories
 */
clinicalRouter.get('/categories', (req, res) => {
  res.json({
    success: true,
    categories: DOCUMENT_CATEGORIES
  });
});

/**
 * POST /api/clinical/analyze
 * Accepts either:
 * 1. Multipart form file ('document')
 * 2. JSON body with 'ocrResult' (pre-extracted OCR)
 * 3. JSON body with 'base64Content' and 'mimeType'
 */
clinicalRouter.post('/analyze', upload.single('document'), async (req, res) => {
  try {
    let fileBuffer = null;
    let mimeType = null;
    let ocrResult = null;
    const overrideCategory = req.body.category || null;

    if (req.file) {
      fileBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
    } else if (req.body.ocrResult) {
      ocrResult = req.body.ocrResult;
    } else if (req.body.base64Content) {
      fileBuffer = Buffer.from(req.body.base64Content, 'base64');
      mimeType = req.body.mimeType;
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_INPUT',
          message: 'Provide a document file, pre-extracted ocrResult, or base64Content.'
        }
      });
    }

    const fileName = req.file?.originalname || req.body.fileName || null;
    const documentType = req.body.documentType || (overrideCategory === 'Prescription' ? 'prescription' : 'lab_report');

    const analysis = await processMedicalDocument({
      fileBuffer,
      mimeType,
      ocrResult,
      overrideCategory,
      fileName,
      documentType
    });

    return res.status(200).json({
      success: true,
      data: analysis,
      ocrResult: analysis.rawOcr || ocrResult
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: { code: err.code, message: err.message }
      });
    }

    if (err instanceof OcrProviderError) {
      const status = err.code === 'CREDENTIALS_MISSING' ? 503 : 502;
      return res.status(status).json({
        success: false,
        error: { code: err.code, message: err.message, details: err.details }
      });
    }

    if (err instanceof MedicalPipelineError) {
      return res.status(422).json({
        success: false,
        error: { code: err.code, message: err.message, details: err.details }
      });
    }

    console.error('[Clinical Analysis Error]', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An error occurred during medical document understanding.'
      }
    });
  }
});
