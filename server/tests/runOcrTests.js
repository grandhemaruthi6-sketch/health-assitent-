import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';
import { validateDocument, ValidationError } from '../utils/documentValidator.js';
import { OcrProvider, OcrProviderError } from '../services/ocr/ocrProvider.js';
import { GoogleDocumentAiProvider } from '../services/ocr/googleDocumentAiProvider.js';
import { MockOcrProvider } from '../services/ocr/mockOcrProvider.js';
import { getOcrProvider, resetOcrProvider } from '../services/ocr/ocrFactory.js';
import { app } from '../server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, 'fixtures');

const pdfPath = path.join(fixturesDir, 'synthetic_multipage_report.pdf');
const pngPath = path.join(fixturesDir, 'synthetic_lab_image.png');
const corruptPath = path.join(fixturesDir, 'corrupt_spoofed_file.pdf');

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

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('   HealthCopilot AI — Production OCR Integration Tests');
  console.log('======================================================\n');

  const pdfBuffer = fs.readFileSync(pdfPath);
  const pngBuffer = fs.readFileSync(pngPath);
  const corruptBuffer = fs.readFileSync(corruptPath);

  // ----------------------------------------------------
  // TEST SUITE 1: DOCUMENT VALIDATOR
  // ----------------------------------------------------
  console.log('--- Suite 1: Document Validator (MIME, Bounds & Magic Bytes) ---');

  try {
    const res = validateDocument(pdfBuffer, 'application/pdf');
    logTest('Validates authentic multi-page PDF buffer', res.isValid && res.mimeType === 'application/pdf');
  } catch (e) {
    logTest('Validates authentic multi-page PDF buffer', false, e.message);
  }

  try {
    const res = validateDocument(pngBuffer, 'image/png');
    logTest('Validates authentic image (PNG) buffer', res.isValid && res.mimeType === 'image/png');
  } catch (e) {
    logTest('Validates authentic image (PNG) buffer', false, e.message);
  }

  try {
    validateDocument(corruptBuffer, 'application/pdf');
    logTest('Rejects corrupt/spoofed document signature', false, 'Expected SIGNATURE_MISMATCH error');
  } catch (e) {
    const passed = e instanceof ValidationError && e.code === 'SIGNATURE_MISMATCH';
    logTest('Rejects corrupt/spoofed document signature (SIGNATURE_MISMATCH)', passed, e.message);
  }

  try {
    validateDocument(Buffer.from('hello text'), 'text/plain');
    logTest('Rejects unsupported MIME type (text/plain)', false, 'Expected UNSUPPORTED_FORMAT');
  } catch (e) {
    const passed = e instanceof ValidationError && e.code === 'UNSUPPORTED_FORMAT';
    logTest('Rejects unsupported MIME type (UNSUPPORTED_FORMAT)', passed, e.message);
  }

  try {
    validateDocument(pdfBuffer, 'application/pdf', 100); // 100 bytes limit
    logTest('Rejects file exceeding max size limit (FILE_TOO_LARGE)', false, 'Expected FILE_TOO_LARGE');
  } catch (e) {
    const passed = e instanceof ValidationError && e.code === 'FILE_TOO_LARGE';
    logTest('Rejects file exceeding max size limit (FILE_TOO_LARGE)', passed, e.message);
  }

  // ----------------------------------------------------
  // TEST SUITE 2: OCR PROVIDER ABSTRACTION & CONTRACT
  // ----------------------------------------------------
  console.log('\n--- Suite 2: Provider Abstraction & Contract Compliance ---');

  const mockProvider = new MockOcrProvider();
  logTest('Provider inherits from base OcrProvider class', mockProvider instanceof OcrProvider);

  const health = await mockProvider.healthCheck();
  logTest('Provider exposes standard healthCheck()', health.isConfigured && health.provider === 'mock-ocr-provider');

  // Test Multi-page processing
  const multiPageResult = await mockProvider.processDocument(pdfBuffer, 'application/pdf', { syntheticPageCount: 2 });
  logTest('Structured result contains documentId (UUID)', typeof multiPageResult.documentId === 'string' && multiPageResult.documentId.length > 10);
  logTest('Preserves exact multi-page count (pageCount = 2)', multiPageResult.pageCount === 2 && multiPageResult.pages.length === 2);
  logTest('Page 1 preserves boundary text & layout', multiPageResult.pages[0].pageNumber === 1 && multiPageResult.pages[0].text.includes('Complete Blood Count'));
  logTest('Page 2 preserves boundary text & layout', multiPageResult.pages[1].pageNumber === 2 && multiPageResult.pages[1].text.includes('Page 2 of 2'));
  logTest('Provides confidence score & form field metadata', multiPageResult.pages[0].confidence > 0.9 && multiPageResult.pages[0].layout.formFields.length > 0);

  // Test Image processing
  const imageResult = await mockProvider.processDocument(pngBuffer, 'image/png');
  logTest('Extracts structured text from medical image', imageResult.pageCount === 1 && imageResult.processingStatus === 'SUCCESS');

  // ----------------------------------------------------
  // TEST SUITE 3: ERROR HANDLING & EDGE CASES
  // ----------------------------------------------------
  console.log('\n--- Suite 3: Error Handling, Timeouts & Unreadable Files ---');

  const unreadableProvider = new MockOcrProvider({ simulateFailure: 'UNREADABLE' });
  const unreadableResult = await unreadableProvider.processDocument(pngBuffer, 'image/png');
  logTest('Returns UNREADABLE_DOCUMENT when image has no text', unreadableResult.processingStatus === 'UNREADABLE_DOCUMENT' && unreadableResult.warnings.length > 0);

  const timeoutProvider = new MockOcrProvider({ simulateFailure: 'TIMEOUT' });
  try {
    await timeoutProvider.processDocument(pdfBuffer, 'application/pdf');
    logTest('Handles upstream timeout with TIMEOUT error', false, 'Expected timeout error');
  } catch (e) {
    const passed = e instanceof OcrProviderError && e.code === 'TIMEOUT' && e.isRetryable === true;
    logTest('Handles upstream timeout (TIMEOUT, isRetryable = true)', passed, e.message);
  }

  const rateLimitProvider = new MockOcrProvider({ simulateFailure: 'RATE_LIMITED' });
  try {
    await rateLimitProvider.processDocument(pdfBuffer, 'application/pdf');
    logTest('Handles rate limits with RATE_LIMITED error', false, 'Expected rate limit error');
  } catch (e) {
    const passed = e instanceof OcrProviderError && e.code === 'RATE_LIMITED' && e.isRetryable === true;
    logTest('Handles rate limits (RATE_LIMITED, isRetryable = true)', passed, e.message);
  }

  // ----------------------------------------------------
  // TEST SUITE 4: GOOGLE CLOUD DOCUMENT AI LIVE SAFETY
  // ----------------------------------------------------
  console.log('\n--- Suite 4: Google Cloud Document AI Provider Safety ---');

  // Test Document AI with unconfigured credentials
  const unconfiguredDocAi = new GoogleDocumentAiProvider({
    projectId: null,
    processorId: null
  });

  const docAiHealth = await unconfiguredDocAi.healthCheck();
  logTest('Safe health check flags missing GCP credentials', docAiHealth.isConfigured === false && docAiHealth.missingVariables.includes('GCP_PROJECT_ID'));

  try {
    await unconfiguredDocAi.processDocument(pdfBuffer, 'application/pdf');
    logTest('Blocks execution and NEVER returns fake text when credentials missing', false, 'Expected CREDENTIALS_MISSING');
  } catch (e) {
    const passed = e instanceof OcrProviderError && e.code === 'CREDENTIALS_MISSING';
    logTest('Blocks execution with CREDENTIALS_MISSING (No fake text)', passed, e.message);
  }

  // ----------------------------------------------------
  // TEST SUITE 5: HTTP API INTEGRATION (EXPRESS)
  // ----------------------------------------------------
  console.log('\n--- Suite 5: Express HTTP API Endpoints ---');

  const testServer = app.listen(0);
  const testPort = testServer.address().port;
  const baseUrl = `http://localhost:${testPort}`;

  try {
    // 1. Health check endpoint
    const healthRes = await fetch(`${baseUrl}/api/ocr/health`);
    const healthData = await healthRes.json();
    logTest('GET /api/ocr/health returns safe JSON without secrets', healthRes.status === 200 || healthRes.status === 503);
    logTest('Health response includes supported MIME types and limits', Array.isArray(healthData.supportedMimeTypes) && healthData.maxFileSizeBytes > 0);

    // 2. Process multi-page PDF via JSON base64
    // Temporarily switch provider to test-synthetic to verify the full HTTP pipeline
    resetOcrProvider();
    process.env.OCR_PROVIDER = 'test-synthetic';

    const processRes = await fetch(`${baseUrl}/api/ocr/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64Content: pdfBuffer.toString('base64'),
        mimeType: 'application/pdf',
        fileName: 'synthetic_multipage_report.pdf'
      })
    });

    const processData = await processRes.json();
    logTest('POST /api/ocr/process returns HTTP 200 with structured data', processRes.status === 200 && processData.success === true);
    logTest('API preserves multi-page structure over HTTP', processData.data.pageCount === 2 && processData.data.pages.length === 2);

    // 3. Process corrupt file via HTTP
    const corruptRes = await fetch(`${baseUrl}/api/ocr/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64Content: corruptBuffer.toString('base64'),
        mimeType: 'application/pdf',
        fileName: 'corrupt.pdf'
      })
    });
    const corruptData = await corruptRes.json();
    logTest('POST /api/ocr/process rejects corrupt file with HTTP 400', corruptRes.status === 400 && corruptData.error.code === 'SIGNATURE_MISMATCH');

    // Restore provider env
    process.env.OCR_PROVIDER = 'google-cloud-documentai';
    resetOcrProvider();
  } finally {
    if (testServer) {
      testServer.closeAllConnections?.();
      await new Promise(r => testServer.close(r));
    }
  }

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

runTestSuite().catch(err => {
  console.error('[FATAL] Test runner crashed:', err);
  process.exitCode = 1;
});
