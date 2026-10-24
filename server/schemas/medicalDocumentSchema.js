import { z } from 'zod';

export const DOCUMENT_CATEGORIES = [
  'Lab Report',
  'Discharge Summary/Letter',
  'Prescription',
  'Scan/Imaging Report',
  'Doctor Consultation/Clinical Notes',
  'Vaccination Record',
  'Medical Certificate',
  'Other'
];

export const PRESENCE_TYPES = ['EXPLICIT', 'INFERRED', 'MISSING', 'UNCERTAIN'];

export const BIOMARKER_STATUSES = ['NORMAL', 'HIGH', 'LOW', 'BORDERLINE', 'CRITICAL', 'UNKNOWN'];

/**
 * Evidence snippet tracking page reference and source text
 */
export const EvidenceSchema = z.object({
  presence: z.enum(['EXPLICIT', 'INFERRED', 'MISSING', 'UNCERTAIN']),
  pageNumber: z.number().int().positive().nullable(),
  rawSnippet: z.string().nullable(),
  confidence: z.number().min(0).max(1).nullable()
});

/**
 * Flags for uncertainty, conflicting readings, or low confidence
 */
export const ReviewFlagsSchema = z.object({
  isConflicting: z.boolean().default(false),
  isLowConfidence: z.boolean().default(false),
  needsUserReview: z.boolean().default(false),
  reviewReason: z.string().nullable().default(null)
});

/**
 * Biomarker Field Schema (for Lab Reports)
 */
export const BiomarkerFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().default('General'),
  rawValue: z.string().nullable(),
  numericValue: z.number().nullable(),
  isZero: z.boolean().default(false), // Distinctly preserves value = 0 vs null
  unit: z.string().nullable(),
  referenceRange: z.object({
    low: z.number().nullable(),
    high: z.number().nullable(),
    rawRange: z.string().nullable()
  }),
  status: z.enum(['NORMAL', 'HIGH', 'LOW', 'BORDERLINE', 'CRITICAL', 'UNKNOWN']).default('UNKNOWN'),
  interpretation: z.string().nullable(),
  evidence: EvidenceSchema,
  flags: ReviewFlagsSchema,
  conflictingReadings: z.array(z.object({
    pageNumber: z.number().nullable(),
    value: z.string(),
    snippet: z.string()
  })).default([]),
  historicalReadings: z.array(z.object({
    date: z.string(),
    value: z.string(),
    numericValue: z.number().nullable(),
    unit: z.string().nullable().default(null)
  })).default([])
});

/**
 * Medication Field Schema (for Prescriptions & Discharge)
 */
export const MedicationFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  drug_name: z.string().nullable().optional(),
  drugName: z.string().nullable().optional(),
  strength: z.string().nullable().optional(),
  dose: z.string().nullable().optional(),
  dosage: z.string().nullable(),
  frequency: z.string().nullable(),
  route: z.string().nullable(), // Oral, IV, Topical, etc.
  duration: z.string().nullable(),
  instructions: z.string().nullable().optional(),
  instructionsAsWritten: z.string(),
  evidence: EvidenceSchema,
  flags: ReviewFlagsSchema
});

/**
 * Imaging Finding Schema (for Scan/Imaging Reports)
 */
export const ImagingFindingSchema = z.object({
  id: z.string(),
  modality: z.string(), // X-Ray, MRI, CT, Ultrasound
  anatomicalRegion: z.string().nullable(),
  findingText: z.string(),
  isNormal: z.boolean().nullable(),
  evidence: EvidenceSchema,
  flags: ReviewFlagsSchema
});

/**
 * Vaccination Field Schema (for Vaccination Records)
 */
export const VaccinationFieldSchema = z.object({
  id: z.string(),
  vaccineName: z.string(),
  doseNumber: z.string().nullable(),
  administrationDate: z.string().nullable(),
  lotNumber: z.string().nullable(),
  provider: z.string().nullable(),
  evidence: EvidenceSchema,
  flags: ReviewFlagsSchema
});

/**
 * General Metadata Schema
 */
export const DocumentMetadataSchema = z.object({
  facilityName: z.string().nullable(),
  clinicianName: z.string().nullable(),
  documentDate: z.string().nullable(),
  reportDate: z.string().nullable().optional(),
  visitDate: z.string().nullable().optional(),
  collectionDate: z.string().nullable().optional(),
  patientIdentifier: z.string().nullable(), // Actual ID only; patient name is separate.
  patientName: z.string().nullable().optional(),
  patientAge: z.string().nullable().optional(),
  patientSex: z.string().nullable().optional(),
  evidence: z.object({
    facility: EvidenceSchema.optional(),
    clinician: EvidenceSchema.optional(),
    date: EvidenceSchema.optional(),
    reportDate: EvidenceSchema.optional(),
    visitDate: EvidenceSchema.optional(),
    collectionDate: EvidenceSchema.optional(),
    patient: EvidenceSchema.optional(),
    patientName: EvidenceSchema.optional(),
    patientIdentifier: EvidenceSchema.optional(),
    age: EvidenceSchema.optional(),
    sex: EvidenceSchema.optional()
  })
});

/**
 * Complete Medical Document Understanding Result Schema
 */
export const MedicalDocumentAnalysisSchema = z.object({
  documentId: z.string(),
  category: z.enum([
    'Lab Report',
    'Discharge Summary/Letter',
    'Prescription',
    'Scan/Imaging Report',
    'Doctor Consultation/Clinical Notes',
    'Vaccination Record',
    'Medical Certificate',
    'Other'
  ]),
  classificationConfidence: z.number().min(0).max(1),
  classificationSignals: z.array(z.string()),
  metadata: DocumentMetadataSchema,
  
  // Specific Clinical Sections
  labResults: z.array(BiomarkerFieldSchema).default([]),
  medications: z.array(MedicationFieldSchema).default([]),
  imagingFindings: z.array(ImagingFindingSchema).default([]),
  vaccinations: z.array(VaccinationFieldSchema).default([]),
  
  // Diagnoses explicitly stated in the document
  explicitDiagnoses: z.array(z.object({
    diagnosis: z.string(),
    type: z.enum(['PRIMARY', 'SECONDARY', 'PROVISIONAL', 'HISTORICAL']),
    evidence: EvidenceSchema
  })).default([]),

  // Follow-up & Discharge Instructions as written
  followUpInstructions: z.array(z.object({
    instruction: z.string(),
    timeline: z.string().nullable(),
    evidence: EvidenceSchema
  })).default([]),

  // Uncertainty & Review Requirements
  overallFlags: z.object({
    totalFieldsExtracted: z.number().int(),
    conflictingFieldsCount: z.number().int(),
    lowConfidenceFieldsCount: z.number().int(),
    requiresHumanReview: z.boolean(),
    reviewItems: z.array(z.string())
  }),

  // Patient-facing Plain-Language Explanation
  plainLanguageSummary: z.object({
    overview: z.string(),
    keyFindings: z.array(z.string()),
    whatToAskDoctor: z.array(z.string()),
    disclaimer: z.string().default(
      'Notice: This AI explanation summarizes explicitly documented statements from your medical record. It does NOT provide a diagnosis, medical advice, or treatment recommendation. Always consult your qualified healthcare provider regarding your health.'
    )
  }),

  // Raw OCR representation for full traceability
  rawOcr: z.any().optional()
});
