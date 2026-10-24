import { v4 as uuidv4 } from 'uuid';
import { OcrProvider, OcrProviderError } from './ocrProvider.js';
import { extractTextFromDocument } from '../../utils/realDocumentExtractor.js';
import { validateDocument } from '../../utils/documentValidator.js';

/**
 * Production OCR provider that runs locally without Google Cloud billing.
 * PDFs use local text extraction and Tesseract.js for scanned pages; images
 * use Tesseract.js directly. This provider never calls a cloud OCR API.
 */
export class TesseractLocalProvider extends OcrProvider {
  name = 'tesseract-local';

  constructor(config = {}) {
    super();
    this.extractor = config.extractor || extractTextFromDocument;
  }

  async healthCheck() {
    return {
      isConfigured: true,
      provider: this.name,
      status: 'READY',
      configurationStatus: 'LOCAL_OCR_READY',
      message: 'Local OCR is enabled (pdf-parse + Tesseract.js). Google Cloud credentials and billing are not required.',
      hasAuthCredentials: false,
      authStatus: 'NOT_REQUIRED',
      missingVariables: [],
      hasLiveProcessingVerified: false,
      engine: 'pdf-parse+tesseract.js'
    };
  }

  async processDocument(buffer, mimeType, options = {}) {
    const startedAt = Date.now();
    const validated = validateDocument(buffer, mimeType);
    let extractedPages;
    try {
      extractedPages = await this.extractor(buffer, validated.mimeType, { ocrScannedPdf: true });
    } catch (error) {
      throw new OcrProviderError(
        'Local OCR could not read this document. Try a clearer image or a PDF with fewer pages.',
        'LOCAL_OCR_FAILED',
        { cause: error?.message || 'Unknown local OCR error' },
        false
      );
    }

    const readablePages = (Array.isArray(extractedPages) ? extractedPages : [])
      .map((page, index) => ({
        pageNumber: Number(page.pageNumber || index + 1),
        text: (page.text || '').trim(),
        confidence: Number.isFinite(page.confidence) ? page.confidence : null,
        source: page.source || (validated.mimeType === 'application/pdf' ? 'pdf-parse' : 'tesseract.js')
      }))
      .filter(page => page.text.length > 0)
      .sort((left, right) => left.pageNumber - right.pageNumber);

    if (readablePages.length === 0 || !readablePages.some(page => page.text.length >= 5)) {
      throw new OcrProviderError(
        'No readable text was detected. Try a clearer, well-lit image or a sharper PDF; local OCR may not reliably read faint or handwritten text.',
        'UNREADABLE_DOCUMENT',
        { mimeType: validated.mimeType, fileSizeBytes: buffer.length },
        false
      );
    }

    const pages = readablePages.map(page => {
      const lines = page.text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      const paragraphs = page.text.split(/\n{2,}/).map(text => text.trim()).filter(Boolean);
      const formFields = [];
      for (const line of lines) {
        const match = line.match(/^([A-Za-z][A-Za-z /()_.-]{2,35})\s*[:\-]\s*(.{2,120})$/);
        if (match) {
          formFields.push({
            fieldName: match[1].trim(),
            fieldValue: match[2].trim(),
            confidence: page.confidence
          });
        }
      }
      return {
        pageNumber: page.pageNumber,
        text: page.text,
        confidence: page.confidence,
        layout: {
          paragraphCount: paragraphs.length,
          lineCount: lines.length,
          paragraphs: paragraphs.map(text => ({ text, confidence: page.confidence })),
          lines: lines.map(text => ({ text, confidence: page.confidence })),
          formFields,
          tables: []
        },
        source: page.source
      };
    });

    const fullText = pages
      .map(page => '--- PAGE ' + page.pageNumber + ' ---\n' + page.text)
      .join('\n\n');

    return {
      documentId: options.documentId || uuidv4(),
      provider: this.name,
      processingStatus: 'SUCCESS',
      pageCount: pages.length,
      fullText,
      pages,
      metadata: {
        mimeType: validated.mimeType,
        sizeBytes: buffer.length,
        latencyMs: Date.now() - startedAt,
        processorName: 'Tesseract.js local OCR',
        cloudBillingRequired: false,
        extractionMethods: [...new Set(pages.map(page => page.source))]
      },
      warnings: []
    };
  }
}
