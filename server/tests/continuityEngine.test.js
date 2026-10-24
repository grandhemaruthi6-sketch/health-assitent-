import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../db/database.js';
import { run_continuity_engine } from '../services/continuity/continuityEngine.js';
import {
  normalize_med_name,
  normalize_dose,
  normalize_frequency,
  normalize_lab_name
} from '../services/continuity/normalizer.js';
import { find_continuity_reason } from '../services/continuity/reasonFinder.js';
import { check_patient_evidence_chain } from '../services/continuity/evidenceChain.js';
import {
  transitionIssueStatus,
  patientConfirmIssue,
  getIssueHistory,
  getIssuesForPatient
} from '../services/continuity/issueLifecycle.js';
import {
  generateDoctorGrant,
  verifyDoctorGrant,
  submitIssueReview,
  getDecisionMemory,
  isDoctorAccessActive
} from '../services/continuity/doctorAccessService.js';
import {
  get_latest_lab,
  get_med_history,
  get_issues,
  get_decision_for_issue,
  find_reason,
  answerMedicineChangeQuery
} from '../services/continuity/companionTools.js';
import { seedRamesh } from '../scripts/seedRameshAndContinuityCases.js';

test('=== CONTINUITY ENGINE SUITE: RAMESH BENCHMARK & CORE PRINCIPLES ===', async (t) => {
  // 1. Seed and run Ramesh Sharma benchmark
  await t.test('1. Ramesh Sharma Benchmark Execution', () => {
    const { patientId, runResult } = seedRamesh();
    assert.equal(runResult.success, true);
    assert.equal(patientId, 'patient-ramesh-001');

    const issues = getIssuesForPatient(patientId);
    assert.ok(issues.length >= 2, `Expected at least 2 issues, got ${issues.length}`);

    // Verify MED_FREQ_CHANGE has reason 'not_found in the available records'
    const freqIssue = issues.find(i => i.issue_type === 'MED_FREQ_CHANGE');
    assert.ok(freqIssue, 'Expected MED_FREQ_CHANGE issue for Metformin frequency change');
    assert.equal(freqIssue.reason_status, 'not_found');
    assert.ok(freqIssue.reason_text.toLowerCase().includes('not found in the available records'));

    // Verify MISSING_EVIDENCE for MRI Lumbar Spine
    const mriIssue = issues.find(i => i.issue_type === 'MISSING_EVIDENCE');
    assert.ok(mriIssue, 'Expected MISSING_EVIDENCE issue for referenced MRI');
    assert.equal(mriIssue.reason_status, 'not_found');
    assert.ok(mriIssue.reason_text.toLowerCase().includes('not found in the available records'));

    // Verify ZERO false lab alerts for HbA1c fluctuation (7.9% -> 7.8%)
    const labIssues = issues.filter(i => i.issue_type === 'LAB_SIGNIFICANT_CHANGE');
    assert.equal(labIssues.length, 0, 'Expected 0 false lab alerts for minor HbA1c fluctuation');
  });

  // 2. Normalizer Tests
  await t.test('2. Normalizer: Generic/Brand, Doses, and Unknown Frequencies', () => {
    // Brand -> Generic
    assert.equal(normalize_med_name('Calpol 500').canonical_name, 'Paracetamol');
    assert.equal(normalize_med_name('Glucophage 1000mg').canonical_name, 'Metformin');

    // Canonical Dose (mcg -> mg)
    const normMcg = normalize_dose(500, 'mcg');
    assert.equal(normMcg.value, 0.5);
    assert.equal(normMcg.unit, 'mg');

    // Unknown frequency flag
    const normUnknownFreq = normalize_frequency('every full moon');
    assert.equal(normUnknownFreq.needs_confirmation, true);

    // Standard frequency
    const normBid = normalize_frequency('twice daily');
    assert.equal(normBid.canonical_code, 'BID');
    assert.equal(normBid.needs_confirmation, false);

    // Canonical Lab Name & Unit
    const normHb = normalize_lab_name('Hb');
    assert.equal(normHb.canonical_name, 'Hemoglobin');
    assert.equal(normHb.canonical_unit, 'g/dL');
  });

  // 3. Reason Finder Strictness
  await t.test('3. Reason Finder: Non-Negotiable Exact Abstention', () => {
    const res = find_continuity_reason('patient-non-existent', {
      itemName: 'UnknownDrug',
      afterDate: '2026-01-01'
    });
    assert.equal(res.reason_status, 'not_found');
    assert.equal(res.reason_text, 'Reason not found in the available records');
  });

  // 4. Lifecycle State Machine & Audit Trail
  await t.test('4. State Machine: Transitions and Immutable Audit Logging', () => {
    const issues = getIssuesForPatient('patient-ramesh-001');
    const testIssue = issues[0];

    // Patient confirmation moves to pending_review
    const confirmed = patientConfirmIssue(testIssue.id, 'patient-ramesh-001', {
      confirmed: true,
      patientNote: 'Yes, I noticed the change.'
    });
    assert.equal(confirmed.status, 'pending_review');

    // Check audit trail
    const history = getIssueHistory(testIssue.id);
    assert.ok(history.length >= 1);
    const lastAudit = history[history.length - 1];
    assert.equal(lastAudit.action, 'PATIENT_CONFIRMED');

    // Rejects invalid transition
    assert.throws(() => {
      transitionIssueStatus(testIssue.id, 'detected', 'doc-1', 'doctor');
    }, /Invalid status transition/);
  });

  // 5. Doctor Access Grant & Decision Memory
  await t.test('5. Doctor Access Grant (6-digit PIN) & Decision Record Creation', () => {
    // Patient generates grant
    const grant = generateDoctorGrant('patient-ramesh-001', 'dr-rao-123');
    assert.ok(grant.code);
    assert.equal(grant.code.length, 6);

    // Doctor enters 6-digit code
    const verification = verifyDoctorGrant('dr-rao-123', grant.code);
    assert.equal(verification.success, true);
    assert.equal(isDoctorAccessActive('patient-ramesh-001', 'dr-rao-123'), true);

    // Doctor reviews issue and creates Decision Record
    const issues = getIssuesForPatient('patient-ramesh-001');
    const targetIssue = issues.find(i => i.issue_type === 'MED_FREQ_CHANGE') || issues[0];

    const reviewRes = submitIssueReview(targetIssue.id, {
      reviewerId: 'dr-rao-123',
      reviewerRole: 'doctor',
      action: 'confirmed_intentional',
      explanationText: 'Frequency adjusted to OD due to stable evening glycemic readings.',
      evidenceDocumentIds: ['doc-ramesh-v3']
    });

    assert.equal(reviewRes.status, 'resolved');
    assert.ok(reviewRes.decisionId);

    // Decision Memory check
    const decisions = getDecisionMemory('patient-ramesh-001');
    assert.ok(decisions.length >= 1);
    const matched = decisions.find(d => d.id === reviewRes.decisionId);
    assert.ok(matched);
    assert.equal(matched.decision, 'confirmed_intentional');
  });

  // 6. Companion Grounded Question Answering
  await t.test('6. Companion Tools: Answering "Why did my medicine change?"', () => {
    // 1. Tool calls
    const lab = get_latest_lab('patient-ramesh-001', 'HbA1c');
    assert.ok(lab);
    assert.equal(lab.value_num, 7.8);

    const medHistory = get_med_history('patient-ramesh-001', 'Metformin');
    assert.ok(medHistory.length >= 2);

    // 2. High-level answer: resolved issue quotes clinician
    const ansResolved = answerMedicineChangeQuery('patient-ramesh-001', 'Why did my Metformin change?');
    assert.ok(ansResolved);
    assert.equal(ansResolved.answered, true);
    assert.ok(ansResolved.text.includes('Frequency adjusted to OD'));

    // 3. Question for undocumented medicine changes returns "not found in the available records"
    const ansUndoc = answerMedicineChangeQuery('patient-ramesh-001', 'Why was my Amlodipine changed?');
    assert.ok(ansUndoc);
    // Suggests consulting doctor without inventing reasons
    assert.ok(ansUndoc.text.includes('available records') || ansUndoc.text.includes('verify with your doctor'));
  });
});
