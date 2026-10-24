import { getOcrProvider } from '../ocr/ocrFactory.js';
import { validateDocument } from '../../utils/documentValidator.js';
import { classifyDocument } from './documentClassifier.js';
import { extractClinicalFields, extractDocumentMetadata } from './clinicalParser.js';
import { parsePrescriptionDocument } from './prescriptionParser.js';
import { MedicalDocumentAnalysisSchema } from '../../schemas/medicalDocumentSchema.js';

export class MedicalPipelineError extends Error {
  constructor(message, code = 'MEDICAL_PIPELINE_ERROR', details = null) {
    super(message);
    this.name = 'MedicalPipelineError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Executes the complete medical document understanding pipeline:
 * Document Validation -> OCR -> Classification -> Extraction -> Validation -> Summary
 * 
 * @param {Object} input
 * @param {Buffer} [input.fileBuffer] - Raw document buffer
 * @param {string} [input.mimeType] - Document MIME type
 * @param {Object} [input.ocrResult] - Pre-processed structured OCR result
 * @param {string} [input.overrideCategory] - Optional user override
 * @param {string} [input.documentType] - 'lab_report' or 'prescription'
 * @param {string} [input.fileName] - Uploaded filename
 * @returns {Promise<import('../../schemas/medicalDocumentSchema').MedicalDocumentAnalysisSchema>}
 */
export async function processMedicalDocument({ fileBuffer, mimeType, ocrResult, overrideCategory = null, fileName = null, documentType = null }) {
  let resolvedOcr = ocrResult;
  const isPrescription = documentType === 'prescription' || overrideCategory === 'Prescription';

  // 1. If raw buffer provided, execute OCR
  if (!resolvedOcr) {
    if (!fileBuffer) {
      throw new MedicalPipelineError('No file buffer or OCR result provided to medical pipeline.', 'MISSING_INPUT');
    }

    const validated = validateDocument(fileBuffer, mimeType);
    const ocrProvider = getOcrProvider();
    resolvedOcr = await ocrProvider.processDocument(fileBuffer, validated.mimeType, {
      fileName,
      overrideCategory,
      documentType: isPrescription ? 'prescription' : (documentType || 'lab_report')
    });
  }

  const fullText = resolvedOcr.fullText || '';
  const pages = resolvedOcr.pages || [];

  // =========================================================================
  // SEPARATE PRESCRIPTION PIPELINE BRANCH (Step 2 & Step 3 & Step 5)
  // Lab reports pipeline is untouched and follows below.
  // =========================================================================
  if (isPrescription) {
    // Step 5: Failure handling for near-zero or illegible text
    if (!fullText.trim() || fullText.trim().length < 15 || resolvedOcr.processingStatus === 'UNREADABLE_DOCUMENT') {
      return {
        documentId: resolvedOcr.documentId || 'rx-doc',
        category: 'Prescription',
        classificationConfidence: 0.95,
        classificationSignals: ['USER_SELECTED_PRESCRIPTION'],
        processingStatus: 'UNREADABLE_PRESCRIPTION',
        metadata: {
          facilityName: null,
          clinicianName: null,
          documentDate: null,
          patientIdentifier: null,
          evidence: {}
        },
        labResults: [],
        medications: [],
        imagingFindings: [],
        vaccinations: [],
        explicitDiagnoses: [],
        followUpInstructions: [],
        overallFlags: {
          totalFieldsExtracted: 0,
          conflictingFieldsCount: 0,
          lowConfidenceFieldsCount: 0,
          requiresHumanReview: true,
          reviewItems: ["We couldn't read this prescription clearly. Please enter medications manually with the image displayed."]
        },
        plainLanguageSummary: {
          overview: "We couldn't read this prescription clearly.",
          keyFindings: ["Document text was illegible or too low resolution for automated extraction."],
          whatToAskDoctor: ["Please manually verify or enter the prescribed medications."],
          disclaimer: 'Notice: No prescription data could be reliably extracted.'
        },
        rawOcr: resolvedOcr
      };
    }

    // Step 3: Parse to structured fields without guessing
    const rxResult = parsePrescriptionDocument(resolvedOcr);

    // Use the same provider-independent metadata extractor as lab and imaging reports.
    const metadata = extractDocumentMetadata(fullText, resolvedOcr.pages || []);

    const plainSummary = {
      overview: `Prescription parsed with ${rxResult.medications.length} medication(s) identified.`,
      keyFindings: rxResult.medications.map(m => `${m.drug_name || m.name}: ${m.strength || m.dose || ''} ${m.frequency || ''}`.trim()).filter(Boolean),
      whatToAskDoctor: rxResult.reviewItems.length > 0
        ? rxResult.reviewItems.map(item => `Clarify: ${item}`)
        : ['Confirm dosage and schedule with your prescribing physician or pharmacist.'],
      disclaimer: 'Notice: This AI explanation summarizes explicitly documented statements from your medical record. It does NOT provide medical advice. Always consult your qualified healthcare provider.'
    };

    const prescriptionAnalysis = {
      documentId: resolvedOcr.documentId || 'rx-doc',
      category: 'Prescription',
      classificationConfidence: 0.95,
      classificationSignals: ['USER_SELECTED_PRESCRIPTION'],
      metadata,
      labResults: [],
      medications: rxResult.medications,
      imagingFindings: [],
      vaccinations: [],
      explicitDiagnoses: [],
      followUpInstructions: [],
      overallFlags: rxResult.overallFlags,
      plainLanguageSummary: plainSummary,
      rawOcr: resolvedOcr
    };

    try {
      return MedicalDocumentAnalysisSchema.parse(prescriptionAnalysis);
    } catch (zodErr) {
      console.warn('[Prescription Pipeline] Validation warning:', zodErr.errors);
      return prescriptionAnalysis;
    }
  }

  // =========================================================================
  // EXISTING LAB REPORT / GENERAL PIPELINE (UNTOUCHED)
  // =========================================================================

  // Check if OCR produced unreadable document
  if (!fullText.trim() || resolvedOcr.processingStatus === 'UNREADABLE_DOCUMENT') {
    return {
      documentId: resolvedOcr.documentId,
      category: 'Other',
      classificationConfidence: 0.1,
      classificationSignals: ['EMPTY_OR_UNREADABLE_TEXT'],
      metadata: {
        facilityName: null,
        clinicianName: null,
        documentDate: null,
        patientIdentifier: null,
        evidence: {}
      },
      labResults: [],
      medications: [],
      imagingFindings: [],
      vaccinations: [],
      explicitDiagnoses: [],
      followUpInstructions: [],
      overallFlags: {
        totalFieldsExtracted: 0,
        conflictingFieldsCount: 0,
        lowConfidenceFieldsCount: 0,
        requiresHumanReview: true,
        reviewItems: ['Document contained zero legible text. Please upload a higher resolution document.']
      },
      plainLanguageSummary: {
        overview: 'No readable medical text could be extracted from this document.',
        keyFindings: [],
        whatToAskDoctor: ['Please re-upload a clear copy of this medical record.'],
        disclaimer: 'Notice: No clinical data could be extracted.'
      }
    };
  }

  // 2. Classify Document Category
  const classification = classifyDocument(fullText, pages);
  const finalCategory = overrideCategory || classification.category;

  // 3. Extract Clinical Structured Fields & Uncertainty
  const rawAnalysis = extractClinicalFields(resolvedOcr, finalCategory);

  // Preserve classification details
  rawAnalysis.classificationConfidence = classification.confidence;
  rawAnalysis.classificationSignals = classification.signals;
  rawAnalysis.rawOcr = resolvedOcr;

  // 4. Validate output through strict Zod schema
  try {
    const validatedAnalysis = MedicalDocumentAnalysisSchema.parse(rawAnalysis);
    return validatedAnalysis;
  } catch (zodError) {
    console.error('[MedicalPipelineService] Schema validation failed:', zodError.errors);
    throw new MedicalPipelineError(
      'Extracted clinical data failed schema validation.',
      'SCHEMA_VALIDATION_FAILED',
      zodError.errors
    );
  }
}
