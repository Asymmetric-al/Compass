import type {
  AimScope,
  ClassificationLevel,
  CommitmentStatus,
  MeasureCadence,
  MeasureKind,
  TeamType,
} from "@/types/domain";

export type DbOrganization = {
  id: string;
  slug: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type DbTeam = {
  id: string;
  org_id: string;
  type: TeamType;
  slug: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type DbAim = {
  id: string;
  org_id: string;
  cycle_id: string | null;
  scope: AimScope;
  team_id: string | null;
  owner_user_id: string | null;
  parent_aim_id: string | null;
  title: string;
  narrative_json: Record<string, unknown>;
  scripture_anchor: string | null;
  why_this_matters: string | null;
  classification: ClassificationLevel;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type DbMeasure = {
  id: string;
  org_id: string;
  aim_id: string;
  kind: MeasureKind;
  owner_user_id: string | null;
  name: string;
  cadence: MeasureCadence;
  unit: string;
  unit_label: string | null;
  direction: string;
  baseline: number | null;
  target: number | null;
  target_date: string | null;
  confidence_score: number;
  definition_text: string;
  notes_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DbCommitment = {
  id: string;
  org_id: string;
  cycle_id: string | null;
  aim_id: string | null;
  measure_id: string | null;
  owner_user_id: string;
  team_id: string | null;
  title: string;
  details_json: Record<string, unknown>;
  status: CommitmentStatus;
  priority_rank: number;
  weight: number;
  due_date: string | null;
  recurring_rule: string | null;
  estimated_minutes: number | null;
  completed_at: string | null;
  classification: ClassificationLevel;
  created_at: string;
  updated_at: string;
};
