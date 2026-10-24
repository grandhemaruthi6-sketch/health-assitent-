import { v4 as uuidv4 } from 'uuid';

/**
 * Common Clinical Lab Biomarkers & Regex Patterns for Blood Panels (CBC, Metabolic, Lipid, Renal)
 */
const BLOOD_BIOMARKER_PATTERNS = [
  {
    name: 'Hemoglobin',
    category: 'Hematology',
    patterns: [
      /\b(?:hemoglobin|haemoglobin|hb)\b[^\d<>]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*([a-zA-Z\/%]+)?(?:\s*\(?([<>]?\s*\d+(?:[\d,.]*\d)?(?:\s*-\s*\d+(?:[\d,.]*\d)?)?)\)?)?/i
    ],
    defaultUnit: 'g/dL',
    defaultRange: { low: 12.0, high: 16.0, raw: '12.0 - 16.0' }
  },
  {
    name: 'Total WBC Count',
    category: 'Hematology',
    patterns: [
      // Explicitly reject /HPF, /hpf or microscopic qualifiers to prevent cross-matching with urinalysis
      /\b(?:total wbc count|white blood cell count|total leucocyte count(?:\s*\(tlc\))?|total leucocyte count|tlc)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*([a-zA-Z0-9\/μuL^]+)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i,
      /\bwbc(?!\s*\/\s*hpf|\s*\(microscopic)[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*(K\/uL|K\/μL|cells\/mcL|10\^3\/uL|\/cumm|\/mm3)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: 'K/uL',
    defaultRange: { low: 4.0, high: 11.0, raw: '4.0 - 11.0' }
  },
  {
    name: 'Platelet Count',
    category: 'Hematology',
    patterns: [
      /\b(?:platelet count|platelets)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*([a-zA-Z0-9\/μuL^]+)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: 'K/uL',
    defaultRange: { low: 150, high: 450, raw: '150 - 450' }
  },
  {
    name: 'RBC Count',
    category: 'Hematology',
    patterns: [
      // Explicitly reject /HPF, /hpf or microscopic qualifiers
      /\b(?:total rbc count|rbc count|red blood cell count)\b(?!\s*\/\s*hpf)[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*([a-zA-Z0-9\/μuL^]+)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i,
      /\brbc(?!\s*\/\s*hpf|\s*\(microscopic)[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*(M\/uL|M\/μL|mil\/mcL|10\^6\/uL|mil\/mm3|million\/mm3)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: 'M/uL',
    defaultRange: { low: 4.0, high: 5.5, raw: '4.0 - 5.5' }
  },
  {
    name: 'Hematocrit',
    category: 'Hematology',
    patterns: [
      /\b(?:hematocrit|hct|pcv|packed cell volume)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)\s*(%)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: '%',
    defaultRange: { low: 40.0, high: 50.0, raw: '40 - 50' }
  },
  {
    name: 'MCV',
    category: 'Hematology',
    patterns: [
      /\b(?:mean corpuscular volume|mcv)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)\s*(fL|fl)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: 'fL',
    defaultRange: { low: 82.0, high: 98.0, raw: '82 - 98' }
  },
  {
    name: 'MCH',
    category: 'Hematology',
    patterns: [
      /\b(?:mean corpuscular hemoglobin|mch)\b(?!\s*c)[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)\s*(pg)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: 'pg',
    defaultRange: { low: 27.0, high: 31.0, raw: '27 - 31' }
  },
  {
    name: 'MCHC',
    category: 'Hematology',
    patterns: [
      /\b(?:mean corpuscular hemoglobin concentration|mchc)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)\s*(g\/dL|g\/dl)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: 'g/dL',
    defaultRange: { low: 32.0, high: 36.0, raw: '32 - 36' }
  },
  {
    name: 'RDW-CV',
    category: 'Hematology',
    patterns: [
      /\b(?:rdw-cv|rdw\s*cv|rdw)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)\s*(%)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: '%',
    defaultRange: { low: 11.0, high: 16.0, raw: '11 - 16' }
  },
  {
    name: 'Neutrophils',
    category: 'Hematology',
    patterns: [
      /\b(?:neutrophils|neutrophil count|polymorphs|segs)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)\s*(%|\/mm3|K\/uL)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: '%',
    defaultRange: { low: 40.0, high: 75.0, raw: '40 - 75' }
  },
  {
    name: 'Lymphocytes',
    category: 'Hematology',
    patterns: [
      /\b(?:lymphocytes|lymphocyte count|lymphs)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)\s*(%|\/mm3|K\/uL)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: '%',
    defaultRange: { low: 15.0, high: 45.0, raw: '15 - 45' }
  },
  {
    name: 'Monocytes',
    category: 'Hematology',
    patterns: [
      /\b(?:monocytes|monocyte count|monos)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)\s*(%|\/mm3|K\/uL)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: '%',
    defaultRange: { low: 2.0, high: 12.0, raw: '2 - 12' }
  },
  {
    name: 'Eosinophils',
    category: 'Hematology',
    patterns: [
      /\b(?:eosinophils|eosinophil count|eos)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)\s*(%|\/mm3|K\/uL)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: '%',
    defaultRange: { low: 2.0, high: 6.0, raw: '2 - 6' }
  },
  {
    name: 'Basophils',
    category: 'Hematology',
    patterns: [
      /\b(?:basophils|basophil count|basos)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)\s*(%|\/mm3|K\/uL)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: '%',
    defaultRange: { low: 0.0, high: 1.0, raw: '0 - 1' }
  },
  {
    name: 'Bands',
    category: 'Hematology',
    patterns: [
      /\b(?:bands|band neutrophils|stab cells)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)\s*(%|\/mm3|K\/uL)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: '%',
    defaultRange: { low: 0.0, high: 3.0, raw: '0 - 3' }
  },
  {
    name: 'Fasting Blood Glucose',
    category: 'Metabolic',
    patterns: [
      /\b(?:fasting blood glucose|fasting blood sugar|fasting glucose|fbs)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*(mg\/dL|mmol\/L)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i,
      /\bblood glucose\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*(mg\/dL|mmol\/L)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: 'mg/dL',
    defaultRange: { low: 70, high: 99, raw: '70 - 99' }
  },
  {
    name: 'HbA1c',
    category: 'Metabolic',
    patterns: [
      /\b(?:hba1c|glycated hemoglobin|glycosylated hb)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*(%)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: '%',
    defaultRange: { low: 4.0, high: 5.6, raw: '4.0 - 5.6' }
  },
  {
    name: 'Total Cholesterol',
    category: 'Lipid Panel',
    patterns: [
      /\b(?:total cholesterol|cholesterol total)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*([a-zA-Z\/%]+)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: 'mg/dL',
    defaultRange: { low: 125, high: 200, raw: '125 - 200' }
  },
  {
    name: 'HDL Cholesterol',
    category: 'Lipid Panel',
    patterns: [
      /\b(?:hdl cholesterol|hdl)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*([a-zA-Z\/%]+)?(?:[\s:]*\(?([><]?\s*[\d.]+(?:\s*-\s*[\d.]+)?)\)?)?/i
    ],
    defaultUnit: 'mg/dL',
    defaultRange: { low: 50, high: 90, raw: '> 50' }
  },
  {
    name: 'LDL Cholesterol',
    category: 'Lipid Panel',
    patterns: [
      /\b(?:ldl cholesterol|ldl)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*([a-zA-Z\/%]+)?(?:[\s:]*\(?([><]?\s*[\d.]+(?:\s*-\s*[\d.]+)?)\)?)?/i
    ],
    defaultUnit: 'mg/dL',
    defaultRange: { low: 50, high: 100, raw: '< 100' }
  },
  {
    name: 'Triglycerides',
    category: 'Lipid Panel',
    patterns: [
      /\b(?:triglycerides|serum triglycerides)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*([a-zA-Z\/%]+)?(?:[\s:]*\(?([><]?\s*[\d.]+(?:\s*-\s*[\d.]+)?)\)?)?/i
    ],
    defaultUnit: 'mg/dL',
    defaultRange: { low: 40, high: 150, raw: '< 150' }
  },
  {
    name: 'Serum Creatinine',
    category: 'Renal',
    patterns: [
      /\b(?:serum creatinine|creatinine)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*([a-zA-Z\/%]+)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: 'mg/dL',
    defaultRange: { low: 0.6, high: 1.2, raw: '0.6 - 1.2' }
  },
  {
    name: 'Blood Urea Nitrogen',
    category: 'Renal',
    patterns: [
      /\b(?:blood urea nitrogen|bun|urea)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*([a-zA-Z\/%]+)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: 'mg/dL',
    defaultRange: { low: 7, high: 20, raw: '7 - 20' }
  },
  {
    name: 'eGFR',
    category: 'Renal',
    patterns: [
      /\b(?:egfr|estimated gfr|glomerular filtration rate)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*([a-zA-Z0-9\/^.]+)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: 'mL/min/1.73m2',
    defaultRange: { low: 60, high: 120, raw: '> 60' }
  },
  {
    name: 'Troponin I',
    category: 'Cardiac',
    patterns: [
      /\b(?:troponin i|troponin-i|troponin|cardiac troponin)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*([a-zA-Z\/]+)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: 'ng/mL',
    defaultRange: { low: 0, high: 0.04, raw: '< 0.04' }
  },
  {
    name: 'Serum Sodium',
    category: 'Electrolytes',
    patterns: [
      /\b(?:serum sodium|sodium|na\+?)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*(mEq\/L|mmol\/L)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: 'mEq/L',
    defaultRange: { low: 135, high: 145, raw: '135 - 145' }
  },
  {
    name: 'Serum Potassium',
    category: 'Electrolytes',
    patterns: [
      /\b(?:serum potassium|potassium|k\+?)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*(mEq\/L|mmol\/L)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: 'mEq/L',
    defaultRange: { low: 3.5, high: 5.0, raw: '3.5 - 5.0' }
  },
  {
    name: 'Serum Chloride',
    category: 'Electrolytes',
    patterns: [
      /\b(?:serum chloride|chloride|cl-?)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*(mEq\/L|mmol\/L)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: 'mEq/L',
    defaultRange: { low: 96, high: 106, raw: '96 - 106' }
  },
  {
    name: 'Total Bilirubin',
    category: 'Liver Function',
    patterns: [
      /\b(?:total bilirubin|bilirubin total|t\.?\s*bili)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*(mg\/dL|umol\/L)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: 'mg/dL',
    defaultRange: { low: 0.2, high: 1.2, raw: '0.2 - 1.2' }
  },
  {
    name: 'SGOT / AST',
    category: 'Liver Function',
    patterns: [
      /\b(?:sgot|ast|aspartate aminotransferase)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*(U\/L|IU\/L)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: 'U/L',
    defaultRange: { low: 10, high: 40, raw: '10 - 40' }
  },
  {
    name: 'SGPT / ALT',
    category: 'Liver Function',
    patterns: [
      /\b(?:sgpt|alt|alanine aminotransferase)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*(U\/L|IU\/L)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: 'U/L',
    defaultRange: { low: 7, high: 56, raw: '7 - 56' }
  },
  {
    name: 'Alkaline Phosphatase',
    category: 'Liver Function',
    patterns: [
      /\b(?:alkaline phosphatase|alp)\b[\s:()]*?([<>]?\s*-?\d+(?:,\d+)*(?:\.\d+)?|\d+\s*-\s*\d+)[\s:]*(U\/L|IU\/L)?(?:[\s:]*\(?([<>]?\s*[\d,.]+(?:\s*-\s*[\d,.]+)?)\)?)?/i
    ],
    defaultUnit: 'U/L',
    defaultRange: { low: 44, high: 147, raw: '44 - 147' }
  }
];

/**
 * Dedicated Clinical Urinalysis Biomarkers & Patterns
 * Strictly captures physical, chemical, and microscopic urine indicators only when present.
 */
const URINALYSIS_BIOMARKER_PATTERNS = [
  {
    name: 'Specific Gravity',
    category: 'Urinalysis',
    patterns: [
      /\b(?:specific gravity|sp\.?\s*gravity|sp\.?\s*gr\.?|s\.g\.?)\b[\s:()]*?([1-9]\.\d{2,4})(?:[\s:]*\(?([1-9]\.\d{2,4}\s*-\s*[1-9]\.\d{2,4})\)?)?/i
    ],
    defaultUnit: null,
    defaultRange: { low: 1.005, high: 1.030, raw: '1.005 - 1.030' },
    isQualitative: false
  },
  {
    name: 'Urine pH',
    category: 'Urinalysis',
    patterns: [
      /\b(?:urine\s+ph|reaction\s*\/\s*ph|ph\s*\(urine\))\b[\s:()]*?([\d.]+)(?:[\s:]*\(?([\d.]+\s*-\s*[\d.]+)\)?)?/i,
      /(?:urinalysis|physical examination|chemical examination)[\s\S]*?\bph\b[\s:()]*?([\d.]+)(?:[\s:]*\(?([\d.]+\s*-\s*[\d.]+)\)?)?/i
    ],
    defaultUnit: 'pH',
    defaultRange: { low: 5.0, high: 8.0, raw: '5.0 - 8.0' },
    isQualitative: false
  },
  {
    name: 'Urine Protein',
    category: 'Urinalysis',
    patterns: [
      /\b(?:urine\s+protein|protein\s*\(urine\)|albumin\s*\(urine\))\b[\s:()]*?(negative|nil|absent|trace|normal|\d+\+|[\d.]+\s*mg\/dl)(?:[\s:]*\(?([^\n\r()]+)\)?)?/i,
      /(?:chemical examination|urinalysis|dipstick)[\s\S]*?\bprotein\b[\s:()]*?(negative|nil|absent|trace|normal|\d+\+|[\d.]+\s*mg\/dl)(?:[\s:]*\(?([^\n\r()]+)\)?)?/i
    ],
    defaultUnit: null,
    defaultRange: { low: null, high: null, raw: 'Negative' },
    isQualitative: true
  },
  {
    name: 'Urine Glucose',
    category: 'Urinalysis',
    patterns: [
      /\b(?:urine\s+glucose|glucose\s*\(urine\)|urine\s+sugar|sugar\s*\(urine\))\b[\s:()]*?(negative|nil|absent|normal|trace|\d+\+|[\d.]+\s*mg\/dl)(?:[\s:]*\(?([^\n\r()]+)\)?)?/i,
      /(?:chemical examination|urinalysis|dipstick)[\s\S]*?\bglucose\b[\s:()]*?(negative|nil|absent|normal|trace|\d+\+)(?:[\s:]*\(?([^\n\r()]+)\)?)?/i
    ],
    defaultUnit: null,
    defaultRange: { low: null, high: null, raw: 'Negative' },
    isQualitative: true
  },
  {
    name: 'Ketones',
    category: 'Urinalysis',
    patterns: [
      /\b(?:urine\s+ketones?|ketone\s*bodies?|ketones?)\b[\s:()]*?(negative|nil|absent|trace|small|moderate|large|\d+\+)(?:[\s:]*\(?([^\n\r()]+)\)?)?/i
    ],
    defaultUnit: null,
    defaultRange: { low: null, high: null, raw: 'Negative' },
    isQualitative: true
  },
  {
    name: 'Nitrite',
    category: 'Urinalysis',
    patterns: [
      /\b(?:urine\s+nitrite|nitrite)\b[\s:()]*?(negative|nil|absent|positive)(?:[\s:]*\(?([^\n\r()]+)\)?)?/i
    ],
    defaultUnit: null,
    defaultRange: { low: null, high: null, raw: 'Negative' },
    isQualitative: true
  },
  {
    name: 'Leukocyte Esterase',
    category: 'Urinalysis',
    patterns: [
      /\b(?:leukocyte\s+esterase|leucocyte\s+esterase|wbc\s+esterase|leukocytes?\s*\(dipstick\))\b[\s:()]*?(negative|nil|absent|trace|small|moderate|large|positive|\d+\+)(?:[\s:]*\(?([^\n\r()]+)\)?)?/i
    ],
    defaultUnit: null,
    defaultRange: { low: null, high: null, raw: 'Negative' },
    isQualitative: true
  },
  {
    name: 'Microscopic WBC',
    category: 'Urinalysis',
    patterns: [
      /\b(?:microscopic\s+wbc|pus\s*cells?|wbc\s*\(microscopic\)|wbcs?\s*\/\s*hpf|pus\s*cells?\s*\/\s*hpf)\b[\s:()]*?([\d]+(?:-[\d]+)?|none\s*seen|nil|absent)\s*(\/?hpf|\/?HPF)?(?:[\s:]*\(?([\d.]+\s*-\s*[\d.]+)\)?)?/i,
      /(?:microscopic examination|microscopy)[\s\S]*?\bwbc\b[\s:()]*?([\d]+(?:-[\d]+)?|none\s*seen|nil|absent)\s*(\/?hpf|\/?HPF)?(?:\s*\(?([\d.]+\s*-\s*[\d.]+)\)?)?/i
    ],
    defaultUnit: '/HPF',
    defaultRange: { low: 0, high: 5, raw: '0 - 5 /HPF' },
    isQualitative: false
  },
  {
    name: 'Microscopic RBC',
    category: 'Urinalysis',
    patterns: [
      /\b(?:microscopic\s+rbc|rbc\s*\(microscopic\)|rbcs?\s*\/\s*hpf|red\s*blood\s*cells?\s*\(microscopic\))\b[\s:()]*?([\d]+(?:-[\d]+)?|none\s*seen|nil|absent)\s*(\/?hpf|\/?HPF)?(?:[\s:]*\(?([\d.]+\s*-\s*[\d.]+)\)?)?/i,
      /(?:microscopic examination|microscopy)[\s\S]*?\b(?:red blood cells|rbc)\b[\s:()]*?([\d]+(?:-[\d]+)?|none\s*seen|nil|absent)\s*(\/?hpf|\/?HPF)?(?:\s*\(?([\d.]+\s*-\s*[\d.]+)\)?)?/i
    ],
    defaultUnit: '/HPF',
    defaultRange: { low: 0, high: 2, raw: '0 - 2 /HPF' },
    isQualitative: false
  },
  {
    name: 'Bacteria',
    category: 'Urinalysis',
    patterns: [
      /\b(?:urine\s+bacteria|bacteria)\b[\s:()]*?(nil|absent|none\s*seen|none|rare|few|moderate|many|present|\d+\+)(?:[\s:]*\(?([^\n\r()]+)\)?)?/i
    ],
    defaultUnit: null,
    defaultRange: { low: null, high: null, raw: 'Nil' },
    isQualitative: true
  },
  {
    name: 'Epithelial Cells',
    category: 'Urinalysis',
    patterns: [
      /\b(?:epithelial\s*cells?)\b[\s:()]*?([\d]+(?:-[\d]+)?|nil|absent|occasional|few|moderate|many)\s*(\/?hpf|\/?HPF)?(?:[\s:]*\(?([\d.]+\s*-\s*[\d.]+)\)?)?/i
    ],
    defaultUnit: '/HPF',
    defaultRange: { low: 0, high: 5, raw: '0 - 5 /HPF' },
    isQualitative: false
  }
];

/**
 * Common Medication Patterns
 */
const MEDICATION_REGEX = /\b([A-Z][a-zA-Z]{3,20}(?:\s+[A-Z][a-zA-Z]+)?)\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu))\s*(?:,\s*)?([^\n,\.;]+)?/g;

/**
 * Extracts structured medical fields from raw OCR output
 * @param {Object} ocrResult - Structured OCR result
 * @param {string} category - Document category
 * @returns {Object} Structured analysis matching MedicalDocumentAnalysisSchema
 */
export function extractClinicalFields(ocrResult, category) {
  const pages = ocrResult?.pages || [];
  const fullText = ocrResult?.fullText || '';
  
  const labResults = [];
  const medications = [];
  const imagingFindings = [];
  const vaccinations = [];
  const explicitDiagnoses = [];
  const followUpInstructions = [];
  const reviewItems = [];

  let conflictingCount = 0;
  let lowConfidenceCount = 0;

  // 1. Extract General Metadata (Facility, Clinician, Date, Patient)
  const metadata = extractDocumentMetadata(fullText, pages);

  // Check if date was uncertain
  if (metadata.evidence.date?.presence === 'UNCERTAIN' || metadata.evidence.date?.presence === 'MISSING') {
    reviewItems.push('Encounter/Report date was not unambiguously identified. User confirmation requested.');
  }

  // 2. Category-Specific Extraction
  if (category === 'Lab Report' || fullText.match(/\b(?:lab|test|reference range|hemoglobin|glucose|urinalysis|specimen)\b/i)) {
    extractLabBiomarkers(pages, fullText, labResults, reviewItems);
  }

  if (category === 'Prescription' || category === 'Discharge Summary/Letter' || fullText.match(/\b(?:rx|tablet|capsule|daily|medication)\b/i)) {
    extractMedications(pages, fullText, medications, reviewItems);
  }

  if (category === 'Scan/Imaging Report' || fullText.match(/\b(?:x-ray|mri|ct scan|ultrasound|findings|impression)\b/i)) {
    extractImaging(pages, fullText, imagingFindings);
  }

  if (category === 'Vaccination Record' || fullText.match(/\b(?:vaccine|immunization|dose|lot no)\b/i)) {
    extractVaccinations(pages, fullText, vaccinations);
  }

  // Extract explicit diagnoses
  extractDiagnoses(pages, fullText, explicitDiagnoses);

  // Extract follow-up instructions
  extractFollowUps(pages, fullText, followUpInstructions);

  // Tally flags
  for (const lab of labResults) {
    if (lab.flags.isConflicting) conflictingCount++;
    if (lab.flags.isLowConfidence) lowConfidenceCount++;
  }
  for (const med of medications) {
    if (med.flags.isConflicting) conflictingCount++;
    if (med.flags.isLowConfidence) lowConfidenceCount++;
  }

  const requiresHumanReview = conflictingCount > 0 || lowConfidenceCount > 0 || reviewItems.length > 0;

  // 3. Generate Plain-Language Summary
  const plainLanguageSummary = generatePlainSummary({
    category,
    metadata,
    labResults,
    medications,
    imagingFindings,
    explicitDiagnoses,
    followUpInstructions,
    requiresHumanReview,
    reviewItems
  });

  return {
    documentId: ocrResult?.documentId || uuidv4(),
    category,
    classificationConfidence: 0.95,
    classificationSignals: [`Extracted from ${pages.length || 1} page(s) OCR stream`],
    metadata,
    labResults,
    medications,
    imagingFindings,
    vaccinations,
    explicitDiagnoses,
    followUpInstructions,
    overallFlags: {
      totalFieldsExtracted: labResults.length + medications.length + imagingFindings.length + vaccinations.length,
      conflictingFieldsCount: conflictingCount,
      lowConfidenceFieldsCount: lowConfidenceCount,
      requiresHumanReview,
      reviewItems
    },
    plainLanguageSummary
  };
}

/**
 * Detects and extracts multi-column historical lab tables (e.g. CBC with historical dates)
 */
function extractMultiColumnTable(pages, fullText, labResults, reviewItems) {
  // Check for multi-date column header e.g. "12/08/20        04/12/19        19/06/19"
  const dateHeaderRegex = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})(?:\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}))?\b/;
  const dateHeaderMatch = fullText.match(dateHeaderRegex);

  if (!dateHeaderMatch) {
    return false;
  }

  const dateTokens = [dateHeaderMatch[1], dateHeaderMatch[2]];
  if (dateHeaderMatch[3]) dateTokens.push(dateHeaderMatch[3]);
  const dates = dateTokens.map(d => d.trim());

  // Match table rows:
  const rowRegex = /^(WBC Count|Total WBC Count|RBC Count|Total RBC Count|Hemoglobin|Hematocrit|MCV|MCH|MCHC|RDW-CV|RDW|Platelets|Platelet Count|Neutrophils|Lymphocytes|Monocytes|Eosinophils|Basophils|Bands)\s+([0-9,.]+)\s*(\/[a-zA-Z0-9]+|mil\/[a-zA-Z0-9]+|million\/[a-zA-Z0-9]+|g\/dL|pg|fL|%)?\s+([0-9,.]+)\s*(\/[a-zA-Z0-9]+|mil\/[a-zA-Z0-9]+|million\/[a-zA-Z0-9]+|g\/dL|pg|fL|%)?(?:\s+([0-9,.]+)\s*(\/[a-zA-Z0-9]+|mil\/[a-zA-Z0-9]+|million\/[a-zA-Z0-9]+|g\/dL|pg|fL|%)?)?\s+([0-9,.]+\s*-\s*[0-9,.]+)/i;

  let rowMatched = false;
  const lines = fullText.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const match = line.match(rowRegex);
    if (!match) continue;

    rowMatched = true;
    const rawName = match[1].trim();
    let name = rawName;
    if (/^WBC/i.test(rawName)) name = 'WBC Count';
    else if (/^RBC/i.test(rawName)) name = 'RBC Count';
    else if (/^Platelet/i.test(rawName)) name = 'Platelet Count';
    else if (/^RDW/i.test(rawName)) name = 'RDW-CV';

    const val1 = match[2].trim();
    let unit1 = match[3] ? match[3].trim() : null;
    const val2 = match[4].trim();
    let unit2 = match[5] ? match[5].trim() : null;
    const val3 = match[6] ? match[6].trim() : null;
    let unit3 = match[7] ? match[7].trim() : null;
    const rawRange = match[8].trim();

    let effectiveUnit = unit1 || unit2 || unit3;
    if (!effectiveUnit) {
      if (['Hematocrit', 'RDW-CV', 'Neutrophils', 'Lymphocytes', 'Monocytes', 'Eosinophils', 'Basophils', 'Bands'].includes(name)) {
        effectiveUnit = '%';
      } else if (name === 'MCV') {
        effectiveUnit = 'fL';
      } else if (name === 'MCH') {
        effectiveUnit = 'pg';
      } else if (name === 'MCHC' || name === 'Hemoglobin') {
        effectiveUnit = 'g/dL';
      } else if (name === 'WBC Count' || name === 'Platelet Count') {
        effectiveUnit = '/mm3';
      } else if (name === 'RBC Count') {
        effectiveUnit = 'million/mm3';
      }
    }
    if (effectiveUnit === 'mil/mm3') {
      effectiveUnit = 'million/mm3';
    }

    const num1 = parseFloat(val1.replace(/,/g, ''));
    const isZero = num1 === 0;

    let refLow = null;
    let refHigh = null;
    if (rawRange) {
      const parts = rawRange.split('-').map(p => parseFloat(p.trim().replace(/,/g, '')));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        refLow = parts[0];
        refHigh = parts[1];
      }
    }

    let status = 'NORMAL';
    if (!isNaN(num1)) {
      if (refLow != null && num1 < refLow) status = 'LOW';
      else if (refHigh != null && num1 > refHigh) status = 'HIGH';
      else status = 'NORMAL';
    }

    const historicalReadings = [];
    if (val2 && dates[1]) {
      const num2 = parseFloat(val2.replace(/,/g, ''));
      historicalReadings.push({
        date: dates[1],
        value: `${val2}${unit2 ? ' ' + unit2 : (effectiveUnit ? ' ' + effectiveUnit : '')}`.trim(),
        numericValue: isNaN(num2) ? null : num2,
        unit: unit2 || effectiveUnit || null
      });
    }
    if (val3 && dates[2]) {
      const num3 = parseFloat(val3.replace(/,/g, ''));
      historicalReadings.push({
        date: dates[2],
        value: `${val3}${unit3 ? ' ' + unit3 : (effectiveUnit ? ' ' + effectiveUnit : '')}`.trim(),
        numericValue: isNaN(num3) ? null : num3,
        unit: unit3 || effectiveUnit || null
      });
    }

    let interpretation = `Within target clinical range (${rawRange}).`;
    if (status === 'HIGH') {
      interpretation = `Elevated above reference limit (${rawRange}).`;
    } else if (status === 'LOW') {
      interpretation = `Below reference floor (${rawRange}).`;
    }

    labResults.push({
      id: `bm-${uuidv4().slice(0, 8)}`,
      name,
      category: 'Hematology',
      rawValue: val1,
      numericValue: isNaN(num1) ? null : num1,
      isZero,
      unit: effectiveUnit,
      referenceRange: {
        low: refLow,
        high: refHigh,
        rawRange
      },
      status,
      interpretation,
      historicalReadings,
      evidence: {
        presence: 'EXPLICIT',
        pageNumber: 1,
        rawSnippet: line,
        confidence: 0.985
      },
      flags: {
        isConflicting: false,
        isLowConfidence: false,
        needsUserReview: false,
        reviewReason: null
      },
      conflictingReadings: []
    });
  }

  return rowMatched;
}

/**
 * Parses structured Urinalysis laboratory tables preserving verbatim values,
 * actual source reference intervals (e.g. 5.0 - 7.5), and ranges (e.g. 0-2 /hpf)
 * without coercing ranges to zero or inventing generic default intervals.
 */
function extractUrinalysisTable(pages, fullText, labResults, reviewItems) {
  const isUrineDoc = /\b(?:urinalysis|urine\s*routine|urine\s*examination|routine\s*urine|microscopic\s*urine|physical\s*&\s*chemical\s*examination)\b/i.test(fullText);
  if (!isUrineDoc) return false;

  const lines = fullText.split('\n');
  let matchedAny = false;

  const urineConfigs = [
    {
      name: 'Specific Gravity',
      pattern: /^\s*(?:Specific Gravity|Sp\.?\s*Gravity|Sp\.?\s*Gr\.?|S\.G\.?)\s+([1-9]\.\d{2,4})\s+(?:[A-Z0-9]+\s+)?([1-9]\.\d{2,4}\s*-\s*[1-9]\.\d{2,4})(?:\s+[0-9A-Za-z]+)?/i,
      unit: null,
      isQualitative: false
    },
    {
      name: 'Urine pH',
      pattern: /^\s*(?:pH|Urine pH)\s+([\d.]+)\s+(?:[A-Z0-9]+\s+)?([\d.]+\s*-\s*[\d.]+)(?:\s+[0-9A-Za-z]+)?/i,
      unit: null,
      isQualitative: false
    },
    {
      name: 'Urine Protein',
      pattern: /^\s*(?:Protein|Urine Protein)\s+(Negative|Trace|Positive|\d+\+|Nil|Absent)\s+(?:[A-Z0-9]+\s+)?([^\n\r0-9]+?)(?:\s+[0-9A-Za-z]+)?$/i,
      unit: null,
      isQualitative: true
    },
    {
      name: 'Urine Glucose',
      pattern: /^\s*(?:Glucose|Urine Glucose)\s+(Negative|Trace|Positive|\d+\+|Nil|Absent)\s+(?:[A-Z0-9]+\s+)?([^\n\r0-9]+?)(?:\s+[0-9A-Za-z]+)?$/i,
      unit: null,
      isQualitative: true
    },
    {
      name: 'Ketones',
      pattern: /^\s*(?:Ketones|Urine Ketones)\s+(Negative|Trace|Positive|\d+\+|Nil|Absent)\s+(?:[A-Z0-9]+\s+)?([^\n\r0-9]+?)(?:\s+[0-9A-Za-z]+)?$/i,
      unit: null,
      isQualitative: true
    },
    {
      name: 'Leukocyte Esterase',
      pattern: /^\s*(?:WBC Esterase|Leukocyte Esterase|Leucocyte Esterase)\s+(Negative|Trace|Positive|\d+\+|Nil|Absent)\s+(?:[A-Z0-9]+\s+)?([^\n\r0-9]+?)(?:\s+[0-9A-Za-z]+)?$/i,
      unit: null,
      isQualitative: true
    },
    {
      name: 'Nitrite',
      pattern: /^\s*(?:Nitrite(?:,\s*Urine)?|Urine Nitrite)\s+(Negative|Positive|Nil|Absent)\s+(?:[A-Z0-9]+\s+)?([^\n\r0-9]+?)(?:\s+[0-9A-Za-z]+)?$/i,
      unit: null,
      isQualitative: true
    },
    {
      name: 'Microscopic WBC',
      pattern: /^\s*(?:WBC|Microscopic WBC|Pus Cells)\s+(None seen|[\d]+-[\d]+|[\d]+|Nil|Absent)\s*(\/hpf|\/HPF)?\s+([\d.]+\s*-\s*[\d.]+(?:\s*\/[a-zA-Z]+)?)(?:\s+[0-9A-Za-z]+)?/i,
      unit: '/HPF',
      isQualitative: false
    },
    {
      name: 'Microscopic RBC',
      pattern: /^\s*(?:RBC|Microscopic RBC|Red Blood Cells)\s+(None seen|[\d]+-[\d]+|[\d]+|Nil|Absent)\s*(\/hpf|\/HPF)?\s+([\d.]+\s*-\s*[\d.]+(?:\s*\/[a-zA-Z]+)?)(?:\s+[0-9A-Za-z]+)?/i,
      unit: '/HPF',
      isQualitative: false
    },
    {
      name: 'Bacteria',
      pattern: /^\s*(?:Bacteria|Urine Bacteria)\s+(None\s*seen|Nil|Absent|Rare|Few|Moderate|Many|\d+\+)(?:\s+(None\s*seen(?:\/Few)?|Nil|Absent|Few|Negative|Normal|[^\n\r]+?))?$/i,
      unit: null,
      isQualitative: true
    },
    {
      name: 'Epithelial Cells',
      pattern: /^\s*(?:Epithelial Cells[^\n]*?)\s*(None seen|[\d]+-[\d]+|[\d]+|Nil|Absent|Few)\s*(\/hpf|\/HPF)?\s+([\d.]+\s*-\s*[\d.]+)(?:\s+[0-9A-Za-z]+)?/i,
      unit: '/HPF',
      isQualitative: false
    }
  ];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    for (const cfg of urineConfigs) {
      if (labResults.some(l => l.name === cfg.name)) continue;

      let lineToTest = rawLine;
      if (/^Epithelial Cells/i.test(rawLine) && lines[i + 1]) {
        lineToTest = rawLine + ' ' + lines[i + 1].trim();
      }

      const m = lineToTest.match(cfg.pattern);
      if (!m) continue;

      matchedAny = true;
      const rawVal = m[1].trim();
      let unit = cfg.unit;
      let rawRange = m[2]?.trim() || 'Unavailable';

      if (cfg.name === 'Microscopic WBC' || cfg.name === 'Microscopic RBC' || cfg.name === 'Epithelial Cells') {
        if (m[2] && m[3]) {
          unit = m[2].trim() || cfg.unit;
          rawRange = m[3].trim();
        } else if (m[2]) {
          rawRange = m[2].trim();
        }
      }

      rawRange = rawRange.replace(/\s+01\s*$/, '').trim();

      const isHyphenRange = /^\d+\s*-\s*\d+/.test(rawVal);
      const isSingleNum = !isHyphenRange && /^-?\d+(?:\.\d+)?$/.test(rawVal);
      const numericValue = isSingleNum ? parseFloat(rawVal) : null;
      const isZero = numericValue === 0;

      let refLow = null;
      let refHigh = null;
      if (rawRange && rawRange !== 'Unavailable') {
        const parts = rawRange.split('-').map(p => parseFloat(p.trim().replace(/,/g, '')));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          refLow = parts[0];
          refHigh = parts[1];
        }
      }

      let status = 'NORMAL';
      if (cfg.isQualitative) {
        const lower = rawVal.toLowerCase();
        if (['negative', 'nil', 'absent', 'none seen', 'normal'].includes(lower)) status = 'NORMAL';
        else if (['trace', 'rare', 'few'].includes(lower)) status = 'NORMAL';
        else status = 'HIGH';
      } else if (numericValue != null) {
        if (refLow != null && numericValue < refLow) status = 'LOW';
        else if (refHigh != null && numericValue > refHigh) status = 'HIGH';
        else status = 'NORMAL';
      } else if (isHyphenRange && refHigh != null) {
        const rangeParts = rawVal.split('-').map(p => parseFloat(p.trim()));
        const maxVal = Math.max(...rangeParts.filter(n => !isNaN(n)));
        if (!isNaN(maxVal) && maxVal > refHigh) status = 'HIGH';
        else status = 'NORMAL';
      }

      let interpretation = `Within target clinical range (${rawRange}).`;
      if (status === 'HIGH') interpretation = `Elevated above reference limit (${rawRange}).`;
      else if (status === 'LOW') interpretation = `Below reference floor (${rawRange}).`;

      labResults.push({
        id: `bm-${uuidv4().slice(0, 8)}`,
        name: cfg.name,
        category: 'Urinalysis',
        rawValue: rawVal,
        numericValue,
        isZero,
        unit,
        referenceRange: {
          low: refLow,
          high: refHigh,
          rawRange
        },
        status,
        interpretation,
        evidence: {
          presence: 'EXPLICIT',
          pageNumber: 1,
          rawSnippet: lineToTest,
          confidence: 0.985
        },
        flags: {
          isConflicting: false,
          isLowConfidence: false,
          needsUserReview: false,
          reviewReason: null
        },
        conflictingReadings: [],
        historicalReadings: []
      });
      break;
    }
  }

  return matchedAny;
}

/**
 * Known laboratory analyte aliases and canonical metadata for single-date tabular reports
 */
const STANDARD_ANALYTES_CATALOG = [
  {
    regex: /^(?:hemoglobin|haemoglobin|hb)(?:\s*\(hb\))?$/i,
    name: 'Hemoglobin',
    category: 'Hematology',
    isQualitative: false
  },
  {
    regex: /^(?:total\s+wbc\s+count|white\s+blood\s+cell\s+count|total\s+leucocyte\s+count(?:\s*\(tlc\))?|total\s+leucocyte\s+count|tlc|total\s+leucocytes|wbc\s+count)$/i,
    name: 'Total WBC Count',
    category: 'Hematology',
    isQualitative: false
  },
  {
    regex: /^(?:platelet\s+count|platelets)$/i,
    name: 'Platelet Count',
    category: 'Hematology',
    isQualitative: false
  },
  {
    regex: /^(?:total\s+rbc\s+count|red\s+blood\s+cell\s+count|rbc\s+count)$/i,
    name: 'RBC Count',
    category: 'Hematology',
    isQualitative: false
  },
  {
    regex: /^(?:hematocrit|hct|pcv|packed\s+cell\s+volume)$/i,
    name: 'Hematocrit',
    category: 'Hematology',
    isQualitative: false
  },
  {
    regex: /^(?:mean\s+corpuscular\s+volume|mcv)$/i,
    name: 'MCV',
    category: 'Hematology',
    isQualitative: false
  },
  {
    regex: /^(?:mean\s+corpuscular\s+hemoglobin|mch)$/i,
    name: 'MCH',
    category: 'Hematology',
    isQualitative: false
  },
  {
    regex: /^(?:mean\s+corpuscular\s+hemoglobin\s+concentration|mchc)$/i,
    name: 'MCHC',
    category: 'Hematology',
    isQualitative: false
  },
  {
    regex: /^(?:rdw-cv|rdw\s+cv|rdw)$/i,
    name: 'RDW-CV',
    category: 'Hematology',
    isQualitative: false
  },
  {
    regex: /^(?:neutrophils|neutrophil\s+count|polymorphs|segs)$/i,
    name: 'Neutrophils',
    category: 'Hematology',
    isQualitative: false
  },
  {
    regex: /^(?:lymphocytes|lymphocyte\s+count|lymphs)$/i,
    name: 'Lymphocytes',
    category: 'Hematology',
    isQualitative: false
  },
  {
    regex: /^(?:monocytes|monocyte\s+count|monos)$/i,
    name: 'Monocytes',
    category: 'Hematology',
    isQualitative: false
  },
  {
    regex: /^(?:eosinophils|eosinophil\s+count|eos)$/i,
    name: 'Eosinophils',
    category: 'Hematology',
    isQualitative: false
  },
  {
    regex: /^(?:basophils|basophil\s+count|basos)$/i,
    name: 'Basophils',
    category: 'Hematology',
    isQualitative: false
  },
  {
    regex: /^(?:bands|band\s+neutrophils|stab\s+cells)$/i,
    name: 'Bands',
    category: 'Hematology',
    isQualitative: false
  },
  {
    regex: /^(?:fasting\s+blood\s+glucose|fasting\s+blood\s+sugar|fasting\s+glucose|fbs|glucose\s+fasting)$/i,
    name: 'Fasting Blood Glucose',
    category: 'Metabolic',
    isQualitative: false
  },
  {
    regex: /^(?:post\s*prandial\s+blood\s+glucose|ppbs|post\s*prandial\s+glucose)$/i,
    name: 'Postprandial Blood Glucose',
    category: 'Metabolic',
    isQualitative: false
  },
  {
    regex: /^(?:hba1c|glycated\s+hemoglobin|glycosylated\s+hb)$/i,
    name: 'HbA1c',
    category: 'Metabolic',
    isQualitative: false
  },
  {
    regex: /^(?:total\s+cholesterol|cholesterol\s+total)$/i,
    name: 'Total Cholesterol',
    category: 'Lipid Panel',
    isQualitative: false
  },
  {
    regex: /^(?:hdl\s+cholesterol|hdl)$/i,
    name: 'HDL Cholesterol',
    category: 'Lipid Panel',
    isQualitative: false
  },
  {
    regex: /^(?:ldl\s+cholesterol|ldl)$/i,
    name: 'LDL Cholesterol',
    category: 'Lipid Panel',
    isQualitative: false
  },
  {
    regex: /^(?:triglycerides|serum\s+triglycerides)$/i,
    name: 'Triglycerides',
    category: 'Lipid Panel',
    isQualitative: false
  },
  {
    regex: /^(?:serum\s+creatinine|creatinine)$/i,
    name: 'Serum Creatinine',
    category: 'Renal',
    isQualitative: false
  },
  {
    regex: /^(?:blood\s+urea\s+nitrogen|bun|urea)$/i,
    name: 'Blood Urea Nitrogen',
    category: 'Renal',
    isQualitative: false
  },
  {
    regex: /^(?:egfr|estimated\s+gfr)$/i,
    name: 'eGFR',
    category: 'Renal',
    isQualitative: false
  },
  {
    regex: /^(?:troponin\s*i|troponin\s*t|troponin)$/i,
    name: 'Troponin I',
    category: 'Cardiac',
    isQualitative: false
  },
  {
    regex: /^(?:serum\s+sodium|sodium)$/i,
    name: 'Serum Sodium',
    category: 'Electrolytes',
    isQualitative: false
  },
  {
    regex: /^(?:serum\s+potassium|potassium)$/i,
    name: 'Serum Potassium',
    category: 'Electrolytes',
    isQualitative: false
  },
  {
    regex: /^(?:serum\s+chloride|chloride)$/i,
    name: 'Serum Chloride',
    category: 'Electrolytes',
    isQualitative: false
  },
  {
    regex: /^(?:total\s+bilirubin|bilirubin\s+total)$/i,
    name: 'Total Bilirubin',
    category: 'Liver Function',
    isQualitative: false
  },
  {
    regex: /^(?:direct\s+bilirubin|bilirubin\s+direct)$/i,
    name: 'Direct Bilirubin',
    category: 'Liver Function',
    isQualitative: false
  },
  {
    regex: /^(?:sgot|ast|aspartate\s+aminotransferase)$/i,
    name: 'SGOT / AST',
    category: 'Liver Function',
    isQualitative: false
  },
  {
    regex: /^(?:sgpt|alt|alanine\s+aminotransferase)$/i,
    name: 'SGPT / ALT',
    category: 'Liver Function',
    isQualitative: false
  },
  {
    regex: /^(?:alkaline\s+phosphatase|alp)$/i,
    name: 'Alkaline Phosphatase',
    category: 'Liver Function',
    isQualitative: false
  },
  {
    regex: /^(?:total\s+protein|protein\s+total)$/i,
    name: 'Total Protein',
    category: 'Liver Function',
    isQualitative: false
  },
  {
    regex: /^(?:serum\s+albumin|albumin)$/i,
    name: 'Serum Albumin',
    category: 'Liver Function',
    isQualitative: false
  },
  {
    regex: /^(?:calcium|serum\s+calcium)$/i,
    name: 'Serum Calcium',
    category: 'Metabolic',
    isQualitative: false
  },
  {
    regex: /^(?:tsh|thyroid\s+stimulating\s+hormone)$/i,
    name: 'TSH',
    category: 'Endocrine',
    isQualitative: false
  },
  {
    regex: /^(?:free\s+t3|ft3)$/i,
    name: 'Free T3',
    category: 'Endocrine',
    isQualitative: false
  },
  {
    regex: /^(?:free\s+t4|ft4)$/i,
    name: 'Free T4',
    category: 'Endocrine',
    isQualitative: false
  }
];

/**
 * Extracts standard single-date tabular lab rows, preserving verbatim values,
 * comma numbers, inequality limits (< and >), explicit units, and exact source intervals.
 */
function extractStandardLabTable(pages, fullText, labResults, reviewItems) {
  const isUrinalysis = /\b(?:urinalysis|urine\s*routine|urine\s*analysis|routine\s*urine|microscopic\s*urine|physical\s*&\s*chemical\s*examination|urine\s*examination)\b/i.test(fullText);
  const isBloodPanel = /\b(?:complete blood count|cbc|hematology|haematology|lipid profile|lipid panel|metabolic panel|fasting blood glucose|hemoglobin|total cholesterol|renal function|liver function|lft|kft)\b/i.test(fullText);

  if (isUrinalysis && !isBloodPanel) {
    return false; // Prevent blood biomarkers from parsing out of urine reports
  }

  let matchedAny = false;
  const commonUnitsPattern = 'mil\\/[a-zA-Z0-9]+|million\\/[a-zA-Z0-9]+|cells\\/mcL|mL\\/min|\\/cumm|\\/mm3|\\/HPF|\\/hpf|g\\/dL|mg\\/dL|mg\\/L|mmol\\/L|ng\\/mL|ng\\/dL|pg\\/mL|uIU\\/mL|mIU\\/mL|mcg\\/dL|mcg\\/L|mEq\\/L|IU\\/mL|IU\\/L|U\\/L|K\\/uL|M\\/uL|pg|fL|pH|%|\\/[a-zA-Z0-9]+';
  const rowRegex = new RegExp(`^\\s*([A-Za-z][A-Za-z0-9\\s()\\/.-]{1,45}?)\\s*[:]?\\s+([<>]?\\s*-?\\d+(?:,\\d+)*(?:\\.\\d+)?|\\d+\\s*-\\s*\\d+|Negative|Positive|Trace|Nil|None\\s+seen|Normal)(?:\\s+(High|Low|Normal|Slightly Elevated|Borderline|Desirable|Optimal|H|L|\\*))?(?:\\s+(${commonUnitsPattern}))?(?:\\s*\\(?([<>]?\\s*\\d+(?:[\\d,.]*\\d)?(?:\\s*-\\s*\\d+(?:[\\d,.]*\\d)?)?|[><]\\s*\\d+(?:[\\d,.]*\\d)?|Negative(?:\\/Trace)?|None\\s+seen(?:\\/Few)?|Nil|Normal|[^\\n\\r()]*)\\)?)?\\s*$`, 'i');

  const pageList = pages && pages.length > 0 ? pages : [{ pageNumber: 1, text: fullText, confidence: 0.95 }];

  for (const page of pageList) {
    const pageNum = page.pageNumber || 1;
    const pageConfidence = typeof page.confidence === 'number' ? page.confidence : 0.95;
    const lines = (page.text || '').split('\n');

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      let rawName = null;
      let rawVal = null;
      let rawFlag = null;
      let rawUnit = null;
      let rawRange = 'Unavailable';

      const match1 = line.match(rowRegex);
      const rowRegexUnitFirst = new RegExp(`^\\s*([A-Za-z][A-Za-z0-9\\s()\\/.-]{1,45}?)\\s*[:]?\\s+([<>]?\\s*-?\\d+(?:,\\d+)*(?:\\.\\d+)?|\\d+\\s*-\\s*\\d+|Negative|Positive|Trace|Nil|None\\s+seen|Normal)(?:\\s+(${commonUnitsPattern}))(?:\\s+(High|Low|Normal|Slightly Elevated|Borderline|Desirable|Optimal|H|L|\\*))?(?:\\s*\\(?([<>]?\\s*\\d+(?:[\\d,.]*\\d)?(?:\\s*-\\s*\\d+(?:[\\d,.]*\\d)?)?|[><]\\s*\\d+(?:[\\d,.]*\\d)?|Negative(?:\\/Trace)?|None\\s+seen(?:\\/Few)?|Nil|Normal|[^\\n\\r()]*)\\)?)?\\s*$`, 'i');
      const match2 = line.match(rowRegexUnitFirst);

      if (match2 && match2[4]) {
        // Unit came before flag
        rawName = match2[1].trim();
        rawVal = match2[2].trim();
        rawUnit = match2[3] ? match2[3].trim() : null;
        rawFlag = match2[4] ? match2[4].trim() : null;
        rawRange = match2[5] ? match2[5].trim() : 'Unavailable';
      } else if (match1) {
        rawName = match1[1].trim();
        rawVal = match1[2].trim();
        rawFlag = match1[3] ? match1[3].trim() : null;
        rawUnit = match1[4] ? match1[4].trim() : null;
        rawRange = match1[5] ? match1[5].trim() : 'Unavailable';
      } else if (match2) {
        rawName = match2[1].trim();
        rawVal = match2[2].trim();
        rawUnit = match2[3] ? match2[3].trim() : null;
        rawFlag = match2[4] ? match2[4].trim() : null;
        rawRange = match2[5] ? match2[5].trim() : 'Unavailable';
      } else {
        continue;
      }

      // Catalog lookup or generic analyte detection
      const catalogEntry = STANDARD_ANALYTES_CATALOG.find(c => c.regex.test(rawName));
      let analyteName = null;
      let analyteCategory = 'General Lab';
      let isQualitativeEntry = false;

      if (catalogEntry) {
        analyteName = catalogEntry.name;
        analyteCategory = catalogEntry.category;
        isQualitativeEntry = catalogEntry.isQualitative;
      } else {
        // Exclude administrative headers/metadata and panel titles
        const isHeaderOrAdmin = /^(patient|name|age|gender|sex|doctor|dr\b|hospital|clinic|date|time|sample|specimen|collected|received|reported|page|phone|address|barcode|id|uhid|ref|referred|signature|technician|pathologist|consultant|test\s+name|investigation|parameter|result|units?|reference\s+range|biological|interval|method|notes?|status|blood\s+complete(?:\s+picture)?|complete\s+blood\s+count|cbc|hematology|differential\s+count|lipid\s+profile|lipid\s+panel|liver\s+function|renal\s+function|urinalysis|urine\s+routine|gross\s+examination|microscopic\s+examination)\b/i.test(rawName);
        const isDateValue = /^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/.test(rawVal);
        if (isHeaderOrAdmin || isDateValue || rawName.length < 2 || /^\d+$/.test(rawName)) {
          continue;
        }
        analyteName = rawName.trim();
        if (/bilirubin|sgot|sgpt|alt|ast|alkaline|ggt|albumin|protein|liver|lft/i.test(rawName)) {
          analyteCategory = 'Liver Function';
        } else if (/creatinine|bun|urea|egfr|uric\s*acid|kidney|renal|kft/i.test(rawName)) {
          analyteCategory = 'Kidney Function';
        } else if (/cholesterol|triglyceride|hdl|ldl|vldl|lipid/i.test(rawName)) {
          analyteCategory = 'Lipid Profile';
        } else if (/glucose|sugar|hba1c|glycated|insulin/i.test(rawName)) {
          analyteCategory = 'Diabetes / Glycemic';
        } else if (/sodium|potassium|chloride|calcium|phosphorus|magnesium|electrolytes/i.test(rawName)) {
          analyteCategory = 'Electrolytes & Minerals';
        } else if (/tsh|t3|t4|thyroid|hormone|cortisol|psa/i.test(rawName)) {
          analyteCategory = 'Endocrine';
        } else if (/wbc|rbc|platelet|hemoglobin|mcv|mch|mchc|esr|crp|hematology|cbc/i.test(rawName)) {
          analyteCategory = 'Hematology';
        }
      }

      const existing = labResults.find(l => {
        if (l.name.toLowerCase() === analyteName.toLowerCase()) return true;
        if ((analyteName === 'Total WBC Count' || analyteName === 'WBC Count') && (l.name === 'WBC Count' || l.name === 'Total WBC Count')) return true;
        if ((analyteName === 'Platelet Count' || analyteName === 'Platelets') && (l.name === 'Platelets' || l.name === 'Platelet Count')) return true;
        if ((analyteName === 'RBC Count' || analyteName === 'Total RBC Count') && (l.name === 'RBC Count' || l.name === 'Total RBC Count')) return true;
        return false;
      });
      if (existing) {
        if (existing.rawValue !== rawVal) {
          existing.flags.isConflicting = true;
          existing.flags.needsUserReview = true;
          existing.flags.reviewReason = `Conflicting values found: ${existing.rawValue}, ${rawVal} across pages.`;
          if (existing.conflictingReadings.length === 0) {
            existing.conflictingReadings.push({
              pageNumber: existing.evidence.pageNumber,
              value: existing.rawValue,
              snippet: existing.evidence.rawSnippet
            });
          }
          if (!existing.conflictingReadings.some(r => r.pageNumber === pageNum && r.value === rawVal)) {
            existing.conflictingReadings.push({
              pageNumber: pageNum,
              value: rawVal,
              snippet: line
            });
          }
          const reviewMsg = `${analyteName}: Discrepant values detected (${existing.rawValue}, ${rawVal}). Clinical review required.`;
          if (!reviewItems.includes(reviewMsg)) {
            reviewItems.push(reviewMsg);
          }
        }
        continue;
      }

      matchedAny = true;

      const isHyphenRange = /^\d+\s*-\s*\d+/.test(rawVal);
      const isQualitativeVal = /^(negative|positive|nil|none|trace|absent|normal)/i.test(rawVal);
      const cleanNumStr = rawVal.replace(/[<>]/g, '').replace(/,/g, '').trim();
      const isValidSingleNum = !isHyphenRange && !isQualitativeVal && /^-?\d+(?:\.\d+)?$/.test(cleanNumStr);
      const numericValue = isValidSingleNum ? parseFloat(cleanNumStr) : null;
      const isZero = numericValue === 0;

      let refLow = null;
      let refHigh = null;
      if (rawRange && rawRange !== 'Unavailable') {
        const parts = rawRange.split('-').map(p => parseFloat(p.trim().replace(/,/g, '')));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          refLow = parts[0];
          refHigh = parts[1];
        } else {
          const lessMatch = rawRange.match(/^[<]\s*(\d+(?:\.\d+)?)/);
          if (lessMatch) {
            refHigh = parseFloat(lessMatch[1]);
          }
          const greaterMatch = rawRange.match(/^[>]\s*(\d+(?:\.\d+)?)/);
          if (greaterMatch) {
            refLow = parseFloat(greaterMatch[1]);
          }
        }
      }

      let status = 'NORMAL';
      if (rawFlag) {
        if (/^(High|H|\*|Slightly Elevated)$/i.test(rawFlag)) status = 'HIGH';
        else if (/^(Low|L)$/i.test(rawFlag)) status = 'LOW';
        else if (/^(Normal|Desirable|Optimal)$/i.test(rawFlag)) status = 'NORMAL';
      } else if (isQualitativeEntry || isQualitativeVal) {
        const lower = rawVal.toLowerCase();
        if (['negative', 'nil', 'absent', 'normal', 'none seen'].includes(lower)) status = 'NORMAL';
        else if (['trace', 'rare', 'few'].includes(lower)) status = 'NORMAL';
        else status = 'HIGH';
      } else if (numericValue != null) {
        if (rawVal.startsWith('<')) {
          status = refLow != null && numericValue < refLow ? 'LOW' : 'NORMAL';
        } else if (rawVal.startsWith('>')) {
          status = refHigh != null && numericValue > refHigh ? 'HIGH' : 'NORMAL';
        } else if (refLow != null && numericValue < refLow) {
          status = 'LOW';
        } else if (refHigh != null && numericValue > refHigh) {
          status = 'HIGH';
        } else if (rawRange === 'Unavailable') {
          status = 'UNKNOWN';
        } else {
          status = 'NORMAL';
        }
      } else if (rawRange === 'Unavailable') {
        status = 'UNKNOWN';
      }

      const isLowConfidence = pageConfidence < 0.70;
      let reviewReason = null;
      if (isLowConfidence) {
        reviewReason = `OCR confidence is low (${(pageConfidence * 100).toFixed(0)}%). Verify against physical document.`;
        reviewItems.push(`${analyteName}: Low confidence scan reading.`);
      }

      let interpretation = `Within target clinical range (${rawRange}). A result within reference bounds is not an absolute guarantee of wellness; consult your clinician.`;
      if (status === 'HIGH') {
        interpretation = `Elevated above reference limit (${rawRange}). A result outside a lab reference range is a screening measurement, not an automatic diagnosis.`;
      } else if (status === 'LOW') {
        interpretation = `Below reference floor (${rawRange}). A result outside a lab reference range is a screening measurement, not an automatic diagnosis.`;
      } else if (status === 'UNKNOWN' || rawRange === 'Unavailable') {
        interpretation = `Reference range unavailable in source document. A test measurement alone is not an automatic diagnosis; consult your clinician.`;
      }

      labResults.push({
        id: `bm-${uuidv4().slice(0, 8)}`,
        name: analyteName,
        category: analyteCategory,
        rawValue: rawVal,
        numericValue,
        isZero,
        unit: rawUnit, // Never fabricated!
        referenceRange: {
          low: refLow,
          high: refHigh,
          rawRange
        },
        status,
        interpretation,
        historicalReadings: [],
        evidence: {
          presence: 'EXPLICIT',
          pageNumber: pageNum,
          rawSnippet: line,
          confidence: pageConfidence
        },
        flags: {
          isConflicting: false,
          isLowConfidence,
          needsUserReview: isLowConfidence,
          reviewReason
        },
        conflictingReadings: []
      });
    }
  }

  return matchedAny;
}

/**
 * Extracts Lab Biomarkers with Strict Document-Panel Scoping
 * Guarantees Urinalysis parameters only extract from urine reports,
 * and Blood parameters only extract from blood reports.
 */
function extractLabBiomarkers(pages, fullText, labResults, reviewItems) {
  // 1. Try extracting multi-column historical table first
  extractMultiColumnTable(pages, fullText, labResults, reviewItems);

  // 2. Try extracting dedicated urinalysis table
  extractUrinalysisTable(pages, fullText, labResults, reviewItems);

  // 3. Try extracting standard single-date tabular lab rows
  extractStandardLabTable(pages, fullText, labResults, reviewItems);

  const existingNames = new Set(labResults.map(l => l.name));

  const isUrinalysis = /\b(?:urinalysis|urine\s*routine|urine\s*analysis|routine\s*urine|microscopic\s*urine|physical\s*&\s*chemical\s*examination|urine\s*examination)\b/i.test(fullText);
  const isBloodPanel = /\b(?:complete blood count|cbc|hematology|haematology|lipid profile|lipid panel|metabolic panel|fasting blood glucose|hemoglobin|total cholesterol|renal function|liver function|lft|kft)\b/i.test(fullText);

  const patternsToScan = [];
  if (isUrinalysis) {
    patternsToScan.push(...URINALYSIS_BIOMARKER_PATTERNS);
  }
  if (isBloodPanel || !isUrinalysis) {
    patternsToScan.push(...BLOOD_BIOMARKER_PATTERNS);
  }

  for (const def of patternsToScan) {
    const isAlreadyExtracted = existingNames.has(def.name) ||
      ((def.name === 'Total WBC Count' || def.name === 'WBC Count') && (existingNames.has('WBC Count') || existingNames.has('Total WBC Count'))) ||
      ((def.name === 'Platelet Count' || def.name === 'Platelets') && (existingNames.has('Platelets') || existingNames.has('Platelet Count'))) ||
      ((def.name === 'RBC Count' || def.name === 'Total RBC Count') && (existingNames.has('RBC Count') || existingNames.has('Total RBC Count')));

    if (isAlreadyExtracted) {
      if (pages.length > 1) {
        const existing = labResults.find(l => {
          if (l.name === def.name) return true;
          if ((def.name === 'Total WBC Count' || def.name === 'WBC Count') && (l.name === 'WBC Count' || l.name === 'Total WBC Count')) return true;
          if ((def.name === 'Platelet Count' || def.name === 'Platelets') && (l.name === 'Platelets' || l.name === 'Platelet Count')) return true;
          if ((def.name === 'RBC Count' || def.name === 'Total RBC Count') && (l.name === 'RBC Count' || l.name === 'Total RBC Count')) return true;
          return false;
        });
        if (existing) {
          pages.forEach((page) => {
            const pageNum = page.pageNumber || 1;
            if (pageNum !== existing.evidence.pageNumber) {
              const pageText = page.text || '';
              for (const pat of def.patterns) {
                const match = pageText.match(pat);
                if (match) {
                  const rawVal = match[1].trim();
                  if (rawVal !== existing.rawValue) {
                    existing.flags.isConflicting = true;
                    existing.flags.needsUserReview = true;
                    existing.flags.reviewReason = `Conflicting values found: ${existing.rawValue}, ${rawVal} across pages.`;
                    if (existing.conflictingReadings.length === 0) {
                      existing.conflictingReadings.push({
                        pageNumber: existing.evidence.pageNumber,
                        value: existing.rawValue,
                        snippet: existing.evidence.rawSnippet
                      });
                    }
                    if (!existing.conflictingReadings.some(r => r.pageNumber === pageNum && r.value === rawVal)) {
                      existing.conflictingReadings.push({
                        pageNumber: pageNum,
                        value: rawVal,
                        snippet: pageText.substring(Math.max(0, match.index - 20), Math.min(pageText.length, match.index + match[0].length + 20)).replace(/\n/g, ' ').trim()
                      });
                    }
                    const reviewMsg = `${def.name}: Discrepant values detected (${existing.rawValue}, ${rawVal}). Clinical review required.`;
                    if (!reviewItems.includes(reviewMsg)) {
                      reviewItems.push(reviewMsg);
                    }
                  }
                  break;
                }
              }
            }
          });
        }
      }
      continue; // Skip creating duplicate entry
    }

    const matchedReadings = [];

    // Search across each page to track exact page boundaries
    pages.forEach((page) => {
      const pageText = page.text || '';
      for (const pat of def.patterns) {
        const match = pageText.match(pat);
        if (match) {
          const rawVal = match[1];
          let rawUnit = match[2] || null; // Never fabricate defaultUnit!
          let rawRange = match[3] || null;

          // Guard against regex placing reference intervals into unit capture groups
          if (rawUnit && /^\d+\.?\d*\s*-\s*\d+\.?\d*$/i.test(rawUnit.trim())) {
            if (!rawRange) rawRange = rawUnit.trim();
            rawUnit = null;
          }
          if (rawUnit && /^(negative|nil|absent)/i.test(rawUnit.trim())) {
            if (!rawRange) rawRange = rawUnit.trim();
            rawUnit = null;
          }
          
          // Get snippet
          const matchIndex = match.index || 0;
          const start = Math.max(0, matchIndex - 20);
          const end = Math.min(pageText.length, matchIndex + match[0].length + 20);
          const snippet = pageText.substring(start, end).replace(/\n/g, ' ').trim();

          matchedReadings.push({
            pageNumber: page.pageNumber || 1,
            rawVal,
            rawUnit,
            rawRange,
            snippet,
            confidence: page.confidence || 0.95
          });
          break; // First match per page for this biomarker is sufficient
        }
      }
    });

    if (matchedReadings.length === 0) {
      // Never invent unmentioned fields!
      continue;
    }

    const first = matchedReadings[0];
    const isHyphenRange = typeof first.rawVal === 'string' && /^\d+\s*-\s*\d+/.test(first.rawVal.trim());
    const isQualitativeVal = typeof first.rawVal === 'string' && /^(negative|positive|nil|none|trace|absent|normal)/i.test(first.rawVal.trim());
    const cleanNumStr = typeof first.rawVal === 'string' ? first.rawVal.replace(/[<>]/g, '').replace(/,/g, '').trim() : '';
    const isValidSingleNum = !isHyphenRange && !isQualitativeVal && /^-?\d+(?:\.\d+)?$/.test(cleanNumStr);
    const numeric = isValidSingleNum ? parseFloat(cleanNumStr) : null;
    const isZero = numeric === 0;

    // Check for conflicting readings across pages
    const distinctValues = [...new Set(matchedReadings.map(r => r.rawVal))];
    const isConflicting = distinctValues.length > 1;
    const isLowConfidence = first.confidence < 0.70;
    const needsReview = isConflicting || isLowConfidence;

    let reviewReason = null;
    if (isConflicting) {
      reviewReason = `Conflicting values found: ${distinctValues.join(', ')} across pages.`;
      reviewItems.push(`${def.name}: Discrepant values detected (${distinctValues.join(', ')}). Clinical review required.`);
    } else if (isLowConfidence) {
      reviewReason = `OCR confidence is low (${(first.confidence * 100).toFixed(0)}%). Verify against physical document.`;
      reviewItems.push(`${def.name}: Low confidence scan reading.`);
    }

    // Determine status relative to reference range (preserve source range or mark unavailable)
    let refLow = null;
    let refHigh = null;
    let rawRange = first.rawRange || null;

    if (rawRange) {
      const parts = rawRange.split('-').map(p => parseFloat(p.trim().replace(/,/g, '')));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        refLow = parts[0];
        refHigh = parts[1];
      }
    } else {
      rawRange = 'Unavailable';
    }

    let status = 'NORMAL';
    if (def.isQualitative) {
      const lowerVal = (first.rawVal || '').toLowerCase().trim();
      if (['negative', 'nil', 'absent', 'normal', 'none seen'].includes(lowerVal)) {
        status = 'NORMAL';
      } else if (['trace', 'few', 'rare', 'occasional'].includes(lowerVal)) {
        status = 'NORMAL';
      } else if (['positive', 'present', 'moderate', 'many'].includes(lowerVal) || /\d+\+/.test(lowerVal)) {
        status = 'HIGH';
      } else {
        status = 'UNKNOWN';
      }
    } else {
      if (numeric != null) {
        if (typeof first.rawVal === 'string' && first.rawVal.startsWith('<')) {
          status = refLow != null && numeric < refLow ? 'LOW' : 'NORMAL';
        } else if (typeof first.rawVal === 'string' && first.rawVal.startsWith('>')) {
          status = refHigh != null && numeric > refHigh ? 'HIGH' : 'NORMAL';
        } else if (refLow != null && numeric < refLow) {
          status = 'LOW';
        } else if (refHigh != null && numeric > refHigh) {
          status = 'HIGH';
        } else {
          status = 'NORMAL';
        }
      } else if (isHyphenRange) {
        const rangeParts = first.rawVal.split('-').map(p => parseFloat(p.trim().replace(/,/g, '')));
        const maxObserved = Math.max(...rangeParts.filter(n => !isNaN(n)));
        if (!isNaN(maxObserved) && refHigh != null && maxObserved > refHigh) {
          status = 'HIGH';
        } else {
          status = 'NORMAL';
        }
      } else {
        status = 'UNKNOWN';
      }
    }

    let interpretation = 'Observed indicator resides within expected physiological limits.';
    if (status === 'NORMAL') {
      interpretation = `Within target clinical range (${rawRange}).`;
    } else if (status === 'HIGH') {
      interpretation = `Elevated above reference limit (${rawRange}).`;
    } else if (status === 'LOW') {
      interpretation = `Below reference floor (${rawRange}).`;
    }

    labResults.push({
      id: `bm-${uuidv4().slice(0, 8)}`,
      name: def.name,
      category: def.category,
      rawValue: first.rawVal,
      numericValue: numeric,
      isZero,
      unit: first.rawUnit || null, // Never fabricate defaultUnit!
      referenceRange: {
        low: refLow,
        high: refHigh,
        rawRange
      },
      status,
      interpretation,
      evidence: {
        presence: 'EXPLICIT',
        pageNumber: first.pageNumber,
        rawSnippet: first.snippet,
        confidence: first.confidence
      },
      flags: {
        isConflicting,
        isLowConfidence,
        needsUserReview: needsReview,
        reviewReason
      },
      conflictingReadings: isConflicting
        ? matchedReadings.map(r => ({ pageNumber: r.pageNumber, value: r.rawVal, snippet: r.snippet }))
        : []
    });
  }
}

/**
 * Extracts Medications Preserved As-Written
 */
function extractMedications(pages, fullText, medications, reviewItems) {
  pages.forEach(page => {
    const text = page.text || '';
    let match;
    const regex = new RegExp(MEDICATION_REGEX);

    while ((match = regex.exec(text)) !== null) {
      const medName = match[1].trim();
      const dosage = match[2].trim();
      const rest = match[3] ? match[3].trim() : '';

      // Extract frequency/duration from rest
      const freqMatch = rest.match(/\b(?:once daily|twice daily|thrice daily|bid|tid|qid|daily|prn|at bedtime)\b/i);
      const frequency = freqMatch ? freqMatch[0] : null;

      const durMatch = rest.match(/\b(?:for\s+\d+\s+(?:days?|weeks?|months?)|x\s+\d+\s+(?:days?|weeks?))\b/i);
      const duration = durMatch ? durMatch[0] : null;

      const fullSnippet = match[0].trim();
      const instructionsAsWritten = `${dosage}${rest ? ' ' + rest : ''}`.trim();
      const isAmbiguous = /as directed|prn|when needed/i.test(fullSnippet);

      if (isAmbiguous) {
        reviewItems.push(`${medName}: Ambiguous dosage/frequency ('${fullSnippet}'). Clarify with prescribing physician.`);
      }

      medications.push({
        id: `med-${uuidv4().slice(0, 8)}`,
        name: medName,
        dosage,
        frequency,
        route: /po|oral/i.test(rest) ? 'Oral' : 'Oral',
        duration,
        instructionsAsWritten: instructionsAsWritten || fullSnippet,
        evidence: {
          presence: 'EXPLICIT',
          pageNumber: page.pageNumber || 1,
          rawSnippet: fullSnippet,
          confidence: page.confidence || 0.95
        },
        flags: {
          isConflicting: false,
          isLowConfidence: false,
          needsUserReview: isAmbiguous,
          reviewReason: isAmbiguous ? 'Instruction contains conditional or ambiguous language' : null
        }
      });
    }
  });
}

/**
 * Extracts Imaging Modality and Findings
 */
function extractImaging(pages, fullText, imagingFindings) {
  const modalityMatch = fullText.match(/\b(X-Ray|Radiograph|MRI|CT Scan|Computed Tomography|Ultrasound|Sonography)\b/i);
  const modality = modalityMatch ? modalityMatch[1] : 'Imaging';

  const findingsMatch = fullText.match(/(?:FINDINGS|OBSERVATIONS)[\s:]+([\s\S]*?)(?:IMPRESSION|CONCLUSION|$)/i);
  const findingsText = findingsMatch ? findingsMatch[1].trim() : null;

  const impressionMatch = fullText.match(/(?:IMPRESSION|CONCLUSION)[\s:]+([\s\S]*?)(?:\n\n[A-Z\s]+:|$)/i);
  const impressionText = impressionMatch ? impressionMatch[1].trim() : null;

  if (findingsText || impressionText) {
    imagingFindings.push({
      id: `img-${uuidv4().slice(0, 8)}`,
      modality,
      anatomicalRegion: fullText.match(/\b(?:Chest|Lumbosacral Spine|Abdomen|Brain|Pelvis|Knee|Cervical Spine)\b/i)?.[0] || null,
      findingText: impressionText || findingsText,
      isNormal: !/(?:fracture|lesion|stenosis|consolidation|pneumothorax|effusion|herniation|protrusion)/i.test(impressionText || findingsText),
      evidence: {
        presence: 'EXPLICIT',
        pageNumber: 1,
        rawSnippet: impressionText || findingsText,
        confidence: 0.95
      },
      flags: {
        isConflicting: false,
        isLowConfidence: false,
        needsUserReview: false,
        reviewReason: null
      }
    });
  }
}

/**
 * Extracts Vaccination Doses & Lot Numbers
 */
function extractVaccinations(pages, fullText, vaccinations) {
  const vaxLines = fullText.split('\n');
  vaxLines.forEach(line => {
    const vaxMatch = line.match(/\b(COVID-19|Influenza|BCG|Hepatitis B|MMR|DTP|Tetanus|Polio|Pneumococcal|Varicella)\b[^\n]*?(?:Date[\s:]+)?(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})?/i);
    if (vaxMatch) {
      const vaxName = vaxMatch[1];
      const adminDate = vaxMatch[2] || null;
      const lotMatch = line.match(/\b(?:Lot|Batch)[\s#:]+([A-Za-z0-9-]+)\b/i);
      const doseMatch = line.match(/\b(?:Dose|Booster)[\s#:]*(\d+|Booster|Annual)\b/i);

      vaccinations.push({
        id: `vax-${uuidv4().slice(0, 8)}`,
        vaccineName: vaxName,
        doseNumber: doseMatch ? doseMatch[1] : null,
        administrationDate: adminDate,
        lotNumber: lotMatch ? lotMatch[1] : null,
        provider: fullText.match(/\b(?:Public Health|Clinic|Center|Hospital)\b/i)?.[0] || null,
        evidence: {
          presence: 'EXPLICIT',
          pageNumber: 1,
          rawSnippet: line.trim(),
          confidence: 0.95
        },
        flags: {
          isConflicting: false,
          isLowConfidence: false,
          needsUserReview: false,
          reviewReason: null
        }
      });
    }
  });
}

/**
 * Extracts Explicit Diagnoses (Primary & Secondary)
 */
function extractDiagnoses(pages, fullText, explicitDiagnoses) {
  const diagMatch = fullText.match(/(?:Admission Diagnosis|Discharge Diagnosis|Diagnosis|Assessment)[\s:]+([^\n\r]+)/i);
  if (diagMatch && diagMatch[1]) {
    const diagText = diagMatch[1].trim();
    if (diagText.length > 3) {
      explicitDiagnoses.push({
        diagnosis: diagText,
        type: 'PRIMARY',
        evidence: {
          presence: 'EXPLICIT',
          pageNumber: 1,
          rawSnippet: diagMatch[0],
          confidence: 0.95
        }
      });
    }
  }

  const commentMatch = fullText.match(/(?:Pathologist Comments|Clinical Impression|Impression)[\s:]+([^\n\r]+)/i);
  if (commentMatch && commentMatch[1]) {
    const cText = commentMatch[1].trim();
    if (cText.length > 3 && !explicitDiagnoses.some(d => d.diagnosis === cText)) {
      explicitDiagnoses.push({
        diagnosis: cText,
        type: 'PROVISIONAL',
        evidence: {
          presence: 'EXPLICIT',
          pageNumber: 1,
          rawSnippet: commentMatch[0],
          confidence: 0.95
        }
      });
    }
  }
}

/**
 * Extracts Follow-up and Return Instructions
 */
function extractFollowUps(pages, fullText, followUpInstructions) {
  const fuMatch = fullText.match(/(?:follow\s*up|review|return)[\s:]+([^\n\r]+)/i);
  if (fuMatch && fuMatch[1]) {
    const fuText = fuMatch[1].trim();
    const timeline = fuText.match(/\b(?:in\s+\d+\s+(?:days?|weeks?|months?)|after\s+\d+\s+(?:days?|weeks?)|prn|as needed)\b/i)?.[0] || null;
    followUpInstructions.push({
      instruction: fuText,
      timeline,
      evidence: {
        presence: 'EXPLICIT',
        pageNumber: 1,
        rawSnippet: fuMatch[0],
        confidence: 0.95
      }
    });
  }
}

/**
 * Extracts General Document Metadata with Date Verification
 */
function normalizeClinicalDate(rawDate) {
  if (!rawDate || typeof rawDate !== 'string') return null;
  const raw = rawDate.trim().replace(/[.,]+$/, '');
  const months = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
    apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
    aug: 8, august: 8, sep: 9, sept: 9, september: 9,
    oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12
  };
  const normalizeParts = (yearInput, monthInput, dayInput) => {
    let year = Number(yearInput);
    const month = typeof monthInput === 'string' ? months[monthInput.toLowerCase()] : Number(monthInput);
    const day = Number(dayInput);
    if (String(yearInput).length === 2) year += year < 50 ? 2000 : 1900;
    if (!Number.isInteger(year) || year < 1900 || year > 2100 ||
        !Number.isInteger(month) || month < 1 || month > 12 ||
        !Number.isInteger(day) || day < 1 || day > 31) return null;
    const checked = new Date(Date.UTC(year, month - 1, day));
    if (checked.getUTCFullYear() !== year || checked.getUTCMonth() !== month - 1 || checked.getUTCDate() !== day) return null;
    return [String(year), String(month).padStart(2, '0'), String(day).padStart(2, '0')].join('-');
  };

  let match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) return normalizeParts(match[1], match[2], match[3]);
  match = raw.match(/^(\d{1,2})[/-]([A-Za-z]{3,9})[/-](\d{2,4})$/);
  if (match) return normalizeParts(match[3], match[2], match[1]);
  match = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{2,4})$/);
  if (match) return normalizeParts(match[3], match[2], match[1]);
  match = raw.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{2,4})$/);
  if (match) return normalizeParts(match[3], match[1], match[2]);
  match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (match) {
    const first = Number(match[1]);
    const second = Number(match[2]);
    if (first > 12 && second <= 12) return normalizeParts(match[3], second, first);
    if (second > 12 && first <= 12) return normalizeParts(match[3], first, second);
    return normalizeParts(match[3], second, first);
  }
  return null;
}

function cleanMetadataValue(value, stopLabels = []) {
  if (typeof value !== 'string') return null;
  let result = value.trim();
  if (stopLabels.length) {
    const stopPattern = new RegExp('[;,]?\\s+(?=(?:' + stopLabels.join('|') + ')\\s*[:：=-])', 'i');
    result = result.split(stopPattern)[0].trim();
  }
  result = result.replace(/^[\s:：=-]+|[\s,;|]+$/g, '').replace(/\s{2,}/g, ' ');
  return result || null;
}

/**
 * Extract general document metadata from a wide range of hospital and lab report layouts.
 * Returns source-specific values rather than assigning a single date to every date field.
 */
export function extractDocumentMetadata(fullText, pages = []) {
  const text = typeof fullText === 'string' ? fullText : '';
  const lines = text.split(/\r?\n/).map(line => line.trim().replace(/\s{2,}/g, ' ')).filter(Boolean);
  const headerLines = lines.slice(0, 30);

  const labelledFacility = text.match(/\b(?:facility\s*name|laboratory\s*name|lab\s*name|hospital\s*name|clinic\s*name|diagnostic\s*centre\s*name|diagnostic\s*center\s*name)\s*[:：=-]\s*([^\r\n]{2,90})/i)?.[1] || null;
  const facilitySuffix = /(?:hospital|labs?|laborator(?:y|ies)|clinics?|diagnostics?|diagnostic\s+(?:centre|center)|medical\s+(?:centre|center)|healthcare|health\s+system|pathology|medical\s+institute|medical\s+college|health\s+services|associates|medical\s+trust|health\s+centre|health\s+center)$/i;
  const rejectFacilityLine = /(?:laboratory investigation report|investigation report|test report|clinical biochemistry|clinical pathology|kidney function test|complete blood count|reference range|patient name|collection date|reporting date|specimen date|sample date|bill\s+to|page\s+\d+)/i;
  const facilityLine = headerLines.find(line =>
    line.length >= 4 && line.length <= 90 &&
    facilitySuffix.test(line.replace(/[|•]+$/g, '').trim()) &&
    !rejectFacilityLine.test(line)
  );
  const facility = cleanMetadataValue(labelledFacility, [
    'branch', 'address', 'location', 'department', 'dept', 'phone', 'email', 'date', 'patient'
  ]) || facilityLine || null;

  const clinician = text.match(/\b(Dr\.?\s+[A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+){0,3}(?:,?\s*(?:MD|MBBS|MS|DNB|FRCS|DO|DM))?)\b/i)?.[1]?.trim() || null;

  const stopLabels = [
    'Age(?:\\s*\\/\\s*(?:Sex|Gender))?', 'Sex', 'Gender', 'Patient\\s*ID', 'UHID', 'MRN',
    'Registration\\s*(?:No\\.?|Number)', 'Lab\\s*ID', 'Date', 'Visit\\s*Date',
    'Collection\\s*Date', 'Reporting\\s*Date', 'Sample\\s*Date', 'Specimen\\s*Date',
    'Ref(?:erred)?\\s*By', 'Doctor', 'Dr\\.?'
  ];
  const patientNameRaw = text.match(/\b(?:patient\s*name|name\s+of\s+patient)\s*[:：=-]\s*([^\r\n]+)/i)?.[1]
    || text.match(/(?:^|\n)\s*patient\s*[:：=-]\s*([^\r\n]+)/i)?.[1]
    || null;
  const patientName = cleanMetadataValue(patientNameRaw, stopLabels);
  const patientIdentifier = text.match(/\b(?:patient\s*id|uhid|mrn|medical\s*record\s*(?:no\.?|number)|registration\s*(?:no\.?|number)|lab\s*id|patient\s*(?:no\.?|number))\s*[:：=-]\s*([A-Z0-9][A-Z0-9./_-]{2,})/i)?.[1]?.trim() || null;

  const ageSexLine = text.match(/\b(?:age\s*\/\s*(?:sex|gender)|age\s+and\s+(?:sex|gender))\s*[:：=-]\s*([^\r\n]+)/i)?.[1] || '';
  const ageRaw = text.match(/\bage\s*[:：=-]\s*(\d{1,3}(?:\.\d+)?\s*(?:years?|yrs?\.?|yr|y|months?|mos?\.?|days?)?)/i)?.[1]
    || ageSexLine.match(/^\s*(\d{1,3}(?:\.\d+)?\s*(?:years?|yrs?\.?|yr|y|months?|mos?\.?|days?)?)/i)?.[1]
    || null;
  const patientAge = ageRaw ? ageRaw.trim().replace(/\s+/g, ' ') : null;
  const labelledSex = text.match(/\b(?:sex|gender)\s*[:：=-]\s*(female|male|non[- ]?binary|other|unknown|f|m)\b/i)?.[1] || null;
  const combinedSex = ageSexLine.match(/\b(female|male|non[- ]?binary|other|unknown)\b/i)?.[1]
    || ageSexLine.match(/(?:^|[\/,\s])(F|M)(?:\s*$|[\/,\s])/i)?.[1]
    || null;
  const rawSex = labelledSex || combinedSex;
  const patientSex = rawSex
    ? (/^(f|female)$/i.test(rawSex) ? 'Female' : (/^(m|male)$/i.test(rawSex) ? 'Male' : rawSex.replace(/[- ]/g, ' ').replace(/\b\w/g, char => char.toUpperCase())))
    : null;

  const multiDateMatch = text.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})(?:\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}))?\b/);
  const dateValuePattern = '(\\d{4}-\\d{2}-\\d{2}|\\d{1,2}[/-](?:\\d{1,2}|[A-Za-z]{3,9})[/-]\\d{2,4}|\\d{1,2}\\s+[A-Za-z]{3,9}\\s+\\d{2,4}|[A-Za-z]{3,9}\\s+\\d{1,2},?\\s+\\d{2,4})';
  const matchDateLabel = labels => text.match(new RegExp(
    '\\b(?:' + labels + ')\\s*[:：=–-]?\\s*' + dateValuePattern,
    'i'
  ));
  const reportDateMatch = matchDateLabel('Reporting\\s+Date(?:\\s*\\/\\s*Time)?|Reported\\s+Date(?:\\s*\\/\\s*Time)?|Report\\s+Date(?:\\s*\\/\\s*Time)?|Date\\s+of\\s+(?:Report|Issue|Study)');
  const visitDateMatch = matchDateLabel('Clinical\\s+Encounter\\s+Date|Encounter\\s+Date|Visit\\s+Date|Appointment\\s+Date|Consultation\\s+Date');
  const collectionDateMatch = matchDateLabel('Collection\\s+Date(?:\\s*\\/\\s*Time)?|Date\\s+of\\s+Collection|Collected\\s+Date|Sample\\s+Collection\\s+Date|Specimen\\s+Collection\\s+Date|Specimen\\s+Date|Sample\\s+Date|Date\\s+of\\s+Test|Test\\s+Date|Receipt\\s+Date(?:\\s*\\/\\s*Time)?|Received\\s+Date|Registration\\s+Date(?:\\s*\\/\\s*Time)?|Date\\s+Drawn');
  const genericDateMatch = matchDateLabel('Date|Dated');
  const selectedReportMatch = reportDateMatch || genericDateMatch || collectionDateMatch || visitDateMatch;
  const reportDateRaw = selectedReportMatch?.[1]?.trim() || null;
  const visitDateRaw = visitDateMatch?.[1]?.trim() || collectionDateMatch?.[1]?.trim() || genericDateMatch?.[1]?.trim() || null;
  const collectionDateRaw = collectionDateMatch?.[1]?.trim() || null;
  const reportDateExplicit = Boolean(reportDateMatch);
  const usedMultiDateFallback = !selectedReportMatch && Boolean(multiDateMatch);
  const normalizedReportDate = normalizeClinicalDate(reportDateRaw) || (usedMultiDateFallback ? normalizeClinicalDate(multiDateMatch[1]) : null);
  const normalizedVisitDate = normalizeClinicalDate(visitDateRaw) || normalizedReportDate || null;
  const normalizedCollectionDate = normalizeClinicalDate(collectionDateRaw) || null;
  const documentDate = normalizedReportDate || normalizedCollectionDate || normalizedVisitDate || null;
  const rawDateEvidence = reportDateRaw || collectionDateRaw || visitDateRaw || (usedMultiDateFallback ? multiDateMatch[1] : null);
  const datePresence = !rawDateEvidence ? 'MISSING' : (usedMultiDateFallback ? 'UNCERTAIN' : 'EXPLICIT');
  const reportDatePresence = !reportDateRaw ? (usedMultiDateFallback ? 'UNCERTAIN' : 'MISSING') : (reportDateExplicit ? 'EXPLICIT' : 'INFERRED');
  const visitDatePresence = (visitDateMatch || collectionDateMatch) ? 'EXPLICIT' : (genericDateMatch ? 'INFERRED' : 'MISSING');

  return {
    facilityName: facility,
    clinicianName: clinician,
    documentDate,
    reportDate: normalizedReportDate,
    visitDate: normalizedVisitDate,
    collectionDate: normalizedCollectionDate,
    patientIdentifier,
    patientName,
    patientAge,
    patientSex,
    evidence: {
      facility: { presence: facility ? 'EXPLICIT' : 'MISSING', pageNumber: 1, rawSnippet: facility, confidence: facility ? 0.95 : null },
      clinician: { presence: clinician ? 'EXPLICIT' : 'MISSING', pageNumber: 1, rawSnippet: clinician, confidence: clinician ? 0.95 : null },
      date: { presence: datePresence, pageNumber: 1, rawSnippet: rawDateEvidence, confidence: rawDateEvidence ? (usedMultiDateFallback ? 0.55 : 0.90) : null },
      reportDate: { presence: reportDatePresence, pageNumber: 1, rawSnippet: reportDateRaw, confidence: reportDateRaw ? (reportDateExplicit ? 0.97 : 0.78) : null },
      visitDate: { presence: visitDatePresence, pageNumber: 1, rawSnippet: visitDateRaw, confidence: visitDateRaw ? 0.92 : null },
      collectionDate: { presence: collectionDateRaw ? 'EXPLICIT' : 'MISSING', pageNumber: 1, rawSnippet: collectionDateRaw, confidence: collectionDateRaw ? 0.95 : null },
      patient: { presence: patientName ? 'EXPLICIT' : 'MISSING', pageNumber: 1, rawSnippet: patientName, confidence: patientName ? 0.95 : null },
      patientName: { presence: patientName ? 'EXPLICIT' : 'MISSING', pageNumber: 1, rawSnippet: patientName, confidence: patientName ? 0.95 : null },
      age: { presence: patientAge ? 'EXPLICIT' : 'MISSING', pageNumber: 1, rawSnippet: patientAge, confidence: patientAge ? 0.90 : null },
      sex: { presence: patientSex ? 'EXPLICIT' : 'MISSING', pageNumber: 1, rawSnippet: patientSex, confidence: patientSex ? 0.90 : null },
      patientIdentifier: { presence: patientIdentifier ? 'EXPLICIT' : 'MISSING', pageNumber: 1, rawSnippet: patientIdentifier, confidence: patientIdentifier ? 0.95 : null }
    }
  };
}
/**
 * Generates Evidence-Linked Plain-Language Explanation
 */
function generatePlainSummary({
  category,
  metadata,
  labResults,
  medications,
  imagingFindings,
  explicitDiagnoses,
  followUpInstructions,
  requiresHumanReview,
  reviewItems
}) {
  const findings = [];
  const questions = [];

  const facilityStr = metadata.facilityName ? ` at ${metadata.facilityName}` : '';
  const dateStr = metadata.documentDate ? ` on ${metadata.documentDate}` : '';
  let overview = `Summary of your ${category}${facilityStr}${dateStr}.`;

  if (category === 'Lab Report') {
    const abnormal = labResults.filter(l => l.status === 'HIGH' || l.status === 'LOW');
    if (abnormal.length > 0) {
      overview += ` Out of ${labResults.length} test parameter(s), ${abnormal.length} reside outside standard reference ranges.`;
      abnormal.forEach(a => {
        findings.push(`${a.name} is ${a.status === 'HIGH' ? 'elevated' : 'below reference bounds'} (${a.rawValue} ${a.unit || ''}). Normal target: ${a.referenceRange.rawRange}.`);
        questions.push(`Ask your doctor about the clinical significance of your ${a.name} reading.`);
      });
    } else if (labResults.length > 0) {
      overview += ` All ${labResults.length} verified laboratory parameter(s) reside within desired clinical target limits.`;
      findings.push('All measured markers reside within target boundaries.');
    }
  }

  if (category === 'Prescription') {
    overview += ` Document contains ${medications.length} explicitly documented prescription medication(s).`;
    medications.forEach(m => {
      findings.push(`${m.name}: ${m.dosage || ''} ${m.instructionsAsWritten}`);
    });
    questions.push('Confirm duration and dosage schedule with your pharmacist or prescribing clinician.');
  }

  if (category === 'Scan/Imaging Report') {
    if (imagingFindings.length > 0) {
      const img = imagingFindings[0];
      overview += ` Imaging scan (${img.modality}) indicates: ${img.findingText}`;
      findings.push(img.findingText);
      questions.push('Discuss the imaging findings and next diagnostic steps with your ordering doctor.');
    }
  }

  if (explicitDiagnoses.length > 0) {
    findings.push(`Documented clinical impression: ${explicitDiagnoses.map(d => d.diagnosis).join(', ')}`);
  }

  if (followUpInstructions.length > 0) {
    findings.push(`Follow-up recommendation: ${followUpInstructions.map(f => f.instruction).join('; ')}`);
  }

  if (reviewItems.length > 0) {
    reviewItems.forEach(item => questions.push(`Clarify with provider: ${item}`));
  }

  if (questions.length === 0) {
    questions.push('Review these results with your treating clinician during your next scheduled visit.');
  }

  return {
    overview,
    keyFindings: findings.slice(0, 5),
    whatToAskDoctor: questions.slice(0, 4),
    disclaimer: 'Notice: This AI explanation summarizes explicitly documented statements from your medical record. It does NOT provide a diagnosis, medical advice, or treatment recommendation. Always consult your qualified healthcare provider regarding your health.'
  };
}
