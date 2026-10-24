import assert from 'assert';
import { extractClinicalFields } from '../services/clinical/clinicalParser.js';

console.log('\n================================================================');
console.log('   HealthCopilot AI — Milestone 2 Structured Lab Reports QA');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${desc}`);
    console.error(`    ${err.message}`);
    failCount++;
  }
}

// ---------------------------------------------------------
// Suite 1: Arbitrary Printed Analytes Beyond Fixed Catalog
// ---------------------------------------------------------
console.log('--- Suite 1: Arbitrary Printed Analytes Beyond Fixed Catalog ---');

const sampleReportText = `
METROPOLIS HEALTHCARE LTD
CLINICAL PATHOLOGY & BIOCHEMISTRY REPORT
Patient Name: Priya Sharma
Age: 32 Y / Female
Date of Collection: 15/10/2026
Facility: Metropolis Diagnostic Lab

TEST NAME                    VALUE       UNIT        FLAG    REFERENCE INTERVAL
Serum Calcium                10.8        mg/dL       High    8.5 - 10.2
Uric Acid                    7.8         mg/dL       High    2.4 - 5.7
Serum Ferritin               4.2         ng/mL       Low     10.0 - 120.0
Vitamin B12                  480         pg/mL               211 - 911
Total Bilirubin              0.8         mg/dL               0.2 - 1.2
C-Reactive Protein (CRP)     12.4        mg/L        High    < 5.0
Free Testosterone            2.1         pg/mL
`;

const ocrData = {
  documentId: 'doc-m2-test-01',
  fullText: sampleReportText,
  pages: [{ pageNumber: 1, text: sampleReportText, confidence: 0.96 }]
};

const analysis = extractClinicalFields(ocrData, 'Lab Report');
const labs = analysis.labResults;

it('Extracts Serum Calcium (non-catalog analyte)', () => {
  const item = labs.find(l => l.name === 'Serum Calcium');
  assert.ok(item, 'Serum Calcium must be extracted');
  assert.strictEqual(item.rawValue, '10.8');
  assert.strictEqual(item.numericValue, 10.8);
  assert.strictEqual(item.unit, 'mg/dL');
  assert.strictEqual(item.status, 'HIGH');
  assert.strictEqual(item.referenceRange.low, 8.5);
  assert.strictEqual(item.referenceRange.high, 10.2);
});

it('Extracts Uric Acid with correct unit and elevated flag', () => {
  const item = labs.find(l => l.name === 'Uric Acid');
  assert.ok(item, 'Uric Acid must be extracted');
  assert.strictEqual(item.rawValue, '7.8');
  assert.strictEqual(item.numericValue, 7.8);
  assert.strictEqual(item.unit, 'mg/dL');
  assert.strictEqual(item.status, 'HIGH');
  assert.strictEqual(item.referenceRange.low, 2.4);
  assert.strictEqual(item.referenceRange.high, 5.7);
});

it('Extracts Serum Ferritin with Low flag and reference bounds', () => {
  const item = labs.find(l => l.name === 'Serum Ferritin');
  assert.ok(item, 'Serum Ferritin must be extracted');
  assert.strictEqual(item.rawValue, '4.2');
  assert.strictEqual(item.unit, 'ng/mL');
  assert.strictEqual(item.status, 'LOW');
});

it('Extracts Vitamin B12 in range with Normal status', () => {
  const item = labs.find(l => l.name === 'Vitamin B12');
  assert.ok(item, 'Vitamin B12 must be extracted');
  assert.strictEqual(item.numericValue, 480);
  assert.strictEqual(item.unit, 'pg/mL');
  assert.strictEqual(item.status, 'NORMAL');
});

it('Extracts C-Reactive Protein (CRP) with inequality bound', () => {
  const item = labs.find(l => l.name.includes('C-Reactive Protein') || l.name.includes('CRP'));
  assert.ok(item, 'CRP must be extracted');
  assert.strictEqual(item.numericValue, 12.4);
  assert.strictEqual(item.status, 'HIGH');
});

// ---------------------------------------------------------
// Suite 2: Missing Reference Range & Non-Diagnostic Framing
// ---------------------------------------------------------
console.log('\n--- Suite 2: Missing Reference Range & Non-Diagnostic Framing ---');

it('Handles Free Testosterone with missing reference interval as Unavailable without fabricating bounds', () => {
  const item = labs.find(l => l.name === 'Free Testosterone');
  assert.ok(item, 'Free Testosterone must be extracted');
  assert.strictEqual(item.rawValue, '2.1');
  assert.strictEqual(item.unit, 'pg/mL');
  assert.strictEqual(item.referenceRange.rawRange, 'Unavailable');
  assert.strictEqual(item.referenceRange.low, null);
  assert.strictEqual(item.referenceRange.high, null);
  assert.strictEqual(item.status, 'UNKNOWN');
});

it('Interpretation clearly states out-of-range is a screening measurement, not an automatic diagnosis', () => {
  const calcium = labs.find(l => l.name === 'Serum Calcium');
  assert.ok(calcium.interpretation.includes('not an automatic diagnosis'), 'Must state not an automatic diagnosis');
});

it('Interpretation for normal values clarifies that within-range is not a complete guarantee of health', () => {
  const b12 = labs.find(l => l.name === 'Vitamin B12');
  assert.ok(b12.interpretation.includes('not an absolute guarantee of wellness'), 'Must not promise absolute health');
});

// ---------------------------------------------------------
// Suite 3: Unit before Flag vs Flag before Unit formats
// ---------------------------------------------------------
console.log('\n--- Suite 3: Unit before Flag vs Flag before Unit formats ---');

const mixedFormatsText = `
CLINICAL LAB REPORT
Patient: Ramesh Kumar
Date: 2026-10-15

Serum Potassium: 5.8 mEq/L High 3.5 - 5.0
Serum Sodium: 132 Low mEq/L 135 - 145
Serum Chloride: 99 mEq/L 96 - 106
`;

const mixedAnalysis = extractClinicalFields({
  documentId: 'doc-mixed-01',
  fullText: mixedFormatsText,
  pages: [{ pageNumber: 1, text: mixedFormatsText, confidence: 0.95 }]
}, 'Lab Report');

it('Parses unit before flag (Potassium 5.8 mEq/L High 3.5 - 5.0)', () => {
  const pot = mixedAnalysis.labResults.find(l => l.name === 'Serum Potassium');
  assert.ok(pot, 'Potassium must be found');
  assert.strictEqual(pot.numericValue, 5.8);
  assert.strictEqual(pot.unit, 'mEq/L');
  assert.strictEqual(pot.status, 'HIGH');
  assert.strictEqual(pot.referenceRange.low, 3.5);
  assert.strictEqual(pot.referenceRange.high, 5.0);
});

it('Parses flag before unit (Sodium 132 Low mEq/L 135 - 145)', () => {
  const sod = mixedAnalysis.labResults.find(l => l.name === 'Serum Sodium');
  assert.ok(sod, 'Sodium must be found');
  assert.strictEqual(sod.numericValue, 132);
  assert.strictEqual(sod.unit, 'mEq/L');
  assert.strictEqual(sod.status, 'LOW');
  assert.strictEqual(sod.referenceRange.low, 135);
  assert.strictEqual(sod.referenceRange.high, 145);
});

console.log('\n================================================================');
console.log(`MILESTONE 2 RESULTS: ${passCount} Passed | ${failCount} Failed`);
console.log('================================================================\n');

if (failCount > 0) process.exit(1);
