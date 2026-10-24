import { z } from 'zod';

export const HealthSummaryLanguageSchema = z.enum(['en', 'te', 'hi']);

export const FindingReferenceItemSchema = z.object({
  name: z.string(),
  value: z.string(),
  unit: z.string().nullable().default(null),
  referenceRange: z.string().default('Unavailable'),
  status: z.string().default('NORMAL'),
  sourceFindingId: z.string().default('unknown')
});

export const FlaggedExplanationSchema = z.object({
  name: z.string(),
  meaning: z.string(),
  sourceFindingId: z.string().default('unknown')
});

export const HistoricalComparisonSchema = z.object({
  name: z.string(),
  currentDate: z.string(),
  currentValue: z.string(),
  priorDate: z.string(),
  priorValue: z.string(),
  unit: z.string().default(''),
  trend: z.enum(['INCREASED', 'DECREASED', 'STABLE']),
  observation: z.string()
});

export const UncertaintyNoticeSchema = z.object({
  name: z.string(),
  reason: z.string(),
  sourceFindingId: z.string().default('unknown')
});

export const GroundingMetadataSchema = z.object({
  totalFindingsEvaluated: z.number().int().nonnegative(),
  verifiedCount: z.number().int().nonnegative(),
  uncertainCount: z.number().int().nonnegative(),
  generatedAt: z.string()
});

/**
 * Step 5 Rich Card Structure Schemas
 */
export const OutsideRangeCardSchema = z.object({
  testName: z.string(),
  displayName: z.string(),
  value: z.string(),
  unit: z.string().nullable().default(null),
  labRange: z.string().default('Unavailable'),
  status: z.enum(['in_range', 'slightly_outside', 'clearly_outside', 'far_outside', 'needs_review']),
  direction: z.enum(['HIGHER', 'LOWER', 'IN_RANGE', 'UNKNOWN']),
  arrow: z.string(),
  severityLabel: z.string(),
  sourceReport: z.string(),
  reportDate: z.string(),
  whatIsThisTest: z.string(),
  whatResultShows: z.string(),
  commonReasons: z.array(z.string()).default([]),
  questionsForDoctor: z.array(z.string()).default([]),
  urgentDoctorNotice: z.string().nullable().default(null),
  isUnknown: z.boolean().default(false),
  aiGeneralInfo: z.string().nullable().default(null),
  area: z.string().default('other')
});

export const GroupedAreaSchema = z.object({
  areaKey: z.string(),
  areaTitle: z.string(),
  sentence: z.string(),
  testCount: z.number().int(),
  outsideCount: z.number().int()
});

export const AllResultRowSchema = z.object({
  testName: z.string(),
  displayName: z.string(),
  value: z.string(),
  unit: z.string().nullable().default(null),
  labRange: z.string().default('Unavailable'),
  status: z.enum(['in_range', 'slightly_outside', 'clearly_outside', 'far_outside', 'needs_review']),
  arrow: z.string(),
  plainMeaning: z.string(),
  area: z.string().default('other')
});

export const StatusBannerSchema = z.object({
  headline: z.string(),
  subtext: z.string().nullable().default(null),
  allInRange: z.boolean(),
  outsideCount: z.number().int(),
  totalCount: z.number().int(),
  unreadableCount: z.number().int()
});

export const EvidenceGroundedHealthSummarySchema = z.object({
  version: z.number().int().default(1),
  language: HealthSummaryLanguageSchema,
  reportId: z.string(),
  overview: z.string(),
  statusBanner: StatusBannerSchema.optional(),
  outsideRangeCards: z.array(OutsideRangeCardSchema).default([]),
  groupedAreas: z.array(GroupedAreaSchema).default([]),
  allResults: z.array(AllResultRowSchema).default([]),
  whatToDoNext: z.array(z.string()).default([]),
  footerNotice: z.string().default('Not a diagnosis. Your doctor decides.'),

  // Legacy/Compatibility fields
  withinReferenceRange: z.array(FindingReferenceItemSchema).default([]),
  outsideReferenceRange: z.array(FindingReferenceItemSchema).default([]),
  flaggedExplanations: z.array(FlaggedExplanationSchema).default([]),
  historicalComparisons: z.array(HistoricalComparisonSchema).default([]),
  uncertainties: z.array(UncertaintyNoticeSchema).default([]),
  nextSteps: z.array(z.string()).default([]),
  disclaimer: z.string(),
  groundingMetadata: GroundingMetadataSchema
});
