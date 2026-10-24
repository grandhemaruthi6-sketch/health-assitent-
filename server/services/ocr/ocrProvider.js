/**
 * Abstract OCR Provider Interface
 * 
 * Any OCR engine (Google Cloud Document AI, AWS Textract, Azure Document Intelligence,
 * Tesseract, etc.) must implement this contract to ensure interchangeable integration.
 */

export class OcrProviderError extends Error {
  constructor(message, code = 'OCR_PROVIDER_ERROR', details = null, isRetryable = false) {
    super(message);
    this.name = 'OcrProviderError';
    this.code = code;
    this.details = details;
    this.isRetryable = isRetryable;
  }
}

/**
 * Standard Structured OCR Output Schema
 * @typedef {Object} OcrPage
 * @property {number} pageNumber - 1-indexed page number
 * @property {string} text - Clean extracted text for this page
 * @property {number|null} confidence - Average OCR confidence score (0.0 to 1.0)
 * @property {Object} layout - Layout details (paragraphs, lines, tokens, tables, formFields)
 * 
 * @typedef {Object} StructuredOcrResult
 * @property {string} documentId - Unique UUID for this processing job
 * @property {string} provider - Provider identifier (e.g. 'google-cloud-documentai')
 * @property {string} processingStatus - 'SUCCESS' | 'PARTIAL_SUCCESS' | 'UNREADABLE_DOCUMENT' | 'FAILED'
 * @property {number} pageCount - Total number of pages processed
 * @property {string} fullText - Complete concatenated text
 * @property {OcrPage[]} pages - Per-page details preserving layout & boundaries
 * @property {Object} metadata - File size, mime type, latency in ms, processor version
 * @property {string[]} warnings - Any non-fatal warnings (e.g., low confidence on page 2)
 */

export class OcrProvider {
  /**
   * Provider identifier name
   * @type {string}
   */
  name = 'base-provider';

  /**
   * Health check and configuration status
   * @returns {Promise<{ isConfigured: boolean, provider: string, message: string, details?: Object }>}
   */
  async healthCheck() {
    throw new Error('OcrProvider.healthCheck() must be implemented by subclass.');
  }

  /**
   * Process a validated document buffer
   * @param {Buffer} buffer - Validated raw file buffer
   * @param {string} mimeType - Validated MIME type
   * @param {Object} [options] - Additional processing options
   * @returns {Promise<StructuredOcrResult>}
   */
  async processDocument(buffer, mimeType, options = {}) {
    throw new Error('OcrProvider.processDocument() must be implemented by subclass.');
  }
}
