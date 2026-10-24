import express from 'express';
import multer from 'multer';
import { validateDocument, ValidationError, MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from '../utils/documentValidator.js';
import { getOcrProvider } from '../services/ocr/ocrFactory.js';
import { OcrProviderError } from '../services/ocr/ocrProvider.js';

export const ocrRouter = express.Router();

// Configure Multer for in-memory handling with safety bounds
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1
  }
});

/**
 * GET /api/ocr/health
 * Safe health check endpoint - checks readiness and configuration without leaking secrets.
 */
ocrRouter.get('/health', async (req, res) => {
  try {
    const provider = getOcrProvider();
    const health = await provider.healthCheck();

    const responsePayload = {
      status: health.isConfigured ? 'READY' : 'DEGRADED',
      configurationStatus: health.configurationStatus || (health.isConfigured ? 'CONFIGURED' : 'UNCONFIGURED'),
      provider: health.provider,
      message: health.message,
      hasLiveProcessingVerified: false, // Distinguishes configuration readiness from live cloud test verification
      supportedMimeTypes: ALLOWED_MIME_TYPES,
      maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
      hasAuthCredentials: health.hasAuthCredentials,
      details: {
        projectId: health.projectId || null,
        location: health.location || null,
        processorId: health.processorIdMasked || null,
        processorName: health.processorName || null,
        missingVariables: health.missingVariables || [],
        authStatus: health.authStatus || null,
        keyFileExists: typeof health.keyFileExists === 'boolean' ? health.keyFileExists : null,
        authError: health.authError || null
      }
    };

    const statusCode = health.isConfigured ? 200 : 503;
    return res.status(statusCode).json(responsePayload);
  } catch (err) {
    return res.status(500).json({
      status: 'ERROR',
      message: 'Failed to perform OCR service health check.',
      error: err.message
    });
  }
});

/**
 * POST /api/ocr/process
 * Accepts multipart file upload ('document') or raw base64 JSON payload
 */
ocrRouter.post('/process', upload.single('document'), async (req, res) => {
  const startTime = Date.now();

  try {
    let fileBuffer;
    let mimeType;
    let originalName;

    // 1. Extract file from multipart or JSON payload
    if (req.file) {
      fileBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
      originalName = req.file.originalname;
    } else if (req.body && req.body.base64Content) {
      fileBuffer = Buffer.from(req.body.base64Content, 'base64');
      mimeType = req.body.mimeType;
      originalName = req.body.fileName || 'uploaded_document';
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FILE',
          message: "No document provided. Send a multipart form with field 'document' or JSON with 'base64Content' and 'mimeType'."
        }
      });
    }

    // 2. Validate Document (MIME type, size, magic signature)
    const validated = validateDocument(fileBuffer, mimeType);

    // 3. Resolve Provider and Process
    const provider = getOcrProvider();
    const result = await provider.processDocument(fileBuffer, validated.mimeType, {
      fileName: originalName
    });

    return res.status(200).json({
      success: true,
      data: result,
      executionTimeMs: Date.now() - startTime
    });
  } catch (err) {
    // Structured error response
    if (err instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: err.code,
          message: err.message
        }
      });
    }

    if (err instanceof OcrProviderError) {
      let status = 502; // Bad Gateway
      if (err.code === 'CREDENTIALS_MISSING') status = 503; // Service Unavailable
      else if (err.code === 'RATE_LIMITED') status = 429;  // Too Many Requests
      else if (err.code === 'TIMEOUT') status = 504;       // Gateway Timeout
      else if (err.code === 'INVALID_DOCUMENT_ARGUMENT') status = 400;

      return res.status(status).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
          isRetryable: err.isRetryable,
          details: err.details
        }
      });
    }

    // Catch multer limits
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File exceeds maximum allowed size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`
        }
      });
    }

    console.error('[OCR Process Error]', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred during OCR processing.'
      }
    });
  }
});
