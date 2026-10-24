import test from 'node:test';
import assert from 'node:assert/strict';
import { parseApiResponse } from '../../src/services/apiClient.js';

test('reports an HTML fallback as an API routing/configuration error', async () => {
  const response = { status: 404, headers: { get: () => 'text/html; charset=utf-8' }, text: async () => '<!DOCTYPE html><html><body>Not found</body></html>' };
  await assert.rejects(() => parseApiResponse(response), error => {
    assert.equal(error.code, 'API_NON_JSON_RESPONSE');
    assert.match(error.message, /VITE_API_BASE_URL/);
    assert.equal(error.status, 404);
    return true;
  });
});

test('parses valid JSON API responses', async () => {
  const response = { status: 200, headers: { get: () => 'application/json; charset=utf-8' }, json: async () => ({ success: true, data: { labResults: [] } }) };
  assert.deepEqual(await parseApiResponse(response), { success: true, data: { labResults: [] } });
});

test('reports malformed JSON with a stable diagnostic code', async () => {
  const response = { status: 502, headers: { get: () => 'application/json' }, json: async () => { throw new SyntaxError('bad json'); } };
  await assert.rejects(() => parseApiResponse(response), error => {
    assert.equal(error.code, 'API_INVALID_JSON_RESPONSE');
    return true;
  });
});
