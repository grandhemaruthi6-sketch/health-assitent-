import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { run_continuity_engine } from '../services/continuity/continuityEngine.js';
import { processDocumentForContinuity } from '../services/continuity/documentIngestionService.js';
import {
  transitionIssueStatus,
  patientConfirmIssue,
  getIssueHistory,
  getIssuesForPatient
} from '../services/continuity/issueLifecycle.js';
import {
  generateDoctorGrant,
  verifyDoctorGrant,
  revokeDoctorGrant,
  submitIssueReview,
  getDecisionMemory,
  isDoctorAccessActive
} from '../services/continuity/doctorAccessService.js';

export const continuityRouter = Router();

/**
 * Resolves whether the given ID is a patient_id or a user_id.
 * If user exists without a patient record, automatically creates one.
 */
function resolvePatientId(idOrUserId) {
  if (!idOrUserId) return null;

  // 1. Direct match on patients.id
  const direct = db.prepare('SELECT id FROM patients WHERE id = ?').get(idOrUserId);
  if (direct) return direct.id;

  // 2. Match on patients.user_id
  const byUser = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(idOrUserId);
  if (byUser) return byUser.id;

  // 3. Check users table
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(idOrUserId);
  if (user) {
    const newPatId = uuidv4();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO patients (id, user_id, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(newPatId, user.id, user.name || 'Patient', now, now);
    return newPatId;
  }

  // Fallback to the ID itself (synthetic tests / standalone patient IDs)
  return idOrUserId;
}

// ============================================================================
// 1. DOCUMENT PROCESSING (BRIDGING OCR TO CONTINUITY SCHEMA)
// ============================================================================

/**
 * POST /api/documents/:id/process
 * Ingest document into continuity tables and trigger comparison engine
 */
continuityRouter.post('/documents/:id/process', (req, res, next) => {
  try {
    const documentId = req.params.id;
    const result = processDocumentForContinuity(documentId, req.body || {});
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 400).json({
      success: false,
      error: { message: err.message }
    });
  }
});

// ============================================================================
// 2. TRIGGER CONTINUITY ENGINE FOR PATIENT
// ============================================================================

/**
 * POST /api/patients/:id/continuity/run
 * Master trigger running deterministic comparison rules, reason finder, and evidence chain
 */
continuityRouter.post('/patients/:id/continuity/run', (req, res, next) => {
  try {
    const patientId = resolvePatientId(req.params.id);
    const result = run_continuity_engine(patientId);
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: { message: err.message }
    });
  }
});

// ============================================================================
// 3. ISSUES RETRIEVAL & FILTERING
// ============================================================================

/**
 * GET /api/patients/:id/issues
 * Query params: ?status=pending_review (or detected, resolved, dismissed, etc.)
 */
continuityRouter.get('/patients/:id/issues', (req, res, next) => {
  try {
    const patientId = resolvePatientId(req.params.id);
    const filterStatus = req.query.status || null;
    const issues = getIssuesForPatient(patientId, filterStatus);

    res.json({
      success: true,
      patientId,
      count: issues.length,
      data: issues
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: { message: err.message }
    });
  }
});

/**
 * GET /api/issues/:id
 * Detailed issue view with linked before/after source entities, documents, reason quotes, and audit history
 */
continuityRouter.get('/issues/:id', (req, res, next) => {
  try {
    const issueId = req.params.id;
    const issue = db.prepare('SELECT * FROM continuity_issues WHERE id = ?').get(issueId);

    if (!issue) {
      return res.status(404).json({
        success: false,
        error: { message: `Issue ${issueId} not found` }
      });
    }

    let summaryStructured = {};
    try {
      summaryStructured = JSON.parse(issue.summary_structured || '{}');
    } catch (e) {
      summaryStructured = {};
    }

    // Resolve before and after source details
    let beforeEntity = null;
    let afterEntity = null;

    if (issue.before_ref) {
      beforeEntity = db.prepare(`
        SELECT m.*, v.visit_date, v.doctor_name
        FROM medications m
        JOIN visits v ON v.id = m.visit_id
        WHERE m.id = ?
      `).get(issue.before_ref) || db.prepare(`
        SELECT l.*, v.visit_date, v.doctor_name
        FROM lab_results l
        JOIN visits v ON v.id = l.visit_id
        WHERE l.id = ?
      `).get(issue.before_ref);
    }

    if (issue.after_ref) {
      afterEntity = db.prepare(`
        SELECT m.*, v.visit_date, v.doctor_name
        FROM medications m
        JOIN visits v ON v.id = m.visit_id
        WHERE m.id = ?
      `).get(issue.after_ref) || db.prepare(`
        SELECT l.*, v.visit_date, v.doctor_name
        FROM lab_results l
        JOIN visits v ON v.id = l.visit_id
        WHERE l.id = ?
      `).get(issue.after_ref);
    }

    // Source document
    let sourceDocument = null;
    if (issue.reason_source_document_id) {
      sourceDocument = db.prepare('SELECT id, type, title, uploaded_at FROM documents WHERE id = ?').get(issue.reason_source_document_id);
    }

    // Reviews
    const reviews = db.prepare('SELECT * FROM issue_reviews WHERE issue_id = ? ORDER BY created_at ASC').all(issueId);

    // Audit trail
    const auditTrail = getIssueHistory(issueId);

    res.json({
      success: true,
      data: {
        ...issue,
        summary_structured: summaryStructured,
        beforeEntity,
        afterEntity,
        sourceDocument,
        reviews,
        auditTrail
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: { message: err.message }
    });
  }
});

// ============================================================================
// 4. PATIENT CONFIRMATION
// ============================================================================

/**
 * POST /api/issues/:id/patient-confirm
 * Body: { confirmed: boolean, patientNote?: string, patientId?: string }
 */
continuityRouter.post('/issues/:id/patient-confirm', (req, res, next) => {
  try {
    const issueId = req.params.id;
    const { confirmed = true, patientNote = '', patientId } = req.body;

    const issue = db.prepare('SELECT patient_id FROM continuity_issues WHERE id = ?').get(issueId);
    if (!issue) {
      return res.status(404).json({ success: false, error: { message: 'Issue not found' } });
    }

    const effectivePatientId = patientId || issue.patient_id;
    const updated = patientConfirmIssue(issueId, effectivePatientId, { confirmed, patientNote });

    res.json({
      success: true,
      data: updated
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: { message: err.message }
    });
  }
});

// ============================================================================
// 5. DOCTOR REVIEW & DECISION MEMORY
// ============================================================================

/**
 * POST /api/issues/:id/review
 * Clinician validates, explains, or dismisses an issue, creating a Decision Record
 * Body: { reviewerId, reviewerRole, action, explanationText, evidenceDocumentIds }
 */
continuityRouter.post('/issues/:id/review', (req, res, next) => {
  try {
    const issueId = req.params.id;
    const result = submitIssueReview(issueId, req.body);

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: { message: err.message }
    });
  }
});

/**
 * GET /api/patients/:id/decision-memory
 * Full historical memory of clinical decisions
 */
continuityRouter.get('/patients/:id/decision-memory', (req, res, next) => {
  try {
    const patientId = resolvePatientId(req.params.id);
    const decisions = getDecisionMemory(patientId);

    res.json({
      success: true,
      patientId,
      count: decisions.length,
      data: decisions
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: { message: err.message }
    });
  }
});

// ============================================================================
// 6. CONTINUITY TIMELINE
// ============================================================================

/**
 * GET /api/patients/:id/timeline
 * Complete chronological timeline aggregating visits, medications, labs, notes, and issues
 */
continuityRouter.get('/patients/:id/timeline', (req, res, next) => {
  try {
    const patientId = resolvePatientId(req.params.id);

    // Fetch visits
    const visits = db.prepare(`
      SELECT * FROM visits WHERE patient_id = ? ORDER BY visit_date ASC
    `).all(patientId);

    // Fetch issues
    const issues = getIssuesForPatient(patientId);

    // Group items by visit
    const timeline = visits.map(v => {
      const meds = db.prepare('SELECT * FROM medications WHERE visit_id = ?').all(v.id);
      const labs = db.prepare('SELECT * FROM lab_results WHERE visit_id = ?').all(v.id);
      const notes = db.prepare('SELECT * FROM clinical_notes WHERE visit_id = ?').all(v.id);
      const docs = db.prepare('SELECT id, type, title, uploaded_at FROM documents WHERE visit_id = ?').all(v.id);

      // Issues associated with this visit (via after_ref or note_id)
      const visitMedsIds = new Set(meds.map(m => m.id));
      const visitLabsIds = new Set(labs.map(l => l.id));
      const visitNotesIds = new Set(notes.map(n => n.id));

      const visitIssues = issues.filter(iss => 
        visitMedsIds.has(iss.after_ref) ||
        visitLabsIds.has(iss.after_ref) ||
        visitNotesIds.has(iss.before_ref)
      );

      return {
        visit: v,
        documents: docs,
        medications: meds,
        labResults: labs,
        clinicalNotes: notes,
        continuityIssues: visitIssues
      };
    });

    res.json({
      success: true,
      patientId,
      count: timeline.length,
      data: timeline
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: { message: err.message }
    });
  }
});

// ============================================================================
// 7. DOCTOR ACCESS GRANTS (6-DIGIT CODE)
// ============================================================================

/**
 * POST /api/patients/:id/grants/generate
 * Patient creates 6-digit access code for doctor review (valid 10 minutes)
 */
continuityRouter.post('/patients/:id/grants/generate', (req, res, next) => {
  try {
    const patientId = resolvePatientId(req.params.id);
    const doctorId = req.body.doctorId || 'pending_doctor';
    const grant = generateDoctorGrant(patientId, doctorId);

    res.status(201).json({
      success: true,
      data: grant
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: { message: err.message }
    });
  }
});

/**
 * POST /api/grants/verify
 * Doctor enters 6-digit code
 * Body: { doctorId, code }
 */
continuityRouter.post('/grants/verify', (req, res, next) => {
  try {
    const { doctorId, code } = req.body;
    const verification = verifyDoctorGrant(doctorId, code);

    res.json({
      success: true,
      data: verification
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: { message: err.message }
    });
  }
});

/**
 * POST /api/grants/:id/revoke
 * Revoke grant
 */
continuityRouter.post('/grants/:id/revoke', (req, res, next) => {
  try {
    const grantId = req.params.id;
    const actorId = req.body.actorId || 'system';
    const actorRole = req.body.actorRole || 'patient';
    const result = revokeDoctorGrant(grantId, actorId, actorRole);

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: { message: err.message }
    });
  }
});
