import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { OcrProvider, OcrProviderError } from './ocrProvider.js';
import { withRetry } from '../../utils/retryHelper.js';
import { preprocessPrescriptionImage } from './imagePreprocessor.js';

export class GoogleDocumentAiProvider extends OcrProvider {
  name = 'google-cloud-documentai';

  constructor(config = {}) {
    super();
    this.projectId = config.projectId !== undefined ? config.projectId : process.env.GCP_PROJECT_ID;
    this.location = ((config.location !== undefined ? config.location : process.env.GCP_LOCATION) || 'us').toLowerCase();
    this.processorId = config.processorId !== undefined ? config.processorId : process.env.GCP_PROCESSOR_ID;
    this.prescriptionProcessorId = config.prescriptionProcessorId !== undefined ? config.prescriptionProcessorId : process.env.GCP_PRESCRIPTION_PROCESSOR_ID;
    this.credentialsPath = config.credentialsPath !== undefined ? config.credentialsPath : process.env.GOOGLE_APPLICATION_CREDENTIALS;
    this.credentialsJson = config.credentialsJson !== undefined ? config.credentialsJson : process.env.GCP_CREDENTIALS_JSON;
    this.timeoutMs = config.timeoutMs || parseInt(process.env.OCR_TIMEOUT_MS, 10) || 45000;

    this.client = null;
    this._keyFileMissing = false;
    this._resolvedKeyPath = null;
    this._initClient();
  }

  _initClient() {
    // Only construct client if basic config is present
    if (!this.projectId || !this.processorId) {
      return;
    }

    try {
      const clientOptions = {};
      // Google Cloud Document AI regional endpoint configuration
      if (this.location) {
        clientOptions.apiEndpoint = `${this.location}-documentai.googleapis.com`;
      }

      if (this.credentialsJson) {
        try {
          clientOptions.credentials = JSON.parse(this.credentialsJson);
        } catch (e) {
          console.warn('[GoogleDocumentAiProvider] Failed to parse GCP_CREDENTIALS_JSON');
        }
      } else if (this.credentialsPath) {
        const resolved = path.resolve(process.cwd(), this.credentialsPath);
        this._resolvedKeyPath = resolved;
        if (fs.existsSync(resolved)) {
          clientOptions.keyFilename = resolved;
        } else {
          // Track that the key file is configured in env but missing on disk
          this._keyFileMissing = true;
        }
      }
      // Note: If neither credentialsJson nor credentialsPath is set, client automatically uses Application Default Credentials (ADC)

      this.client = new DocumentProcessorServiceClient(clientOptions);
    } catch (err) {
      console.warn('[GoogleDocumentAiProvider] Client initialization warning:', err.message);
    }
  }

  /**
   * Health check for Document AI configuration
   */
  async healthCheck() {
    const missing = [];
    if (!this.projectId) missing.push('GCP_PROJECT_ID');
    if (!this.processorId) missing.push('GCP_PROCESSOR_ID');

    const hasAuth = !!(this.credentialsPath || this.credentialsJson || process.env.GOOGLE_APPLICATION_CREDENTIALS);
    const resolvedPath = this.credentialsPath ? path.resolve(process.cwd(), this.credentialsPath) : null;
    const keyFileExists = resolvedPath ? fs.existsSync(resolvedPath) : false;

    let authStatus = 'UNAUTHENTICATED';
    let authError = null;

    if (this.credentialsJson) {
      try {
        JSON.parse(this.credentialsJson);
        authStatus = 'AUTHENTICATED';
      } catch (e) {
        authError = 'GCP_CREDENTIALS_JSON contains invalid JSON';
      }
    } else if (this.credentialsPath) {
      if (keyFileExists) {
        authStatus = 'AUTHENTICATED';
      } else {
        authError = `Key file not found at: ${this.credentialsPath}`;
      }
    } else if (this.client && this.client.auth) {
      try {
        await this.client.auth.getClient();
        authStatus = 'AUTHENTICATED';
      } catch (err) {
        authError = 'No Application Default Credentials (ADC) or service account key configured';
      }
    }

    if (missing.length > 0) {
      return {
        isConfigured: false,
        provider: this.name,
        status: 'UNCONFIGURED',
        configurationStatus: 'UNCONFIGURED',
        message: `Missing required GCP environment variables: ${missing.join(', ')}`,
        missingVariables: missing,
        hasAuthCredentials: hasAuth,
        authStatus,
        authError,
        keyFileExists,
        processorName: null
      };
    }

    const maskedProcessor = this.processorId.length > 6
      ? `${this.processorId.slice(0, 3)}...${this.processorId.slice(-3)}`
      : '***';

    return {
      isConfigured: true,
      provider: this.name,
      status: 'CONFIGURED',
      configurationStatus: 'CONFIGURED',
      message: authStatus === 'AUTHENTICATED'
        ? 'Google Cloud Document AI provider is configured and credentials are authenticated.'
        : `Google Cloud Document AI configured with project and processor, but authentication pending: ${authError || 'Key file not found on disk'}`,
      projectId: this.projectId,
      location: this.location,
      processorIdMasked: maskedProcessor,
      processorName: `projects/${this.projectId}/locations/${this.location}/processors/${maskedProcessor}`,
      hasAuthCredentials: hasAuth,
      authStatus,
      authError,
      keyFileExists,
      hasLiveProcessingVerified: false
    };
  }

  /**
   * Process document with Document AI
   */
  async processDocument(buffer, mimeType, options = {}) {
    const startTime = Date.now();
    const documentId = options.documentId || uuidv4();

    // 1. Verify Configuration
    if (!this.projectId || !this.processorId) {
      throw new OcrProviderError(
        'Google Cloud Document AI is not configured. Missing GCP_PROJECT_ID or GCP_PROCESSOR_ID in environment variables.',
        'CREDENTIALS_MISSING',
        {
          projectIdConfigured: !!this.projectId,
          processorIdConfigured: !!this.processorId
        },
        false
      );
    }

    if (this._keyFileMissing) {
      throw new OcrProviderError(
        `Google Cloud service account key file not found at: ${this._resolvedKeyPath || this.credentialsPath}. Place your service account JSON key in this location before processing documents.`,
        'CREDENTIALS_MISSING',
        {
          keyPath: this.credentialsPath,
          resolvedPath: this._resolvedKeyPath
        },
        false
      );
    }

    if (!this.client) {
      this._initClient();
      if (!this.client) {
        throw new OcrProviderError(
          'DocumentProcessorServiceClient failed to initialize. Check authentication credentials.',
          'INITIALIZATION_FAILED',
          null,
          false
        );
      }
    }

    const isPrescription = options?.documentType === 'prescription' || options?.overrideCategory === 'Prescription';
    const effectiveProcessorId = (isPrescription && (options?.processorId || this.prescriptionProcessorId))
      ? (options?.processorId || this.prescriptionProcessorId)
      : (options?.processorId || this.processorId);

    let docBuffer = buffer;
    let prepDetails = null;

    if (isPrescription) {
      const prepRes = await preprocessPrescriptionImage(buffer, mimeType);
      docBuffer = prepRes.buffer;
      prepDetails = prepRes;
    }

    const processorName = `projects/${this.projectId}/locations/${this.location}/processors/${effectiveProcessorId}`;

    const request = {
      name: processorName,
      rawDocument: {
        content: docBuffer.toString('base64'),
        mimeType: mimeType
      }
    };

    // 2. Execute with Retry for transient errors
    let response;
    try {
      response = await withRetry(
        async () => {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(
              () => reject(new OcrProviderError(`Document AI request timed out after ${this.timeoutMs}ms`, 'TIMEOUT', null, true)),
              this.timeoutMs
            )
          );

          const apiPromise = this.client.processDocument(request);
          const [result] = await Promise.race([apiPromise, timeoutPromise]);
          return result;
        },
        {
          maxRetries: 2,
          initialDelayMs: 800,
          shouldRetry: (err) => {
            // Retry on standard gRPC transient codes: 14 (UNAVAILABLE), 4 (DEADLINE_EXCEEDED), 8 (RESOURCE_EXHAUSTED / Rate limit)
            const code = err.code || err.status;
            return code === 14 || code === 4 || code === 8 || err.code === 'TIMEOUT' || err.code === 'RATE_LIMITED';
          }
        }
      );
    } catch (err) {
      this._handleApiError(err);
    }

    // 3. Parse Document AI Result
    const document = response?.document;
    if (!document) {
      throw new OcrProviderError(
        'Document AI returned an empty response object.',
        'EMPTY_OCR_OUTPUT',
        null,
        false
      );
    }

    const fullText = document.text || '';
    if (!fullText.trim()) {
      return {
        documentId,
        provider: this.name,
        processingStatus: 'UNREADABLE_DOCUMENT',
        pageCount: document.pages?.length || 0,
        fullText: '',
        pages: [],
        metadata: {
          mimeType,
          sizeBytes: buffer.length,
          latencyMs: Date.now() - startTime,
          processorName
        },
        warnings: ['Document contained no extractable textual content. May be blank, distorted, or corrupted.']
      };
    }

    // Parse Per-Page Boundaries & Layout
    const parsedPages = (document.pages || []).map((page, index) => {
      const pageNumber = page.pageNumber || index + 1;
      const pageText = this._extractTextFromSegments(page.layout?.textAnchor, fullText);

      // Paragraphs
      const paragraphs = (page.paragraphs || []).map(p => ({
        text: this._extractTextFromSegments(p.layout?.textAnchor, fullText),
        confidence: p.layout?.confidence || null,
        boundingBox: p.layout?.boundingPoly || null
      }));

      // Lines
      const lines = (page.lines || []).map(l => ({
        text: this._extractTextFromSegments(l.layout?.textAnchor, fullText),
        confidence: l.layout?.confidence || null
      }));

      // Form fields / Key-value pairs
      const formFields = (page.formFields || []).map(ff => ({
        fieldName: this._extractTextFromSegments(ff.fieldName?.textAnchor, fullText).trim(),
        fieldValue: this._extractTextFromSegments(ff.fieldValue?.textAnchor, fullText).trim(),
        confidence: ff.fieldName?.confidence || null
      }));

      // Tables with full cell text extraction
      const tables = (page.tables || []).map(t => {
        const headers = (t.headerRows || []).flatMap(row =>
          (row.cells || []).map(c => this._extractTextFromSegments(c.layout?.textAnchor, fullText).trim())
        );
        const rows = (t.bodyRows || []).map(row =>
          (row.cells || []).map(c => this._extractTextFromSegments(c.layout?.textAnchor, fullText).trim())
        );
        return {
          rowCount: (t.headerRows?.length || 0) + (t.bodyRows?.length || 0),
          confidence: t.layout?.confidence || null,
          headers,
          rows
        };
      });

      // Detected Languages per page
      const detectedLanguages = (page.detectedLanguages || []).map(dl => ({
        languageCode: dl.languageCode,
        confidence: dl.confidence || null
      }));

      // Dimensions & Quality scores
      const dimension = page.dimension ? {
        width: page.dimension.width,
        height: page.dimension.height,
        unit: page.dimension.unit || 'pixels'
      } : null;

      const imageQualityScore = page.imageQualityScores?.qualityScore || null;

      // Compute page average confidence
      const confidences = [
        ...paragraphs.map(p => p.confidence),
        ...lines.map(l => l.confidence)
      ].filter(c => typeof c === 'number');

      const avgConfidence = confidences.length > 0
        ? parseFloat((confidences.reduce((a, b) => a + b, 0) / confidences.length).toFixed(3))
        : null;

      return {
        pageNumber,
        text: pageText || lines.map(l => l.text).join('\n'),
        confidence: avgConfidence,
        detectedLanguages,
        dimension,
        imageQualityScore,
        layout: {
          paragraphCount: paragraphs.length,
          lineCount: lines.length,
          paragraphs,
          lines,
          formFields,
          tables
        }
      };
    });

    return {
      documentId,
      provider: this.name,
      processingStatus: 'SUCCESS',
      pageCount: parsedPages.length || 1,
      fullText,
      pages: parsedPages,
      metadata: {
        mimeType,
        sizeBytes: buffer.length,
        latencyMs: Date.now() - startTime,
        processorName
      },
      warnings: []
    };
  }

  /**
   * Extracts text substring matching textAnchor segment offsets safely
   */
  _extractTextFromSegments(textAnchor, fullText) {
    if (!textAnchor || !textAnchor.textSegments || textAnchor.textSegments.length === 0) {
      return '';
    }

    return textAnchor.textSegments
      .map(segment => {
        const start = segment.startIndex != null ? parseInt(segment.startIndex, 10) : 0;
        const end = segment.endIndex != null ? parseInt(segment.endIndex, 10) : fullText.length;
        if (isNaN(start) || isNaN(end) || start < 0 || start >= fullText.length) {
          return '';
        }
        return fullText.substring(start, Math.min(end, fullText.length));
      })
      .join('');
  }

  /**
   * Normalizes Document AI gRPC and HTTP errors
   */
  _handleApiError(err) {
    const message = err.message || 'Unknown Document AI error';
    const code = err.code || err.status;

    if (code === 7 || code === 403 || message.includes('PERMISSION_DENIED')) {
      throw new OcrProviderError(
        `Document AI Permission Denied: Ensure the service account has 'roles/documentai.viewer' or 'roles/documentai.apiUser' on project '${this.projectId}'. Error: ${message}`,
        'PERMISSION_DENIED',
        { originalError: message },
        false
      );
    }

    if (code === 5 || code === 404 || message.includes('NOT_FOUND')) {
      throw new OcrProviderError(
        `Document AI Processor not found: '${this.processorId}' in location '${this.location}' does not exist or was deleted.`,
        'PROCESSOR_NOT_FOUND',
        { originalError: message },
        false
      );
    }

    if (code === 8 || code === 429 || message.includes('RESOURCE_EXHAUSTED')) {
      throw new OcrProviderError(
        'Document AI Rate limit or quota exhausted. Please retry after a brief delay.',
        'RATE_LIMITED',
        { originalError: message },
        true
      );
    }

    if (code === 3 || code === 400 || message.includes('INVALID_ARGUMENT')) {
      throw new OcrProviderError(
        `Invalid document argument provided to Document AI: ${message}`,
        'INVALID_DOCUMENT_ARGUMENT',
        { originalError: message },
        false
      );
    }

    throw new OcrProviderError(
      `Document AI request failed: ${message}`,
      'PROVIDER_ERROR',
      { originalError: message, code },
      code === 14 || code === 4
    );
  }
}
