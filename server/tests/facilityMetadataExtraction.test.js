import test from 'node:test';
import assert from 'node:assert/strict';
import { extractLabeledMetadata } from '../../src/utils/documentMetadataExtractor.js';

test('extracts an explicitly labelled branch', () => {
  const text = ['Apollo Hospital', 'Branch: Jubilee Hills'].join(String.fromCharCode(10));
  assert.equal(extractLabeledMetadata(text, /(?:branch|unit|campus)/i), 'Jubilee Hills');
});

test('extracts explicitly labelled address and department', () => {
  const text = ['Address: Road No. 72, Hyderabad', 'Department: Clinical Pathology'].join(String.fromCharCode(10));
  assert.equal(extractLabeledMetadata(text, /(?:address|location)/i), 'Road No. 72, Hyderabad');
  assert.equal(extractLabeledMetadata(text, /(?:department|dept|specialty|speciality)/i), 'Clinical Pathology');
});

test('does not invent missing metadata', () => {
  const text = ['Apollo Hospital', 'CBC report'].join(String.fromCharCode(10));
  assert.equal(extractLabeledMetadata(text, /(?:address|location)/i), null);
  assert.equal(extractLabeledMetadata('', /(?:branch|unit|campus)/i), null);
});
