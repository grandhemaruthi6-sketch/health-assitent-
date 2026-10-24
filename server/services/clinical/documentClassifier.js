/**
 * Document Classification Service
 * 
 * Classifies clinical OCR text into:
 * - Lab Report
 * - Discharge Summary/Letter
 * - Prescription
 * - Scan/Imaging Report
 * - Doctor Consultation/Clinical Notes
 * - Vaccination Record
 * - Medical Certificate
 * - Other
 */

const CATEGORY_SIGNALS = {
  'Lab Report': {
    strong: [
      /\b(?:pathology|laboratory|hematology|biochemistry|lipid profile|complete blood count|cbc|urinalysis|reference interval|reference range|specimen|collected on)\b/i,
      /\b(?:hemoglobin|wbc|rbc|platelets|hba1c|glucose|cholesterol|creatinine|sgot|sgpt|bilirubin|tsh)\b/i
    ],
    moderate: [
      /\b(?:test name|observed value|biological ref|diagnostic center|lab no|accession)\b/i,
      /\b(?:mg\/dl|g\/dl|mmol\/l|u\/l|fl|pg|%\b)/i
    ]
  },
  'Discharge Summary/Letter': {
    strong: [
      /\b(?:discharge summary|discharge letter|date of admission|date of discharge|hospital discharge|discharge instructions|inpatient summary)\b/i,
      /\b(?:hospital course|reason for admission|condition at discharge|discharge diagnosis|admission date|discharge date)\b/i,
      /\b(?:admission diagnosis|hospital discharge summary|inpatient discharge)\b/i
    ],
    moderate: [
      /\b(?:admitted on|discharged on|icu stay|post-op|surgical procedure|discharge medications)\b/i
    ]
  },
  'Prescription': {
    strong: [
      /\b(?:prescription|rx\b|℞|prescribed medication|sig:|take \d+(?:-\d+)? tablet|take \d+(?:-\d+)? cap)\b/i,
      /\b(?:once daily|twice daily|thrice daily|bid|tid|qid|prn|po|before food|after food|ac|pc)\b/i
    ],
    moderate: [
      /\b(?:mg\b|mcg\b|ml\b|tablets?|capsules?|syrup|ointment|drops|dispense|refills?)\b/i,
      /\b(?:metformin|atorvastatin|amoxicillin|paracetamol|pantoprazole|ibuprofen|levothyroxine)\b/i
    ]
  },
  'Scan/Imaging Report': {
    strong: [
      /\b(?:x-ray|radiology report|mri|ct scan|computed tomography|ultrasound|sonography|doppler|radiograph|scan report)\b/i,
      /\b(?:findings:|impression:|technique:|clinical indication:|contrast administered)\b/i
    ],
    moderate: [
      /\b(?:radiologist|attenuation|axial|sagittal|coronal|lesion|silhouette|bilateral lung fields)\b/i
    ]
  },
  'Doctor Consultation/Clinical Notes': {
    strong: [
      /\b(?:consultation note|clinical note|outpatient consultation|physician note|progress note|soap note)\b/i,
      /\b(?:chief complaint|history of present illness|hpi|review of systems|physical examination|assessment & plan)\b/i
    ],
    moderate: [
      /\b(?:follow up in|provisional diagnosis|vitals on arrival|bp:|pulse:|temp:)\b/i
    ]
  },
  'Vaccination Record': {
    strong: [
      /\b(?:vaccination record|immunization record|vaccine certificate|immunisation card|vaccination history)\b/i,
      /\b(?:dose \d|lot number|batch no|date of vaccination|booster dose|covid-19 vaccine|bcg|hepatitis b|mmr|polio|dtap)\b/i
    ],
    moderate: [
      /\b(?:vaccine name|administered by|route of administration|expiry date)\b/i
    ]
  },
  'Medical Certificate': {
    strong: [
      /\b(?:medical certificate|fitness certificate|sick leave certificate|to whomsoever it may concern|certified that mr|certified that ms|is suffering from)\b/i,
      /\b(?:advised rest for|unfit for duty|fit to resume duties|convalescence period)\b/i
    ],
    moderate: [
      /\b(?:registered medical practitioner|reg no|signature of medical officer)\b/i
    ]
  }
};

/**
 * Classifies document based on text content and OCR metadata
 * @param {string} fullText - Complete OCR extracted text
 * @param {Array} pages - Pages array from OCR output
 * @returns {{ category: string, confidence: number, signals: string[], rankedScores: Object }}
 */
export function classifyDocument(fullText, pages = []) {
  if (!fullText || !fullText.trim()) {
    return {
      category: 'Other',
      confidence: 0.1,
      signals: ['EMPTY_OR_UNREADABLE_DOCUMENT'],
      rankedScores: {}
    };
  }

  const scores = {};
  const signalMatches = {};

  for (const [category, patterns] of Object.entries(CATEGORY_SIGNALS)) {
    scores[category] = 0;
    signalMatches[category] = [];

    // Strong patterns (score weight: 3.5 each)
    for (const pat of patterns.strong) {
      const match = fullText.match(pat);
      if (match) {
        scores[category] += 3.5;
        signalMatches[category].push(`strong: '${match[0]}'`);
      }
    }

    // Moderate patterns (score weight: 1.5 each)
    for (const pat of patterns.moderate) {
      const match = fullText.match(pat);
      if (match) {
        scores[category] += 1.5;
        signalMatches[category].push(`moderate: '${match[0]}'`);
      }
    }
  }

  // Find category with highest score
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topCategory, topScore] = ranked[0];

  // Threshold check: need at least 3.0 points for a confident categorization
  if (topScore < 3.0) {
    return {
      category: 'Other',
      confidence: Math.min(0.45, Math.max(0.1, topScore / 10)),
      signals: ['INSUFFICIENT_CLINICAL_KEYWORDS'],
      rankedScores: scores
    };
  }

  // Normalized confidence (capped at 0.99)
  const confidence = Math.min(0.99, parseFloat((0.70 + Math.min(topScore / 18, 0.28)).toFixed(2)));

  return {
    category: topCategory,
    confidence,
    signals: signalMatches[topCategory],
    rankedScores: scores
  };
}
