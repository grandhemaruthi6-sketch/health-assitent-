import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';
import { extractClinicalFields } from '../services/clinical/clinicalParser.js';
import { processMedicalDocument } from '../services/clinical/medicalPipelineService.js';
import { MedicalRecordService } from '../services/medicalRecordService.js';
import { AuthService } from '../services/authService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, 'fixtures');

let passedCount = 0;
let failedCount = 0;

function logTest(desc, condition, extraInfo = '') {
  if (condition) {
    passedCount++;
    console.log(`  ✓ [PASS] ${desc}`);
  } else {
    failedCount++;
    console.error(`  ✗ [FAIL] ${desc} ${extraInfo}`);
  }
}

async function runClinicalValueCorrectnessSuite() {
  console.log('\n================================================================');
  console.log('   HealthCopilot AI — Clinical Value Correctness & Pipeline QA');
  console.log('================================================================\n');

  // ----------------------------------------------------
  // SUITE 1: NUMERIC ACCURACY, COMMAS, DECIMALS & ZERO
  // ----------------------------------------------------
  console.log('--- Suite 1: Comma Numbers, Decimals & Exact Numeric Parsing ---');

  const cbcText = `APOLLO CLINICAL DIAGNOSTICS
Patient Name: Patient Alpha-99    Date: 15/10/2026
COMPLETE BLOOD COUNT (CBC) & METABOLIC
Investigation               Result     Flag   Units     Reference Interval
Hemoglobin                  14.2              g/dL      12.0 - 16.0
Total Leucocyte Count (TLC) 10,040     High   /mm3      4,000 - 10,000
Platelet Count              267,000           /cumm     150,000 - 450,000
Hematocrit                  42.5              %         37.0 - 48.0
Neutrophils                 55                %         40 - 75
Basophils                   0                 %         0 - 1
Bands                       0                 %         0 - 3`;

  const cbcOcr = {
    documentId: 'doc-cbc-comma-1',
    fullText: cbcText,
    pages: [{ pageNumber: 1, text: cbcText, confidence: 0.96 }]
  };

  const parsedCbc = extractClinicalFields(cbcOcr, 'Lab Report');
  const wbc = parsedCbc.labResults.find(b => b.name === 'Total WBC Count' || b.name === 'WBC Count');
  const plt = parsedCbc.labResults.find(b => b.name === 'Platelet Count');
  const baso = parsedCbc.labResults.find(b => b.name === 'Basophils');
  const bands = parsedCbc.labResults.find(b => b.name === 'Bands');
  const hb = parsedCbc.labResults.find(b => b.name === 'Hemoglobin');

  logTest('WBC Count preserves verbatim comma string "10,040"', wbc && wbc.rawValue === '10,040');
  logTest('WBC Count converts to exact numeric 10040 (not truncated 10)', wbc && wbc.numericValue === 10040);
  logTest('WBC Count preserves extracted unit "/mm3"', wbc && wbc.unit === '/mm3');
  logTest('WBC reference range parses commas (high = 10000, not 10)', wbc && wbc.referenceRange.high === 10000);
  logTest('WBC status correctly evaluated as HIGH relative to 10,000 limit', wbc && wbc.status === 'HIGH');

  logTest('Platelet Count preserves verbatim comma string "267,000"', plt && plt.rawValue === '267,000');
  logTest('Platelet Count converts to exact numeric 267000 (not truncated 267)', plt && plt.numericValue === 267000);
  logTest('Platelet Count preserves extracted unit "/cumm"', plt && plt.unit === '/cumm');
  logTest('Platelet reference range parses commas (low = 150000, high = 450000)', plt && plt.referenceRange.low === 150000 && plt.referenceRange.high === 450000);

  logTest('Hemoglobin decimal value 14.2 parsed correctly', hb && hb.numericValue === 14.2 && hb.rawValue === '14.2');
  logTest('Basophils value 0 distinguished as isZero = true, numericValue = 0', baso && baso.isZero === true && baso.numericValue === 0);
  logTest('Bands value 0 distinguished as isZero = true, numericValue = 0', bands && bands.isZero === true && bands.numericValue === 0);

  // ----------------------------------------------------
  // SUITE 2: INEQUALITIES, DETECTION LIMITS & SIGNS
  // ----------------------------------------------------
  console.log('\n--- Suite 2: Inequalities (< and >) & Detection Limits ---');

  const renalText = `METRO HEALTH LABS
Patient Name: Patient Beta-42    Date: 2026-09-18
SPECIALIZED CHEMISTRY & RENAL PANEL
Investigation               Result     Units     Reference Interval
Serum Creatinine            < 0.5      mg/dL     0.6 - 1.2
Troponin I                  < 0.01     ng/mL     < 0.04
eGFR                        > 60       mL/min    > 60`;

  const renalOcr = {
    documentId: 'doc-renal-ineq-1',
    fullText: renalText,
    pages: [{ pageNumber: 1, text: renalText, confidence: 0.95 }]
  };

  const parsedRenal = extractClinicalFields(renalOcr, 'Lab Report');
  const creat = parsedRenal.labResults.find(b => b.name === 'Serum Creatinine');
  const trop = parsedRenal.labResults.find(b => b.name === 'Troponin I');
  const egfr = parsedRenal.labResults.find(b => b.name === 'eGFR');

  logTest('Creatinine preserves raw inequality "< 0.5"', creat && creat.rawValue === '< 0.5');
  logTest('Creatinine numericValue is 0.5 without dropping the decimal', creat && creat.numericValue === 0.5);
  logTest('Creatinine status evaluated as LOW relative to 0.6 reference floor', creat && creat.status === 'LOW');

  logTest('Troponin I preserves raw "< 0.01"', trop && trop.rawValue === '< 0.01');
  logTest('Troponin I numericValue is 0.01', trop && trop.numericValue === 0.01);
  logTest('Troponin I status evaluated as NORMAL relative to < 0.04 limit', trop && trop.status === 'NORMAL');

  logTest('eGFR preserves raw "> 60"', egfr && egfr.rawValue === '> 60');
  logTest('eGFR numericValue is 60', egfr && egfr.numericValue === 60);
  logTest('eGFR status evaluated as NORMAL relative to > 60 floor', egfr && egfr.status === 'NORMAL');

  // ----------------------------------------------------
  // SUITE 3: NO FABRICATION OF UNITS OR REFERENCE RANGES
  // ----------------------------------------------------
  console.log('\n--- Suite 3: Truthfulness & Zero Fabrication (Units & Ranges) ---');

  const unitlessText = `CLINICAL PATHOLOGY
Patient: Test Subject C    Date: 2026-10-01
Hemoglobin 13.8`;

  const unitlessOcr = {
    documentId: 'doc-unitless-1',
    fullText: unitlessText,
    pages: [{ pageNumber: 1, text: unitlessText, confidence: 0.95 }]
  };

  const parsedUnitless = extractClinicalFields(unitlessOcr, 'Lab Report');
  const unitlessHb = parsedUnitless.labResults.find(b => b.name === 'Hemoglobin');

  logTest('Extracted present Hemoglobin without unit', unitlessHb && unitlessHb.numericValue === 13.8);
  logTest('Does NOT fabricate default unit (unit is null when omitted from document)', unitlessHb && unitlessHb.unit === null);
  logTest('Does NOT fabricate default reference range (rawRange is "Unavailable")', unitlessHb && unitlessHb.referenceRange.rawRange === 'Unavailable');
  logTest('Reference low and high are null when interval is missing', unitlessHb && unitlessHb.referenceRange.low === null && unitlessHb.referenceRange.high === null);

  // ----------------------------------------------------
  // SUITE 4: DATE NORMALIZATION (DD/MM/YYYY, MM/DD/YYYY, ISO)
  // ----------------------------------------------------
  console.log('\n--- Suite 4: Date Normalization & Calendar Validity ---');

  const intlDateDoc = {
    documentId: 'doc-date-1',
    fullText: `APOLLO HOSPITALS\nSample Date: 15/10/2026\nHemoglobin 14.0 g/dL`,
    pages: [{ pageNumber: 1, text: 'APOLLO HOSPITALS\nSample Date: 15/10/2026\nHemoglobin 14.0 g/dL', confidence: 0.95 }]
  };
  const parsedIntl = extractClinicalFields(intlDateDoc, 'Lab Report');
  logTest('International DD/MM/YYYY (15/10/2026) produces valid ISO "2026-10-15" (NOT 2026-15-10)', parsedIntl.metadata.documentDate === '2026-10-15');

  const usDateDoc = {
    documentId: 'doc-date-2',
    fullText: `BOSTON GENERAL HOSPITAL\nVisit Date: 10/25/2026\nHemoglobin 14.0 g/dL`,
    pages: [{ pageNumber: 1, text: 'BOSTON GENERAL HOSPITAL\nVisit Date: 10/25/2026\nHemoglobin 14.0 g/dL', confidence: 0.95 }]
  };
  const parsedUs = extractClinicalFields(usDateDoc, 'Lab Report');
  logTest('US MM/DD/YYYY (10/25/2026) produces valid ISO "2026-10-25"', parsedUs.metadata.documentDate === '2026-10-25');

  const isoDateDoc = {
    documentId: 'doc-date-3',
    fullText: `CITY HOSPITAL\nDate: 2026-11-04\nHemoglobin 14.0 g/dL`,
    pages: [{ pageNumber: 1, text: 'CITY HOSPITAL\nDate: 2026-11-04\nHemoglobin 14.0 g/dL', confidence: 0.95 }]
  };
  const parsedIso = extractClinicalFields(isoDateDoc, 'Lab Report');
  logTest('ISO format (2026-11-04) preserved identically as "2026-11-04"', parsedIso.metadata.documentDate === '2026-11-04');

  // ----------------------------------------------------
  // SUITE 5: URINALYSIS EXACT QUALITATIVE PRESERVATION
  // ----------------------------------------------------
  console.log('\n--- Suite 5: Urinalysis Qualitative Findings & Ranges ---');

  const urineReportText = `METRO DIAGNOSTIC CENTER
DEPARTMENT OF CLINICAL PATHOLOGY
URINE ROUTINE EXAMINATION
Patient: Priya Sharma    Date: 18/10/2026
Test Name            Result          Units   Reference Interval
Specific Gravity     1.021                   1.005 - 1.030
Urine pH             6.5                     5.0 - 8.0
Protein              Negative                Negative
Glucose              Negative                Negative
Ketones              Negative                Negative
Leukocyte Esterase   Negative                Negative
Nitrite              Negative                Negative
Microscopic WBC      2-4             /HPF    0 - 5 /HPF
Microscopic RBC      0-1             /HPF    0 - 2 /HPF
Bacteria             None seen               None seen
Epithelial Cells     Few             /HPF    0 - 5 /HPF`;

  const urineOcr = {
    documentId: 'doc-urine-qa-1',
    fullText: urineReportText,
    pages: [{ pageNumber: 1, text: urineReportText, confidence: 0.97 }]
  };

  const parsedUrine = extractClinicalFields(urineOcr, 'Lab Report');
  const sg = parsedUrine.labResults.find(b => b.name === 'Specific Gravity');
  const uProt = parsedUrine.labResults.find(b => b.name === 'Urine Protein');
  const uWbc = parsedUrine.labResults.find(b => b.name === 'Microscopic WBC');
  const uBact = parsedUrine.labResults.find(b => b.name === 'Bacteria');

  logTest('Urinalysis Specific Gravity numeric = 1.021, range = "1.005 - 1.030"', sg && sg.numericValue === 1.021 && sg.referenceRange.rawRange === '1.005 - 1.030');
  logTest('Urine Protein qualitative rawValue is "Negative", status is NORMAL', uProt && uProt.rawValue === 'Negative' && uProt.status === 'NORMAL');
  logTest('Microscopic WBC hyphen range "2-4" preserved as rawValue with unit "/HPF"', uWbc && uWbc.rawValue === '2-4' && uWbc.unit === '/HPF');
  logTest('Microscopic WBC reference range is "0 - 5 /HPF"', uWbc && uWbc.referenceRange.rawRange === '0 - 5 /HPF');
  logTest('Bacteria value is "None seen"', uBact && uBact.rawValue === 'None seen');
  logTest('Bacteria reference range is "None seen" (NOT truncated "seen")', uBact && uBact.referenceRange.rawRange === 'None seen');

  // Verify CBC markers did NOT bleed into Urinalysis
  const fakeHbInUrine = parsedUrine.labResults.find(b => b.name === 'Hemoglobin');
  const fakePltInUrine = parsedUrine.labResults.find(b => b.name === 'Platelet Count');
  logTest('No CBC Hemoglobin bleeding into Urinalysis', fakeHbInUrine === undefined);
  logTest('No CBC Platelet Count bleeding into Urinalysis', fakePltInUrine === undefined);

  // ----------------------------------------------------
  // SUITE 6: FULL PIPELINE PERSISTENCE & SQLITE RETRIEVAL
  // ----------------------------------------------------
  console.log('\n--- Suite 6: Full Pipeline Trace (Upload -> Parser -> DB -> Retrieval) ---');

  // Register an isolated test user
  const uniqueEmail = `qa-patient-${Date.now()}@healthcopilot.local`;
  const authRes = await AuthService.register({
    email: uniqueEmail,
    password: 'Password123!',
    name: 'QA Verification Patient'
  });
  const userId = authRes.user.id;

  const hospital = MedicalRecordService.createOrSelectHospital(userId, {
    name: 'Apollo Clinical Quality Testing Facility'
  });

  const pdfBuffer = fs.readFileSync(path.join(fixturesDir, 'synthetic_cbc_report.pdf'));

  const processedDoc = await processMedicalDocument({
    fileBuffer: pdfBuffer,
    mimeType: 'application/pdf',
    fileName: 'synthetic_cbc_report.pdf',
    ocrResult: cbcOcr
  });

  const visit = MedicalRecordService.createOrFindVisit(userId, {
    hospitalId: hospital.id,
    visitDate: processedDoc.metadata.documentDate || '2026-10-15',
    physicianName: processedDoc.metadata.clinicianName
  });

  const savedReport = await MedicalRecordService.attachReport({
    userId,
    visitId: visit.id,
    title: 'QA Blood Test Report',
    category: processedDoc.category,
    reportDate: processedDoc.metadata.documentDate,
    physicianName: processedDoc.metadata.clinicianName,
    aiAnalysis: processedDoc,
    ocrResult: cbcOcr,
    extractedText: cbcOcr.fullText,
    fileBuffer: pdfBuffer,
    fileName: 'synthetic_cbc_report.pdf',
    mimeType: 'application/pdf'
  });

  logTest('Report successfully saved to SQLite with generated ID', savedReport && typeof savedReport.id === 'string');

  const retrievedReport = MedicalRecordService.getReportById(userId, savedReport.id);
  logTest('Retrieved report from SQLite retains correct category', retrievedReport && retrievedReport.category === 'Lab Report');
  logTest('Retrieved report from SQLite retains documentDate "2026-10-15"', retrievedReport && retrievedReport.reportDate === '2026-10-15');

  const retrievedWbc = retrievedReport.aiAnalysis.labResults.find(b => b.name === 'Total WBC Count' || b.name === 'WBC Count');
  const retrievedPlt = retrievedReport.aiAnalysis.labResults.find(b => b.name === 'Platelet Count');

  logTest('SQLite persists WBC verbatim comma string "10,040"', retrievedWbc && retrievedWbc.rawValue === '10,040');
  logTest('SQLite persists WBC numeric 10040', retrievedWbc && retrievedWbc.numericValue === 10040);
  logTest('SQLite persists WBC unit "/mm3"', retrievedWbc && retrievedWbc.unit === '/mm3');
  logTest('SQLite persists Platelet verbatim comma string "267,000"', retrievedPlt && retrievedPlt.rawValue === '267,000');
  logTest('SQLite persists Platelet numeric 267000', retrievedPlt && retrievedPlt.numericValue === 267000);
  logTest('SQLite persists raw extractedText without truncation', retrievedReport.extractedText && retrievedReport.extractedText.includes('10,040'));

  // Clean up
  MedicalRecordService.deleteReport(userId, savedReport.id);
  logTest('Database cleanup: Test report removed cleanly', MedicalRecordService.getReportById(userId, savedReport.id) === null);

  console.log('\n================================================================');
  console.log(`CLINICAL CORRECTNESS RESULTS: ${passedCount} Passed | ${failedCount} Failed`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runClinicalValueCorrectnessSuite().catch(err => {
  console.error('[Clinical Value Correctness Suite Error]', err);
  process.exit(1);
});
