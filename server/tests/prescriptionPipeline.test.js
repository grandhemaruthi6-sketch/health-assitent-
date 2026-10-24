import assert from 'assert';
import { parsePrescriptionDocument } from '../services/clinical/prescriptionParser.js';
import { processMedicalDocument } from '../services/clinical/medicalPipelineService.js';
import { MedicalDocumentAnalysisSchema } from '../schemas/medicalDocumentSchema.js';

console.log('\n======================================================');
console.log('   HealthCopilot AI — Prescription Extraction Tests   ');
console.log('======================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function runSuite() {
  // =========================================================================
  // SAMPLE 1: Clear printed prescription
  // =========================================================================
  console.log('--- Sample 1: Clear Printed Prescription ---');
  const sample1Ocr = {
    documentId: 'doc-sample-1',
    fullText: `CITY CARE CLINIC
Dr. Sarah Jenkins, MD
Date: 2026-10-20
Patient: Priya Sharma

Rx:
1. Tab Amoxicillin 500mg 1 tab TDS after food x 5 days
2. Tab Paracetamol 650mg 1 tab SOS for fever`,
    pages: [{
      pageNumber: 1,
      confidence: 0.98,
      text: `CITY CARE CLINIC
Dr. Sarah Jenkins, MD
Date: 2026-10-20
Patient: Priya Sharma

Rx:
1. Tab Amoxicillin 500mg 1 tab TDS after food x 5 days
2. Tab Paracetamol 650mg 1 tab SOS for fever`,
      layout: {
        lines: [
          { text: 'CITY CARE CLINIC', confidence: 0.99 },
          { text: 'Dr. Sarah Jenkins, MD', confidence: 0.99 },
          { text: 'Date: 2026-10-20', confidence: 0.99 },
          { text: 'Patient: Priya Sharma', confidence: 0.98 },
          { text: 'Rx:', confidence: 0.99 },
          { text: '1. Tab Amoxicillin 500mg 1 tab TDS after food x 5 days', confidence: 0.96 },
          { text: '2. Tab Paracetamol 650mg 1 tab SOS for fever', confidence: 0.97 }
        ]
      }
    }]
  };

  const res1 = await processMedicalDocument({
    ocrResult: sample1Ocr,
    overrideCategory: 'Prescription'
  });

  runTest('Sample 1: Extracts exactly 2 medications', () => {
    assert.strictEqual(res1.medications.length, 2);
  });

  runTest('Sample 1: Medication 1 extracts drug_name Amoxicillin, 500mg, 1 tab, TDS, 5 days, after food', () => {
    const med1 = res1.medications[0];
    assert.strictEqual(med1.drug_name, 'Amoxicillin');
    assert.strictEqual(med1.strength, '500mg');
    assert.strictEqual(med1.dose, '1 tab');
    assert.ok(med1.frequency.includes('TDS'));
    assert.strictEqual(med1.duration, '5 days');
    assert.ok(med1.instructions.includes('After food'));
    assert.strictEqual(med1.flags.needsUserReview, false);
  });

  runTest('Sample 1: Medication 2 extracts Paracetamol, 650mg, 1 tab, SOS', () => {
    const med2 = res1.medications[1];
    assert.strictEqual(med2.drug_name, 'Paracetamol');
    assert.strictEqual(med2.strength, '650mg');
    assert.strictEqual(med2.dose, '1 tab');
    assert.ok(med2.frequency.includes('SOS'));
    assert.strictEqual(med2.flags.needsUserReview, false);
  });

  // =========================================================================
  // SAMPLE 2: Messy handwritten prescription (low line confidence < 0.80)
  // =========================================================================
  console.log('\n--- Sample 2: Messy Handwritten Prescription (Confidence < 0.80) ---');
  const sample2Ocr = {
    documentId: 'doc-sample-2',
    fullText: `Dr. V. Sharma, MBBS
Date: 2026-10-22
Rx:
Tab Atorvastatin 20mg 1 tab HS x 30 days`,
    pages: [{
      pageNumber: 1,
      confidence: 0.72,
      text: `Dr. V. Sharma, MBBS
Date: 2026-10-22
Rx:
Tab Atorvastatin 20mg 1 tab HS x 30 days`,
      layout: {
        lines: [
          { text: 'Dr. V. Sharma, MBBS', confidence: 0.75 },
          { text: 'Date: 2026-10-22', confidence: 0.78 },
          { text: 'Rx:', confidence: 0.80 },
          { text: 'Tab Atorvastatin 20mg 1 tab HS x 30 days', confidence: 0.72 }
        ]
      }
    }]
  };

  const res2 = await processMedicalDocument({
    ocrResult: sample2Ocr,
    overrideCategory: 'Prescription'
  });

  runTest('Sample 2: Extracts Atorvastatin 20mg correctly', () => {
    assert.strictEqual(res2.medications.length, 1);
    const med = res2.medications[0];
    assert.strictEqual(med.drug_name, 'Atorvastatin');
    assert.strictEqual(med.strength, '20mg');
    assert.ok(med.frequency.includes('HS'));
    assert.strictEqual(med.duration, '30 days');
  });

  runTest('Sample 2: Low confidence (< 0.80) correctly sets needsUserReview = true', () => {
    const med = res2.medications[0];
    assert.strictEqual(med.flags.isLowConfidence, true);
    assert.strictEqual(med.flags.needsUserReview, true);
    assert.ok(med.flags.reviewReason.includes('Low OCR line confidence'));
  });

  // =========================================================================
  // SAMPLE 3: Multi-drug prescription with frequency like "1-0-1"
  // =========================================================================
  console.log('\n--- Sample 3: Multi-drug Prescription with 1-0-1 Frequency ---');
  const sample3Ocr = {
    documentId: 'doc-sample-3',
    fullText: `METRO MEDICAL CENTER
Dr. Rajesh Gupta, MBBS
Date: 2026-09-15
Rx:
1. Tab Metformin 500mg 1-0-1 after food x 1 month
2. Tab Telmisartan 40mg 1-0-0 before food x 30 days
3. Cap Omeprazole 20mg 0-0-1 before food x 14 days`,
    pages: [{
      pageNumber: 1,
      confidence: 0.95,
      text: `METRO MEDICAL CENTER
Dr. Rajesh Gupta, MBBS
Date: 2026-09-15
Rx:
1. Tab Metformin 500mg 1-0-1 after food x 1 month
2. Tab Telmisartan 40mg 1-0-0 before food x 30 days
3. Cap Omeprazole 20mg 0-0-1 before food x 14 days`,
      layout: {
        lines: [
          { text: 'METRO MEDICAL CENTER', confidence: 0.98 },
          { text: 'Dr. Rajesh Gupta, MBBS', confidence: 0.98 },
          { text: 'Date: 2026-09-15', confidence: 0.98 },
          { text: 'Rx:', confidence: 0.99 },
          { text: '1. Tab Metformin 500mg 1-0-1 after food x 1 month', confidence: 0.95 },
          { text: '2. Tab Telmisartan 40mg 1-0-0 before food x 30 days', confidence: 0.94 },
          { text: '3. Cap Omeprazole 20mg 0-0-1 before food x 14 days', confidence: 0.95 }
        ]
      }
    }]
  };

  const res3 = await processMedicalDocument({
    ocrResult: sample3Ocr,
    overrideCategory: 'Prescription'
  });

  runTest('Sample 3: Extracts all 3 multi-drug medications', () => {
    assert.strictEqual(res3.medications.length, 3);
  });

  runTest('Sample 3: Metformin 1-0-1 parses correctly with morning & night schedule', () => {
    const med1 = res3.medications[0];
    assert.strictEqual(med1.drug_name, 'Metformin');
    assert.strictEqual(med1.strength, '500mg');
    assert.ok(med1.frequency.includes('1-0-1'));
    assert.strictEqual(med1.duration, '1 month');
    assert.ok(med1.instructions.includes('After food'));
  });

  runTest('Sample 3: Telmisartan 1-0-0 and Omeprazole 0-0-1 parse correctly', () => {
    const med2 = res3.medications[1];
    const med3 = res3.medications[2];
    assert.strictEqual(med2.drug_name, 'Telmisartan');
    assert.ok(med2.frequency.includes('1-0-0'));
    assert.strictEqual(med3.drug_name, 'Omeprazole');
    assert.ok(med3.frequency.includes('0-0-1'));
  });

  // =========================================================================
  // SAMPLE 4: Unreadable scribble (Failure Handling)
  // =========================================================================
  console.log('\n--- Sample 4: Unreadable Scribble (Failure Handling) ---');
  const sample4Ocr = {
    documentId: 'doc-sample-4',
    fullText: '~~ // ?',
    pages: [{
      pageNumber: 1,
      confidence: 0.25,
      text: '~~ // ?',
      layout: {
        lines: [
          { text: '~~ // ?', confidence: 0.25 }
        ]
      }
    }]
  };

  const res4 = await processMedicalDocument({
    ocrResult: sample4Ocr,
    overrideCategory: 'Prescription'
  });

  runTest('Sample 4: Triggers UNREADABLE_PRESCRIPTION failure state', () => {
    assert.strictEqual(res4.processingStatus, 'UNREADABLE_PRESCRIPTION');
    assert.strictEqual(res4.overallFlags.requiresHumanReview, true);
    assert.ok(res4.overallFlags.reviewItems[0].includes("couldn't read this prescription clearly"));
  });

  runTest('Sample 4: Does NOT fall back to mock data (medications is empty array)', () => {
    assert.strictEqual(res4.medications.length, 0);
  });

  // =========================================================================
  // SAMPLE 5: Prescription with Ambiguous Instructions
  // =========================================================================
  console.log('\n--- Sample 5: Ambiguous Instructions ("as directed") ---');
  const sample5Ocr = {
    documentId: 'doc-sample-5',
    fullText: `FAMILY CLINIC
Date: 2026-10-10
Rx:
1. Tab Cetirizine 10mg as directed`,
    pages: [{
      pageNumber: 1,
      confidence: 0.95,
      text: `FAMILY CLINIC
Date: 2026-10-10
Rx:
1. Tab Cetirizine 10mg as directed`,
      layout: {
        lines: [
          { text: 'FAMILY CLINIC', confidence: 0.98 },
          { text: 'Date: 2026-10-10', confidence: 0.95 },
          { text: 'Rx:', confidence: 0.99 },
          { text: '1. Tab Cetirizine 10mg as directed', confidence: 0.95 }
        ]
      }
    }]
  };

  const res5 = await processMedicalDocument({
    ocrResult: sample5Ocr,
    overrideCategory: 'Prescription'
  });

  runTest('Sample 5: Extracts Cetirizine 10mg without guessing missing frequency', () => {
    assert.strictEqual(res5.medications.length, 1);
    const med = res5.medications[0];
    assert.strictEqual(med.drug_name, 'Cetirizine');
    assert.strictEqual(med.strength, '10mg');
  });

  runTest('Sample 5: Flags ambiguous instruction with needsUserReview = true', () => {
    const med = res5.medications[0];
    assert.strictEqual(med.flags.needsUserReview, true);
    assert.ok(med.flags.reviewReason.includes('as directed'));
  });

  // =========================================================================
  // REGRESSION CHECK: Lab Report Upload Still Works Untouched
  // =========================================================================
  console.log('\n--- Regression Check: Lab Report Untouched ---');
  const labOcr = {
    documentId: 'doc-lab-check',
    fullText: `APOLLO CLINICAL LAB
Date: 2026-10-15
Test Name                Result     Unit     Reference Range
Hemoglobin               14.2       g/dL     12.0 - 16.0
Total WBC Count          7500       /cumm    4000 - 11000`,
    pages: [{
      pageNumber: 1,
      confidence: 0.98,
      text: `APOLLO CLINICAL LAB
Date: 2026-10-15
Test Name                Result     Unit     Reference Range
Hemoglobin               14.2       g/dL     12.0 - 16.0
Total WBC Count          7500       /cumm    4000 - 11000`
    }]
  };

  const labRes = await processMedicalDocument({
    ocrResult: labOcr,
    overrideCategory: 'Lab Report'
  });

  runTest('Regression: Lab report extracts biomarkers, not medications', () => {
    assert.strictEqual(labRes.category, 'Lab Report');
    assert.ok(labRes.labResults.length >= 2);
    assert.strictEqual(labRes.medications.length, 0);
    assert.strictEqual(labRes.labResults[0].name, 'Hemoglobin');
    assert.strictEqual(labRes.labResults[0].numericValue, 14.2);
  });

  // Print Summary Table
  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passedTests} Passed | ${totalTests - passedTests} Failed`);
  console.log('======================================================\n');
}

runSuite().catch(err => {
  console.error('Test Suite encountered fatal error:', err);
  process.exit(1);
});
