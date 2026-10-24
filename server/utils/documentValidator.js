/**
 * Document Validator for HealthCopilot AI OCR Pipeline
 * 
 * Enforces:
 * 1. MIME-type validation against allowed clinical document types.
 * 2. File size limits (default 20MB).
 * 3. File signature (magic bytes) verification to prevent MIME spoofing.
 */

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
];

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

// Known file signatures (magic bytes)
const MAGIC_NUMBERS = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
  'image/jpeg': [0xFF, 0xD8, 0xFF],            // JPEG SOI
  'image/png': [0x89, 0x50, 0x4E, 0x47],       // .PNG
  'image/webp': [0x52, 0x49, 0x46, 0x46]       // RIFF
};

export class ValidationError extends Error {
  constructor(message, code = 'INVALID_DOCUMENT') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}

/**
 * Validates document buffer, size, and declared MIME type.
 * @param {Buffer} buffer - File buffer
 * @param {string} declaredMimeType - Client declared MIME type
 * @param {number} maxSizeBytes - Optional custom size limit
 * @returns {{ isValid: boolean, mimeType: string, sizeBytes: number }}
 */
export function validateDocument(buffer, declaredMimeType, maxSizeBytes = MAX_FILE_SIZE_BYTES) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new ValidationError('Document buffer is empty or invalid.', 'EMPTY_BUFFER');
  }

  if (buffer.length === 0) {
    throw new ValidationError('Uploaded file is 0 bytes.', 'EMPTY_FILE');
  }

  if (buffer.length > maxSizeBytes) {
    const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
    const limitMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    throw new ValidationError(
      `File size (${sizeMB} MB) exceeds maximum allowed limit of ${limitMB} MB.`,
      'FILE_TOO_LARGE'
    );
  }

  const normalizedMime = (declaredMimeType || '').toLowerCase().trim();
  if (!ALLOWED_MIME_TYPES.includes(normalizedMime)) {
    throw new ValidationError(
      `Unsupported file format '${declaredMimeType}'. Supported types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      'UNSUPPORTED_FORMAT'
    );
  }

  // Magic bytes check
  const expectedMagic = MAGIC_NUMBERS[normalizedMime];
  if (expectedMagic) {
    for (let i = 0; i < expectedMagic.length; i++) {
      if (buffer[i] !== expectedMagic[i]) {
        throw new ValidationError(
          `File content signature does not match declared MIME type '${declaredMimeType}'. Possible file corruption or format spoofing.`,
          'SIGNATURE_MISMATCH'
        );
      }
    }
  }

  return {
    isValid: true,
    mimeType: normalizedMime,
    sizeBytes: buffer.length
  };
}
