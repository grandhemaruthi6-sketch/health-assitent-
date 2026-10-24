import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { SecureStorageService } from './secureStorageService.js';
import { validateDocument } from '../utils/documentValidator.js';

export class MedicalRecordService {
  // ============================================================================
  // 1. HOSPITALS
  // ============================================================================

  /**
   * Create or select a user-registered hospital
   */
  static createOrSelectHospital(userId, { name, branch = null, location = null, department = null }) {
    if (!userId || !name || !name.trim()) {
      throw new Error('User ID and Hospital Name are required.');
    }

    const cleanName = name.trim();

    // Check if hospital with exact name already exists for this user
    const existing = db.prepare(`
      SELECT * FROM hospitals WHERE user_id = ? AND LOWER(name) = LOWER(?)
    `).get(userId, cleanName);

    if (existing) {
      return existing;
    }

    const hospitalId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO hospitals (id, user_id, name, branch, location, department, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(hospitalId, userId, cleanName, branch, location, department, now);

    return db.prepare('SELECT * FROM hospitals WHERE id = ?').get(hospitalId);
  }

  /**
   * Get all registered hospitals for user with dynamic visit & report counts
   */
  static getUserHospitals(userId) {
    return db.prepare(`
      SELECT 
        h.id,
        h.name,
        h.branch,
        h.location,
        h.department,
        h.created_at as createdAt,
        COUNT(DISTINCT v.id) as visitCount,
        COUNT(DISTINCT r.id) as reportCount,
        MAX(v.visit_date) as latestVisitDate
      FROM hospitals h
      LEFT JOIN hospital_visits v ON v.hospital_id = h.id AND v.user_id = h.user_id
      LEFT JOIN medical_reports r ON r.visit_id = v.id AND r.user_id = h.user_id
      WHERE h.user_id = ?
      GROUP BY h.id
      ORDER BY latestVisitDate DESC, h.created_at DESC
    `).all(userId);
  }

  // ============================================================================
  // 2. HOSPITAL VISITS (Separates visit_date from uploaded_at)
  // ============================================================================

  /**
   * Create or find a hospital visit (Idempotent by date & hospital or idempotency_key)
   */
  static createOrFindVisit(userId, { hospitalId, visitDate, physicianName = null, department = null, reasonForVisit = null, idempotencyKey = null }) {
    if (!userId || !hospitalId || !visitDate) {
      throw new Error('User ID, Hospital ID, and Visit Date are required.');
    }

    // Validate ISO date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate)) {
      throw new Error("Invalid visit date format. Must be 'YYYY-MM-DD'.");
    }

    // Verify hospital belongs to user
    const hospital = db.prepare('SELECT id FROM hospitals WHERE id = ? AND user_id = ?').get(hospitalId, userId);
    if (!hospital) {
      throw new Error('Hospital not found or unauthorized for this user.');
    }

    // Check by idempotency key
    if (idempotencyKey) {
      const existingByKey = db.prepare(`
        SELECT * FROM hospital_visits WHERE user_id = ? AND idempotency_key = ?
      `).get(userId, idempotencyKey);
      if (existingByKey) return existingByKey;
    }

    // Check if a visit on this exact clinical date for this hospital already exists
    const existingByDate = db.prepare(`
      SELECT * FROM hospital_visits 
      WHERE user_id = ? AND hospital_id = ? AND visit_date = ?
    `).get(userId, hospitalId, visitDate);

    if (existingByDate) {
      return existingByDate;
    }

    const visitId = uuidv4();
    const now = new Date().toISOString(); // upload/system timestamp

    db.prepare(`
      INSERT INTO hospital_visits (id, user_id, hospital_id, visit_date, physician_name, department, reason_for_visit, idempotency_key, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(visitId, userId, hospitalId, visitDate, physicianName, department, reasonForVisit, idempotencyKey, now);

    return db.prepare('SELECT * FROM hospital_visits WHERE id = ?').get(visitId);
  }

  // ============================================================================
  // 3. MEDICAL REPORTS (Private Vault Storage, Deduplication & Ownership)
  // ============================================================================

  /**
   * Ingest and attach report to a visit
   */
  static async attachReport({
    userId,
    visitId,
    title,
    category,
    reportDate,
    fileBuffer,
    fileName,
    mimeType,
    idempotencyKey = null,
    ocrResult = null,
    aiAnalysis = null,
    processingStatus = 'completed',
    failureCode = null,
    failureReason = null
  }) {
    if (!userId || !visitId || !fileBuffer || !fileName || !reportDate) {
      throw new Error('User ID, Visit ID, file buffer, file name, and report date are required.');
    }

    // Validate visit ownership
    const visit = db.prepare('SELECT id, hospital_id FROM hospital_visits WHERE id = ? AND user_id = ?').get(visitId, userId);
    if (!visit) {
      throw new Error('Visit not found or unauthorized for this user.');
    }

    // 1. Idempotency Check (by key)
    if (idempotencyKey) {
      const existingReportByKey = db.prepare(`
        SELECT * FROM medical_reports WHERE user_id = ? AND idempotency_key = ?
      `).get(userId, idempotencyKey);
      if (existingReportByKey) {
        return this.formatReportRecord(existingReportByKey);
      }
    }

    // 2. Validate file signature and bounds
    const validated = validateDocument(fileBuffer, mimeType);

    // 3. Duplicate check by SHA-256 hash for this visit
    const fileHash = SecureStorageService.computeFileHash(fileBuffer);
    const existingByHash = db.prepare(`
      SELECT * FROM medical_reports WHERE user_id = ? AND visit_id = ? AND file_hash_sha256 = ?
    `).get(userId, visitId, fileHash);

    if (existingByHash) {
      return this.formatReportRecord(existingByHash);
    }

    // 4. Save to isolated private vault
    const reportId = uuidv4();
    const savedFile = SecureStorageService.saveFile(userId, reportId, fileName, fileBuffer);

    const now = new Date().toISOString(); // upload timestamp
    const cleanTitle = title?.trim() || fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

    db.prepare(`
      INSERT INTO medical_reports (
        id, user_id, visit_id, title, category, report_date, uploaded_at,
        file_storage_path, file_name, file_size_bytes, mime_type, file_hash_sha256,
        idempotency_key, processing_status, failure_code, failure_reason,
        ocr_result_json, ai_analysis_json, ai_summary, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reportId,
      userId,
      visitId,
      cleanTitle,
      category || 'Lab Report',
      reportDate,
      now, // Distinct uploaded_at timestamp
      savedFile.storagePath,
      fileName,
      savedFile.fileSizeBytes,
      validated.mimeType,
      fileHash,
      idempotencyKey,
      processingStatus,
      failureCode,
      failureReason,
      ocrResult ? JSON.stringify(ocrResult) : null,
      aiAnalysis ? JSON.stringify(aiAnalysis) : null,
      aiAnalysis?.plainLanguageSummary?.overview || null,
      now,
      now
    );

    const createdRecord = db.prepare('SELECT * FROM medical_reports WHERE id = ?').get(reportId);
    return this.formatReportRecord(createdRecord);
  }

  /**
   * Get single report by ID with user authorization
   */
  static getReportById(userId, reportId) {
    const record = db.prepare(`
      SELECT 
        r.*,
        v.visit_date as visitDate,
        v.physician_name as physicianName,
        h.id as hospitalId,
        h.name as hospitalName,
        h.location as hospitalLocation
      FROM medical_reports r
      LEFT JOIN hospital_visits v ON v.id = r.visit_id
      LEFT JOIN hospitals h ON h.id = v.hospital_id
      WHERE r.id = ? AND r.user_id = ?
    `).get(reportId, userId);

    if (!record) return null;

    return this.formatReportRecord(record);
  }

  /**
   * Get all reports for user with filters
   */
  static getUserReports(userId, { category = null, searchQuery = null } = {}) {
    let sql = `
      SELECT 
        r.*,
        v.visit_date as visitDate,
        v.physician_name as physicianName,
        h.id as hospitalId,
        h.name as hospitalName,
        h.location as hospitalLocation
      FROM medical_reports r
      LEFT JOIN hospital_visits v ON v.id = r.visit_id
      LEFT JOIN hospitals h ON h.id = v.hospital_id
      WHERE r.user_id = ?
    `;

    const params = [userId];

    if (category && category !== 'All') {
      sql += ' AND r.category = ?';
      params.push(category);
    }

    if (searchQuery && searchQuery.trim()) {
      sql += ' AND (LOWER(r.title) LIKE ? OR LOWER(h.name) LIKE ?)';
      params.push(`%${searchQuery.toLowerCase()}%`, `%${searchQuery.toLowerCase()}%`);
    }

    sql += ' ORDER BY r.report_date DESC, r.uploaded_at DESC';

    const records = db.prepare(sql).all(...params);
    return records.map(r => this.formatReportRecord(r));
  }

  /**
   * Update report metadata with authorization
   */
  static updateReportMetadata(userId, reportId, { title, category, reportDate, physicianName, notes, aiSummary }) {
    const existing = db.prepare('SELECT * FROM medical_reports WHERE id = ? AND user_id = ?').get(reportId, userId);
    if (!existing) {
      throw new Error('Report not found or unauthorized.');
    }

    const updates = [];
    const params = [];

    if (title !== undefined && title.trim()) {
      updates.push('title = ?');
      params.push(title.trim());
    }

    if (category !== undefined && category.trim()) {
      updates.push('category = ?');
      params.push(category.trim());
    }

    if (reportDate !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
      updates.push('report_date = ?');
      params.push(reportDate);
    }

    if (aiSummary !== undefined) {
      updates.push('ai_summary = ?');
      params.push(aiSummary);
    }

    const now = new Date().toISOString();
    updates.push('updated_at = ?');
    params.push(now);

    params.push(reportId, userId);

    db.prepare(`
      UPDATE medical_reports
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).run(...params);

    if (physicianName !== undefined && existing.visit_id) {
      db.prepare(`
        UPDATE hospital_visits
        SET physician_name = ?
        WHERE id = ? AND user_id = ?
      `).run(physicianName ? physicianName.trim() : null, existing.visit_id, userId);
    }

    return this.getReportById(userId, reportId);
  }

  /**
   * Delete report with authorization and private file cleanup
   */
  static deleteReport(userId, reportId) {
    const report = db.prepare(`
      SELECT id, file_storage_path FROM medical_reports WHERE id = ? AND user_id = ?
    `).get(reportId, userId);

    if (!report) {
      throw new Error('Report not found or unauthorized.');
    }

    // Delete file from private vault
    SecureStorageService.deleteFile(userId, report.file_storage_path);

    // Delete record
    db.prepare('DELETE FROM medical_reports WHERE id = ? AND user_id = ?').run(reportId, userId);

    return { success: true, deletedReportId: reportId };
  }

  // ============================================================================
  // 4. TIMELINE AGGREGATION
  // ============================================================================

  /**
   * Get chronological medical journey for authenticated user
   */
  static getUserTimeline(userId) {
    const visits = db.prepare(`
      SELECT 
        v.id as visitId,
        v.visit_date as visitDate,
        v.physician_name as physicianName,
        v.department as visitDepartment,
        v.reason_for_visit as reasonForVisit,
        h.id as hospitalId,
        h.name as hospitalName,
        h.location as hospitalLocation
      FROM hospital_visits v
      JOIN hospitals h ON h.id = v.hospital_id
      WHERE v.user_id = ?
      ORDER BY v.visit_date DESC
    `).all(userId);

    if (visits.length === 0) {
      return []; // Return genuine empty state!
    }

    // Attach reports to each visit
    const getReportsStmt = db.prepare(`
      SELECT 
        id, title, category, report_date as reportDate, uploaded_at as uploadedAt,
        processing_status as processingStatus, ai_summary as aiSummary, file_name as fileName
      FROM medical_reports 
      WHERE visit_id = ? AND user_id = ?
      ORDER BY report_date DESC
    `);

    return visits.map(v => {
      const reports = getReportsStmt.all(v.visitId, userId);
      return {
        ...v,
        reports,
        reportCount: reports.length
      };
    });
  }

  /**
   * Helper to format database record into structured response with short-lived signed URL
   */
  static formatReportRecord(record) {
    if (!record) return null;

    const signedToken = SecureStorageService.generateSignedUrlToken(record.user_id, record.id);
    const signedDownloadUrl = `/api/reports/${record.id}/download?token=${signedToken}`;

    return {
      id: record.id,
      userId: record.user_id,
      visitId: record.visit_id,
      visitDate: record.visitDate || null,
      visit: record.visitDate ? {
        id: record.visit_id,
        visitDate: record.visitDate
      } : null,
      title: record.title,
      category: record.category,
      reportDate: record.report_date, // distinct clinical date
      uploadedAt: record.uploaded_at, // distinct upload timestamp
      fileName: record.file_name,
      fileSizeBytes: record.file_size_bytes,
      fileSizeFormatted: `${(record.file_size_bytes / (1024 * 1024)).toFixed(1)} MB`,
      mimeType: record.mime_type,
      fileHash: record.file_hash_sha256,
      idempotencyKey: record.idempotency_key,
      processingStatus: record.processing_status,
      failureCode: record.failure_code,
      failureReason: record.failure_reason,
      aiSummary: record.ai_summary,
      ocrResult: record.ocr_result_json ? JSON.parse(record.ocr_result_json) : null,
      extractedText: record.ocr_result_json ? (JSON.parse(record.ocr_result_json).fullText || '') : '',
      aiAnalysis: record.ai_analysis_json ? JSON.parse(record.ai_analysis_json) : null,
      signedDownloadUrl,
      hospital: record.hospitalName ? {
        id: record.hospitalId,
        name: record.hospitalName,
        location: record.hospitalLocation
      } : null,
      physicianName: record.physicianName || null,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }
}
