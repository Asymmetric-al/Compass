export type TeamType = "department" | "region";
export type CycleType = "annual" | "quarterly";
export type AimScope = "org" | "team" | "user";
export type MeasureKind = "lead" | "lag" | "health" | "learning";
export type MeasureCadence = "weekly" | "monthly" | "quarterly";
export type CommitmentStatus =
  | "planned"
  | "in_progress"
  | "blocked"
  | "done"
  | "dropped";
export type ClassificationLevel = "normal" | "sensitive" | "restricted";

export type GoalScopeType = "org" | "team" | "user";
export type GoalStatus = "draft" | "active" | "done" | "dropped";
export type GoalTimeboxType =
  | "annual"
  | "quarterly"
  | "monthly"
  | "weekly"
  | "custom";
export type GoalVisibility = "org" | "team" | "private";

export type GoalMeasureKind = "lead" | "outcome";
export type GoalMeasureFormat = "number" | "percent" | "boolean" | "text";
export type GoalMeasureUpdateCadence = "weekly" | "monthly" | "ad_hoc";

export type BoardType = "user" | "team";
export type BoardColumnKey = "backlog" | "next" | "doing" | "waiting" | "done";
export type BoardViewKind = "all" | "goal" | "unlinked" | "custom";

export type WorkItemType = "task" | "project" | "subtask";
export type WorkPriority = "low" | "medium" | "high" | "urgent";

export type ApiEnvelope<T> = {
  data: T | null;
  error: { code: string; message: string } | null;
  meta: { requestId: string };
};
