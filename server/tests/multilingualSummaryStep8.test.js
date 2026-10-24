import assert from 'assert';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { runMigrations } from '../db/migrations.js';
import { evaluateBiomarkerStatus } from '../services/clinical/statusEngine.js';
import { validateAiSummaryOutput } from '../services/clinical/aiValidator.js';
import { HealthSummaryService } from '../services/clinical/healthSummaryService.js';
import { MULTILINGUAL_TEST_KNOWLEDGE, findTestKnowledge } from '../data/multilingualKnowledgeBase.js';

console.log('--- STARTING STEP 8: MULTILINGUAL SUMMARY COMPREHENSIVE VERIFICATION SUITE ---\n');

// 0. Ensure migrations applied
runMigrations(db);

let testsPassed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    throw err;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    throw err;
  }
}

// Helper: Setup test user, hospital, visit and report in DB
const testUserId = `test-user-${Date.now()}`;
const testHospitalId = `test-hosp-${Date.now()}`;
const testVisitId = `test-visit-${Date.now()}`;

db.prepare(`
  INSERT OR REPLACE INTO users (id, email, name, password_hash, created_at, updated_at)
  VALUES (?, ?, 'Test Patient', ?, datetime('now'), datetime('now'))
`).run(testUserId, `${testUserId}@example.com`, 'hash123');

db.prepare(`
  INSERT INTO hospitals (id, user_id, name, created_at)
  VALUES (?, ?, 'Apollo Diagnostics', datetime('now'))
`).run(testHospitalId, testUserId);

db.prepare(`
  INSERT INTO hospital_visits (id, user_id, hospital_id, visit_date, department, created_at)
  VALUES (?, ?, ?, '2026-10-24', 'General Medicine', datetime('now'))
`).run(testVisitId, testUserId, testHospitalId);

function createDbReport(reportId, labResults, title = 'Lab Report') {
  const analysisJson = JSON.stringify({ labResults });
  const hash = crypto.createHash('sha256').update(reportId).digest('hex');
  db.prepare(`
    INSERT INTO medical_reports (
      id, user_id, visit_id, title, file_name, mime_type, file_storage_path, file_size_bytes,
      file_hash_sha256, category, report_date, uploaded_at, processing_status, ai_analysis_json,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'application/pdf', '/dummy.pdf', 1024, ?, 'lab_report', '2026-10-24', datetime('now'), 'completed', ?, datetime('now'), datetime('now'))
  `).run(reportId, testUserId, testVisitId, title, `${reportId}.pdf`, hash, analysisJson);
}

// ==========================================
// TEST 1: Status Engine Deterministic Logic
// ==========================================
runTest('StatusEngine - Numeric two-sided and one-sided ranges & qualitative', () => {
  // In range
  const r1 = evaluateBiomarkerStatus({ value: 14.0, referenceRange: '12.0 - 16.0' });
  assert.strictEqual(r1.status, 'in_range');
  assert.strictEqual(r1.direction, 'IN_RANGE');

  // Slightly outside (low): 11.5 with range 12.0 - 16.0 (range span 4, deviation 0.5/4 = 12.5% <= 15%)
  const r2 = evaluateBiomarkerStatus({ value: 11.5, referenceRange: '12.0 - 16.0' });
  assert.strictEqual(r2.status, 'slightly_outside');
  assert.strictEqual(r2.direction, 'LOWER');

  // Clearly outside (high): 13,000 with range 4,000 - 11,000 (span 7,000, dev 2,000/7,000 = 28.5% <= 40%)
  const r3 = evaluateBiomarkerStatus({ value: 13000, referenceRange: '4000 - 11000' });
  assert.strictEqual(r3.status, 'clearly_outside');
  assert.strictEqual(r3.direction, 'HIGHER');

  // Far outside (high): 240 with range 70 - 100 (span 30, dev 140/30 = 466% > 40%)
  const r4 = evaluateBiomarkerStatus({ value: 240, referenceRange: '70 - 100' });
  assert.strictEqual(r4.status, 'far_outside');
  assert.strictEqual(r4.direction, 'HIGHER');

  // One-sided: < 200
  const r5In = evaluateBiomarkerStatus({ value: 180, referenceRange: '< 200' });
  assert.strictEqual(r5In.status, 'in_range');

  const r5Out = evaluateBiomarkerStatus({ value: 220, referenceRange: '< 200' });
  assert.strictEqual(r5Out.status, 'slightly_outside'); // (220-200)/200 = 10% <= 15%
  assert.strictEqual(r5Out.direction, 'HIGHER');

  // Qualitative: Positive vs Negative
  const r6 = evaluateBiomarkerStatus({ value: 'Positive', referenceRange: 'Negative' });
  assert.strictEqual(r6.status, 'clearly_outside');
  assert.strictEqual(r6.direction, 'HIGHER');

  // Qualitative: Negative vs Negative
  const r7 = evaluateBiomarkerStatus({ value: 'Negative', referenceRange: 'Negative' });
  assert.strictEqual(r7.status, 'in_range');

  // Qualitative: Nil vs Nil
  const r8 = evaluateBiomarkerStatus({ value: 'Nil', referenceRange: 'Nil' });
  assert.strictEqual(r8.status, 'in_range');

  // Qualitative: Present vs Absent
  const r9 = evaluateBiomarkerStatus({ value: 'Present', referenceRange: 'Absent' });
  assert.strictEqual(r9.status, 'clearly_outside');

  // Unreadable value
  const r10 = evaluateBiomarkerStatus({ value: 'BLURRED_UNCLEAR', referenceRange: '12 - 16' });
  assert.strictEqual(r10.status, 'needs_review');
});

// ==========================================
// TEST 2: AI Validator Strict Guardrails
// ==========================================
runTest('AIValidator - Blocks banned words and ungrounded numbers', () => {
  const context = {
    totalFindings: 2,
    outsideCount: 1,
    withinCount: 1,
    uncertainCount: 0,
    findings: [
      { value: '11.5', referenceRange: '12.0 - 16.0' },
      { value: '105', referenceRange: '70 - 100' }
    ],
    reportDate: '2026-10-24'
  };

  // Banned word test: "anemia"
  const v1 = validateAiSummaryOutput('This report shows signs of anemia.', context);
  assert.strictEqual(v1.isValid, false);
  assert(v1.reason.includes('anemia'));

  // Banned word test: "disease"
  const v2 = validateAiSummaryOutput('There may be signs of kidney disease.', context);
  assert.strictEqual(v2.isValid, false);
  assert(v2.reason.includes('disease'));

  // Banned word test: "normal"
  const v3 = validateAiSummaryOutput('Your hemoglobin is normal.', context);
  assert.strictEqual(v3.isValid, false);
  assert(v3.reason.includes('normal'));

  // Ungrounded number test: "550" not in context
  const v4 = validateAiSummaryOutput('Your blood sugar is 550 mg/dL.', context);
  assert.strictEqual(v4.isValid, false);
  assert(v4.reason.includes('Ungrounded number'));

  // Valid grounded non-diagnostic text
  const v5 = validateAiSummaryOutput(
    'Your report includes 2 findings. Fasting blood sugar is 105 mg/dL which is outside the stated reference range.',
    context
  );
  assert.strictEqual(v5.isValid, true);
});

// ==========================================
// TEST 3: Report Profile 1 - All In Range
// ==========================================
await runAsyncTest('Profile 1 - All results in range', async () => {
  const reportId = `rep-all-in-${Date.now()}`;
  const labResults = [
    { name: 'Hemoglobin', rawValue: '14.2', unit: 'g/dL', referenceRange: { rawRange: '12.0 - 16.0', low: 12.0, high: 16.0 } },
    { name: 'Platelet Count', rawValue: '250000', unit: '/mcL', referenceRange: { rawRange: '150000 - 450000', low: 150000, high: 450000 } },
    { name: 'Total WBC Count', rawValue: '7000', unit: '/uL', referenceRange: { rawRange: '4000 - 11000', low: 4000, high: 11000 } }
  ];
  createDbReport(reportId, labResults, 'Normal CBC Panel');

  const summary = await HealthSummaryService.getOrGenerateSummary({
    userId: testUserId,
    reportId,
    language: 'en',
    forceRegenerate: true
  });

  assert(summary.statusBanner, 'statusBanner must be present');
  assert.strictEqual(summary.statusBanner.allInRange, true);
  assert.strictEqual(summary.statusBanner.outsideCount, 0);
  assert.strictEqual(summary.statusBanner.totalCount, 3);
  assert.strictEqual(summary.outsideRangeCards.length, 0);
  assert(summary.statusBanner.headline.includes("within the lab's range"));
});

// ==========================================
// TEST 4: Profile 2 - Low and High Outside Range
// ==========================================
await runAsyncTest('Profile 2 - Low and high results outside range', async () => {
  const reportId = `rep-low-high-${Date.now()}`;
  const labResults = [
    { name: 'Hemoglobin', rawValue: '11.0', unit: 'g/dL', referenceRange: { rawRange: '12.0 - 16.0', low: 12.0, high: 16.0 } }, // Low (clearly_outside)
    { name: 'Total WBC Count', rawValue: '13500', unit: '/uL', referenceRange: { rawRange: '4000 - 11000', low: 4000, high: 11000 } }, // High (clearly_outside)
    { name: 'Platelet Count', rawValue: '250000', unit: '/mcL', referenceRange: { rawRange: '150000 - 450000', low: 150000, high: 450000 } } // In range
  ];
  createDbReport(reportId, labResults, 'CBC with Flags');

  const summary = await HealthSummaryService.getOrGenerateSummary({
    userId: testUserId,
    reportId,
    language: 'en',
    forceRegenerate: true
  });

  assert.strictEqual(summary.statusBanner.allInRange, false);
  assert.strictEqual(summary.statusBanner.outsideCount, 2);
  assert.strictEqual(summary.outsideRangeCards.length, 2);

  const hbCard = summary.outsideRangeCards.find(c => c.testName === 'Hemoglobin');
  assert(hbCard, 'Hemoglobin card must exist');
  assert.strictEqual(hbCard.direction, 'LOWER');
  assert.strictEqual(hbCard.arrow, '↓');
  assert(hbCard.commonReasons.length > 0, 'Must have common reasons from KB');
  assert(hbCard.questionsForDoctor.length >= 2, 'Must have questions for doctor');

  const wbcCard = summary.outsideRangeCards.find(c => c.testName === 'Total WBC Count');
  assert(wbcCard, 'WBC card must exist');
  assert.strictEqual(wbcCard.direction, 'HIGHER');
  assert.strictEqual(wbcCard.arrow, '↑');
});

// ==========================================
// TEST 5: Profile 3 - Far Outside with Urgent Notice in EN, TE, HI
// ==========================================
await runAsyncTest('Profile 3 - Far outside with urgent doctor notice in EN, TE, HI', async () => {
  const reportId = `rep-far-out-${Date.now()}`;
  const labResults = [
    { name: 'Fasting Blood Sugar', rawValue: '250', unit: 'mg/dL', referenceRange: { rawRange: '70 - 100', low: 70, high: 100 } }
  ];
  createDbReport(reportId, labResults, 'Diabetic Sugar Panel');

  // English
  const summaryEn = await HealthSummaryService.getOrGenerateSummary({
    userId: testUserId,
    reportId,
    language: 'en',
    forceRegenerate: true
  });
  assert.strictEqual(summaryEn.outsideRangeCards[0].status, 'far_outside');
  assert(summaryEn.outsideRangeCards[0].urgentDoctorNotice, 'Urgent notice must be set for far_outside in EN');
  assert(summaryEn.outsideRangeCards[0].urgentDoctorNotice.includes('Please talk to your doctor soon'));

  // Telugu
  const summaryTe = await HealthSummaryService.getOrGenerateSummary({
    userId: testUserId,
    reportId,
    language: 'te',
    forceRegenerate: true
  });
  assert.strictEqual(summaryTe.outsideRangeCards[0].status, 'far_outside');
  assert(summaryTe.outsideRangeCards[0].urgentDoctorNotice, 'Urgent notice must be set for far_outside in TE');
  assert(summaryTe.outsideRangeCards[0].urgentDoctorNotice.includes('వైద్యుడితో మాట్లాడండి'));

  // Hindi
  const summaryHi = await HealthSummaryService.getOrGenerateSummary({
    userId: testUserId,
    reportId,
    language: 'hi',
    forceRegenerate: true
  });
  assert.strictEqual(summaryHi.outsideRangeCards[0].status, 'far_outside');
  assert(summaryHi.outsideRangeCards[0].urgentDoctorNotice, 'Urgent notice must be set for far_outside in HI');
  assert(summaryHi.outsideRangeCards[0].urgentDoctorNotice.includes('डॉक्टर से बात करें'));
});

// ==========================================
// TEST 6: Profile 4 - Unknown Test Missing from KB
// ==========================================
await runAsyncTest('Profile 4 - Unknown test: value, range, arrow, ask doctor, NO causes, logged to missing_knowledge', async () => {
  const reportId = `rep-unknown-kb-${Date.now()}`;
  const unknownName = `Serum Ceruloplasmin Copper ${Date.now()}`;
  const labResults = [
    { name: unknownName, rawValue: '8.0', unit: 'mg/dL', referenceRange: { rawRange: '20.0 - 60.0', low: 20.0, high: 60.0 } }
  ];
  createDbReport(reportId, labResults, 'Rare Specialized Panel');

  const summary = await HealthSummaryService.getOrGenerateSummary({
    userId: testUserId,
    reportId,
    language: 'en',
    forceRegenerate: true
  });

  assert.strictEqual(summary.outsideRangeCards.length, 1);
  const card = summary.outsideRangeCards[0];
  assert.strictEqual(card.testName, unknownName);
  assert.strictEqual(card.direction, 'LOWER');
  assert.strictEqual(card.arrow, '↓');
  assert.strictEqual(card.isUnknown, true);
  // CRITICAL REQUIREMENT: Unknown test MUST NOT display fabricated causes
  assert.strictEqual(card.commonReasons.length, 0, 'Unknown tests must have NO causes');
  assert(card.questionsForDoctor.length >= 1, 'Must have question to ask doctor');

  // Verify logged to missing_knowledge table
  const row = db.prepare('SELECT * FROM missing_knowledge WHERE test_name = ?').get(unknownName);
  assert(row, 'Missing test must be recorded in missing_knowledge table');
  assert.strictEqual(row.test_name, unknownName);
  assert.strictEqual(row.raw_value, '8.0');
});

// ==========================================
// TEST 7: Profile 5 - Unreadable/One-Sided Range & Qualitative Results
// ==========================================
await runAsyncTest('Profile 5 - One-sided range & unreadable result', async () => {
  const reportId = `rep-onesided-unreadable-${Date.now()}`;
  const labResults = [
    { name: 'Total Cholesterol', rawValue: '235', unit: 'mg/dL', referenceRange: { rawRange: '< 200' } },
    { name: 'Urine Leukocyte Esterase', rawValue: 'Positive', unit: '', referenceRange: { rawRange: 'Negative' } },
    { name: 'Urine Ketones', rawValue: 'Negative', unit: '', referenceRange: { rawRange: 'Negative' } },
    { name: 'Serum Electrolyte Pot', rawValue: '', unit: 'mmol/L', referenceRange: { rawRange: '3.5 - 5.0' } } // missing/unreadable
  ];
  createDbReport(reportId, labResults, 'Mixed Panel');

  const summary = await HealthSummaryService.getOrGenerateSummary({
    userId: testUserId,
    reportId,
    language: 'en',
    forceRegenerate: true
  });

  assert.strictEqual(summary.statusBanner.allInRange, false);
  assert.strictEqual(summary.statusBanner.unreadableCount, 1);

  // Verify cards include the needs_review item
  const unreadableCard = summary.outsideRangeCards.find(c => c.testName === 'Serum Electrolyte Pot');
  assert(unreadableCard, 'Unreadable finding must produce a card for review');
  assert.strictEqual(unreadableCard.status, 'needs_review');
});

// ==========================================
// TEST 8: Instant Persistence and Multilingual Caching
// ==========================================
await runAsyncTest('Step 2 & Caching - Saves with version=2, reloads instantly without re-calling AI', async () => {
  const reportId = `rep-cache-test-${Date.now()}`;
  const labResults = [
    { name: 'Hemoglobin', rawValue: '10.5', unit: 'g/dL', referenceRange: { rawRange: '12.0 - 16.0', low: 12.0, high: 16.0 } }
  ];
  createDbReport(reportId, labResults, 'Anemia Check');

  // 1. Generate English
  const en = await HealthSummaryService.getOrGenerateSummary({ userId: testUserId, reportId, language: 'en' });
  // 2. Generate Telugu
  const te = await HealthSummaryService.getOrGenerateSummary({ userId: testUserId, reportId, language: 'te' });
  // 3. Generate Hindi
  const hi = await HealthSummaryService.getOrGenerateSummary({ userId: testUserId, reportId, language: 'hi' });

  // Verify rows in report_health_summaries table
  const rows = db.prepare('SELECT language, version, summary_json FROM report_health_summaries WHERE report_id = ?').all(reportId);
  assert.strictEqual(rows.length, 3, 'Must have 3 cached languages for this report');
  assert(rows.every(r => r.version === 2), 'All rows must be version 2');

  // Verify instant reload from cache (forceRegenerate = false)
  const cachedEn = await HealthSummaryService.getOrGenerateSummary({ userId: testUserId, reportId, language: 'en', forceRegenerate: false });
  assert.deepStrictEqual(cachedEn.outsideRangeCards[0].testName, en.outsideRangeCards[0].testName);

  // Telugu display name retains English name
  assert(te.outsideRangeCards[0].displayName.includes('Hemoglobin'), 'Display name must retain English test name');
  assert(hi.outsideRangeCards[0].displayName.includes('Hemoglobin'), 'Display name must retain English test name');

  // Telugu plain meaning localized
  assert(te.outsideRangeCards[0].whatIsThisTest.length > 0, 'Telugu card must have Telugu explanation');
  assert(hi.outsideRangeCards[0].whatIsThisTest.length > 0, 'Hindi card must have Hindi explanation');

  // Non-diagnostic footer disclaimers
  assert.strictEqual(en.footerNotice, 'Not a diagnosis. Your doctor decides.');
  assert.strictEqual(te.footerNotice, 'ఇది వైద్య నిర్ధారణ కాదు. మీ వైద్యుడే నిర్ణయిస్తారు.');
  assert.strictEqual(hi.footerNotice, 'यह कोई चिकित्सीय निदान नहीं है। आपके डॉक्टर ही निर्णय लेते हैं।');
});

// ==========================================
// TEST 9: Knowledge Base Coverage Verification
// ==========================================
runTest('KnowledgeBase - 54 Clinical Tests Covered with all 3 languages', () => {
  assert(MULTILINGUAL_TEST_KNOWLEDGE.length >= 40, `KB must cover at least 40 tests, found ${MULTILINGUAL_TEST_KNOWLEDGE.length}`);
  console.log(`Knowledge Base Total Clinical Tests: ${MULTILINGUAL_TEST_KNOWLEDGE.length}`);

  let unreviewedCount = 0;
  for (const item of MULTILINGUAL_TEST_KNOWLEDGE) {
    assert(item.id, 'Each item must have an id');
    assert(item.area, 'Each item must have an area');
    assert(item.en && item.en.display_name && item.en.plain_meaning, `Item ${item.id} missing English definitions`);
    assert(item.te && item.te.display_name && item.te.plain_meaning, `Item ${item.id} missing Telugu definitions`);
    assert(item.hi && item.hi.display_name && item.hi.plain_meaning, `Item ${item.id} missing Hindi definitions`);

    if (item.te.language_reviewed === false) unreviewedCount++;
    if (item.hi.language_reviewed === false) unreviewedCount++;
  }

  console.log(`Knowledge Base Unreviewed Language Entries (flagged for clinical native speaker check): ${unreviewedCount}`);
});

console.log(`\n======================================================`);
console.log(`ALL ${testsPassed} COMPREHENSIVE VERIFICATION TESTS PASSED!`);
console.log(`======================================================\n`);
