import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../db/database.js';
import { transitionIssueStatus } from './issueLifecycle.js';

const GRANT_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

/**
 * Generates a SHA-256 hash for a 6-digit access code.
 */
function hashGrantCode(code) {
  return crypto.createHash('sha256').update(String(code).trim()).digest('hex');
}

/**
 * Patient generates a secure 6-digit grant code for doctor access.
 * Valid for 10 minutes, allows up to 5 attempts.
 * 
 * @param {string} patientId 
 * @param {string} [doctorId] - optional doctor identifier or 'pending_doctor'
 * @returns {object} { grantId, code, expiresAt, patientId }
 */
export function generateDoctorGrant(patientId, doctorId = 'pending_doctor') {
  if (!patientId) throw new Error('Patient ID is required to generate grant');

  // Verify patient exists
  const patient = db.prepare('SELECT id FROM patients WHERE id = ?').get(patientId);
  if (!patient) {
    throw new Error(`Patient ${patientId} not found`);
  }

  // Generate 6-digit random code
  const code = String(crypto.randomInt(100000, 999999));
  const codeHash = hashGrantCode(code);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + GRANT_EXPIRY_MINUTES * 60 * 1000).toISOString();
  const grantId = uuidv4();

  db.prepare(`
    INSERT INTO doctor_access_grants (
      id, patient_id, doctor_id, code_hash, attempts, expires_at, scope, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    grantId,
    patientId,
    doctorId,
    codeHash,
    0,
    expiresAt,
    'continuity_review',
    now.toISOString()
  );

  // Write audit log
  db.prepare(`
    INSERT INTO audit_log (id, actor_id, actor_role, action, entity_type, entity_id, timestamp, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    patientId,
    'patient',
    'DOCTOR_GRANT_GENERATED',
    'doctor_access_grants',
    grantId,
    now.toISOString(),
    JSON.stringify({ expiresAt, scope: 'continuity_review' })
  );

  return {
    grantId,
    code,
    expiresAt,
    patientId
  };
}

/**
 * Doctor enters the 6-digit code to unlock access to the patient's continuity records.
 * 
 * @param {string} doctorId 
 * @param {string} code 
 * @returns {object} { success: boolean, grantId, patientId, expiresAt }
 */
export function verifyDoctorGrant(doctorId, code) {
  if (!doctorId || !code) {
    throw new Error('doctorId and 6-digit code are required');
  }

  const codeHash = hashGrantCode(code);
  const nowIso = new Date().toISOString();

  // Find grant by code hash that hasn't been revoked
  const grant = db.prepare(`
    SELECT * FROM doctor_access_grants
    WHERE code_hash = ? AND revoked_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
  `).get(codeHash);

  if (!grant) {
    throw new Error('Invalid code or grant not found');
  }

  // Check expiration
  if (grant.expires_at < nowIso) {
    throw new Error('This access code has expired. Please ask the patient to generate a new one.');
  }

  // Check attempt limits
  if (grant.attempts >= MAX_ATTEMPTS) {
    throw new Error('This access code is locked due to too many failed attempts.');
  }

  // Mark grant as approved and assign doctorId
  db.prepare(`
    UPDATE doctor_access_grants
    SET approved_at = ?, doctor_id = ?
    WHERE id = ?
  `).run(nowIso, doctorId, grant.id);

  // Write audit log
  db.prepare(`
    INSERT INTO audit_log (id, actor_id, actor_role, action, entity_type, entity_id, timestamp, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    doctorId,
    'doctor',
    'DOCTOR_GRANT_APPROVED',
    'doctor_access_grants',
    grant.id,
    nowIso,
    JSON.stringify({ patientId: grant.patient_id })
  );

  return {
    success: true,
    grantId: grant.id,
    patientId: grant.patient_id,
    expiresAt: grant.expires_at
  };
}

/**
 * Checks if a doctor currently has valid approved access to a patient.
 * 
 * @param {string} patientId 
 * @param {string} doctorId 
 * @returns {boolean}
 */
export function isDoctorAccessActive(patientId, doctorId) {
  if (!patientId || !doctorId) return false;
  const nowIso = new Date().toISOString();

  const activeGrant = db.prepare(`
    SELECT id FROM doctor_access_grants
    WHERE patient_id = ? AND doctor_id = ?
      AND approved_at IS NOT NULL
      AND revoked_at IS NULL
      AND expires_at > ?
    LIMIT 1
  `).get(patientId, doctorId, nowIso);

  return !!activeGrant;
}

/**
 * Revokes a doctor access grant immediately.
 * 
 * @param {string} grantId 
 * @param {string} actorId 
 * @param {string} actorRole 
 */
export function revokeDoctorGrant(grantId, actorId, actorRole) {
  const grant = db.prepare('SELECT * FROM doctor_access_grants WHERE id = ?').get(grantId);
  if (!grant) {
    throw new Error(`Grant ${grantId} not found`);
  }

  const nowIso = new Date().toISOString();
  db.prepare('UPDATE doctor_access_grants SET revoked_at = ? WHERE id = ?').run(nowIso, grantId);

  db.prepare(`
    INSERT INTO audit_log (id, actor_id, actor_role, action, entity_type, entity_id, timestamp, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    actorId,
    actorRole,
    'DOCTOR_GRANT_REVOKED',
    'doctor_access_grants',
    grantId,
    nowIso,
    JSON.stringify({ patientId: grant.patient_id })
  );

  return { success: true, revokedAt: nowIso };
}

/**
 * Clinician reviews a continuity issue, adds clinical explanation, and creates a Decision Record.
 * 
 * @param {string} issueId
 * @param {object} reviewData
 * @param {string} reviewData.reviewerId
 * @param {string} reviewData.reviewerRole - 'doctor' | 'clinician'
 * @param {string} reviewData.action - 'confirmed_intentional' | 'explained' | 'needs_followup' | 'dismissed'
 * @param {string} reviewData.explanationText
 * @param {Array<string>} [reviewData.evidenceDocumentIds]
 * @returns {object} { review, decisionRecord, updatedIssue }
 */
export function submitIssueReview(issueId, {
  reviewerId,
  reviewerRole = 'doctor',
  action,
  explanationText,
  evidenceDocumentIds = []
}) {
  if (!issueId || !reviewerId || !action || !explanationText) {
    throw new Error('issueId, reviewerId, action, and explanationText are required to submit review');
  }

  const issue = db.prepare('SELECT * FROM continuity_issues WHERE id = ?').get(issueId);
  if (!issue) {
    throw new Error(`Issue ${issueId} not found`);
  }

  const now = new Date().toISOString();
  const reviewId = uuidv4();
  const evidenceJson = JSON.stringify(evidenceDocumentIds);

  // 1. Insert into issue_reviews
  db.prepare(`
    INSERT INTO issue_reviews (
      id, issue_id, reviewer_id, reviewer_role, action, explanation_text, evidence_document_ids, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    reviewId,
    issueId,
    reviewerId,
    reviewerRole,
    action,
    explanationText,
    evidenceJson,
    now
  );

  // 2. Determine target status
  let targetStatus = 'resolved';
  if (action === 'dismissed') {
    targetStatus = 'dismissed';
  } else if (action === 'needs_followup') {
    targetStatus = 'pending_review';
  }

  // 3. Transition status & audit log
  let updatedIssue = issue;
  if (issue.status !== targetStatus) {
    updatedIssue = transitionIssueStatus(
      issueId,
      targetStatus,
      reviewerId,
      reviewerRole,
      `Clinician review: ${action} - ${explanationText}`,
      { reviewId, action }
    );
  }

  // 4. Create Decision Record (Decision Memory)
  const decisionId = uuidv4();
  // Find associated visit_id from after_ref or patient latest visit
  let visitId = null;
  if (issue.after_ref) {
    const medOrLab = db.prepare('SELECT visit_id FROM medications WHERE id = ?').get(issue.after_ref)
      || db.prepare('SELECT visit_id FROM lab_results WHERE id = ?').get(issue.after_ref)
      || db.prepare('SELECT visit_id FROM clinical_notes WHERE id = ?').get(issue.after_ref);
    if (medOrLab) visitId = medOrLab.visit_id;
  }
  if (!visitId && issue.before_ref) {
    const medOrLab = db.prepare('SELECT visit_id FROM medications WHERE id = ?').get(issue.before_ref)
      || db.prepare('SELECT visit_id FROM lab_results WHERE id = ?').get(issue.before_ref);
    if (medOrLab) visitId = medOrLab.visit_id;
  }
  if (!visitId) {
    const latestVisit = db.prepare('SELECT id FROM visits WHERE patient_id = ? ORDER BY visit_date DESC LIMIT 1').get(issue.patient_id);
    if (latestVisit) visitId = latestVisit.id;
  }

  let structuredSummary = {};
  try {
    structuredSummary = JSON.parse(issue.summary_structured || '{}');
  } catch (e) {
    structuredSummary = {};
  }

  const findingSummary = `${issue.issue_type}: ${structuredSummary.summary || structuredSummary.message || 'Clinical continuity observation'}`;

  if (visitId) {
    db.prepare(`
      INSERT INTO decision_records (
        id, patient_id, visit_id, finding, decision, documented_reason,
        reason_source_document_id, reason_source_quote, evidence_document_ids, source, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      decisionId,
      issue.patient_id,
      visitId,
      findingSummary,
      action,
      explanationText,
      issue.reason_source_document_id || null,
      explanationText,
      evidenceJson,
      'clinician documented',
      now
    );
  }

  // Audit log for review
  db.prepare(`
    INSERT INTO audit_log (id, actor_id, actor_role, action, entity_type, entity_id, timestamp, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    reviewerId,
    reviewerRole,
    'CLINICIAN_REVIEW_COMPLETED',
    'continuity_issues',
    issueId,
    now,
    JSON.stringify({ reviewId, decisionId, action, targetStatus })
  );

  return {
    reviewId,
    decisionId,
    updatedIssue,
    status: targetStatus
  };
}

/**
 * Retrieves full decision memory for a patient across all visits.
 * 
 * @param {string} patientId 
 * @returns {Array<object>}
 */
export function getDecisionMemory(patientId) {
  if (!patientId) return [];

  const decisions = db.prepare(`
    SELECT dr.*, v.visit_date, v.doctor_name, v.hospital_id
    FROM decision_records dr
    JOIN visits v ON v.id = dr.visit_id
    WHERE dr.patient_id = ?
    ORDER BY v.visit_date DESC, dr.created_at DESC
  `).all(patientId);

  return decisions.map(d => ({
    ...d,
    evidence_document_ids: d.evidence_document_ids ? JSON.parse(d.evidence_document_ids) : []
  }));
}
