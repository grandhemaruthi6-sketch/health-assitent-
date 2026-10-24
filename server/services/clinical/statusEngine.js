import { STATUS_THRESHOLDS, QUALITATIVE_CLASSIFICATIONS } from '../../config/statusConfig.js';

/**
 * Parses raw reference interval into structured limits
 * Handles:
 *  - Standard two-sided: "12.0 - 16.0", "150000 - 450000", "4.0 to 11.0"
 *  - One-sided upper: "< 200", "<= 200", "Up to 150", "Desirable: < 200"
 *  - One-sided lower: "> 50", ">= 50", ">50 mg/dL"
 *  - Qualitative: "Negative", "Nil", "Non-reactive"
 */
export function parseReferenceRange(rawRange) {
  if (!rawRange || typeof rawRange !== 'string') {
    return { type: 'MISSING', raw: null };
  }

  const clean = rawRange.trim();
  if (!clean || clean.toLowerCase() === 'unavailable' || clean === '—' || clean === '-') {
    return { type: 'MISSING', raw: clean };
  }

  // 1. Check one-sided upper: < 200, <= 150, <200
  const upperMatch = clean.match(/^[<≤]\s*=?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i) ||
    clean.match(/\b(?:less than|up to|<)\s*=?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);
  if (upperMatch) {
    const limit = parseFloat(upperMatch[1].replace(/,/g, ''));
    if (!isNaN(limit)) {
      return { type: 'ONE_SIDED_UPPER', upperLimit: limit, raw: clean };
    }
  }

  // 2. Check one-sided lower: > 50, >= 60, >50
  const lowerMatch = clean.match(/^[>≥]\s*=?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i) ||
    clean.match(/\b(?:greater than|more than|>)\s*=?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);
  if (lowerMatch) {
    const limit = parseFloat(lowerMatch[1].replace(/,/g, ''));
    if (!isNaN(limit)) {
      return { type: 'ONE_SIDED_LOWER', lowerLimit: limit, raw: clean };
    }
  }

  // 3. Check standard two-sided: "12.0 - 16.0", "12 to 16", "130-170"
  const twoSidedMatch = clean.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);
  if (twoSidedMatch) {
    const low = parseFloat(twoSidedMatch[1].replace(/,/g, ''));
    const high = parseFloat(twoSidedMatch[2].replace(/,/g, ''));
    if (!isNaN(low) && !isNaN(high) && low < high) {
      return { type: 'TWO_SIDED', low, high, raw: clean };
    }
  }

  // 4. Qualitative text: "Negative", "Nil", "Absent"
  const lowerClean = clean.toLowerCase();
  for (const term of QUALITATIVE_CLASSIFICATIONS.NORMAL_TERMS) {
    if (lowerClean.includes(term)) {
      return { type: 'QUALITATIVE', expected: 'NORMAL', raw: clean };
    }
  }

  return { type: 'UNKNOWN', raw: clean };
}

/**
 * Evaluates observed value strictly against the report's reference range.
 * Zero hardcoded test ranges. Statuses:
 * - in_range
 * - slightly_outside
 * - clearly_outside
 * - far_outside
 * - needs_review
 *
 * @param {Object} input
 * @param {string|number} input.value - Observed value (e.g. 17.1, "17.1", "Negative", "1+")
 * @param {string} input.referenceRange - Report's own reference interval (e.g. "12.0 - 16.0", "< 200")
 * @param {string} [input.unit] - Clinical unit
 * @returns {Object} Structured deterministic status result
 */
export function evaluateBiomarkerStatus({ value, referenceRange, unit = null }) {
  // Guard missing or unreadable values
  if (value === null || value === undefined || value === '' || value === 'N/A') {
    return {
      status: 'needs_review',
      direction: 'UNKNOWN',
      deviationPercent: null,
      severityLabel: 'Needs review',
      arrow: '?',
      reviewReason: 'Observed value is missing or unreadable.'
    };
  }

  const parsedRange = parseReferenceRange(referenceRange);

  if (parsedRange.type === 'MISSING' || parsedRange.type === 'UNKNOWN') {
    return {
      status: 'needs_review',
      direction: 'UNKNOWN',
      deviationPercent: null,
      severityLabel: 'Needs review',
      arrow: '?',
      reviewReason: 'Reference interval was not specified in the source document.'
    };
  }

  // Check if value is numeric
  const cleanValStr = typeof value === 'string' ? value.replace(/,/g, '').trim() : String(value);
  const numericVal = parseFloat(cleanValStr);
  const isNumeric = !isNaN(numericVal) && !/^[><]/.test(cleanValStr);

  // =========================================================================
  // 1. QUALITATIVE EVALUATION
  // =========================================================================
  if (parsedRange.type === 'QUALITATIVE' || !isNumeric) {
    const textVal = String(value).toLowerCase().trim();

    if (QUALITATIVE_CLASSIFICATIONS.NORMAL_TERMS.has(textVal)) {
      return {
        status: 'in_range',
        direction: 'IN_RANGE',
        deviationPercent: 0,
        severityLabel: 'In range',
        arrow: '✓',
        reviewReason: null
      };
    }
    if (QUALITATIVE_CLASSIFICATIONS.SLIGHT_TERMS.has(textVal)) {
      return {
        status: 'slightly_outside',
        direction: 'HIGHER',
        deviationPercent: 0.10,
        severityLabel: 'Slightly outside',
        arrow: '↑',
        reviewReason: null
      };
    }
    if (QUALITATIVE_CLASSIFICATIONS.CLEAR_TERMS.has(textVal)) {
      return {
        status: 'clearly_outside',
        direction: 'HIGHER',
        deviationPercent: 0.25,
        severityLabel: 'Clearly outside',
        arrow: '↑',
        reviewReason: null
      };
    }
    if (QUALITATIVE_CLASSIFICATIONS.FAR_TERMS.has(textVal)) {
      return {
        status: 'far_outside',
        direction: 'HIGHER',
        deviationPercent: 0.50,
        severityLabel: 'Far outside',
        arrow: '↑',
        reviewReason: null
      };
    }

    return {
      status: 'needs_review',
      direction: 'UNKNOWN',
      deviationPercent: null,
      severityLabel: 'Needs review',
      arrow: '?',
      reviewReason: `Qualitative value '${value}' does not match standard clinical reference mappings.`
    };
  }

  // =========================================================================
  // 2. TWO-SIDED NUMERIC RANGE EVALUATION
  // =========================================================================
  if (parsedRange.type === 'TWO_SIDED') {
    const { low, high } = parsedRange;
    const rangeSpan = high - low;

    if (numericVal >= low && numericVal <= high) {
      return {
        status: 'in_range',
        direction: 'IN_RANGE',
        deviationPercent: 0,
        severityLabel: 'In range',
        arrow: '✓',
        reviewReason: null
      };
    }

    if (numericVal > high) {
      const diff = numericVal - high;
      const deviation = rangeSpan > 0 ? diff / rangeSpan : diff / high;
      return assignDeviationStatus(deviation, 'HIGHER');
    }

    if (numericVal < low) {
      const diff = low - numericVal;
      const deviation = rangeSpan > 0 ? diff / rangeSpan : diff / low;
      return assignDeviationStatus(deviation, 'LOWER');
    }
  }

  // =========================================================================
  // 3. ONE-SIDED UPPER RANGE (< X)
  // =========================================================================
  if (parsedRange.type === 'ONE_SIDED_UPPER') {
    const limit = parsedRange.upperLimit;

    if (numericVal <= limit) {
      return {
        status: 'in_range',
        direction: 'IN_RANGE',
        deviationPercent: 0,
        severityLabel: 'In range',
        arrow: '✓',
        reviewReason: null
      };
    }

    const diff = numericVal - limit;
    const deviation = limit > 0 ? diff / limit : diff;
    return assignDeviationStatus(deviation, 'HIGHER');
  }

  // =========================================================================
  // 4. ONE-SIDED LOWER RANGE (> X)
  // =========================================================================
  if (parsedRange.type === 'ONE_SIDED_LOWER') {
    const limit = parsedRange.lowerLimit;

    if (numericVal >= limit) {
      return {
        status: 'in_range',
        direction: 'IN_RANGE',
        deviationPercent: 0,
        severityLabel: 'In range',
        arrow: '✓',
        reviewReason: null
      };
    }

    const diff = limit - numericVal;
    const deviation = limit > 0 ? diff / limit : diff;
    return assignDeviationStatus(deviation, 'LOWER');
  }

  return {
    status: 'needs_review',
    direction: 'UNKNOWN',
    deviationPercent: null,
    severityLabel: 'Needs review',
    arrow: '?',
    reviewReason: 'Unable to evaluate value against reference range format.'
  };
}

/**
 * Maps deviation proportion to status using configuration thresholds
 */
function assignDeviationStatus(deviation, direction) {
  const percent = Math.round(deviation * 100);
  const arrow = direction === 'HIGHER' ? '↑' : '↓';

  if (deviation <= STATUS_THRESHOLDS.SLIGHTLY_OUTSIDE_MAX) {
    return {
      status: 'slightly_outside',
      direction,
      deviationPercent: percent,
      severityLabel: 'Slightly outside',
      arrow,
      reviewReason: null
    };
  }

  if (deviation <= STATUS_THRESHOLDS.CLEARLY_OUTSIDE_MAX) {
    return {
      status: 'clearly_outside',
      direction,
      deviationPercent: percent,
      severityLabel: 'Clearly outside',
      arrow,
      reviewReason: null
    };
  }

  return {
    status: 'far_outside',
    direction,
    deviationPercent: percent,
    severityLabel: 'Far outside',
    arrow,
    reviewReason: null
  };
}
