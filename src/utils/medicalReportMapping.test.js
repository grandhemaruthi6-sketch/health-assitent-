import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPersistedClinicalAnalysis, mapSavedReport } from './medicalReportMapping.js';

test('uses populated labResults when extractedBiomarkers is an empty array', () => {
  const labResults = Array.from({ length: 5 }, (_, index) => ({
    name: 'Marker ' + index, numericValue: index + 1, rawValue: String(index + 1), unit: 'mg/dL',
    status: 'NORMAL', referenceRange: { low: 0, high: 10, rawRange: '0 - 10' }
  }));
  const mapped = mapSavedReport({
    id: 'saved-report', reportDate: '2023-04-19', uploadedAt: '2026-10-24T10:00:00.000Z',
    category: 'Lab Report', aiAnalysis: { extractedBiomarkers: [], labResults }
  });
  assert.equal(mapped.biomarkers.length, 5);
  assert.equal(mapped.biomarkers[0].name, 'Marker 0');
  assert.equal(mapped.biomarkers[0].value, 1);
  assert.equal(mapped.date, 'Apr 19, 2023');
});

test('saved report maps facility and patient metadata without inventing a clinician', () => {
  const mapped = mapSavedReport({
    id: 'saved-report', reportDate: '2023-04-19', visitDate: '2023-04-19',
    aiAnalysis: { metadata: { facilityName: 'MAX Lab', patientName: 'Mr. Chintan Sharma', patientAge: '42 years', patientSex: 'Male', clinicianName: null }, labResults: [] }
  });
  assert.equal(mapped.hospitalName, 'MAX Lab');
  assert.equal(mapped.patientName, 'Mr. Chintan Sharma');
  assert.equal(mapped.patientAge, '42 years');
  assert.equal(mapped.patientSex, 'Male');
  assert.equal(mapped.doctorName, '');
});

test('persisted analysis keeps raw lab results and a non-empty UI biomarker representation', () => {
  const raw = { category: 'Lab Report', metadata: { facilityName: 'MAX Lab' }, labResults: [{ name: 'Creatinine', numericValue: 0.78, rawValue: '0.78', status: 'NORMAL', referenceRange: { low: 0.7, high: 1.3, rawRange: '0.7 - 1.3' } }] };
  const persisted = buildPersistedClinicalAnalysis(raw, [{ name: 'Creatinine', value: 0.78, unit: 'mg/dL', status: 'Normal' }], { hospitalDetected: true, hospitalName: 'MAX Lab', reportDate: '2023-04-19', visitDate: '2023-04-19' });
  assert.equal(persisted.labResults.length, 1);
  assert.equal(persisted.extractedBiomarkers.length, 1);
  assert.equal(persisted.metadata.facilityName, 'MAX Lab');
  assert.equal(persisted.metadata.reportDate, '2023-04-19');
});

test('does not create fake clinical marker counts for empty analysis results', () => {
  const mapped = mapSavedReport({ id: 'empty', aiAnalysis: { extractedBiomarkers: [], labResults: [] } });
  assert.equal(mapped.biomarkers.length, 0);
});
