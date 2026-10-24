import test from 'node:test';
import assert from 'node:assert';
import { runMigrations } from '../db/migrations.js';
import { db } from '../db/database.js';
import { AuthService } from '../services/authService.js';
import { MedicalRecordService } from '../services/medicalRecordService.js';
import { HealthSummaryService } from '../services/clinical/healthSummaryService.js';
import { EvidenceGroundedHealthSummarySchema } from '../schemas/healthSummarySchema.js';
import { app } from '../server.js';

// Run migrations to ensure report_health_summaries table exists
runMigrations();

test('=== HEALTHCOPILOT EVIDENCE-GROUNDED AI HEALTH SUMMARY SUITE ===', async (t) => {
  const timestamp = Date.now();
  let userAlice, userBob;
  let tokenAlice, tokenBob;
  let hospital;
  let normalReport, abnormalCbcReport, missingRangeReport;

  await t.test('1. Setup Test Users & Hospital', async () => {
    const resAlice = await AuthService.register({
      email: `alice.summary.${timestamp}@example.com`,
      password: 'StrongPassword123!',
      name: 'Alice Summary Test',
      bloodGroup: 'B+',
      age: 32
    });
    userAlice = resAlice.user;
    tokenAlice = resAlice.token;

    const resBob = await AuthService.register({
      email: `bob.attacker.${timestamp}@example.com`,
      password: 'StrongPassword123!',
      name: 'Bob Attacker',
      bloodGroup: 'O-',
      age: 40
    });
    userBob = resBob.user;
    tokenBob = resBob.token;

    hospital = MedicalRecordService.createOrSelectHospital(userAlice.id, {
      name: 'Metro Diagnostic Center',
      branch: 'Main',
      location: 'Hyderabad'
    });

    assert.ok(userAlice.id);
    assert.ok(userBob.id);
    assert.ok(hospital.id);
  });

  // --------------------------------------------------------------------------
  // TEST: Normal Results (All Within Reference Range)
  // --------------------------------------------------------------------------
  await t.test('2. Normal Findings: Placed within reference range, no false alarms', async () => {
    const visit = MedicalRecordService.createOrFindVisit(userAlice.id, {
      hospitalId: hospital.id,
      visitDate: '2026-10-10'
    });

    const normalAnalysis = {
      documentType: 'Lab Report',
      labResults: [
        {
          id: 'norm-1',
          name: 'Fasting Blood Glucose',
          rawValue: '88',
          numericValue: 88,
          unit: 'mg/dL',
          referenceRange: { low: 70, high: 99, rawRange: '70 - 99 mg/dL' },
          status: 'NORMAL',
          flags: { isLowConfidence: false, isConflicting: false }
        },
        {
          id: 'norm-2',
          name: 'Total Cholesterol',
          rawValue: '165',
          numericValue: 165,
          unit: 'mg/dL',
          referenceRange: { low: 125, high: 200, rawRange: '125 - 200 mg/dL' },
          status: 'NORMAL',
          flags: { isLowConfidence: false, isConflicting: false }
        }
      ]
    };

    normalReport = await MedicalRecordService.attachReport({
      userId: userAlice.id,
      visitId: visit.id,
      title: 'Routine Normal Lipid & Metabolic',
      category: 'Lab Report',
      reportDate: '2026-10-10',
      fileBuffer: Buffer.from('%PDF-1.4 sample content normal'),
      fileName: 'normal_panel.pdf',
      mimeType: 'application/pdf',
      aiAnalysis: normalAnalysis
    });

    const summary = await HealthSummaryService.getOrGenerateSummary({
      userId: userAlice.id,
      reportId: normalReport.id,
      language: 'en'
    });

    // Validate against strict Zod schema
    const validated = EvidenceGroundedHealthSummarySchema.parse(summary);
    assert.ok(validated);

    assert.strictEqual(summary.withinReferenceRange.length, 2, 'Both normal markers must reside within reference range');
    assert.strictEqual(summary.outsideReferenceRange.length, 0, 'Zero markers should be flagged as outside range');
    assert.strictEqual(summary.flaggedExplanations.length, 0, 'Zero flagged explanations for normal report');
    assert.strictEqual(summary.uncertainties.length, 0, 'Zero uncertainties when ranges are complete');
    assert.ok(summary.overview.includes('within standard reference bounds'), 'Overview notes normal bounds adherence');
    assert.ok(summary.disclaimer.includes('does NOT provide a diagnosis'), 'Disclaimer present');
  });

  // --------------------------------------------------------------------------
  // TEST: Abnormal Results (High/Low Biomarkers Grounded with Non-Diagnostic Explanations)
  // --------------------------------------------------------------------------
  await t.test('3. Abnormal Findings: Flagged results isolated with non-diagnostic explanations', async () => {
    const visit = MedicalRecordService.createOrFindVisit(userAlice.id, {
      hospitalId: hospital.id,
      visitDate: '2026-10-15'
    });

    const cbcAnalysis = {
      documentType: 'Lab Report',
      labResults: [
        {
          id: 'cbc-wbc',
          name: 'WBC Count',
          rawValue: '10,040',
          numericValue: 10040,
          unit: '/mm3',
          referenceRange: { low: 4000, high: 10000, rawRange: '4,000 - 10,000 /mm3' },
          status: 'HIGH',
          flags: { isLowConfidence: false },
          historicalReadings: [
            { date: '04/12/19', value: '14130', numericValue: 14130, unit: '/mm3' },
            { date: '19/06/19', value: '9490', numericValue: 9490, unit: '/mm3' }
          ]
        },
        {
          id: 'cbc-hb',
          name: 'Hemoglobin',
          rawValue: '17.1',
          numericValue: 17.1,
          unit: 'g/dL',
          referenceRange: { low: 14.0, high: 18.0, rawRange: '14.0 - 18.0 g/dL' },
          status: 'NORMAL',
          flags: { isLowConfidence: false },
          historicalReadings: [
            { date: '04/12/19', value: '17.0', numericValue: 17.0, unit: 'g/dL' },
            { date: '19/06/19', value: '17.3', numericValue: 17.3, unit: 'g/dL' }
          ]
        },
        {
          id: 'cbc-plt',
          name: 'Platelet Count',
          rawValue: '267,000',
          numericValue: 267000,
          unit: '/mm3',
          referenceRange: { low: 140000, high: 450000, rawRange: '140,000 - 450,000 /mm3' },
          status: 'NORMAL',
          flags: { isLowConfidence: false }
        }
      ]
    };

    abnormalCbcReport = await MedicalRecordService.attachReport({
      userId: userAlice.id,
      visitId: visit.id,
      title: 'Complete Blood Count Multi-Date',
      category: 'Lab Report',
      reportDate: '2026-10-15',
      fileBuffer: Buffer.from('%PDF-1.4 sample content cbc'),
      fileName: 'cbc_report.pdf',
      mimeType: 'application/pdf',
      aiAnalysis: cbcAnalysis
    });

    const summary = await HealthSummaryService.getOrGenerateSummary({
      userId: userAlice.id,
      reportId: abnormalCbcReport.id,
      language: 'en'
    });

    // Verification
    assert.strictEqual(summary.outsideReferenceRange.length, 1, 'Only WBC Count is outside reference bounds');
    assert.strictEqual(summary.outsideReferenceRange[0].name, 'WBC Count');
    assert.strictEqual(summary.outsideReferenceRange[0].status, 'HIGH');
    assert.strictEqual(summary.outsideReferenceRange[0].value, '10,040');
    assert.strictEqual(summary.outsideReferenceRange[0].sourceFindingId, 'cbc-wbc');

    assert.strictEqual(summary.withinReferenceRange.length, 2, 'Hemoglobin and Platelets reside within range');

    // Flagged explanation must be non-diagnostic
    assert.strictEqual(summary.flaggedExplanations.length, 1);
    const wbcExp = summary.flaggedExplanations[0];
    assert.strictEqual(wbcExp.name, 'WBC Count');
    assert.ok(wbcExp.meaning.includes('above the laboratory reference range'));
    assert.ok(wbcExp.meaning.includes('Consult your doctor'));
    assert.ok(!wbcExp.meaning.includes('You definitely have leukemia'), 'Must never diagnose');

    // Historical trend verification
    assert.ok(summary.historicalComparisons.length >= 1, 'Should detect verified historical comparisons');
    const wbcHist = summary.historicalComparisons.find(h => h.name === 'WBC Count');
    assert.ok(wbcHist, 'WBC historical trend identified');
    assert.strictEqual(wbcHist.trend, 'DECREASED', '10,040 is decreased compared to 14,130 on 04/12/19');
    assert.ok(wbcHist.observation.includes('04/12/19'));
  });

  // --------------------------------------------------------------------------
  // TEST: Missing Reference Ranges & OCR Uncertainty
  // --------------------------------------------------------------------------
  await t.test('4. Missing Reference Range & OCR Uncertainty: Strictly isolated in uncertainties', async () => {
    const visit = MedicalRecordService.createOrFindVisit(userAlice.id, {
      hospitalId: hospital.id,
      visitDate: '2026-10-18'
    });

    const uncertainAnalysis = {
      documentType: 'Lab Report',
      labResults: [
        {
          id: 'unc-1',
          name: 'Alkaline Phosphatase',
          rawValue: '115',
          numericValue: 115,
          unit: 'U/L',
          referenceRange: { low: null, high: null, rawRange: 'Unavailable' }, // Missing range!
          status: 'NORMAL', // Extraction had guessed normal, but summary must NOT claim normal!
          flags: { isLowConfidence: false }
        },
        {
          id: 'unc-2',
          name: 'Serum Bilirubin',
          rawValue: '0.8',
          numericValue: 0.8,
          unit: 'mg/dL',
          referenceRange: { low: 0.2, high: 1.2, rawRange: '0.2 - 1.2 mg/dL' },
          status: 'NORMAL',
          flags: { isLowConfidence: true } // Low OCR confidence!
        }
      ]
    };

    missingRangeReport = await MedicalRecordService.attachReport({
      userId: userAlice.id,
      visitId: visit.id,
      title: 'Hepatic Panel with Missing Range',
      category: 'Lab Report',
      reportDate: '2026-10-18',
      fileBuffer: Buffer.from('%PDF-1.4 sample content uncertain'),
      fileName: 'hepatic_panel.pdf',
      mimeType: 'application/pdf',
      aiAnalysis: uncertainAnalysis
    });

    const summary = await HealthSummaryService.getOrGenerateSummary({
      userId: userAlice.id,
      reportId: missingRangeReport.id,
      language: 'en'
    });

    // 1. Missing reference range MUST be categorized under uncertainties, NOT withinReferenceRange
    const missingRangeItem = summary.uncertainties.find(u => u.name === 'Alkaline Phosphatase');
    assert.ok(missingRangeItem, 'Alkaline Phosphatase must be flagged in uncertainties');
    assert.ok(missingRangeItem.reason.includes('Reference interval was not specified'));
    assert.strictEqual(
      summary.withinReferenceRange.some(w => w.name === 'Alkaline Phosphatase'),
      false,
      'Marker with missing reference range MUST NOT be claimed as within range or normal'
    );

    // 2. Low OCR confidence must be noted in uncertainties
    const lowConfItem = summary.uncertainties.find(u => u.name === 'Serum Bilirubin');
    assert.ok(lowConfItem, 'Low confidence OCR item flagged in uncertainties');
    assert.ok(lowConfItem.reason.includes('Low OCR extraction confidence'));
  });

  // --------------------------------------------------------------------------
  // TEST: Telugu & Hindi Localization
  // --------------------------------------------------------------------------
  await t.test('5. Multilingual Synthesis: Accurate Telugu and Hindi clinical outputs', async () => {
    // Telugu
    const teluguSummary = await HealthSummaryService.getOrGenerateSummary({
      userId: userAlice.id,
      reportId: abnormalCbcReport.id,
      language: 'te',
      forceRegenerate: true
    });

    EvidenceGroundedHealthSummarySchema.parse(teluguSummary);
    assert.strictEqual(teluguSummary.language, 'te');
    assert.ok(teluguSummary.overview.includes('పరీక్షా పారామితులు'), 'Telugu overview contains clinical vocabulary');
    assert.ok(teluguSummary.disclaimer.includes('ముఖ్యమైన గమనిక: ఈ AI సారాంశం'), 'Telugu disclaimer present');
    assert.ok(teluguSummary.flaggedExplanations[0].meaning.includes('WBC కౌంట్'), 'Telugu explanation for WBC Count present');

    // Hindi
    const hindiSummary = await HealthSummaryService.getOrGenerateSummary({
      userId: userAlice.id,
      reportId: abnormalCbcReport.id,
      language: 'hi',
      forceRegenerate: true
    });

    EvidenceGroundedHealthSummarySchema.parse(hindiSummary);
    assert.strictEqual(hindiSummary.language, 'hi');
    assert.ok(hindiSummary.overview.includes('परीक्षण मापदंडों'), 'Hindi overview contains clinical vocabulary');
    assert.ok(hindiSummary.disclaimer.includes('महत्वपूर्ण सूचना: यह एआई सारांश'), 'Hindi disclaimer present');
    assert.ok(hindiSummary.flaggedExplanations[0].meaning.includes('WBC काउंट'), 'Hindi explanation for WBC Count present');
  });

  // --------------------------------------------------------------------------
  // TEST: Database Persistence & Cache Invalidation
  // --------------------------------------------------------------------------
  await t.test('6. Database Persistence: Cache hit and invalidation on data change', async () => {
    // 1. Verify persisted row in report_health_summaries table
    const dbRow = db.prepare(`
      SELECT * FROM report_health_summaries WHERE report_id = ? AND language = 'en'
    `).get(abnormalCbcReport.id);

    assert.ok(dbRow, 'Summary record exists in SQLite report_health_summaries table');
    assert.strictEqual(dbRow.user_id, userAlice.id);

    // 2. Calling without forceRegenerate should return cached entry immediately
    const cachedSummary = await HealthSummaryService.getOrGenerateSummary({
      userId: userAlice.id,
      reportId: abnormalCbcReport.id,
      language: 'en',
      forceRegenerate: false
    });
    assert.strictEqual(cachedSummary.reportId, abnormalCbcReport.id);

    // 3. Modifying report findings invalidates data_hash and triggers fresh generation
    const updatedAiAnalysis = {
      documentType: 'Lab Report',
      labResults: [
        {
          id: 'cbc-wbc-updated',
          name: 'WBC Count',
          rawValue: '6,200',
          numericValue: 6200,
          unit: '/mm3',
          referenceRange: { low: 4000, high: 10000, rawRange: '4,000 - 10,000 /mm3' },
          status: 'NORMAL',
          flags: { isLowConfidence: false }
        }
      ]
    };

    db.prepare(`
      UPDATE medical_reports SET ai_analysis_json = ? WHERE id = ?
    `).run(JSON.stringify(updatedAiAnalysis), abnormalCbcReport.id);

    const freshSummary = await HealthSummaryService.getOrGenerateSummary({
      userId: userAlice.id,
      reportId: abnormalCbcReport.id,
      language: 'en',
      forceRegenerate: false
    });

    assert.strictEqual(freshSummary.outsideReferenceRange.length, 0, 'Updated WBC is now normal');
    assert.strictEqual(freshSummary.withinReferenceRange.length, 1, 'Updated WBC is now in withinReferenceRange');
  });

  // --------------------------------------------------------------------------
  // TEST: Multi-Tenant Authorization & Security
  // --------------------------------------------------------------------------
  await t.test('7. Security: User Bob is blocked from accessing Alice summary (404/Forbidden)', async () => {
    await assert.rejects(
      async () => {
        await HealthSummaryService.getOrGenerateSummary({
          userId: userBob.id,
          reportId: abnormalCbcReport.id, // Alice's report!
          language: 'en'
        });
      },
      (err) => {
        assert.strictEqual(err.code, 'REPORT_NOT_FOUND');
        assert.strictEqual(err.status, 404);
        return true;
      },
      'Bob must be rejected when attempting to fetch Alice report summary'
    );
  });

  // --------------------------------------------------------------------------
  // TEST: Live HTTP Endpoints (GET & POST /api/reports/:id/summary)
  // --------------------------------------------------------------------------
  await t.test('8. HTTP API Endpoints: Auth enforcement and multilingual responses', async () => {
    let server;
    const testPort = 5022;
    await new Promise((resolve) => {
      server = app.listen(testPort, () => resolve());
    });

    try {
      const baseUrl = `http://localhost:${testPort}`;

      // 1. Unauthenticated request -> HTTP 401
      const unauthRes = await fetch(`${baseUrl}/api/reports/${normalReport.id}/summary`);
      assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must return 401');

      // 2. Cross-user access -> HTTP 404
      const crossRes = await fetch(`${baseUrl}/api/reports/${normalReport.id}/summary`, {
        headers: { Authorization: `Bearer ${tokenBob}` }
      });
      assert.strictEqual(crossRes.status, 404, 'User Bob accessing Alice report summary must return 404');

      // 3. Alice requests summary in Telugu -> HTTP 200
      const teRes = await fetch(`${baseUrl}/api/reports/${normalReport.id}/summary?lang=te`, {
        headers: { Authorization: `Bearer ${tokenAlice}` }
      });
      assert.strictEqual(teRes.status, 200, 'Alice accessing own report summary in Telugu returns 200');
      const teJson = await teRes.json();
      assert.strictEqual(teJson.success, true);
      assert.strictEqual(teJson.data.language, 'te');
      assert.ok(teJson.data.overview.includes('పరీక్షా పారామితులు'));

      // 4. Alice requests fresh generation in Hindi -> HTTP 200
      const hiRes = await fetch(`${baseUrl}/api/reports/${normalReport.id}/summary/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAlice}`
        },
        body: JSON.stringify({ language: 'hi', force: true })
      });
      assert.strictEqual(hiRes.status, 200, 'Alice generating summary in Hindi returns 200');
      const hiJson = await hiRes.json();
      assert.strictEqual(hiJson.success, true);
      assert.strictEqual(hiJson.data.language, 'hi');
      assert.ok(hiJson.data.overview.includes('परीक्षण मापदंडों'));
    } finally {
      server.close();
    }
  });
});
