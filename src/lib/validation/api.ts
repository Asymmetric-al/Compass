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

export const createRoleAssignmentSchema = z.object({
  userId: uuidSchema,
  role: z.enum([
    "co_ed",
    "admin",
    "staff",
    "department_director",
    "department_staff",
    "regional_director",
    "regional_staff",
    "read_only",
  ]),
  teamId: uuidSchema.nullable().optional(),
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

const goalSchemaBase = z.object({
  scopeType: z.enum(["org", "team", "user"]),
  scopeTeamId: uuidSchema.nullable().optional(),
  scopeUserId: uuidSchema.nullable().optional(),
  title: z.string().min(2).max(240),
  descriptionJson: z.record(z.string(), z.unknown()).nullable().optional(),
  descriptionText: z.string().nullable().optional(),
  status: z.enum(["draft", "active", "done", "dropped"]).optional(),
  timeboxType: z.enum(["annual", "quarterly", "monthly", "weekly", "custom"]),
  startDate: z.string().date(),
  endDate: z.string().date(),
  parentGoalId: uuidSchema.nullable().optional(),
  visibility: z.enum(["org", "team", "private"]).optional(),
  classification: z.enum(["normal", "sensitive", "restricted"]).optional(),
});

export const createGoalSchema = goalSchemaBase.refine(
  (value) => value.startDate <= value.endDate,
  {
    message: "startDate must be before or equal to endDate",
    path: ["endDate"],
  }
);

export const updateGoalSchema = goalSchemaBase
  .partial()
  .superRefine((value, ctx) => {
    if (
      value.startDate !== undefined &&
      value.endDate !== undefined &&
      value.startDate > value.endDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "startDate must be before or equal to endDate",
        path: ["endDate"],
      });
    }
  });

export const createGoalLinkSchema = z.object({
  upstreamGoalId: uuidSchema,
  linkType: z.enum(["supports", "related"]).optional(),
});

export const createGoalMeasureSchema = z.object({
  kind: z.enum(["lead", "outcome"]),
  name: z.string().min(2).max(180),
  unit: z.string().nullable().optional(),
  format: z.enum(["number", "percent", "boolean", "text"]).optional(),
  startValue: z.number().nullable().optional(),
  targetValue: z.number().nullable().optional(),
  currentValue: z.number().nullable().optional(),
  updateCadence: z.enum(["weekly", "monthly", "ad_hoc"]).optional(),
});

export const createGoalMeasureUpdateSchema = z.object({
  value: z.number().nullable().optional(),
  noteJson: z.record(z.string(), z.unknown()).nullable().optional(),
  noteText: z.string().nullable().optional(),
  occurredAt: z.string().date(),
});

export const createBoardSchema = z
  .object({
    type: z.enum(["user", "team"]),
    ownerUserId: uuidSchema.nullable().optional(),
    teamId: uuidSchema.nullable().optional(),
    name: z.string().min(2).max(180),
    isDefault: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "user" && !value.ownerUserId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ownerUserId is required for user boards",
        path: ["ownerUserId"],
      });
    }
    if (value.type === "team" && !value.teamId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "teamId is required for team boards",
        path: ["teamId"],
      });
    }
  });

export const updateBoardSchema = z.object({
  name: z.string().min(2).max(180).optional(),
  isDefault: z.boolean().optional(),
});

const boardViewSchemaBase = z.object({
  name: z.string().min(2).max(120),
  kind: z.enum(["all", "goal", "unlinked", "custom"]),
  goalId: uuidSchema.nullable().optional(),
  filterJson: z.record(z.string(), z.unknown()).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const createBoardViewSchema = boardViewSchemaBase.superRefine(
  (value, ctx) => {
    if (value.kind === "goal" && !value.goalId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "goalId is required when kind is goal",
        path: ["goalId"],
      });
    }
    if (value.kind === "custom" && !value.filterJson) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "filterJson is required when kind is custom",
        path: ["filterJson"],
      });
    }
  }
);

export const updateBoardViewSchema = boardViewSchemaBase
  .partial()
  .superRefine((value, ctx) => {
    if (value.kind === "goal" && value.goalId === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "goalId is required when kind is goal",
        path: ["goalId"],
      });
    }
    if (value.kind === "custom" && value.filterJson === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "filterJson is required when kind is custom",
        path: ["filterJson"],
      });
    }
  });

export const updateBoardColumnSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  sortOrder: z.number().int().optional(),
  wipLimit: z.number().int().min(1).nullable().optional(),
});

export const reorderBoardColumnsSchema = z.object({
  orderedColumnIds: z.array(uuidSchema).min(1),
});

export const createWorkItemSchema = z.object({
  type: z.enum(["task", "project", "subtask"]).optional(),
  title: z.string().min(2).max(240),
  descriptionJson: z.record(z.string(), z.unknown()).nullable().optional(),
  descriptionText: z.string().nullable().optional(),
  statusKey: z.enum(["backlog", "next", "doing", "waiting", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().date().nullable().optional(),
  startDate: z.string().date().nullable().optional(),
  ownerUserId: uuidSchema.optional(),
  teamId: uuidSchema.nullable().optional(),
  visibility: z.enum(["org", "team", "private"]).optional(),
  classification: z.enum(["normal", "sensitive", "restricted"]).optional(),
  parentWorkItemId: uuidSchema.nullable().optional(),
  primaryGoalId: uuidSchema.nullable().optional(),
  linkedGoalIds: z.array(uuidSchema).optional(),
});

export const updateWorkItemSchema = createWorkItemSchema.partial();

export const addWorkItemAssigneeSchema = z.object({
  userId: uuidSchema,
});

export const addWorkItemWatcherSchema = z.object({
  userId: uuidSchema,
});

export const linkWorkItemGoalSchema = z.object({
  goalId: uuidSchema,
  isPrimary: z.boolean().optional(),
});

export const setWorkItemTagsSchema = z.object({
  teamIds: z.array(uuidSchema).default([]),
  missionaryIds: z.array(uuidSchema).default([]),
  labelIds: z.array(uuidSchema).default([]),
});

export const moveWorkItemSchema = z.object({
  toColumnId: uuidSchema,
  prevWorkItemId: uuidSchema.nullable(),
  nextWorkItemId: uuidSchema.nullable(),
});

export const pinWorkItemSchema = z.object({
  boardId: uuidSchema,
});

export const createChecklistItemSchema = z.object({
  text: z.string().min(1).max(240),
  sortOrder: z.number().int().optional(),
});

export const updateChecklistItemSchema = z.object({
  text: z.string().min(1).max(240).optional(),
  isDone: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const createLabelSchema = z.object({
  name: z.string().min(2).max(80),
  colorKey: z.string().nullable().optional(),
});

export const updateLabelSchema = createLabelSchema.partial();
