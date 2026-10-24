/**
 * Deterministic Clinical Status Thresholds & Configuration
 * Statuses: in_range, slightly_outside, clearly_outside, far_outside, needs_review
 * Based on percentage deviation from the nearest reference range boundary.
 */
export const STATUS_THRESHOLDS = {
  // Deviation <= 0: inside reference range
  // Deviation > 0 and <= SLIGHTLY_OUTSIDE_MAX: slightly_outside (<= 15% outside range)
  SLIGHTLY_OUTSIDE_MAX: 0.15,

  // Deviation > 0.15 and <= CLEARLY_OUTSIDE_MAX: clearly_outside (15% to 40% outside range)
  CLEARLY_OUTSIDE_MAX: 0.40

  // Deviation > 0.40: far_outside (> 40% outside range)
};

/**
 * Standard Qualitative Result Classifications
 */
export const QUALITATIVE_CLASSIFICATIONS = {
  NORMAL_TERMS: new Set([
    'negative', 'nil', 'absent', 'normal', 'none seen', 'not detected', 'non-reactive', 'clear'
  ]),
  SLIGHT_TERMS: new Set([
    'trace', 'few', 'rare', 'occasional', 'borderline'
  ]),
  CLEAR_TERMS: new Set([
    'positive', 'present', 'reactive', '1+', '2+', 'detected', 'cloudy'
  ]),
  FAR_TERMS: new Set([
    '3+', '4+', 'moderate', 'many', 'large', 'heavily positive', 'grossly elevated'
  ])
};

export const STATUS_ORDER = {
  far_outside: 1,
  clearly_outside: 2,
  slightly_outside: 3,
  needs_review: 4,
  in_range: 5
};
