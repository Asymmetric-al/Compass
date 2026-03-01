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

export type ApiEnvelope<T> = {
  data: T | null;
  error: { code: string; message: string } | null;
  meta: { requestId: string };
};
