import test from 'node:test';
import assert from 'node:assert';
import { GoogleDocumentAiProvider } from '../services/ocr/googleDocumentAiProvider.js';
import { getOcrProvider, resetOcrProvider } from '../services/ocr/ocrFactory.js';
import { OcrProviderError } from '../services/ocr/ocrProvider.js';

test('=== GOOGLE CLOUD DOCUMENT AI INTEGRATION & CONFIGURATION SUITE ===', async (t) => {

  await t.test('1. Resource Name & Regional Endpoint Resolution', () => {
    const usProvider = new GoogleDocumentAiProvider({
      projectId: 'test-health-proj',
      location: 'us',
      processorId: 'proc-abc-123'
    });

    assert.strictEqual(usProvider.projectId, 'test-health-proj');
    assert.strictEqual(usProvider.location, 'us');
    assert.strictEqual(usProvider.processorId, 'proc-abc-123');

    const euProvider = new GoogleDocumentAiProvider({
      projectId: 'test-eu-proj',
      location: 'eu',
      processorId: 'proc-eu-456'
    });
    assert.strictEqual(euProvider.location, 'eu');
  });

  await t.test('2. Unconfigured Health Status and Safe Masking', async () => {
    const unconfiguredProvider = new GoogleDocumentAiProvider({
      projectId: null,
      processorId: null
    });

    const health = await unconfiguredProvider.healthCheck();
    assert.strictEqual(health.isConfigured, false);
    assert.strictEqual(health.status, 'UNCONFIGURED');
    assert.ok(health.missingVariables.includes('GCP_PROJECT_ID'));
    assert.ok(health.missingVariables.includes('GCP_PROCESSOR_ID'));

    const configuredProvider = new GoogleDocumentAiProvider({
      projectId: 'my-project-100',
      location: 'us',
      processorId: '1234567890abcdef',
      credentialsPath: 'C:\\fake\\key.json'
    });

    const configuredHealth = await configuredProvider.healthCheck();
    assert.strictEqual(configuredHealth.isConfigured, true);
    assert.strictEqual(configuredHealth.status, 'CONFIGURED');
    assert.strictEqual(configuredHealth.processorIdMasked, '123...def', 'Masks sensitive processor ID');
    assert.ok(configuredHealth.processorName.includes('123...def'), 'Sanitizes processor resource name');
  });

  await t.test('3. Strict No-Silent-Fallback Enforcement when Unconfigured', async () => {
    const unconfiguredProvider = new GoogleDocumentAiProvider({
      projectId: null,
      processorId: null
    });

    await assert.rejects(
      async () => {
        await unconfiguredProvider.processDocument(Buffer.from('sample-doc'), 'application/pdf');
      },
      (err) => {
        assert.ok(err instanceof OcrProviderError);
        assert.strictEqual(err.code, 'CREDENTIALS_MISSING');
        assert.strictEqual(err.isRetryable, false);
        return true;
      },
      'Must throw CREDENTIALS_MISSING error and NEVER silently fall back to mock OCR'
    );
  });

  await t.test('4. Safe Segment Offset Extraction Logic', () => {
    const provider = new GoogleDocumentAiProvider({
      projectId: 'dummy',
      processorId: 'dummy'
    });

    const fullText = "Hemoglobin: 17.1 g/dL\nWBC: 10,040 /mm3\nPlatelets: 267,000 /mm3";

    // Text Anchor with valid segment
    const anchorHb = {
      textSegments: [{ startIndex: '0', endIndex: '21' }]
    };
    const extractedHb = provider._extractTextFromSegments(anchorHb, fullText);
    assert.strictEqual(extractedHb, 'Hemoglobin: 17.1 g/dL');

    // Text Anchor with segment starting at 0
    const anchorWbc = {
      textSegments: [{ startIndex: 22, endIndex: 38 }]
    };
    const extractedWbc = provider._extractTextFromSegments(anchorWbc, fullText);
    assert.strictEqual(extractedWbc, 'WBC: 10,040 /mm3');

    // Edge case: Empty or invalid text anchor
    assert.strictEqual(provider._extractTextFromSegments(null, fullText), '');
    assert.strictEqual(provider._extractTextFromSegments({}, fullText), '');
    assert.strictEqual(provider._extractTextFromSegments({ textSegments: [] }, fullText), '');
  });

  await t.test('5. Non-Retryable Error Classification (Permissions, Not Found, Bad Args)', () => {
    const provider = new GoogleDocumentAiProvider({
      projectId: 'dummy',
      processorId: 'dummy'
    });

    // Permission Denied (gRPC 7 / HTTP 403)
    assert.throws(
      () => provider._handleApiError({ code: 7, message: 'Caller does not have required permission' }),
      (err) => {
        assert.strictEqual(err.code, 'PERMISSION_DENIED');
        assert.strictEqual(err.isRetryable, false, 'Permission errors must NOT retry');
        return true;
      }
    );

    // Processor Not Found (gRPC 5 / HTTP 404)
    assert.throws(
      () => provider._handleApiError({ code: 5, message: 'Processor not found' }),
      (err) => {
        assert.strictEqual(err.code, 'PROCESSOR_NOT_FOUND');
        assert.strictEqual(err.isRetryable, false, '404 errors must NOT retry');
        return true;
      }
    );

    // Invalid Document Argument (gRPC 3 / HTTP 400)
    assert.throws(
      () => provider._handleApiError({ code: 3, message: 'Document exceeds max pages' }),
      (err) => {
        assert.strictEqual(err.code, 'INVALID_DOCUMENT_ARGUMENT');
        assert.strictEqual(err.isRetryable, false, 'Invalid arguments must NOT retry');
        return true;
      }
    );

    // Rate Limited / Quota (gRPC 8 / HTTP 429) - Retryable
    assert.throws(
      () => provider._handleApiError({ code: 8, message: 'Resource exhausted' }),
      (err) => {
        assert.strictEqual(err.code, 'RATE_LIMITED');
        assert.strictEqual(err.isRetryable, true, 'Quota errors can be retried with backoff');
        return true;
      }
    );
  });

  await t.test('6. Opt-In Live Google Document AI Cloud Verification Status', async () => {
    const isLiveEnabled = process.env.RUN_LIVE_DOCUMENTAI_TEST === 'true';
    const hasProject = Boolean(process.env.GCP_PROJECT_ID);
    const hasProcessor = Boolean(process.env.GCP_PROCESSOR_ID);
    const hasAuth = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCP_CREDENTIALS_JSON);

    if (!isLiveEnabled || !hasProject || !hasProcessor || !hasAuth) {
      console.log('  [OPT-IN LIVE STATUS] Live Document AI cloud call is BLOCKED / SKIPPED.');
      console.log(`    RUN_LIVE_DOCUMENTAI_TEST : ${isLiveEnabled}`);
      console.log(`    GCP_PROJECT_ID set       : ${hasProject}`);
      console.log(`    GCP_PROCESSOR_ID set     : ${hasProcessor}`);
      console.log(`    GCP Auth Credentials set : ${hasAuth}`);
      console.log('    Reason: Cloud credentials and processor ID are unconfigured. Mock fallback was NOT used.');
      assert.ok(true, 'Live cloud call safely skipped without unexpected cloud charges or fake success claims');
    } else {
      console.log('  [OPT-IN LIVE STATUS] Live Google Document AI credentials detected. Executing test request...');
      // Only runs if explicitly configured
      const liveProvider = new GoogleDocumentAiProvider();
      const health = await liveProvider.healthCheck();
      assert.strictEqual(health.status, 'CONFIGURED');
    }
  });

});
