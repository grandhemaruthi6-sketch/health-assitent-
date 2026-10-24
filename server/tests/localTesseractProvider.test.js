import test from 'node:test';
import assert from 'node:assert/strict';
import { TesseractLocalProvider } from '../services/ocr/tesseractLocalProvider.js';
import { getOcrProvider, resetOcrProvider } from '../services/ocr/ocrFactory.js';
import { OcrProviderError } from '../services/ocr/ocrProvider.js';

const pdfBuffer = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(80, 0)]);
const readablePage = {
  pageNumber: 1,
  text: 'Apollo Hospital\nComplete Blood Count\nHemoglobin: 13.2 g/dL\nWBC: 8.1 K/uL',
  confidence: 0.91,
  source: 'tesseract.js'
};

test('local provider reports ready without Google Cloud credentials', async () => {
  const provider = new TesseractLocalProvider({ extractor: async () => [readablePage] });
  const health = await provider.healthCheck();
  assert.equal(health.isConfigured, true);
  assert.equal(health.provider, 'tesseract-local');
  assert.equal(health.authStatus, 'NOT_REQUIRED');
  assert.match(health.message, /billing are not required/i);
});

test('local provider returns structured OCR output from extracted text', async () => {
  let receivedOptions;
  const provider = new TesseractLocalProvider({
    extractor: async (_buffer, mimeType, options) => {
      receivedOptions = { mimeType, options };
      return [readablePage];
    }
  });
  const result = await provider.processDocument(pdfBuffer, 'application/pdf', { fileName: 'sample.pdf' });
  assert.equal(receivedOptions.mimeType, 'application/pdf');
  assert.equal(receivedOptions.options.ocrScannedPdf, true);
  assert.equal(result.provider, 'tesseract-local');
  assert.equal(result.processingStatus, 'SUCCESS');
  assert.equal(result.pageCount, 1);
  assert.match(result.fullText, /Hemoglobin: 13.2 g\\/dL/);
  assert.equal(result.metadata.cloudBillingRequired, false);
  assert.equal(result.pages[0].layout.lines.length, 4);
});

test('local provider fails clearly when no readable document text is detected', async () => {
  const provider = new TesseractLocalProvider({ extractor: async () => [] });
  await assert.rejects(
    () => provider.processDocument(pdfBuffer, 'application/pdf'),
    error => error instanceof OcrProviderError && error.code === 'UNREADABLE_DOCUMENT'
  );
});

test('OCR factory can select the local Tesseract provider', () => {
  const previous = process.env.OCR_PROVIDER;
  process.env.OCR_PROVIDER = 'tesseract-local';
  resetOcrProvider();
  try {
    assert.ok(getOcrProvider() instanceof TesseractLocalProvider);
  } finally {
    resetOcrProvider();
    if (previous === undefined) delete process.env.OCR_PROVIDER;
    else process.env.OCR_PROVIDER = previous;
  }
});

test('local provider still enforces MIME and file-signature validation', async () => {
  const provider = new TesseractLocalProvider({ extractor: async () => [readablePage] });
  await assert.rejects(() => provider.processDocument(Buffer.from('not a pdf document'), 'application/pdf'));
  await assert.rejects(() => provider.processDocument(Buffer.from('plain text'), 'text/plain'));
});
