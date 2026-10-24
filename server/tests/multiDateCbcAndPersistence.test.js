import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { MockOcrProvider } from '../services/ocr/mockOcrProvider.js';
import { processMedicalDocument } from '../services/clinical/medicalPipelineService.js';
import { MedicalRecordService } from '../services/medicalRecordService.js';
import { AuthService } from '../services/authService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

function logTest(name, condition, errorMsg = '') {
  if (condition) {
    console.log(`  ✓ [PASS] ${name}`);
    testsPassed++;
  } else {
    console.error(`  ✗ [FAIL] ${name} — ${errorMsg}`);
    testsFailed++;
  }
}

async function runMultiDateCbcAndPersistenceTests() {
  console.log('\n================================================================');
  console.log('   HealthCopilot AI — Multi-Date CBC & OCR Persistence Tests');
  console.log('================================================================\n');

  const ocrProvider = new MockOcrProvider();

  // ----------------------------------------------------
  // SUITE 1: MULTI-COLUMN CBC RECOGNITION & PARSING
  // ----------------------------------------------------
  console.log('--- Suite 1: Multi-Column CBC Recognition & First Visible Column ---');

  const cbcOcrResult = await ocrProvider.processDocument(Buffer.from('sample-multi-cbc'), 'image/jpeg', {
    fileName: 'priya 2.jpeg',
    documentType: 'multi_date_cbc'
  });

  logTest('OCR recognizes multi-date CBC and returns authentic text', cbcOcrResult.processingStatus === 'SUCCESS' && cbcOcrResult.fullText.includes('Blood Complete'));
  logTest('OCR fullText preserves all 3 historical dates', cbcOcrResult.fullText.includes('12/08/20') && cbcOcrResult.fullText.includes('04/12/19') && cbcOcrResult.fullText.includes('19/06/19'));

  const cbcAnalysis = await processMedicalDocument({
    fileBuffer: Buffer.from('sample-multi-cbc'),
    mimeType: 'image/jpeg',
    ocrResult: cbcOcrResult,
    fileName: 'priya 2.jpeg'
  });

  logTest('Classifies document as Lab Report', cbcAnalysis.category === 'Lab Report');
  logTest('Extracts primary report date as 2020-08-12 from 12/08/20', cbcAnalysis.metadata.documentDate === '2020-08-12');
  logTest('Extracts 15 distinct clinical parameters', cbcAnalysis.labResults.length === 15);

  const labMap = new Map(cbcAnalysis.labResults.map(l => [l.name, l]));

  // Validation against exact values in Requirement 4
  const wbc = labMap.get('WBC Count');
  logTest('WBC Count value is 10,040 /mm3 (numeric 10040)', wbc && (wbc.rawValue === '10,040' || wbc.numericValue === 10040) && wbc.unit === '/mm3');
  logTest('WBC Count reference range is 4,000 - 10,000', wbc && wbc.referenceRange.rawRange === '4,000 - 10,000' && wbc.referenceRange.high === 10000);
  logTest('WBC Count flagged as HIGH (slightly elevated)', wbc && wbc.status === 'HIGH');

  const rbc = labMap.get('RBC Count');
  logTest('RBC Count value is 5.83 million/mm3', rbc && (rbc.rawValue === '5.83' || rbc.numericValue === 5.83) && rbc.unit.includes('million/mm3'));
  logTest('RBC Count reference range is 4.5 - 6.0', rbc && rbc.referenceRange.rawRange === '4.5 - 6.0');

  const hb = labMap.get('Hemoglobin');
  logTest('Hemoglobin value is 17.1 g/dL (NOT 14.2 g/dL mock)', hb && hb.numericValue === 17.1 && hb.unit === 'g/dL');
  logTest('Hemoglobin reference range is 14 - 18 (NOT 12.0 - 16.0)', hb && hb.referenceRange.rawRange === '14 - 18' && hb.referenceRange.low === 14 && hb.referenceRange.high === 18);

  const hct = labMap.get('Hematocrit');
  logTest('Hematocrit value is 50%', hct && hct.numericValue === 50 && hct.unit === '%');
  logTest('Hematocrit reference range is 40 - 50%', hct && hct.referenceRange.rawRange === '40 - 50');

  const mcv = labMap.get('MCV');
  logTest('MCV value is 86 fL', mcv && mcv.numericValue === 86 && mcv.unit === 'fL');
  logTest('MCV reference range is 82 - 98', mcv && mcv.referenceRange.rawRange === '82 - 98');

  const mch = labMap.get('MCH');
  logTest('MCH value is 29 pg', mch && mch.numericValue === 29 && mch.unit === 'pg');

  const mchc = labMap.get('MCHC');
  logTest('MCHC value is 34 g/dL', mchc && mchc.numericValue === 34 && mchc.unit === 'g/dL');

  const rdw = labMap.get('RDW-CV');
  logTest('RDW-CV value is 13%', rdw && rdw.numericValue === 13 && rdw.unit === '%');

  const plt = labMap.get('Platelet Count');
  logTest('Platelets value is 267,000 /mm3 (NOT 240 K/uL mock)', plt && (plt.rawValue === '267,000' || plt.numericValue === 267000) && plt.unit === '/mm3');
  logTest('Platelets reference range is 140,000 - 450,000', plt && plt.referenceRange.rawRange === '140,000 - 450,000');

  const neut = labMap.get('Neutrophils');
  logTest('Neutrophils value is 53%', neut && neut.numericValue === 53 && neut.unit === '%');

  const lymph = labMap.get('Lymphocytes');
  logTest('Lymphocytes value is 37%', lymph && lymph.numericValue === 37 && lymph.unit === '%');

  const mono = labMap.get('Monocytes');
  logTest('Monocytes value is 7%', mono && mono.numericValue === 7 && mono.unit === '%');

  const eos = labMap.get('Eosinophils');
  logTest('Eosinophils value is 3%', eos && eos.numericValue === 3 && eos.unit === '%');

  const baso = labMap.get('Basophils');
  logTest('Basophils value is 0% with isZero = true', baso && baso.numericValue === 0 && baso.isZero === true && baso.unit === '%');

  const bands = labMap.get('Bands');
  logTest('Bands value is 0% with isZero = true', bands && bands.numericValue === 0 && bands.isZero === true && bands.unit === '%');

  // ----------------------------------------------------
  // SUITE 2: HISTORICAL COLUMN PRESERVATION
  // ----------------------------------------------------
  console.log('\n--- Suite 2: Historical Columns Preserved Separately ---');

  logTest('WBC Count preserves 2 historical readings', wbc && wbc.historicalReadings?.length === 2);
  logTest('WBC historical reading 1 date is 04/12/19', wbc && wbc.historicalReadings?.[0]?.date === '04/12/19');
  logTest('WBC historical reading 1 value is 14130 /mm3', wbc && (wbc.historicalReadings?.[0]?.value?.includes('14130') || wbc.historicalReadings?.[0]?.numericValue === 14130));
  logTest('WBC historical reading 2 date is 19/06/19', wbc && wbc.historicalReadings?.[1]?.date === '19/06/19');
  logTest('WBC historical reading 2 value is 9490 /mm3', wbc && (wbc.historicalReadings?.[1]?.value?.includes('9490') || wbc.historicalReadings?.[1]?.numericValue === 9490));

  logTest('Hemoglobin preserves historical reading 17.0 g/dL on 04/12/19', hb && hb.historicalReadings?.[0]?.numericValue === 17.0);
  logTest('Hemoglobin preserves historical reading 17.3 g/dL on 19/06/19', hb && hb.historicalReadings?.[1]?.numericValue === 17.3);

  logTest('Platelets preserves historical reading 339000 /mm3 on 04/12/19', plt && plt.historicalReadings?.[0]?.numericValue === 339000);
  logTest('Platelets preserves historical reading 251000 /mm3 on 19/06/19', plt && plt.historicalReadings?.[1]?.numericValue === 251000);

  logTest('Historical readings do NOT overwrite or combine current values', hb.numericValue === 17.1 && hb.historicalReadings?.[0]?.numericValue === 17.0);

  // ----------------------------------------------------
  // SUITE 3: CROSS-DOCUMENT ISOLATION (CBC vs URINE)
  // ----------------------------------------------------
  console.log('\n--- Suite 3: Document Purity & Zero Bleed Between Reports ---');

  const urineOcrResult = await ocrProvider.processDocument(Buffer.from('sample-urine'), 'image/jpeg', {
    fileName: 'priya 1.jpeg',
    documentType: 'urinalysis'
  });

  const urineAnalysis = await processMedicalDocument({
    fileBuffer: Buffer.from('sample-urine'),
    mimeType: 'image/jpeg',
    ocrResult: urineOcrResult,
    fileName: 'priya 1.jpeg'
  });

  const urineNames = new Set(urineAnalysis.labResults.map(l => l.name));
  const cbcNames = new Set(cbcAnalysis.labResults.map(l => l.name));

  logTest('Urine analysis contains Specific Gravity', urineNames.has('Specific Gravity'));
  logTest('Urine analysis contains Urine pH', urineNames.has('Urine pH'));
  logTest('Urine analysis contains NO Hemoglobin', !urineNames.has('Hemoglobin'));
  logTest('Urine analysis contains NO Platelet Count', !urineNames.has('Platelet Count'));
  logTest('Urine analysis contains NO Hematocrit', !urineNames.has('Hematocrit'));
  logTest('Urine analysis contains NO MCV or MCH', !urineNames.has('MCV') && !urineNames.has('MCH'));

  logTest('CBC analysis contains NO Specific Gravity', !cbcNames.has('Specific Gravity'));
  logTest('CBC analysis contains NO Urine Protein', !cbcNames.has('Urine Protein'));
  logTest('CBC analysis contains NO Leukocyte Esterase', !cbcNames.has('Leukocyte Esterase'));
  logTest('CBC analysis contains NO Microscopic WBC', !cbcNames.has('Microscopic WBC'));

  // ----------------------------------------------------
  // SUITE 4: OCR PERSISTENCE IN DATABASE & RETRIEVAL
  // ----------------------------------------------------
  console.log('\n--- Suite 4: Database Persistence & Extracted Text Retrieval ---');

  const regRes = await AuthService.register({
    email: `test-ocr-persist-${Date.now()}@healthcopilot.local`,
    password: 'SecurePassword123!',
    name: 'Test Persistence User'
  });
  const testUser = regRes.user;

  const hospital = await MedicalRecordService.createOrSelectHospital(testUser.id, {
    name: 'Diagnostic Hematology Lab',
    branch: 'Main Laboratory',
    location: 'Building C'
  });

  const visit = await MedicalRecordService.createOrFindVisit(testUser.id, {
    hospitalId: hospital.id,
    visitDate: '2020-08-12',
    physicianName: 'Dr. Hematologist'
  });

  const report = await MedicalRecordService.attachReport({
    userId: testUser.id,
    visitId: visit.id,
    title: 'Blood Complete Picture (CBC)',
    category: 'Lab Report',
    reportDate: '2020-08-12',
    fileBuffer: fs.readFileSync(path.join(__dirname, 'fixtures', 'synthetic_cbc_report.pdf')),
    fileName: 'synthetic_cbc_report.pdf',
    mimeType: 'application/pdf',
    ocrResult: cbcOcrResult,
    aiAnalysis: cbcAnalysis
  });

  logTest('Report successfully persisted in database with ID', typeof report.id === 'string' && report.id.length > 10);
  logTest('Report record retains ocrResult with fullText', report.ocrResult && typeof report.ocrResult.fullText === 'string');
  logTest('Report record exposes extractedText matching OCR fullText', report.extractedText === cbcOcrResult.fullText);
  logTest('Report record has non-empty extractedText (NOT "No raw text available")', report.extractedText.length > 50);

  // Fetch report fresh from DB
  const fetchedReport = await MedicalRecordService.getReportById(testUser.id, report.id);
  logTest('Re-fetched report preserves ocrResult object', fetchedReport.ocrResult !== null && fetchedReport.ocrResult.pageCount === 1);
  logTest('Re-fetched report preserves extractedText', fetchedReport.extractedText.includes('WBC Count'));
  logTest('Re-fetched report retains all 15 biomarkers', fetchedReport.aiAnalysis.labResults.length === 15);
  logTest('Re-fetched report retains historical readings in DB', fetchedReport.aiAnalysis.labResults[0].historicalReadings?.length === 2);

  // Clean up
  await MedicalRecordService.deleteReport(testUser.id, report.id);
  logTest('Report clean up successful', true);

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

runMultiDateCbcAndPersistenceTests().catch(err => {
  console.error('[FATAL] Multi-date CBC test suite crashed:', err);
  process.exitCode = 1;
});
