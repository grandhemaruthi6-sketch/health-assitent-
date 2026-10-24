import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiFileUrl, withDownloadFlag } from './reportFileUrl.js';

test('resolves relative report paths to the configured backend origin', () => {
  assert.equal(resolveApiFileUrl('/api/reports/123/download?token=abc', 'https://health-assitent.onrender.com/api', 'https://healthconecto.netlify.app'), 'https://health-assitent.onrender.com/api/reports/123/download?token=abc');
});

test('preserves query tokens and adds download disposition to the backend URL', () => {
  const url = withDownloadFlag(resolveApiFileUrl('/api/reports/123/download?token=abc', 'https://health-assitent.onrender.com/api', 'https://healthconecto.netlify.app'));
  const parsed = new URL(url);
  assert.equal(parsed.origin, 'https://health-assitent.onrender.com');
  assert.equal(parsed.searchParams.get('token'), 'abc');
  assert.equal(parsed.searchParams.get('download'), '1');
});

test('leaves absolute and blob preview URLs intact', () => {
  assert.equal(resolveApiFileUrl('https://files.example.com/report.pdf', 'https://api.example.com/api', 'https://app.example.com'), 'https://files.example.com/report.pdf');
  assert.equal(resolveApiFileUrl('blob:http://localhost/preview-id', '/api', 'http://localhost:3000'), 'blob:http://localhost/preview-id');
});
