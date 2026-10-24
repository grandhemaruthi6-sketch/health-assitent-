import test from 'node:test';
import assert from 'node:assert/strict';
import { extractClinicalFields } from '../services/clinical/clinicalParser.js';

function analyzeHeader(text) {
  return extractClinicalFields({ documentId: 'header-metadata-test', fullText: text, pages: [{ pageNumber: 1, text }] }, 'Lab Report').metadata;
}

test('detects MAX Lab from the masthead and extracts the report and collection dates', () => {
  const text = [
    'MAX Lab',
    'Laboratory Investigation Report',
    'Patient Name : Mr. Chintan Sharma',
    'Age/Sex : 42 Yrs/Male',
    'Patient ID : MX123456',
    'Collection Date/Time : 19/Apr/2023 10:20AM',
    'Reporting Date/Time : 19/Apr/2023 05:58PM',
    'Clinical Biochemistry',
    'Kidney Function Test (KFT) Profile with Calcium, Uric Acid, Serum',
    'Date 19/Apr/2023 10:20AM 30/Jan/2023 10:40AM 14/Jan/2023 11:59AM'
  ].join(String.fromCharCode(10));
  const metadata = analyzeHeader(text);
  assert.equal(metadata.facilityName, 'MAX Lab');
  assert.equal(metadata.documentDate, '2023-04-19');
  assert.equal(metadata.reportDate, '2023-04-19');
  assert.equal(metadata.visitDate, '2023-04-19');
  assert.equal(metadata.collectionDate, '2023-04-19');
  assert.equal(metadata.patientName, 'Mr. Chintan Sharma');
  assert.equal(metadata.patientAge, '42 Yrs');
  assert.equal(metadata.patientSex, 'Male');
  assert.equal(metadata.patientIdentifier, 'MX123456');
  assert.equal(metadata.evidence.reportDate.presence, 'EXPLICIT');
});

test('prefers report date over specimen collection date', () => {
  const text = [
    'Apollo Hospitals',
    'Patient Name: Asha Reddy',
    'Collection Date/Time: 19/Apr/2023 10:20AM',
    'Reporting Date/Time: 20/Apr/2023 05:58PM',
    'Clinical Biochemistry'
  ].join(String.fromCharCode(10));
  const metadata = analyzeHeader(text);
  assert.equal(metadata.facilityName, 'Apollo Hospitals');
  assert.equal(metadata.documentDate, '2023-04-20');
  assert.equal(metadata.visitDate, '2023-04-19');
  assert.equal(metadata.reportDate, '2023-04-20');
});

test('supports generic diagnostic-lab naming across provider formats', () => {
  assert.equal(analyzeHeader('Dr. Lal PathLabs\nReport Date: 19-Apr-2023').facilityName, 'Dr. Lal PathLabs');
  assert.equal(analyzeHeader('Metropolis Healthcare\nReport Date: 19-Apr-2023').facilityName, 'Metropolis Healthcare');
  assert.equal(analyzeHeader('Facility Name: City Diagnostics').facilityName, 'City Diagnostics');
});

test('normalizes day-month-name, numeric and ISO report date formats', () => {
  assert.equal(analyzeHeader('MAX Lab\nReport Date: 19-Apr-2023').documentDate, '2023-04-19');
  assert.equal(analyzeHeader('MAX Lab\nReport Date: 19/04/2023').documentDate, '2023-04-19');
  assert.equal(analyzeHeader('MAX Lab\nReport Date: 2023-04-19').documentDate, '2023-04-19');
});

test('marks historical comparison-column dates uncertain when no labelled report date exists', () => {
  const metadata = analyzeHeader(['MAX Lab', '19/04/2023   30/01/2023   14/01/2023'].join(String.fromCharCode(10)));
  assert.equal(metadata.facilityName, 'MAX Lab');
  assert.equal(metadata.evidence.date.presence, 'UNCERTAIN');
  assert.equal(metadata.evidence.reportDate.presence, 'UNCERTAIN');
});
