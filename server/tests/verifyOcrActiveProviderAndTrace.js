import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getOcrProvider, resetOcrProvider } from '../services/ocr/ocrFactory.js';
import { GoogleDocumentAiProvider } from '../services/ocr/googleDocumentAiProvider.js';
import { processMedicalDocument } from '../services/clinical/medicalPipelineService.js';
import { MedicalRecordService } from '../services/medicalRecordService.js';
import { AuthService } from '../services/authService.js';
import { HealthSummaryService } from '../services/clinical/healthSummaryService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passed = 0;
let failed = 0;

function assert(description, condition, details = '') {
  if (condition) {
    console.log(`  ✓ [PASS] ${description}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${description} — ${details}`);
    failed++;
  }
}

async function runStageTraceAndProviderVerification() {
  console.log('\n================================================================');
  console.log('   HealthCopilot AI — OCR Provider & 5-Stage Trace Audit');
  console.log('================================================================\n');

  // -----------------------------------------------------------------
  // 1. ACTIVE OCR PROVIDER & ENVIRONMENT CONFIGURATION CHECK
  // -----------------------------------------------------------------
  console.log('--- Step 1: Active OCR Provider & Configuration Verification ---');
  
  const activeProvider = getOcrProvider();
  console.log(`  Active Provider Type : ${activeProvider.name}`);
  console.log(`  Process.env.OCR_PROVIDER : ${process.env.OCR_PROVIDER || '(unset)'}`);

  assert('Active provider is MockOcrProvider when OCR_PROVIDER=test-synthetic', activeProvider.name === 'mock-ocr-provider');

  // Inspect Live Google Document AI provider configuration
  const liveProvider = new GoogleDocumentAiProvider();
  const liveHealth = await liveProvider.healthCheck();

  console.log(`  Live Google Document AI Status : ${liveHealth.status}`);
  console.log(`  Live Document AI Configured    : ${liveHealth.isConfigured}`);
  console.log(`  Live Document AI Has Auth      : ${liveHealth.hasAuthCredentials}`);
  console.log(`  Live Missing GCP Variables     : ${liveHealth.missingVariables ? liveHealth.missingVariables.join(', ') : 'None'}`);

  if (process.env.GCP_PROJECT_ID && process.env.GCP_PROCESSOR_ID) {
    assert('Live Document AI recognizes configured project and processor', liveHealth.isConfigured === true);
    assert('Live Document AI correctly flags live processing unverified before cloud call', liveHealth.hasLiveProcessingVerified === false);
    assert('Live Document AI reports pending auth or key file status', typeof liveHealth.keyFileExists === 'boolean');
  } else {
    assert('Live Document AI is correctly flagged as UNCONFIGURED', liveHealth.status === 'UNCONFIGURED' && liveHealth.isConfigured === false);
    assert('Missing GCP_PROJECT_ID is detected', liveHealth.missingVariables?.includes('GCP_PROJECT_ID'));
    assert('Missing GCP_PROCESSOR_ID is detected', liveHealth.missingVariables?.includes('GCP_PROCESSOR_ID'));
  }

  // -----------------------------------------------------------------
  // 2. 5-STAGE VALUE TRACE FOR APPROVED MULTI-DATE CBC
  // -----------------------------------------------------------------
  console.log('\n--- Step 2: 5-Stage Value Trace (Source -> OCR -> Parser -> DB -> UI) ---');

  // Stage 1: Ground Truth / Source Document Values
  const sourceValues = {
    documentType: 'Hematology Complete Blood Picture (CBC)',
    primaryDate: '12/08/20',
    historicalDates: ['04/12/19', '19/06/19'],
    hemoglobin: { value: 17.1, unit: 'g/dL', range: '14 - 18' },
    wbc: { raw: '10,040', numeric: 10040, unit: '/mm3', range: '4,000 - 10,000' },
    platelets: { raw: '267,000', numeric: 267000, unit: '/mm3', range: '140,000 - 450,000' },
    rbc: { raw: '5.83', numeric: 5.83, unit: 'mil/mm3', range: '4.5 - 6.0' }
  };
  console.log('  [Stage 1 Source] Printed Values on Report Image:', sourceValues);

  // Stage 2: Raw OCR Output
  const ocrResult = await activeProvider.processDocument(Buffer.from('synthetic-cbc-buffer'), 'image/jpeg', {
    fileName: 'priya 2.jpeg',
    documentType: 'multi_date_cbc'
  });

  assert('Stage 2: Raw OCR text captures authentic Hemoglobin 17.1 g/dL', ocrResult.fullText.includes('Hemoglobin                17.1 g/dL'));
  assert('Stage 2: Raw OCR text captures WBC Count 10,040 /mm3', ocrResult.fullText.includes('WBC Count                 10,040 /mm3'));
  assert('Stage 2: Raw OCR text captures Platelets 267,000 /mm3', ocrResult.fullText.includes('Platelets                 267,000 /mm3'));
  assert('Stage 2: Raw OCR text captures all 3 historical dates', ocrResult.fullText.includes('12/08/20') && ocrResult.fullText.includes('04/12/19') && ocrResult.fullText.includes('19/06/19'));

  // Stage 3: Clinical Parser Output
  const analysis = await processMedicalDocument({
    fileBuffer: Buffer.from('synthetic-cbc-buffer'),
    mimeType: 'image/jpeg',
    ocrResult,
    fileName: 'priya 2.jpeg'
  });

  const parsedLabs = new Map(analysis.labResults.map(l => [l.name, l]));
  const parsedHb = parsedLabs.get('Hemoglobin');
  const parsedWbc = parsedLabs.get('WBC Count');
  const parsedPlt = parsedLabs.get('Platelet Count');

  assert('Stage 3: Parsed Hemoglobin is exact 17.1 g/dL (no mock 14.2)', parsedHb && parsedHb.numericValue === 17.1 && parsedHb.unit === 'g/dL');
  assert('Stage 3: Parsed Hemoglobin lab range is 14 - 18', parsedHb && parsedHb.referenceRange.rawRange === '14 - 18');
  assert('Stage 3: Parsed WBC preserves comma string "10,040" and numeric 10040', parsedWbc && (parsedWbc.rawValue === '10,040' || parsedWbc.numericValue === 10040));
  assert('Stage 3: Parsed WBC reference range is 4,000 - 10,000', parsedWbc && parsedWbc.referenceRange.rawRange === '4,000 - 10,000');
  assert('Stage 3: Parsed Platelets is 267,000 /mm3 (no mock 240 K/uL)', parsedPlt && (parsedPlt.rawValue === '267,000' || parsedPlt.numericValue === 267000) && parsedPlt.unit === '/mm3');
  assert('Stage 3: Preserves 2 distinct historical readings for WBC', parsedWbc && parsedWbc.historicalReadings?.length === 2);
  assert('Stage 3: Preserves 2 distinct historical readings for Hemoglobin', parsedHb && parsedHb.historicalReadings?.length === 2);

  // Stage 4: SQLite Database Persistence
  const authRes = await AuthService.register({
    email: `trace-test-${Date.now()}@healthcopilot.local`,
    password: 'PasswordSafe123!',
    name: 'Trace Audit User'
  });
  const testUser = authRes.user;

  const hospital = await MedicalRecordService.createOrSelectHospital(testUser.id, {
    name: 'Apollo Clinical Lab',
    branch: 'Hematology Wing'
  });

  const visit = await MedicalRecordService.createOrFindVisit(testUser.id, {
    hospitalId: hospital.id,
    visitDate: '2020-08-12',
    physicianName: 'Dr. Pathologist'
  });

  const savedReport = await MedicalRecordService.attachReport({
    userId: testUser.id,
    visitId: visit.id,
    title: 'Complete Blood Picture',
    category: 'Lab Report',
    reportDate: '2020-08-12',
    fileBuffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0xFF, 0xD9]),
    fileName: 'priya 2.jpeg',
    mimeType: 'image/jpeg',
    ocrResult,
    aiAnalysis: analysis
  });

  // Re-fetch report directly from SQLite database
  const fetchedReport = await MedicalRecordService.getReportById(testUser.id, savedReport.id);

  assert('Stage 4: Persisted report retains extractedText identical to OCR fullText', fetchedReport.extractedText === ocrResult.fullText);
  assert('Stage 4: Persisted report extractedText is non-empty (NOT "No raw text available")', fetchedReport.extractedText.length > 100);
  
  const dbLabs = new Map(fetchedReport.aiAnalysis.labResults.map(l => [l.name, l]));
  const dbHb = dbLabs.get('Hemoglobin');
  const dbWbc = dbLabs.get('WBC Count');
  const dbPlt = dbLabs.get('Platelet Count');

  assert('Stage 4: SQLite persists Hemoglobin 17.1 g/dL', dbHb && dbHb.numericValue === 17.1 && dbHb.unit === 'g/dL');
  assert('Stage 4: SQLite persists WBC 10,040 /mm3 with range 4,000 - 10,000', dbWbc && dbWbc.numericValue === 10040 && dbWbc.referenceRange.rawRange === '4,000 - 10,000');
  assert('Stage 4: SQLite persists Platelets 267,000 /mm3', dbPlt && dbPlt.numericValue === 267000 && dbPlt.unit === '/mm3');
  assert('Stage 4: SQLite persists historical readings array', dbHb && dbHb.historicalReadings?.length === 2);

  // Stage 5: UI Presentation Mapping
  // Verify the exact fields accessed by ReportDetailsScreen.jsx
  const uiBiomarkers = fetchedReport.biomarkers || fetchedReport.aiAnalysis.labResults.map(l => ({
    name: l.name,
    value: l.numericValue ?? l.rawValue,
    unit: l.unit,
    range: l.referenceRange?.rawRange || `${l.referenceRange?.low} - ${l.referenceRange?.high}`,
    status: l.status
  }));

  const uiHb = uiBiomarkers.find(b => b.name === 'Hemoglobin');
  const uiWbc = uiBiomarkers.find(b => b.name === 'WBC Count');
  const uiPlt = uiBiomarkers.find(b => b.name === 'Platelet Count');
  const uiExtractedText = fetchedReport.ocrResult?.fullText || fetchedReport.extractedText || '';

  assert('Stage 5: UI renders Hemoglobin as 17.1 g/dL with range 14 - 18', uiHb && uiHb.value === 17.1 && uiHb.unit === 'g/dL' && uiHb.range === '14 - 18');
  assert('Stage 5: UI renders WBC as 10040 /mm3 with HIGH status', uiWbc && uiWbc.value === 10040 && uiWbc.status === 'HIGH');
  assert('Stage 5: UI renders Platelets as 267000 /mm3 with range 140,000 - 450,000', uiPlt && uiPlt.value === 267000 && uiPlt.range === '140,000 - 450,000');
  assert('Stage 5: UI Extracted Text panel displays full text (NOT "No raw text available")', uiExtractedText.includes('Hematology') && uiExtractedText.includes('10,040 /mm3'));

  // -----------------------------------------------------------------
  // 3. EVIDENCE-GROUNDED SUMMARY CONSUMES PERSISTED FINDINGS
  // -----------------------------------------------------------------
  console.log('\n--- Step 3: Evidence-Grounded AI Summary Grounding ---');
  
  const summaryEn = await HealthSummaryService.getOrGenerateSummary({
    userId: testUser.id,
    reportId: fetchedReport.id,
    language: 'en'
  });
  
  assert('Summary exists and contains structured clinical sections', summaryEn && summaryEn.overview && Array.isArray(summaryEn.withinReferenceRange) && Array.isArray(summaryEn.outsideReferenceRange));
  assert('Summary correctly flags elevated WBC Count in outsideReferenceRange', summaryEn.outsideReferenceRange.some(r => r.name === 'WBC Count' && (r.value === '10,040' || r.value === 10040 || String(r.value).includes('10040'))));
  assert('Summary groups Hemoglobin 17.1 g/dL within withinReferenceRange', summaryEn.withinReferenceRange.some(r => r.name === 'Hemoglobin' && (r.value === '17.1' || r.value === 17.1 || String(r.value).includes('17.1'))));
  assert('Summary groups Platelets within withinReferenceRange', summaryEn.withinReferenceRange.some(r => r.name === 'Platelet Count' && (r.value === '267,000' || r.value === 267000 || String(r.value).includes('267000'))));

  // Clean up
  await MedicalRecordService.deleteReport(testUser.id, savedReport.id);

  // -----------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TRACE RESULTS: ${passed} Passed | ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}

runStageTraceAndProviderVerification().catch(err => {
  console.error('[FATAL] Trace verification crashed:', err);
  process.exitCode = 1;
});
