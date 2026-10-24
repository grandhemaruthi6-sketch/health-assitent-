import { PDFParse } from 'pdf-parse';
import { createWorker } from 'tesseract.js';

const MIN_EMBEDDED_TEXT_CHARS = 20;
const MAX_SCANNED_PDF_PAGES = 10;

function hasUsefulText(pages) {
  return pages.some(page => (page.text || '').trim().length > MIN_EMBEDDED_TEXT_CHARS);
}

async function recognizeImageBuffers(images) {
  if (!Array.isArray(images) || images.length === 0) return [];
  let worker;
  const results = [];
  try {
    worker = await createWorker('eng', 1, {
      logger: () => {},
      errorHandler: error => console.warn('[Tesseract OCR] Worker error:', error?.message || error)
    });
    for (const image of images) {
      if (!image?.data) continue;
      const data = Buffer.isBuffer(image.data) ? image.data : Buffer.from(image.data);
      const result = await worker.recognize(data);
      const text = (result?.data?.text || '').trim();
      results.push({
        pageNumber: image.pageNumber || results.length + 1,
        text,
        confidence: Number.isFinite(result?.data?.confidence)
          ? Math.max(0, Math.min(1, result.data.confidence / 100))
          : null,
        source: 'tesseract.js'
      });
    }
  } finally {
    if (worker) {
      try { await worker.terminate(); } catch (_) {}
    }
  }
  return results;
}

/**
 * Extract text from a PDF. Text-native PDFs use pdf-parse first; when
 * ocrScannedPdf is enabled, blank/scanned pages are rendered as PNG and
 * recognized locally with Tesseract.js. No cloud OCR API is called.
 * At most 10 scanned pages are OCRed per request to bound resource use.
 */
export async function extractTextFromRealPdf(buffer, { ocrScannedPdf = false } = {}) {
  let parsedPages = [];
  let parser;
  try {
    parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    if (parsed && Array.isArray(parsed.pages)) {
      parsedPages = parsed.pages.map((page, index) => ({
        pageNumber: Number(page.num || page.pageNumber || index + 1),
        text: (page.text || '').trim(),
        confidence: null,
        source: 'pdf-parse'
      }));
    }
  } catch (error) {
    console.warn('[Local PDF OCR] Text-layer extraction failed:', error?.message || error);
  } finally {
    if (parser) {
      try { await parser.destroy(); } catch (_) {}
    }
  }

  if (!hasUsefulText(parsedPages)) {
    try {
      const { extractTextFromPdfBuffer } = await import('./pdfTextExtractor.js');
      const fallbackPages = await extractTextFromPdfBuffer(buffer);
      if (Array.isArray(fallbackPages) && hasUsefulText(fallbackPages)) {
        parsedPages = fallbackPages.map((page, index) => ({
          pageNumber: Number(page.pageNumber || index + 1),
          text: (page.text || '').trim(),
          confidence: null,
          source: 'pdf-lib'
        }));
      }
    } catch (error) {
      // Scanned/image-only PDFs commonly have no embedded text streams.
    }
  }

  if (!ocrScannedPdf) {
    return hasUsefulText(parsedPages)
      ? parsedPages.filter(page => (page.text || '').trim().length > 0)
      : [];
  }

  const usablePages = parsedPages.filter(page => (page.text || '').trim().length > MIN_EMBEDDED_TEXT_CHARS);
  const requestedPages = parsedPages.length > 0
    ? parsedPages
        .filter(page => (page.text || '').trim().length <= MIN_EMBEDDED_TEXT_CHARS)
        .map(page => page.pageNumber)
        .filter(pageNumber => Number.isInteger(pageNumber) && pageNumber > 0)
        .slice(0, MAX_SCANNED_PDF_PAGES)
    : null;

  if (parsedPages.length > 0 && requestedPages.length === 0 && usablePages.length === parsedPages.length) {
    return parsedPages.filter(page => (page.text || '').trim().length > 0);
  }

  let screenshotParser;
  let screenshotResult;
  try {
    screenshotParser = new PDFParse({ data: buffer });
    const renderOptions = { scale: 1.5, imageDataUrl: false, imageBuffer: true };
    screenshotResult = requestedPages && requestedPages.length > 0
      ? await screenshotParser.getScreenshot({ ...renderOptions, partial: requestedPages })
      : await screenshotParser.getScreenshot({ ...renderOptions, first: MAX_SCANNED_PDF_PAGES });
  } catch (error) {
    console.warn('[Local PDF OCR] Could not render scanned PDF pages:', error?.message || error);
    return parsedPages.filter(page => (page.text || '').trim().length > 0);
  } finally {
    if (screenshotParser) {
      try { await screenshotParser.destroy(); } catch (_) {}
    }
  }

  const renderedImages = (screenshotResult?.pages || [])
    .map((page, index) => ({
      pageNumber: Number(requestedPages?.[index] || page.pageNumber || page.num || index + 1),
      data: page.data || page.imageBuffer || page.buffer
    }))
    .filter(page => page.data);

  let scannedPages = [];
  try {
    scannedPages = await recognizeImageBuffers(renderedImages);
  } catch (error) {
    console.warn('[Local PDF OCR] Tesseract failed to recognize rendered pages:', error?.message || error);
    return parsedPages.filter(page => (page.text || '').trim().length > 0);
  }

  const byPage = new Map(parsedPages.map(page => [page.pageNumber, page]));
  for (const scanned of scannedPages) {
    if (!scanned.text) continue;
    const existing = byPage.get(scanned.pageNumber);
    if (!existing || (existing.text || '').trim().length <= MIN_EMBEDDED_TEXT_CHARS) {
      byPage.set(scanned.pageNumber, scanned);
    }
  }
  return Array.from(byPage.values())
    .filter(page => (page.text || '').trim().length > 0)
    .sort((left, right) => left.pageNumber - right.pageNumber);
}

/**
 * Extract text from a real image locally with Tesseract.js.
 */
export async function extractTextFromImage(buffer, mimeType) {
  if (!buffer || buffer.length < 500) return '';
  try {
    const pages = await recognizeImageBuffers([{ pageNumber: 1, data: buffer, mimeType }]);
    return (pages[0]?.text || '').trim();
  } catch (error) {
    console.warn('[Local Image OCR] Tesseract failed:', error?.message || error);
    return '';
  }
}

/**
 * Scanned-PDF OCR is opt-in so test-synthetic mode keeps its lightweight behavior;
 * the real local provider enables it.
 */
export async function extractTextFromDocument(buffer, mimeType, { ocrScannedPdf = false } = {}) {
  if (!buffer || buffer.length < 10) return [];
  const mime = (mimeType || '').toLowerCase();
  if (mime === 'application/pdf') {
    return extractTextFromRealPdf(buffer, { ocrScannedPdf });
  }
  if (mime.startsWith('image/')) {
    const text = await extractTextFromImage(buffer, mime);
    if (!text) return [];
    return [{ pageNumber: 1, text, confidence: null, source: 'tesseract.js' }];
  }
  return [];
}
