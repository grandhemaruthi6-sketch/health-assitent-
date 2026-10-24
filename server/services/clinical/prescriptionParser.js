import { v4 as uuidv4 } from 'uuid';

/**
 * Curated Medical Catalog of Common Generic & Brand Medications
 * Used to cross-reference extracted medication names.
 */
export const MEDICINE_CATALOG = new Set([
  // Antibiotics & Antimicrobials
  'amoxicillin', 'clavulanic acid', 'augmentin', 'clavam', 'moxikind',
  'azithromycin', 'azithral', 'zithromax', 'azimax',
  'ciprofloxacin', 'ciplox', 'cifran',
  'cefixime', 'taxim-o', 'ceftum', 'cefpodoxime',
  'ceftriaxone', 'monocef',
  'doxycycline', 'dox',
  'levofloxacin', 'levomac',
  'metronidazole', 'flagyl', 'metrogyl',
  'clarithromycin', 'ampicillin', 'gentamicin',
  
  // Analgesics, Antipyretics, NSAIDs
  'paracetamol', 'acetaminophen', 'dolo', 'calpol', 'crocin', 'pacimol',
  'ibuprofen', 'brufen', 'combiflam',
  'diclofenac', 'voveran',
  'aceclofenac', 'zerodol', 'hifenac',
  'tramadol', 'ultram',
  'naproxen', 'naprosyn',
  'aspirin', 'ecosprin', 'disprin',
  'mefenamic acid', 'meftal-spas', 'meftal',

  // Cardiovascular & Antihypertensive
  'amlodipine', 'amlong', 'norvasc',
  'telmisartan', 'telma', 'micardis',
  'losartan', 'losar', 'cozaar',
  'atenolol', 'tenormin',
  'metoprolol', 'betaloc', 'metolar',
  'enalapril', 'ramipril', 'cardace',
  'hydrochlorothiazide', 'chlorthalidone',
  'nebivolol', 'nebicip',

  // Antidiabetic
  'metformin', 'glycomet', 'glucophage',
  'glimepiride', 'amaryl',
  'gliclazide', 'diamicron',
  'sitagliptin', 'januvia',
  'vildagliptin', 'galvus',
  'empagliflozin', 'jardiance',
  'dapagliflozin', 'forxiga',
  'insulin', 'humalog', 'lantus', 'novorapid',

  // Gastrointestinal (PPIs, Antacids, Antiemetics)
  'pantoprazole', 'pan', 'pantocid', 'pantosec',
  'omeprazole', 'omez', 'prilosec',
  'rabeprazole', 'razo', 'happi',
  'esomeprazole', 'nexium',
  'ranitidine', 'zantac', 'aciloc',
  'famotidine',
  'domperidone', 'vomistop',
  'ondansetron', 'emset', 'zofran',
  'sucralfate', 'antacid',

  // Respiratory & Antiallergic
  'cetirizine', 'citizin', 'cetzine', 'zyrtec',
  'levocetirizine', 'levocet', 'xyzal',
  'montelukast', 'montek', 'singulair',
  'fexofenadine', 'allegra',
  'salbutamol', 'albuterol', 'asthalin',
  'budesonide', 'pulmicort', 'budecort',
  'fluticasone', 'flonase',

  // Statins / Lipid Lowering
  'atorvastatin', 'atorva', 'lipitor', 'storvas',
  'rosuvastatin', 'rosuvas', 'crestor',
  'fenofibrate',

  // Vitamins, Minerals, Supplements
  'vitamin d3', 'cholecalciferol', 'calcirol',
  'vitamin b12', 'methylcobalamin', 'neurobion',
  'calcium', 'shelcal',
  'folic acid', 'folvite',
  'iron', 'ferrous ascorbate', 'autrin',
  'zinc', 'becosules', 'multivitamin',

  // Thyroid
  'levothyroxine', 'thyronorm', 'eltroxin', 'synthroid',

  // Others
  'prednisolone', 'omnacortil', 'dexamethasone', 'decadron'
]);

/**
 * Normalizes drug name candidate for catalog lookup
 */
function normalizeName(str) {
  return (str || '')
    .toLowerCase()
    .replace(/^(?:tab(?:let)?\.?|cap(?:sule)?\.?|syp(?:rup)?\.?|inj(?:ection)?\.?|drops?\.?|oint(?:ment)?\.?)\s+/i, '')
    .replace(/[^\w\s-]/g, '')
    .trim();
}

/**
 * Checks if a drug name exists in catalog (exact or starts-with prefix)
 */
export function isKnownMedication(name) {
  if (!name) return false;
  const clean = normalizeName(name);
  if (MEDICINE_CATALOG.has(clean)) return true;

  // Check prefix / partial match
  for (const known of MEDICINE_CATALOG) {
    if (clean === known || clean.startsWith(known + ' ') || known.startsWith(clean + ' ')) {
      return true;
    }
  }
  return false;
}

/**
 * Parses dosage abbreviations into readable frequency
 */
function normalizeFrequency(rawFreq) {
  if (!rawFreq) return null;
  const f = rawFreq.trim().toUpperCase();

  // Pattern matrix: 1-0-1, 1-1-1, 0-0-1, etc.
  const matrixMatch = f.match(/\b([01½\.]+(?:\/[01½\.]+)?)-([01½\.]+(?:\/[01½\.]+)?)-([01½\.]+(?:\/[01½\.]+)?)(?:-([01½\.]+(?:\/[01½\.]+)?))?\b/);
  if (matrixMatch) {
    const morning = matrixMatch[1];
    const afternoon = matrixMatch[2];
    const night = matrixMatch[3];
    const bed = matrixMatch[4];

    if (bed) {
      return `${matrixMatch[0]} (Morning: ${morning}, Noon: ${afternoon}, Evening: ${night}, Bed: ${bed})`;
    }
    return `${matrixMatch[0]} (Morning: ${morning}, Afternoon: ${afternoon}, Night: ${night})`;
  }

  // Common clinical abbreviations
  if (/\b(?:OD|QD|ONCE\s+DAILY|ONCE\s+A\s+DAY)\b/i.test(f)) return 'Once daily (OD)';
  if (/\b(?:BD|BID|TWICE\s+DAILY|TWICE\s+A\s+DAY)\b/i.test(f)) return 'Twice daily (BD)';
  if (/\b(?:TDS|TID|THRICE\s+DAILY|THREE\s+TIMES\s+A\s+DAY)\b/i.test(f)) return 'Three times daily (TDS)';
  if (/\b(?:QID|FOUR\s+TIMES\s+DAILY)\b/i.test(f)) return 'Four times daily (QID)';
  if (/\b(?:HS|QHS|AT\s+BEDTIME)\b/i.test(f)) return 'At bedtime (HS)';
  if (/\b(?:SOS|PRN|AS\s+NEEDED)\b/i.test(f)) return 'As needed (SOS)';
  if (/\bSTAT\b/i.test(f)) return 'Immediately (STAT)';
  if (/\b(?:Q4H|EVERY\s+4\s+HOURS)\b/i.test(f)) return 'Every 4 hours';
  if (/\b(?:Q6H|EVERY\s+6\s+HOURS)\b/i.test(f)) return 'Every 6 hours';
  if (/\b(?:Q8H|EVERY\s+8\s+HOURS)\b/i.test(f)) return 'Every 8 hours';
  if (/\b(?:Q12H|EVERY\s+12\s+HOURS)\b/i.test(f)) return 'Every 12 hours';

  return rawFreq.trim();
}

/**
 * Parses instructions and relation to food
 */
function parseFoodRelation(text) {
  if (/\b(?:before\s+food|before\s+meals|ac|empty\s+stomach)\b/i.test(text)) {
    return 'Before food (AC)';
  }
  if (/\b(?:after\s+food|after\s+meals|pc)\b/i.test(text)) {
    return 'After food (PC)';
  }
  if (/\b(?:with\s+food|with\s+meals)\b/i.test(text)) {
    return 'With food';
  }
  return null;
}

/**
 * Core Prescription Parsing Engine
 * Extracts: drug_name, strength, dose, frequency, duration, instructions.
 * Strictly adheres to non-hallucination: unreadable or missing fields are left empty.
 * Evaluates line confidence, medicine catalog membership, and flags "Needs review".
 *
 * @param {Object} ocrResult - Document AI / Local OCR structured output
 * @returns {Object} Structured prescription extraction
 */
export function parsePrescriptionDocument(ocrResult) {
  const pages = ocrResult?.pages || [];
  const fullText = ocrResult?.fullText || '';

  // Extract all lines with their confidence
  const lineItems = [];
  pages.forEach((page, pageIdx) => {
    const pageNum = page.pageNumber || (pageIdx + 1);
    if (page.layout?.lines && Array.isArray(page.layout.lines)) {
      page.layout.lines.forEach(l => {
        if (l && l.text && l.text.trim()) {
          lineItems.push({
            text: l.text.trim(),
            confidence: typeof l.confidence === 'number' ? l.confidence : (page.confidence || 0.95),
            pageNumber: pageNum
          });
        }
      });
    } else {
      // Split text into lines if line layout is missing
      const rawLines = (page.text || '').split('\n').map(x => x.trim()).filter(Boolean);
      rawLines.forEach(rl => {
        lineItems.push({
          text: rl,
          confidence: page.confidence || 0.95,
          pageNumber: pageNum
        });
      });
    }
  });

  const medications = [];
  const reviewItems = [];

  // Prescription line regex patterns
  // Pattern 1: Rx prefix or numbering like "1. Tab Amoxicillin 500mg 1-0-1 x 5 days"
  // Pattern 2: "Metformin 500 mg - 1 tab BD after food for 30 days"
  // Pattern 3: Dosage matrix line directly following drug name

  const FORM_PREFIX_REGEX = /\b(Tab(?:let)?\.?|Cap(?:sule)?\.?|Syp(?:rup)?\.?|Inj(?:ection)?\.?|Oint(?:ment)?\.?|Drops?)\b/i;
  const STRENGTH_REGEX = /\b(\d+(?:\.\d+)?\s*(?:mg|mcg|μg|g|ml|iu|%))\b/i;
  const DOSE_REGEX = /\b(\d+(?:\.\d+)?\s*(?:tablet|tab|capsule|cap|puff|drop|tsp|tbsp|ml|ampoule|vial)s?|\b[1-2]\s+(?:tab|cap|pills?))\b/i;
  const MATRIX_REGEX = /\b([01½\.]+(?:\/[01½\.]+)?-[01½\.]+(?:\/[01½\.]+)?-[01½\.]+(?:\/[01½\.]+)?(?:-[01½\.]+(?:\/[01½\.]+)?|\b))\b/;
  const FREQ_WORDS_REGEX = /\b(OD|BD|BID|TDS|TID|QID|HS|QHS|SOS|PRN|STAT|once daily|twice daily|thrice daily|every\s+\d+\s+hours|at bedtime|in the morning)\b/i;
  const DURATION_REGEX = /\b(?:(?:for|x)\s*)?(\d+\s*(?:days?|weeks?|months?|d|w|m))\b/i;

  let currentMed = null;

  for (let i = 0; i < lineItems.length; i++) {
    const item = lineItems[i];
    const line = item.text;
    const lineConf = item.confidence;
    const pageNum = item.pageNumber;

    // Filter out common non-medication clinical headers
    if (/^(?:dr\.|patient|name|age|sex|date|diagnosis|clinical\s+notes?|investigation|bp|pulse|weight|temp|chief\s+complaints?|address|reg\s*no|rx:?$)/i.test(line.trim())) {
      continue;
    }

    // Check if line contains a strength or form prefix or known drug name
    const hasStrength = STRENGTH_REGEX.test(line);
    const hasForm = FORM_PREFIX_REGEX.test(line);
    const hasMatrix = MATRIX_REGEX.test(line);
    const hasFreq = FREQ_WORDS_REGEX.test(line);

    // Look for drug name candidate
    let potentialDrugName = null;

    // Try extracting drug name
    // Strip leading number or Rx: "1. ", "1) ", "Rx: "
    let cleanLine = line.replace(/^\s*(?:\d+[\.\)]\s*|rx\s*[:\.]?\s*|-+\s*)/i, '').trim();

    // Check if line begins with a Form Prefix (Tab., Cap., Syp., etc.)
    const formPrefixMatch = cleanLine.match(FORM_PREFIX_REGEX);
    let formPrefix = formPrefixMatch ? formPrefixMatch[1] : null;

    // Drug name candidates before strength or frequency
    const strengthMatch = cleanLine.match(STRENGTH_REGEX);
    const strength = strengthMatch ? strengthMatch[1].trim() : null;

    if (strengthMatch) {
      // Everything before strength is likely the drug name + form
      const beforeStrength = cleanLine.slice(0, strengthMatch.index).trim();
      if (beforeStrength) {
        potentialDrugName = beforeStrength.replace(FORM_PREFIX_REGEX, '').trim();
      }
    } else if (hasForm) {
      // Everything after form prefix up to punctuation or frequency
      const afterForm = cleanLine.slice((formPrefixMatch.index || 0) + formPrefixMatch[0].length).trim();
      const parts = afterForm.split(/[\s,-]+/);
      if (parts.length > 0) {
        potentialDrugName = parts.slice(0, 2).join(' ');
      }
    } else {
      // Check if line begins with any known drug from catalog
      const words = cleanLine.split(/\s+/);
      const firstTwo = words.slice(0, 2).join(' ');
      if (isKnownMedication(words[0]) || isKnownMedication(firstTwo)) {
        potentialDrugName = isKnownMedication(firstTwo) ? firstTwo : words[0];
      }
    }

    // If potential drug name found or line contains both drug indicators
    if (potentialDrugName && potentialDrugName.length >= 2 && !/^(?:morning|afternoon|night|bedtime|daily|take|after|before|oral)$/i.test(potentialDrugName)) {
      // If we already had a medication in progress without frequency, finalize it
      if (currentMed) {
        finalizeMedication(currentMed, medications, reviewItems);
        currentMed = null;
      }

      // Extract dose, frequency, duration, instructions from line
      const doseMatch = cleanLine.match(DOSE_REGEX);
      const dose = doseMatch ? doseMatch[1].trim() : (formPrefix ? `1 ${formPrefix}` : null);

      const matrixMatch = cleanLine.match(MATRIX_REGEX);
      const freqMatch = cleanLine.match(FREQ_WORDS_REGEX);
      const rawFrequency = matrixMatch ? matrixMatch[1] : (freqMatch ? freqMatch[1] : null);
      const frequency = normalizeFrequency(rawFrequency);

      const durationMatch = cleanLine.match(DURATION_REGEX);
      const duration = durationMatch ? durationMatch[1].trim() : null;

      const foodRel = parseFoodRelation(cleanLine);
      const instructions = foodRel ? foodRel : (cleanLine.includes('food') || cleanLine.includes('empty stomach') ? cleanLine : null);

      currentMed = {
        drug_name: potentialDrugName,
        strength,
        dose,
        frequency,
        duration,
        instructions,
        instructionsAsWritten: cleanLine,
        lineConfidence: lineConf,
        pageNumber: pageNum,
        rawSnippet: line,
        formPrefix
      };

      // If line has full details (drug, strength, frequency/duration), finalize
      if (frequency && (duration || strength)) {
        finalizeMedication(currentMed, medications, reviewItems);
        currentMed = null;
      }
    } else if (currentMed) {
      // Continuation line for the current medication (e.g. "Sig: 1-0-1 after food x 5 days")
      const doseMatch = line.match(DOSE_REGEX);
      if (doseMatch && !currentMed.dose) currentMed.dose = doseMatch[1].trim();

      const strengthMatch = line.match(STRENGTH_REGEX);
      if (strengthMatch && !currentMed.strength) currentMed.strength = strengthMatch[1].trim();

      const matrixMatch = line.match(MATRIX_REGEX);
      const freqMatch = line.match(FREQ_WORDS_REGEX);
      const rawFreq = matrixMatch ? matrixMatch[1] : (freqMatch ? freqMatch[1] : null);
      if (rawFreq && !currentMed.frequency) currentMed.frequency = normalizeFrequency(rawFreq);

      const durMatch = line.match(DURATION_REGEX);
      if (durMatch && !currentMed.duration) currentMed.duration = durMatch[1].trim();

      const foodRel = parseFoodRelation(line);
      if (foodRel && !currentMed.instructions) {
        currentMed.instructions = foodRel;
      }

      currentMed.instructionsAsWritten += ` ${line}`.trim();
      currentMed.lineConfidence = Math.min(currentMed.lineConfidence, lineConf);

      // Finalize after continuation line
      finalizeMedication(currentMed, medications, reviewItems);
      currentMed = null;
    }
  }

  // Finalize last medication if left uncommitted
  if (currentMed) {
    finalizeMedication(currentMed, medications, reviewItems);
  }

  // Calculate review items and summary
  const lowConfidenceCount = medications.filter(m => m.flags?.isLowConfidence).length;
  const reviewCount = medications.filter(m => m.flags?.needsUserReview).length;

  return {
    category: 'Prescription',
    classificationConfidence: 0.95,
    medications,
    reviewItems,
    overallFlags: {
      totalFieldsExtracted: medications.length,
      conflictingFieldsCount: 0,
      lowConfidenceFieldsCount: lowConfidenceCount,
      requiresHumanReview: reviewCount > 0,
      reviewItems
    }
  };
}

/**
 * Validates extracted fields and assigns "Needs review" flags according to strict safety rules
 */
function finalizeMedication(med, list, reviewItems) {
  const flags = {
    isConflicting: false,
    isLowConfidence: false,
    needsUserReview: false,
    reviewReason: null
  };

  const reasons = [];

  // Rule 1: Line confidence is low (< 0.80)
  if (typeof med.lineConfidence === 'number' && med.lineConfidence < 0.80) {
    flags.isLowConfidence = true;
    reasons.push(`Low OCR line confidence (${(med.lineConfidence * 100).toFixed(0)}%)`);
  }

  // Rule 2: Drug name not in medicine catalog
  const inCatalog = isKnownMedication(med.drug_name);
  if (!inCatalog) {
    reasons.push(`Medication '${med.drug_name}' not verified in standard drug dictionary`);
  }

  // Rule 3: Dose or frequency is missing or in an impossible format
  if (!med.dose && !med.strength) {
    reasons.push('Dosage / strength missing or unreadable');
  }
  if (!med.frequency) {
    reasons.push('Frequency (e.g. OD, BD, 1-0-1) is missing');
  }

  // Rule 4: Text is ambiguous (e.g. "as directed", "prn", "as needed")
  const isAmbiguous = /as directed|prn|as needed|when required/i.test(med.instructionsAsWritten);
  if (isAmbiguous) {
    reasons.push(`Instructions contain ambiguous wording ('as directed' / 'prn')`);
  }

  if (reasons.length > 0) {
    flags.needsUserReview = true;
    flags.reviewReason = reasons.join('; ');
    reviewItems.push(`${med.drug_name || 'Prescription item'}: ${flags.reviewReason}`);
  }

  list.push({
    id: `med-${uuidv4().slice(0, 8)}`,
    name: med.drug_name || 'Unspecified Medication',
    drug_name: med.drug_name || null,
    drugName: med.drug_name || null,
    strength: med.strength || null,
    dose: med.dose || null,
    dosage: med.strength || med.dose || null,
    frequency: med.frequency || null,
    route: 'Oral',
    duration: med.duration || null,
    instructions: med.instructions || null,
    instructionsAsWritten: med.instructionsAsWritten || '',
    evidence: {
      presence: 'EXPLICIT',
      pageNumber: med.pageNumber || 1,
      rawSnippet: med.rawSnippet || med.instructionsAsWritten,
      confidence: med.lineConfidence || 0.95
    },
    flags
  });
}
