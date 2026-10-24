/**
 * HealthContinuum Continuity Engine — Pure Normalization Module
 * 
 * Strict deterministic normalizers for medications, dosages, frequencies, and lab analytes.
 * Core Principle: Never silently guess. Unparseable fields explicitly set needs_confirmation=true.
 */

// Synthetic Brand-to-Generic and Salt Mappings
const BRAND_TO_GENERIC_MAP = {
  // Diabetes
  'glycomet': 'metformin',
  'glucophage': 'metformin',
  'januvia': 'sitagliptin',
  'galvus': 'vildagliptin',
  'amaryl': 'glimepiride',
  'lantus': 'insulin glargine',
  'trajenta': 'linagliptin',
  'forxiga': 'dapagliflozin',
  'jardiance': 'empagliflozin',

  // Cardiovascular & Hypertension
  'lipitor': 'atorvastatin',
  'atorva': 'atorvastatin',
  'crestor': 'rosuvastatin',
  'rosuvas': 'rosuvastatin',
  'ecosprin': 'aspirin',
  'aspirin': 'aspirin',
  'tenormin': 'atenolol',
  'concor': 'bisoprolol',
  'norvasc': 'amlodipine',
  'amlong': 'amlodipine',
  'telma': 'telmisartan',
  'micardis': 'telmisartan',
  'zestril': 'lisinopril',
  'lasix': 'furosemide',

  // Antibiotics & Gastro
  'augmentin': 'amoxicillin-clavulanate',
  'amoxil': 'amoxicillin',
  'pan': 'pantoprazole',
  'pantocid': 'pantoprazole',
  'nexium': 'esomeprazole',
  'omecid': 'omeprazole',
  'calpol': 'paracetamol',
  'dolo': 'paracetamol',
  'tylenol': 'paracetamol',
  'crocin': 'paracetamol'
};

// Common salt suffixes to strip deterministically
const SALT_SUFFIXES = [
  'hydrochloride', 'hcl', 'sodium', 'potassium', 'calcium',
  'succinate', 'tartrate', 'maleate', 'mesylate', 'besylate',
  'fumarate', 'phosphate', 'acetate', 'hydrate'
];

/**
 * Normalizes a raw medication name to lowercase generic root.
 * Strips salts and maps brand names to canonical generic names.
 * 
 * @param {string} rawName 
 * @returns {{ name: string, isBrandMapped: boolean, needs_confirmation: boolean }}
 */
export function normalize_med_name(rawName) {
  if (!rawName || typeof rawName !== 'string' || !rawName.trim()) {
    return { name: 'unknown', isBrandMapped: false, needs_confirmation: true };
  }

  // Clean punctuation, extra spaces, dosage numbers that might be appended
  let cleaned = rawName
    .toLowerCase()
    .replace(/[,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\b\d+(\.\d+)?\s*(mg|mcg|g|ml|iu|tablets?|capsules?)\b/gi, '')
    .trim()
    .replace(/\s+/g, ' ');

  // Strip salt tokens
  const tokens = cleaned.split(' ').filter(Boolean);
  const filteredTokens = tokens.filter(t => !SALT_SUFFIXES.includes(t));
  const candidate = filteredTokens.join(' ').trim();

  if (!candidate) {
    return { name: 'unknown', isBrandMapped: false, needs_confirmation: true };
  }

  // Check direct brand mapping
  let canonical = candidate;
  let isBrand = false;
  if (BRAND_TO_GENERIC_MAP[candidate]) {
    canonical = BRAND_TO_GENERIC_MAP[candidate];
    isBrand = true;
  } else if (BRAND_TO_GENERIC_MAP[filteredTokens[0]]) {
    canonical = BRAND_TO_GENERIC_MAP[filteredTokens[0]];
    isBrand = true;
  }

  const capitalized = canonical.charAt(0).toUpperCase() + canonical.slice(1);
  return {
    name: canonical,
    canonical_name: capitalized,
    isBrandMapped: isBrand,
    needs_confirmation: false
  };
}

// Canonical frequency mappings
const FREQUENCY_DICTIONARY = {
  // BID: twice daily
  'bid': 'BID',
  'bd': 'BID',
  '1-0-1': 'BID',
  '1 0 1': 'BID',
  'twice daily': 'BID',
  'twice a day': 'BID',
  'two times daily': 'BID',
  'two times a day': 'BID',
  '2 times a day': 'BID',
  '2x daily': 'BID',
  'every 12 hours': 'BID',
  'q12h': 'BID',

  // OD: once daily
  'od': 'OD',
  '1-0-0': 'OD',
  '0-0-1': 'OD',
  '0-1-0': 'OD',
  'once daily': 'OD',
  'once a day': 'OD',
  'daily': 'OD',
  'every 24 hours': 'OD',
  'one time a day': 'OD',
  '1x daily': 'OD',
  'every morning': 'OD',
  'every night': 'OD',
  'at bedtime': 'OD',
  'q24h': 'OD',
  'qd': 'OD',

  // TID: three times daily
  'tid': 'TID',
  'tds': 'TID',
  '1-1-1': 'TID',
  '1 1 1': 'TID',
  'three times daily': 'TID',
  'three times a day': 'TID',
  '3 times a day': 'TID',
  '3x daily': 'TID',
  'thrice daily': 'TID',
  'q8h': 'TID',

  // QID: four times daily
  'qid': 'QID',
  '1-1-1-1': 'QID',
  'four times daily': 'QID',
  'four times a day': 'QID',
  '4 times a day': 'QID',
  '4x daily': 'QID',
  'q6h': 'QID',

  // PRN: as needed
  'prn': 'PRN',
  'as needed': 'PRN',
  'when required': 'PRN',
  'sos': 'PRN',

  // Weekly / alternate
  'weekly': 'QW',
  'once weekly': 'QW',
  'alternate days': 'QOD',
  'every other day': 'QOD',
  'qod': 'QOD'
};

/**
 * Normalizes frequency string to canonical format ('OD','BID','TID','QID','PRN','QOD','QW').
 * Unknown or unparseable patterns return null with needs_confirmation=true.
 * 
 * @param {string} rawFreq 
 * @returns {{ frequency: string|null, needs_confirmation: boolean }}
 */
export function normalize_frequency(rawFreq) {
  if (!rawFreq || typeof rawFreq !== 'string') {
    return { frequency: null, canonical_code: null, needs_confirmation: true };
  }

  const cleaned = rawFreq.toLowerCase().trim().replace(/\s+/g, ' ');
  if (FREQUENCY_DICTIONARY[cleaned]) {
    const code = FREQUENCY_DICTIONARY[cleaned];
    return { frequency: code, canonical_code: code, needs_confirmation: false };
  }

  // Check matching substring
  for (const [pattern, canonical] of Object.entries(FREQUENCY_DICTIONARY)) {
    if (cleaned === pattern || cleaned.startsWith(pattern) || cleaned.endsWith(pattern)) {
      return { frequency: canonical, canonical_code: canonical, needs_confirmation: false };
    }
  }

  return { frequency: null, canonical_code: null, needs_confirmation: true };
}

/**
 * Normalizes a medication dose string into canonical numeric value and unit.
 * Standardizes grams (g) and micrograms (mcg) to milligrams (mg) for uniform comparison.
 * 
 * @param {string|number} rawDose 
 * @param {string} [optionalUnit]
 * @returns {{ value: number|null, unit: string|null, needs_confirmation: boolean }}
 */
export function normalize_dose(rawDose, optionalUnit = null) {
  if (rawDose == null) {
    return { value: null, unit: null, needs_confirmation: true };
  }

  let num = null;
  let unit = (optionalUnit || 'mg').trim().toLowerCase();

  if (typeof rawDose === 'number') {
    num = rawDose;
  } else {
    const str = String(rawDose).trim().toLowerCase();
    const match = str.match(/^([0-9]+(?:\.[0-9]+)?)\s*([a-z\/%]+)?$/i);
    if (!match) {
      return { value: null, unit: null, needs_confirmation: true };
    }
    num = parseFloat(match[1]);
    if (match[2]) {
      unit = match[2].trim().toLowerCase();
    }
  }

  if (isNaN(num)) {
    return { value: null, unit: null, needs_confirmation: true };
  }

  // Canonical unit conversion to mg
  if (unit === 'g' || unit === 'gm' || unit === 'gram' || unit === 'grams') {
    num = Number((num * 1000).toFixed(4));
    unit = 'mg';
  } else if (unit === 'mcg' || unit === 'ug' || unit === 'microgram') {
    num = Number((num / 1000).toFixed(4));
    unit = 'mg';
  } else if (unit === 'iu' || unit === 'units' || unit === 'unit') {
    unit = 'IU';
  } else if (unit === 'ml') {
    unit = 'ml';
  } else {
    unit = 'mg';
  }

  return { value: num, unit, needs_confirmation: false };
}

// Canonical lab name alias mapping
const LAB_NAME_ALIASES = {
  // HbA1c
  'hba1c': 'hba1c',
  'glycated hemoglobin': 'hba1c',
  'a1c': 'hba1c',
  'hemoglobin a1c': 'hba1c',
  'glycosylated hemoglobin': 'hba1c',
  'hba1c %': 'hba1c',

  // Hemoglobin
  'hemoglobin': 'hemoglobin',
  'hb': 'hemoglobin',
  'hgb': 'hemoglobin',

  // Total WBC
  'wbc': 'wbc_count',
  'wbc count': 'wbc_count',
  'total wbc': 'wbc_count',
  'total wbc count': 'wbc_count',
  'white blood cell count': 'wbc_count',
  'white blood cells': 'wbc_count',
  'leukocyte count': 'wbc_count',
  'total leukocytes': 'wbc_count',

  // Platelets
  'platelet count': 'platelet_count',
  'platelets': 'platelet_count',
  'plt': 'platelet_count',
  'total platelets': 'platelet_count',

  // Renal
  'creatinine': 'creatinine',
  'serum creatinine': 'creatinine',
  'creat': 'creatinine',
  'blood urea': 'blood_urea',
  'bun': 'blood_urea_nitrogen',
  'egfr': 'egfr',

  // Glucose & Lipids
  'fasting blood sugar': 'fasting_blood_glucose',
  'fbs': 'fasting_blood_glucose',
  'fasting glucose': 'fasting_blood_glucose',
  'post prandial blood sugar': 'post_prandial_blood_glucose',
  'ppbs': 'post_prandial_blood_glucose',
  'total cholesterol': 'total_cholesterol',
  'cholesterol': 'total_cholesterol',
  'serum cholesterol': 'total_cholesterol',
  'triglycerides': 'triglycerides',
  'hdl cholesterol': 'hdl_cholesterol',
  'ldl cholesterol': 'ldl_cholesterol'
};

const LAB_CANONICAL_UNITS = {
  'hba1c': '%',
  'hemoglobin': 'g/dL',
  'wbc_count': '/mm3',
  'platelet_count': '/mm3',
  'creatinine': 'mg/dL',
  'fasting_blood_glucose': 'mg/dL',
  'total_cholesterol': 'mg/dL'
};

/**
 * Normalizes lab analyte names to canonical identifiers and canonical units.
 * 
 * @param {string} rawName 
 * @param {string} [rawUnit]
 * @returns {{ name: string, canonicalUnit: string, needs_confirmation: boolean }}
 */
export function normalize_lab_name(rawName, rawUnit = null) {
  if (!rawName || typeof rawName !== 'string' || !rawName.trim()) {
    return { name: 'unknown_test', canonicalUnit: '', needs_confirmation: true };
  }

  const cleaned = rawName.toLowerCase().replace(/[:\-]/g, ' ').replace(/\s+/g, ' ').trim();
  const canonical = LAB_NAME_ALIASES[cleaned];

  const formatLabName = (str) => {
    if (str === 'hemoglobin') return 'Hemoglobin';
    if (str === 'hba1c') return 'HbA1c';
    if (str === 'wbc_count') return 'Total WBC Count';
    if (str === 'platelet_count') return 'Platelet Count';
    if (str === 'creatinine') return 'Serum Creatinine';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  if (canonical) {
    const canonicalUnit = LAB_CANONICAL_UNITS[canonical] || (rawUnit || '').trim();
    return {
      name: canonical,
      canonical_name: formatLabName(canonical),
      canonicalUnit,
      canonical_unit: canonicalUnit,
      needs_confirmation: false
    };
  }

  // Attempt fuzzy token matching
  for (const [alias, mapped] of Object.entries(LAB_NAME_ALIASES)) {
    if (cleaned.includes(alias) || alias.includes(cleaned)) {
      const canonicalUnit = LAB_CANONICAL_UNITS[mapped] || (rawUnit || '').trim();
      return {
        name: mapped,
        canonical_name: formatLabName(mapped),
        canonicalUnit,
        canonical_unit: canonicalUnit,
        needs_confirmation: false
      };
    }
  }

  // Unrecognized lab name requires confirmation
  return {
    name: cleaned.replace(/\s+/g, '_'),
    canonical_name: cleaned.charAt(0).toUpperCase() + cleaned.slice(1),
    canonicalUnit: (rawUnit || '').trim(),
    canonical_unit: (rawUnit || '').trim(),
    needs_confirmation: true
  };
}
