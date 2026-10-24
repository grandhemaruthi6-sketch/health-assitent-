import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'node:assert';

process.env.OCR_PROVIDER = 'test-synthetic';

import { processMedicalDocument } from '../services/clinical/medicalPipelineService.js';
import { getOcrProvider, resetOcrProvider } from '../services/ocr/ocrFactory.js';
import { MedicalRecordService } from '../services/medicalRecordService.js';
import { getDatabase } from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, 'fixtures');

let testsPassed = 0;
let testsFailed = 0;

function logTest(name, condition, errorMsg = '') {
  if (condition) {
    console.log(`  ✓ [PASS] ${name}`);
    testsPassed++;
  } else {
    console.error(`  ✗ [FAIL] ${name} ${errorMsg ? '— ' + errorMsg : ''}`);
    testsFailed++;
  }
}

async function runRegressionTestSuite() {
  console.log('\n================================================================');
  console.log('   HealthCopilot AI — Document-Specific OCR & Isolation Tests');
  console.log('================================================================\n');

  // Load Fixture Buffers
  const urinePdfBuffer = fs.readFileSync(path.join(fixturesDir, 'synthetic_urine_report.pdf'));
  const cbcPdfBuffer = fs.readFileSync(path.join(fixturesDir, 'synthetic_cbc_report.pdf'));
  const lipidPdfBuffer = fs.readFileSync(path.join(fixturesDir, 'synthetic_lipid_report.pdf'));

  // ----------------------------------------------------
  // TEST SUITE 1: URINALYSIS EXTRACTION ACCURACY & PURITY
  // ----------------------------------------------------
  console.log('--- Suite 1: Urinalysis Specific Parameters & Purity ---');

  const urineResult = await processMedicalDocument({
    fileBuffer: urinePdfBuffer,
    mimeType: 'application/pdf',
    fileName: 'synthetic_urine_report.pdf'
  });

  const urineBiomarkerNames = urineResult.labResults.map(l => l.name);

  // 1. Mandatory Urinalysis Parameters Must Be Present
  logTest("Urinalysis extracts 'Specific Gravity'", urineBiomarkerNames.includes('Specific Gravity'));
  logTest("Urinalysis extracts 'Urine pH'", urineBiomarkerNames.includes('Urine pH'));
  logTest("Urinalysis extracts 'Urine Protein'", urineBiomarkerNames.includes('Urine Protein'));
  logTest("Urinalysis extracts 'Urine Glucose'", urineBiomarkerNames.includes('Urine Glucose'));
  logTest("Urinalysis extracts 'Ketones'", urineBiomarkerNames.includes('Ketones'));
  logTest("Urinalysis extracts 'Nitrite'", urineBiomarkerNames.includes('Nitrite'));
  logTest("Urinalysis extracts 'Leukocyte Esterase'", urineBiomarkerNames.includes('Leukocyte Esterase'));
  logTest("Urinalysis extracts 'Microscopic WBC'", urineBiomarkerNames.includes('Microscopic WBC'));
  logTest("Urinalysis extracts 'Microscopic RBC'", urineBiomarkerNames.includes('Microscopic RBC'));
  logTest("Urinalysis extracts 'Bacteria'", urineBiomarkerNames.includes('Bacteria'));

  // 2. Strict Cross-Contamination Purity: Blood Panel values MUST NOT appear in Urinalysis
  logTest("Urinalysis contains NO 'Hemoglobin'", !urineBiomarkerNames.includes('Hemoglobin'));
  logTest("Urinalysis contains NO 'Total WBC Count' (blood)", !urineBiomarkerNames.includes('Total WBC Count'));
  logTest("Urinalysis contains NO 'Platelet Count'", !urineBiomarkerNames.includes('Platelet Count'));
  logTest("Urinalysis contains NO 'Fasting Blood Glucose' (blood)", !urineBiomarkerNames.includes('Fasting Blood Glucose'));
  logTest("Urinalysis contains NO 'Total Cholesterol'", !urineBiomarkerNames.includes('Total Cholesterol'));
  logTest("Urinalysis contains NO 'Triglycerides'", !urineBiomarkerNames.includes('Triglycerides'));

  // ----------------------------------------------------
  // TEST SUITE 2: EXACT VALUE, UNIT & REFERENCE RANGE PRESERVATION
  // ----------------------------------------------------
  console.log('\n--- Suite 2: Exact Value, Unit & Reference Range Preservation ---');

  const sg = urineResult.labResults.find(l => l.name === 'Specific Gravity');
  const protein = urineResult.labResults.find(l => l.name === 'Urine Protein');
  const microWbc = urineResult.labResults.find(l => l.name === 'Microscopic WBC');
  const microRbc = urineResult.labResults.find(l => l.name === 'Microscopic RBC');

  logTest("Preserves Specific Gravity numeric value = 1.020", sg?.numericValue === 1.02 || sg?.rawValue === '1.020');
  logTest("Preserves Specific Gravity range = '1.005 - 1.030'", sg?.referenceRange?.rawRange === '1.005 - 1.030');
  logTest("Specific Gravity does NOT have Hemoglobin unit 'g/dL'", sg?.unit !== 'g/dL');

  logTest("Preserves qualitative Urine Protein raw value = 'Negative'", protein?.rawValue?.toLowerCase() === 'negative');
  logTest("Preserves Urine Protein reference target = 'Negative'", protein?.referenceRange?.rawRange === 'Negative');
  logTest("Urine Protein does NOT inherit default 12-16 Hemoglobin range", protein?.referenceRange?.rawRange !== '12.0 - 16.0' && protein?.referenceRange?.low !== 12.0);

  logTest("Preserves Microscopic WBC raw value = '2-4'", microWbc?.rawValue === '2-4' || microWbc?.rawValue?.includes('2-4'));
  logTest("Preserves Microscopic WBC unit = '/HPF'", microWbc?.unit?.toUpperCase()?.includes('HPF'));
  logTest("Preserves Microscopic WBC range = '0 - 5 /HPF'", microWbc?.referenceRange?.rawRange?.includes('0 - 5'));

  logTest("Preserves Microscopic RBC unit = '/HPF'", microRbc?.unit?.toUpperCase()?.includes('HPF'));
  logTest("Preserves Microscopic RBC range = '0 - 2 /HPF'", microRbc?.referenceRange?.rawRange?.includes('0 - 2'));

  // ----------------------------------------------------
  // TEST SUITE 3: CBC & LIPID REPORT SPECIFICITY & PURITY
  // ----------------------------------------------------
  console.log('\n--- Suite 3: CBC & Lipid Report Specificity & Cross-Contamination Guard ---');

  const cbcResult = await processMedicalDocument({
    fileBuffer: cbcPdfBuffer,
    mimeType: 'application/pdf',
    fileName: 'synthetic_cbc_report.pdf'
  });

  const cbcNames = cbcResult.labResults.map(l => l.name);
  logTest("CBC contains 'Hemoglobin'", cbcNames.includes('Hemoglobin'));
  logTest("CBC contains 'Total WBC Count'", cbcNames.includes('Total WBC Count'));
  logTest("CBC contains 'Platelet Count'", cbcNames.includes('Platelet Count'));
  logTest("CBC contains NO Urinalysis 'Specific Gravity'", !cbcNames.includes('Specific Gravity'));
  logTest("CBC contains NO Urinalysis 'Leukocyte Esterase'", !cbcNames.includes('Leukocyte Esterase'));
  logTest("CBC contains NO Urinalysis 'Nitrite'", !cbcNames.includes('Nitrite'));

  const lipidResult = await processMedicalDocument({
    fileBuffer: lipidPdfBuffer,
    mimeType: 'application/pdf',
    fileName: 'synthetic_lipid_report.pdf'
  });

  const lipidNames = lipidResult.labResults.map(l => l.name);
  logTest("Lipid Panel contains 'Total Cholesterol'", lipidNames.includes('Total Cholesterol'));
  logTest("Lipid Panel contains 'HDL Cholesterol'", lipidNames.includes('HDL Cholesterol'));
  logTest("Lipid Panel contains 'Triglycerides'", lipidNames.includes('Triglycerides'));
  logTest("Lipid Panel contains NO 'Hemoglobin'", !lipidNames.includes('Hemoglobin'));
  logTest("Lipid Panel contains NO Urinalysis 'Microscopic WBC'", !lipidNames.includes('Microscopic WBC'));
  logTest("Lipid Panel contains NO Urinalysis 'Specific Gravity'", !lipidNames.includes('Specific Gravity'));

  // ----------------------------------------------------
  // TEST SUITE 4: SEPARATION OF REPORT DATE, VISIT DATE & TIMESTAMP
  // ----------------------------------------------------
  console.log('\n--- Suite 4: Separation of Report Date, Visit Date & Ingestion Timestamp ---');

  logTest("Urinalysis document date parsed as '2026-10-18'", urineResult.metadata?.documentDate === '2026-10-18');
  logTest("CBC document date parsed as '2026-10-15'", cbcResult.metadata?.documentDate === '2026-10-15');
  logTest("Lipid document date parsed as '2026-10-12'", lipidResult.metadata?.documentDate === '2026-10-12');

  // Verify DB Storage enforces discrete report_date vs visit_date vs uploaded_at
  const db = getDatabase();
  const testUserId = 'test-reg-user-' + Date.now();

  // Register temporary test user
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, blood_group, age, created_at, updated_at)
    VALUES (?, ?, 'dummy_hash', 'Regression Subject', 'O+', 30, datetime('now'), datetime('now'))
  `).run(testUserId, `reg_${Date.now()}@example.com`);

  const hospital = MedicalRecordService.createOrSelectHospital(testUserId, {
    name: 'Metropolis Clinical Laboratories'
  });

  const visit = MedicalRecordService.createOrFindVisit(testUserId, {
    hospitalId: hospital.id,
    visitDate: '2026-10-17' // Clinical visit occurred Oct 17
  });

  const report = await MedicalRecordService.attachReport({
    userId: testUserId,
    visitId: visit.id,
    title: 'Urinalysis Test Report',
    category: 'Lab Report',
    reportDate: '2026-10-18', // Lab issued report on Oct 18
    fileBuffer: urinePdfBuffer,
    fileName: 'synthetic_urine_report.pdf',
    mimeType: 'application/pdf',
    aiAnalysis: urineResult
  });

  const fetched = MedicalRecordService.getReportById(testUserId, report.id);

  logTest("Report record retains distinct reportDate = '2026-10-18'", fetched.reportDate === '2026-10-18');
  logTest("Visit record retains distinct visitDate = '2026-10-17'", fetched.visit?.visitDate === '2026-10-17');
  logTest("System records separate uploadedAt ISO timestamp", typeof fetched.uploadedAt === 'string' && fetched.uploadedAt.includes('T'));
  logTest("reportDate is NOT silently replaced with visitDate or upload time", fetched.reportDate !== fetched.visit?.visitDate && fetched.reportDate !== fetched.uploadedAt);

  // ----------------------------------------------------
  // TEST SUITE 5: REPEATED UPLOADS & REPORT SWITCHING ISOLATION
  // ----------------------------------------------------
  console.log('\n--- Suite 5: Repeated Uploads & Database Report Switching ---');

  // Attach a second, completely different report (Lipid) to the same user
  const lipidReport = await MedicalRecordService.attachReport({
    userId: testUserId,
    visitId: visit.id,
    title: 'Lipid Test Report',
    category: 'Lab Report',
    reportDate: '2026-10-12',
    fileBuffer: lipidPdfBuffer,
    fileName: 'synthetic_lipid_report.pdf',
    mimeType: 'application/pdf',
    aiAnalysis: lipidResult
  });

  const fetchedUrine = MedicalRecordService.getReportById(testUserId, report.id);
  const fetchedLipid = MedicalRecordService.getReportById(testUserId, lipidReport.id);

  logTest("Fetching Urine Report returns urine parameters (Specific Gravity present)", fetchedUrine.aiAnalysis?.labResults?.some(l => l.name === 'Specific Gravity'));
  logTest("Fetching Urine Report has NO lipid markers (Cholesterol absent)", !fetchedUrine.aiAnalysis?.labResults?.some(l => l.name === 'Total Cholesterol'));

  logTest("Fetching Lipid Report returns lipid parameters (Total Cholesterol present)", fetchedLipid.aiAnalysis?.labResults?.some(l => l.name === 'Total Cholesterol'));
  logTest("Fetching Lipid Report has NO urine parameters (Specific Gravity absent)", !fetchedLipid.aiAnalysis?.labResults?.some(l => l.name === 'Specific Gravity'));

  // Clean up test data
  try {
    MedicalRecordService.deleteReport(testUserId, report.id);
    MedicalRecordService.deleteReport(testUserId, lipidReport.id);
    db.prepare(`DELETE FROM users WHERE id = ?`).run(testUserId);
  } catch { }

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${testsPassed} Passed | ${testsFailed} Failed`);
  console.log('================================================================\n');

  if (testsFailed > 0) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}

runRegressionTestSuite().catch(err => {
  console.error('[FATAL] Regression test suite crashed:', err);
  process.exitCode = 1;
});





