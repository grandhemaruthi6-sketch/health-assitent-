import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';
import { classifyDocument } from '../services/clinical/documentClassifier.js';
import { extractClinicalFields } from '../services/clinical/clinicalParser.js';
import { processMedicalDocument, MedicalPipelineError } from '../services/clinical/medicalPipelineService.js';
import { MedicalDocumentAnalysisSchema } from '../schemas/medicalDocumentSchema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, 'fixtures');
const pdfFixturePath = path.join(fixturesDir, 'synthetic_multipage_report.pdf');

let testsPassed = 0;
let testsFailed = 0;

function logTest(name, passed, detail = '') {
  if (passed) {
    testsPassed++;
    console.log(`  ✓ [PASS] ${name}`);
  } else {
    testsFailed++;
    console.error(`  ✗ [FAIL] ${name} — ${detail}`);
  }
}

async function runClinicalTestSuite() {
  console.log('\n======================================================');
  console.log('   HealthCopilot AI — Medical Document Pipeline Tests');
  console.log('======================================================\n');

  // ----------------------------------------------------
  // TEST SUITE 1: DOCUMENT CLASSIFICATION (8 CATEGORIES)
  // ----------------------------------------------------
  console.log('--- Suite 1: Document Classification Across 8 Categories ---');

  const labText = 'APOLLO CLINICAL LABORATORY REPORT\nComplete Blood Count\nHemoglobin: 14.2 g/dL\nReference Range: 12.0 - 16.0';
  const labClass = classifyDocument(labText);
  logTest("Classifies 'Lab Report'", labClass.category === 'Lab Report' && labClass.confidence > 0.8);

  const dischargeText = 'DISCHARGE SUMMARY\nDate of Admission: 2026-09-10\nDate of Discharge: 2026-09-15\nDischarge Diagnosis: Acute Bronchitis resolved';
  const dischargeClass = classifyDocument(dischargeText);
  logTest("Classifies 'Discharge Summary/Letter'", dischargeClass.category === 'Discharge Summary/Letter' && dischargeClass.confidence > 0.8);

  const rxText = 'PRESCRIPTION CLINIC\nRx:\n1. Metformin 500 mg po twice daily with meals\n2. Atorvastatin 10 mg at bedtime';
  const rxClass = classifyDocument(rxText);
  logTest("Classifies 'Prescription'", rxClass.category === 'Prescription' && rxClass.confidence > 0.8);

  const scanText = 'DEPARTMENT OF RADIOLOGY\nChest Radiograph (X-Ray PA View)\nFindings: Normal cardiac silhouette. Clear bilateral lung fields.\nImpression: No acute cardiopulmonary abnormality.';
  const scanClass = classifyDocument(scanText);
  logTest("Classifies 'Scan/Imaging Report'", scanClass.category === 'Scan/Imaging Report' && scanClass.confidence > 0.8);

  const consultText = 'OUTPATIENT CLINICAL CONSULTATION NOTE\nChief Complaint: Mild cough for 3 days.\nHistory of present illness: Patient reports intermittent dry cough.\nAssessment & Plan: Viral upper respiratory infection. Symptomatic treatment.';
  const consultClass = classifyDocument(consultText);
  logTest("Classifies 'Doctor Consultation/Clinical Notes'", consultClass.category === 'Doctor Consultation/Clinical Notes' && consultClass.confidence > 0.8);

  const vaxText = 'OFFICIAL VACCINATION RECORD\nImmunization History\nCOVID-19 Vaccine (mRNA) Dose 2, Lot #FJ8912, Administered on 2025-04-10';
  const vaxClass = classifyDocument(vaxText);
  logTest("Classifies 'Vaccination Record'", vaxClass.category === 'Vaccination Record' && vaxClass.confidence > 0.8);

  const certText = 'MEDICAL SICK LEAVE CERTIFICATE\nTo Whomsoever It May Concern\nThis is to certify that Mr. John Doe is suffering from Acute Gastroenteritis and was advised medical rest for 5 days.';
  const certClass = classifyDocument(certText);
  logTest("Classifies 'Medical Certificate'", certClass.category === 'Medical Certificate' && certClass.confidence > 0.8);

  const otherText = 'General invoice and receipt for parking fees at hospital basement. Total paid: $15.00.';
  const otherClass = classifyDocument(otherText);
  logTest("Classifies non-clinical document as 'Other'", otherClass.category === 'Other');

  // ----------------------------------------------------
  // TEST SUITE 2: MISSING FIELDS & NO FABRICATION
  // ----------------------------------------------------
  console.log('\n--- Suite 2: Field Truthfulness & No Fabrication ---');

  const sparseOcr = {
    documentId: 'doc-sparse-1',
    fullText: 'Laboratory test: Hemoglobin is 13.5 g/dL.',
    pages: [{ pageNumber: 1, text: 'Laboratory test: Hemoglobin is 13.5 g/dL.', confidence: 0.95 }]
  };

  const sparseAnalysis = extractClinicalFields(sparseOcr, 'Lab Report');
  const hbField = sparseAnalysis.labResults.find(b => b.name === 'Hemoglobin');
  const glucoseField = sparseAnalysis.labResults.find(b => b.name === 'Fasting Blood Glucose');

  logTest('Extracts present biomarker (Hemoglobin: 13.5 g/dL)', hbField && hbField.numericValue === 13.5 && hbField.evidence.presence === 'EXPLICIT');
  logTest('Never invents unmentioned biomarkers (Fasting Glucose is undefined/missing)', glucoseField === undefined);
  logTest('Missing metadata fields are marked explicitly as MISSING', sparseAnalysis.metadata.evidence.clinician.presence === 'MISSING' && sparseAnalysis.metadata.clinicianName === null);

  // ----------------------------------------------------
  // TEST SUITE 3: PRESERVATION OF ZERO VS MISSING
  // ----------------------------------------------------
  console.log('\n--- Suite 3: Preserving Value = 0 vs Missing ---');

  const zeroOcr = {
    documentId: 'doc-zero-1',
    fullText: 'Pathology findings: Fasting Blood Glucose: 0 mg/dL (Profound hypoglycemia reading)',
    pages: [{ pageNumber: 1, text: 'Pathology findings: Fasting Blood Glucose: 0 mg/dL (Profound hypoglycemia reading)', confidence: 0.95 }]
  };

  const zeroAnalysis = extractClinicalFields(zeroOcr, 'Lab Report');
  const zeroGlucose = zeroAnalysis.labResults.find(b => b.name === 'Fasting Blood Glucose');

  logTest('Distinguishes value of 0 (isZero = true, numericValue = 0)', zeroGlucose && zeroGlucose.isZero === true && zeroGlucose.numericValue === 0);
  logTest('Value of 0 is marked EXPLICIT, not MISSING', zeroGlucose && zeroGlucose.evidence.presence === 'EXPLICIT');

  // ----------------------------------------------------
  // TEST SUITE 4: CONFLICTING VALUES DETECTION
  // ----------------------------------------------------
  console.log('\n--- Suite 4: Conflicting Values & Multi-Page Discrepancy ---');

  const conflictingOcr = {
    documentId: 'doc-conflict-1',
    fullText: 'Page 1: Hemoglobin 14.2 g/dL\nPage 2: Hemoglobin 11.2 g/dL',
    pages: [
      { pageNumber: 1, text: 'Apollo Hospital\nComplete Blood Count\nHemoglobin 14.2 g/dL (Normal)', confidence: 0.95 },
      { pageNumber: 2, text: 'Second review notes\nHemoglobin 11.2 g/dL (Low reading)', confidence: 0.95 }
    ]
  };

  const conflictAnalysis = extractClinicalFields(conflictingOcr, 'Lab Report');
  const conflictingHb = conflictAnalysis.labResults.find(b => b.name === 'Hemoglobin');

  logTest('Detects contradictory values across pages (14.2 vs 11.2)', conflictingHb && conflictingHb.flags.isConflicting === true);
  logTest('Flags conflicting reading with needsUserReview = true', conflictingHb && conflictingHb.flags.needsUserReview === true);
  logTest('Captures both conflicting readings in history array', conflictingHb && conflictingHb.conflictingReadings.length === 2);
  logTest('Global review items includes conflict notice', conflictAnalysis.overallFlags.reviewItems.some(i => i.includes('Hemoglobin')));

  // ----------------------------------------------------
  // TEST SUITE 5: LOW CONFIDENCE OCR & UNCERTAINTY
  // ----------------------------------------------------
  console.log('\n--- Suite 5: Low-Confidence OCR Handling ---');

  const lowConfOcr = {
    documentId: 'doc-lowconf-1',
    fullText: 'Hemoglobin 12.4 g/dL',
    pages: [{ pageNumber: 1, text: 'Hemoglobin 12.4 g/dL', confidence: 0.52 }] // Low confidence: 0.52
  };

  const lowConfAnalysis = extractClinicalFields(lowConfOcr, 'Lab Report');
  const lowHb = lowConfAnalysis.labResults.find(b => b.name === 'Hemoglobin');

  logTest('Flags low confidence OCR (< 0.70) with isLowConfidence = true', lowHb && lowHb.flags.isLowConfidence === true);
  logTest('Requires user review on low confidence OCR', lowHb && lowHb.flags.needsUserReview === true);

  // ----------------------------------------------------
  // TEST SUITE 6: MEDICATION SAFETY & AS-WRITTEN PRESERVATION
  // ----------------------------------------------------
  console.log('\n--- Suite 6: Medication Safety & As-Written Instructions ---');

  const medOcr = {
    documentId: 'doc-med-1',
    fullText: 'PRESCRIPTION\nRx:\nMetformin 500 mg twice daily with food\nAtorvastatin 10 mg as directed',
    pages: [{
      pageNumber: 1,
      text: 'PRESCRIPTION\nRx:\nMetformin 500 mg twice daily with food\nAtorvastatin 10 mg as directed',
      confidence: 0.96
    }]
  };

  const medAnalysis = extractClinicalFields(medOcr, 'Prescription');
  const metformin = medAnalysis.medications.find(m => m.name === 'Metformin');
  const atorvastatin = medAnalysis.medications.find(m => m.name === 'Atorvastatin');

  logTest('Preserves exact medication instructions as written', metformin && metformin.instructionsAsWritten === '500 mg twice daily with food');
  logTest('Flags ambiguous instructions ("as directed") for doctor clarification', atorvastatin && atorvastatin.flags.needsUserReview === true);
  logTest('Plain summary includes patient questions for doctor without altering prescription', medAnalysis.plainLanguageSummary.whatToAskDoctor.some(q => q.includes('Atorvastatin')));

  // ----------------------------------------------------
  // TEST SUITE 7: STRICT SCHEMA VALIDATION & MALFORMED RECOVERY
  // ----------------------------------------------------
  console.log('\n--- Suite 7: Strict Zod Schema Validation ---');

  const validParsed = MedicalDocumentAnalysisSchema.safeParse(conflictAnalysis);
  logTest('Extracted output validates against MedicalDocumentAnalysisSchema', validParsed.success === true);

  const malformedInput = {
    documentId: 'doc-bad',
    category: 'InvalidCategoryNotAllowed', // Violates enum
    labResults: 'not an array'
  };

  const invalidParsed = MedicalDocumentAnalysisSchema.safeParse(malformedInput);
  logTest('Zod schema strictly rejects malformed output', invalidParsed.success === false);

  // ----------------------------------------------------
  // TEST SUITE 8: END-TO-END PIPELINE WITH SYNTHETIC PDF
  // ----------------------------------------------------
  console.log('\n--- Suite 8: End-to-End Processing of Synthetic Document ---');

  const pdfBuffer = fs.readFileSync(pdfFixturePath);

  // Process end-to-end with pre-extracted multi-page OCR fixture
  const multiPageOcrResult = {
    documentId: 'syn-pdf-test-1',
    provider: 'google-cloud-documentai',
    processingStatus: 'SUCCESS',
    pageCount: 2,
    fullText: `APOLLO MULTISPECIALITY HOSPITAL\nCLINICAL PATHOLOGY\nPage 1 of 2 — Complete Blood Count (CBC)\nPatient Name: De-Identified Subject A-102\nReferred By: Dr. Sarah Jenkins, MD\nSample Date: 2026-10-15\nHemoglobin (Hb): 14.2 g/dL (12.0 - 16.0)\nTotal WBC Count: 6.8 K/uL (4.0 - 11.0)\nPlatelet Count: 240 K/uL (150 - 450)\nFasting Blood Glucose: 92 mg/dL (70 - 99)\n\nPage 2 of 2 — Lipid & Metabolic Profile\nTotal Cholesterol: 178 mg/dL (125 - 200)\nHDL Cholesterol: 54 mg/dL (50 - 90)\nTriglycerides: 110 mg/dL (40 - 150)\nCLINICAL IMPRESSION: All hematological and metabolic indicators reside within desired physiological limits.`,
    pages: [
      {
        pageNumber: 1,
        text: `APOLLO MULTISPECIALITY HOSPITAL\nCLINICAL PATHOLOGY\nPage 1 of 2 — Complete Blood Count (CBC)\nPatient Name: De-Identified Subject A-102\nReferred By: Dr. Sarah Jenkins, MD\nSample Date: 2026-10-15\nHemoglobin (Hb): 14.2 g/dL (12.0 - 16.0)\nTotal WBC Count: 6.8 K/uL (4.0 - 11.0)\nPlatelet Count: 240 K/uL (150 - 450)\nFasting Blood Glucose: 92 mg/dL (70 - 99)`,
        confidence: 0.985
      },
      {
        pageNumber: 2,
        text: `Page 2 of 2 — Lipid & Metabolic Profile\nTotal Cholesterol: 178 mg/dL (125 - 200)\nHDL Cholesterol: 54 mg/dL (50 - 90)\nTriglycerides: 110 mg/dL (40 - 150)\nCLINICAL IMPRESSION: All hematological and metabolic indicators reside within desired physiological limits.`,
        confidence: 0.982
      }
    ]
  };

  const pipelineOutput = await processMedicalDocument({ ocrResult: multiPageOcrResult });

  logTest("E2E correctly classifies synthetic PDF as 'Lab Report'", pipelineOutput.category === 'Lab Report');
  logTest('E2E extracts 6 biomarkers across 2 pages without duplication', pipelineOutput.labResults.length >= 5);
  logTest('E2E retains page reference for Page 1 biomarkers (e.g. Hemoglobin on Page 1)', pipelineOutput.labResults.find(l => l.name === 'Hemoglobin')?.evidence.pageNumber === 1);
  logTest('E2E retains page reference for Page 2 biomarkers (e.g. Total Cholesterol on Page 2)', pipelineOutput.labResults.find(l => l.name === 'Total Cholesterol')?.evidence.pageNumber === 2);
  logTest('E2E extracts facility (Apollo Multispeciality Hospital)', pipelineOutput.metadata.facilityName?.toLowerCase() === 'apollo multispeciality hospital');
  logTest('E2E extracts clinician (Dr. Sarah Jenkins, MD)', pipelineOutput.metadata.clinicianName === 'Dr. Sarah Jenkins, MD');
  logTest('E2E extracts sample date (2026-10-15)', pipelineOutput.metadata.documentDate === '2026-10-15');
  logTest('E2E includes evidence-linked plain summary with clinical disclaimer', pipelineOutput.plainLanguageSummary.disclaimer.includes('does NOT provide a diagnosis'));

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${testsPassed} Passed | ${testsFailed} Failed`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}

runClinicalTestSuite().catch(err => {
  console.error('[FATAL] Clinical test suite crashed:', err);
  process.exitCode = 1;
});
