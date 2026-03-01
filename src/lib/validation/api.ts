import { z } from "zod";

const uuidSchema = z.string().uuid();

export const createTeamSchema = z.object({
  type: z.enum(["department", "region"]),
  slug: z.string().min(2).max(80),
  name: z.string().min(2).max(120),
});

export const updateTeamSchema = z.object({
  slug: z.string().min(2).max(80).optional(),
  name: z.string().min(2).max(120).optional(),
});

export const addTeamMemberSchema = z.object({
  userId: uuidSchema,
  isPrimary: z.boolean().optional(),
});

export const createReportingLineSchema = z.object({
  managerUserId: uuidSchema,
  reportUserId: uuidSchema,
});

export const createCycleSchema = z.object({
  type: z.enum(["annual", "quarterly"]),
  name: z.string().min(2).max(80),
  startDate: z.string().date(),
  endDate: z.string().date(),
});

export const updateCycleSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  isActive: z.boolean().optional(),
});

export const createAimSchema = z.object({
  cycleId: uuidSchema.optional(),
  scope: z.enum(["org", "team", "user"]),
  teamId: uuidSchema.nullable().optional(),
  ownerUserId: uuidSchema.nullable().optional(),
  parentAimId: uuidSchema.nullable().optional(),
  title: z.string().min(2).max(240),
  narrativeJson: z.record(z.string(), z.unknown()).optional(),
  scriptureAnchor: z.string().nullable().optional(),
  whyThisMatters: z.string().nullable().optional(),
  classification: z.enum(["normal", "sensitive", "restricted"]).optional(),
});

export const updateAimSchema = createAimSchema.partial();

export const createMeasureSchema = z.object({
  aimId: uuidSchema,
  kind: z.enum(["lead", "lag", "health", "learning"]),
  ownerUserId: uuidSchema.nullable().optional(),
  name: z.string().min(2).max(180),
  cadence: z.enum(["weekly", "monthly", "quarterly"]).optional(),
  unit: z
    .enum([
      "count",
      "percent",
      "currency",
      "hours",
      "score",
      "yes_no",
      "narrative",
      "custom",
    ])
    .optional(),
  unitLabel: z.string().nullable().optional(),
  direction: z.string().optional(),
  baseline: z.number().nullable().optional(),
  target: z.number().nullable().optional(),
  targetDate: z.string().date().nullable().optional(),
  confidenceScore: z.number().int().min(1).max(5).optional(),
  definitionText: z.string().optional(),
  notesJson: z.record(z.string(), z.unknown()).optional(),
});

export const updateMeasureSchema = createMeasureSchema.partial();

export const createMeasureUpdateSchema = z.object({
  asOfDate: z.string().date(),
  valueNumeric: z.number().nullable().optional(),
  valueText: z.string().nullable().optional(),
  commentJson: z.record(z.string(), z.unknown()).optional(),
});

export const createCommitmentSchema = z.object({
  cycleId: uuidSchema.nullable().optional(),
  aimId: uuidSchema.nullable().optional(),
  measureId: uuidSchema.nullable().optional(),
  ownerUserId: uuidSchema.optional(),
  teamId: uuidSchema.nullable().optional(),
  title: z.string().min(2).max(200),
  detailsJson: z.record(z.string(), z.unknown()).optional(),
  status: z
    .enum(["planned", "in_progress", "blocked", "done", "dropped"])
    .optional(),
  priorityRank: z.number().int().min(0).optional(),
  weight: z.number().int().min(0).max(100).optional(),
  dueDate: z.string().date().nullable().optional(),
  recurringRule: z.string().nullable().optional(),
  estimatedMinutes: z.number().int().min(0).nullable().optional(),
  classification: z.enum(["normal", "sensitive", "restricted"]).optional(),
});

export const updateCommitmentSchema = createCommitmentSchema.partial();

export const reorderCommitmentsSchema = z.object({
  items: z.array(
    z.object({
      commitmentId: uuidSchema,
      priorityRank: z.number().int().min(0),
    })
  ),
});

export const upsertCheckinSchema = z.object({
  weekStart: z.string().date(),
  highlightsJson: z.record(z.string(), z.unknown()).optional(),
  progressJson: z.record(z.string(), z.unknown()).optional(),
  blockersJson: z.record(z.string(), z.unknown()).optional(),
  asksJson: z.record(z.string(), z.unknown()).optional(),
  prayerJson: z.record(z.string(), z.unknown()).optional(),
  nextWeekJson: z.record(z.string(), z.unknown()).optional(),
});

export const createStorySchema = z.object({
  teamId: uuidSchema.nullable().optional(),
  cycleId: uuidSchema.nullable().optional(),
  aimId: uuidSchema.nullable().optional(),
  type: z.enum(["quick", "msc_candidate"]).optional(),
  title: z.string().min(2).max(200),
  bodyJson: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  classification: z.enum(["normal", "sensitive", "restricted"]).optional(),
});

export const createPrayerItemSchema = z.object({
  teamId: uuidSchema.nullable().optional(),
  aimId: uuidSchema.nullable().optional(),
  ownerUserId: uuidSchema.nullable().optional(),
  text: z.string().min(2).max(500),
  status: z.enum(["open", "answered", "closed"]).optional(),
  classification: z.enum(["normal", "sensitive", "restricted"]).optional(),
});

export const createMissionarySchema = z.object({
  regionTeamId: uuidSchema,
  codeName: z.string().nullable().optional(),
  publicName: z.string().nullable().optional(),
  status: z.string().optional(),
  locationText: z.string().nullable().optional(),
  classification: z.enum(["normal", "sensitive", "restricted"]).optional(),
});

export const upsertMissionaryUpdateSchema = z.object({
  month: z.string().date(),
  summaryJson: z.record(z.string(), z.unknown()).optional(),
  prayerJson: z.record(z.string(), z.unknown()).optional(),
  leadMetrics: z.record(z.string(), z.unknown()).optional(),
  lagMetrics: z.record(z.string(), z.unknown()).optional(),
  classification: z.enum(["normal", "sensitive", "restricted"]).optional(),
});
