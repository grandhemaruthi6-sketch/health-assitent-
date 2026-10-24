import { v4 as uuidv4 } from 'uuid';
import { db } from '../../db/database.js';

// Allowed state transitions map
const ALLOWED_TRANSITIONS = {
  detected: ['needs_patient_confirmation', 'pending_review', 'resolved', 'dismissed'],
  needs_patient_confirmation: ['pending_review', 'resolved', 'dismissed'],
  pending_review: ['resolved', 'dismissed'],
  resolved: ['pending_review'], // Reopening if new contradictory document arrives
  dismissed: ['pending_review']
};

/**
 * Transitions an issue from its current state to a new state.
 * Enforces valid transition logic and writes an immutable audit log record.
 * 
 * @param {string} issueId
 * @param {string} newStatus - detected | needs_patient_confirmation | pending_review | resolved | dismissed
 * @param {string} actorId
 * @param {string} actorRole - patient | doctor | clinician | system
 * @param {string} [notes]
 * @param {object} [metadata]
 * @returns {object} updated issue record
 */
export function transitionIssueStatus(issueId, newStatus, actorId, actorRole, notes = '', metadata = {}) {
  if (!issueId || !newStatus || !actorId || !actorRole) {
    throw new Error('issueId, newStatus, actorId, and actorRole are required for status transition');
  }

  const issue = db.prepare('SELECT * FROM continuity_issues WHERE id = ?').get(issueId);
  if (!issue) {
    throw new Error(`Issue ${issueId} not found`);
  }

  const currentStatus = issue.status;

  if (currentStatus === newStatus) {
    return issue; // No-op idempotent
  }

  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed: ${allowed.join(', ') || 'none'}`);
  }

  const now = new Date().toISOString();

  // Update continuity issue
  db.prepare(`
    UPDATE continuity_issues
    SET status = ?, updated_at = ?
    WHERE id = ?
  `).run(newStatus, now, issueId);

  // Write immutable audit log
  const auditId = uuidv4();
  const auditMeta = JSON.stringify({
    fromStatus: currentStatus,
    toStatus: newStatus,
    notes,
    ...metadata
  });

  db.prepare(`
    INSERT INTO audit_log (id, actor_id, actor_role, action, entity_type, entity_id, timestamp, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    auditId,
    actorId,
    actorRole,
    'STATUS_TRANSITION',
    'continuity_issues',
    issueId,
    now,
    auditMeta
  );

  return db.prepare('SELECT * FROM continuity_issues WHERE id = ?').get(issueId);
}

/**
 * Handles patient confirmation or clarification of an issue.
 * Transitions from detected or needs_patient_confirmation to pending_review.
 * 
 * @param {string} issueId 
 * @param {string} patientId 
 * @param {object} param2 
 * @returns {object}
 */
export function patientConfirmIssue(issueId, patientId, { confirmed = true, patientNote = '' } = {}) {
  const issue = db.prepare('SELECT * FROM continuity_issues WHERE id = ? AND patient_id = ?').get(issueId, patientId);
  if (!issue) {
    throw new Error(`Issue ${issueId} not found for patient ${patientId}`);
  }

  const now = new Date().toISOString();
  const actionType = confirmed ? 'PATIENT_CONFIRMED' : 'PATIENT_CLARIFIED';

  // Move to pending_review for clinician validation
  const nextStatus = 'pending_review';
  db.prepare(`
    UPDATE continuity_issues
    SET status = ?, updated_at = ?
    WHERE id = ?
  `).run(nextStatus, now, issueId);

  // Audit log
  db.prepare(`
    INSERT INTO audit_log (id, actor_id, actor_role, action, entity_type, entity_id, timestamp, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    patientId,
    'patient',
    actionType,
    'continuity_issues',
    issueId,
    now,
    JSON.stringify({
      fromStatus: issue.status,
      toStatus: nextStatus,
      confirmed,
      patientNote
    })
  );

  return db.prepare('SELECT * FROM continuity_issues WHERE id = ?').get(issueId);
}

/**
 * Retrieves the full immutable audit trail for a specific issue.
 * 
 * @param {string} issueId 
 * @returns {Array<object>}
 */
export function getIssueHistory(issueId) {
  const logs = db.prepare(`
    SELECT * FROM audit_log
    WHERE entity_type = 'continuity_issues' AND entity_id = ?
    ORDER BY timestamp ASC
  `).all(issueId);

  return logs.map(l => ({
    ...l,
    metadata: l.metadata ? JSON.parse(l.metadata) : null
  }));
}

/**
 * Retrieves issues for a patient with optional status filtering.
 * Parses structured JSON summaries.
 * 
 * @param {string} patientId 
 * @param {string|null} filterStatus 
 * @returns {Array<object>}
 */
export function getIssuesForPatient(patientId, filterStatus = null) {
  let query = 'SELECT * FROM continuity_issues WHERE patient_id = ?';
  const params = [patientId];

  if (filterStatus) {
    query += ' AND status = ?';
    params.push(filterStatus);
  }

  query += ' ORDER BY created_at DESC';

  const rows = db.prepare(query).all(...params);
  return rows.map(r => ({
    ...r,
    summary_structured: r.summary_structured ? JSON.parse(r.summary_structured) : {}
  }));
}
