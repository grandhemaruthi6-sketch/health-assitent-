import { db } from '../../db/database.js';
import { normalize_med_name, normalize_lab_name } from './normalizer.js';

/**
 * 1. get_latest_lab
 * Returns the most recent lab result for a specific test (e.g. HbA1c, Platelets, Creatinine).
 */
export function get_latest_lab(patientId, labName) {
  if (!patientId || !labName) return null;

  const norm = normalize_lab_name(labName);
  const row = db.prepare(`
    SELECT l.*, v.visit_date, v.doctor_name
    FROM lab_results l
    JOIN visits v ON v.id = l.visit_id
    WHERE l.patient_id = ?
      AND (l.test_name_normalized = ? OR LOWER(l.test_name_raw) LIKE ?)
    ORDER BY l.result_date DESC, l.created_at DESC
    LIMIT 1
  `).get(patientId, norm.canonical_name, `%${labName.toLowerCase()}%`);

  return row || null;
}

/**
 * 2. get_med_history
 * Returns the full timeline of medication prescriptions for a patient,
 * optionally filtered to a specific medication name.
 */
export function get_med_history(patientId, medName = null) {
  if (!patientId) return [];

  let query = `
    SELECT m.*, v.visit_date, v.doctor_name, v.hospital_id
    FROM medications m
    JOIN visits v ON v.id = m.visit_id
    WHERE m.patient_id = ?
  `;
  const params = [patientId];

  if (medName) {
    const norm = normalize_med_name(medName);
    query += ' AND (m.name_normalized = ? OR LOWER(m.name_raw) LIKE ?)';
    params.push(norm.canonical_name, `%${medName.toLowerCase()}%`);
  }

  query += ' ORDER BY v.visit_date ASC, m.created_at ASC';
  return db.prepare(query).all(...params);
}

/**
 * 3. get_issues
 * Returns continuity issues for a patient, optionally filtered by status.
 */
export function get_issues(patientId, status = null) {
  if (!patientId) return [];

  let query = 'SELECT * FROM continuity_issues WHERE patient_id = ?';
  const params = [patientId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);

  return rows.map(r => ({
    ...r,
    summary_structured: r.summary_structured ? JSON.parse(r.summary_structured) : {}
  }));
}

/**
 * 4. get_decision_for_issue
 * Returns clinician reviews and decision records linked to a specific continuity issue.
 */
export function get_decision_for_issue(issueId) {
  if (!issueId) return null;

  const reviews = db.prepare(`
    SELECT * FROM issue_reviews
    WHERE issue_id = ?
    ORDER BY created_at DESC
  `).all(issueId);

  const issue = db.prepare('SELECT * FROM continuity_issues WHERE id = ?').get(issueId);
  let decisionRecords = [];
  if (issue) {
    decisionRecords = db.prepare(`
      SELECT * FROM decision_records
      WHERE patient_id = ? AND reason_source_quote IS NOT NULL
      ORDER BY created_at DESC
    `).all(issue.patient_id);
  }

  return {
    issueId,
    reviews: reviews.map(r => ({
      ...r,
      evidence_document_ids: r.evidence_document_ids ? JSON.parse(r.evidence_document_ids) : []
    })),
    decisionRecords
  };
}

/**
 * 5. find_reason
 * Checks if a reason was documented or reviewed for a given issue.
 * Strictly adheres to the rule: "Reason not found" means "not found in the available records".
 */
export function find_reason(issueId) {
  if (!issueId) {
    return {
      status: 'not_found',
      verbatim_quote: null,
      message: 'not found in the available records'
    };
  }

  const issue = db.prepare('SELECT * FROM continuity_issues WHERE id = ?').get(issueId);
  if (!issue) {
    return {
      status: 'not_found',
      verbatim_quote: null,
      message: 'not found in the available records'
    };
  }

  // 1. Check if clinician review resolved it
  const review = db.prepare(`
    SELECT * FROM issue_reviews WHERE issue_id = ? ORDER BY created_at DESC LIMIT 1
  `).get(issueId);

  if (review) {
    return {
      status: 'clinician_explained',
      action: review.action,
      explanation: review.explanation_text,
      reviewerId: review.reviewer_id,
      reviewerRole: review.reviewer_role,
      message: `Your clinician documented: "${review.explanation_text}"`
    };
  }

  // 2. Check if verbatim reason was extracted from clinical notes
  if (issue.reason_status === 'documented' && issue.reason_text) {
    return {
      status: 'documented',
      verbatim_quote: issue.reason_text,
      sourceDocumentId: issue.reason_source_document_id,
      message: `The medical records document: "${issue.reason_text}"`
    };
  }

  // 3. Fallback: Not found in the available records
  return {
    status: 'not_found',
    verbatim_quote: null,
    message: 'not found in the available records'
  };
}

/**
 * High-level conversational answering for: "Why did my medicine change?"
 * Returns an evidence-grounded response adhering to all non-negotiable guidelines.
 * 
 * @param {string} patientId 
 * @param {string} query 
 * @returns {object|null} answer payload or null if not a medicine change query
 */
export function answerMedicineChangeQuery(patientId, query) {
  if (!patientId || !query) return null;
  const lower = query.toLowerCase();

  const isChangeQuery = (
    lower.includes('why') && (
      lower.includes('change') ||
      lower.includes('stop') ||
      lower.includes('increas') ||
      lower.includes('decreas') ||
      lower.includes('dose') ||
      lower.includes('switch') ||
      lower.includes('differ') ||
      lower.includes('prescrib')
    )
  ) || lower.includes('why did my medicine') || lower.includes('why was my medicine');

  if (!isChangeQuery) return null;

  // Retrieve issues for patient
  const issues = get_issues(patientId);
  const medIssues = issues.filter(i => [
    'MED_DOSE_CHANGE', 'MED_FREQ_CHANGE', 'MED_ADDED', 'MED_STOPPED'
  ].includes(i.issue_type));

  if (medIssues.length === 0) {
    return {
      answered: true,
      foundIssue: false,
      text: "No medication changes were detected across your recorded visits in the available records. If you believe your prescription changed, please verify with your doctor or upload your latest prescription.",
      suggestedQuestions: ["Can I check my current medication list?", "What should I ask my doctor?"]
    };
  }

  // Find candidate issues matching the medication mentioned in query
  const namedCandidates = medIssues.filter(iss => {
    const medName = iss.summary_structured?.medication || iss.summary_structured?.medication_name || '';
    return medName && lower.includes(medName.toLowerCase());
  });

  // If a specific medication was mentioned in the user's question, but has no detected changes:
  const words = lower.replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  const commonWords = new Set(['why', 'did', 'was', 'my', 'the', 'medicine', 'medication', 'dose', 'tablets', 'change', 'changed', 'stop', 'stopped', 'prescribed', 'increased', 'decreased', 'daily']);
  const queriedMed = words.find(w => w.length > 3 && !commonWords.has(w));

  if (queriedMed && namedCandidates.length === 0) {
    const medCap = queriedMed.charAt(0).toUpperCase() + queriedMed.slice(1);
    return {
      answered: true,
      foundIssue: false,
      text: `No changes for ${medCap} were found in the available records across your visits. If your doctor adjusted this medication recently, please verify with your doctor or upload your latest prescription.`,
      suggestedQuestions: [`Verify current dose of ${medCap}`, "View my current prescriptions"]
    };
  }

  const candidates = namedCandidates.length > 0 ? namedCandidates : medIssues;

  // Prioritize resolved / clinician-reviewed issue, then documented, otherwise latest
  let matchedIssue = candidates.find(c => c.status === 'resolved')
    || candidates.find(c => c.reason_status === 'documented')
    || candidates[0];

  const structured = matchedIssue.summary_structured || {};
  const medName = structured.medication || structured.medication_name || 'your medication';
  const reasonResult = find_reason(matchedIssue.id);

  if (reasonResult.status === 'clinician_explained') {
    return {
      answered: true,
      foundIssue: true,
      issueId: matchedIssue.id,
      issueType: matchedIssue.issue_type,
      medication: medName,
      text: `Your clinician explained the change for ${medName}: "${reasonResult.explanation}".`,
      reasonStatus: 'clinician_explained',
      suggestedQuestions: ["What are the side effects?", "When is my next follow-up?"]
    };
  }

  if (reasonResult.status === 'documented' && reasonResult.verbatim_quote) {
    return {
      answered: true,
      foundIssue: true,
      issueId: matchedIssue.id,
      issueType: matchedIssue.issue_type,
      medication: medName,
      text: `Regarding ${medName}, the clinical note from your visit documents: "${reasonResult.verbatim_quote}".`,
      reasonStatus: 'documented',
      suggestedQuestions: ["Should I take this with food?", "When is my next lab test?"]
    };
  }

  // Reason not found in available records
  return {
    answered: true,
    foundIssue: true,
    issueId: matchedIssue.id,
    issueType: matchedIssue.issue_type,
    medication: medName,
    text: `A documented reason for changing ${medName} was not found in the available records. We recommend adding this to your questions for the doctor at your next visit.`,
    reasonStatus: 'not_found in the available records',
    suggestedQuestions: [
      `Add "Why was my ${medName} changed?" to doctor questions`,
      "View my continuity issues",
      "Request doctor review"
    ]
  };
}
