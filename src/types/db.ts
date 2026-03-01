import type {
  AimScope,
  BoardColumnKey,
  BoardType,
  BoardViewKind,
  ClassificationLevel,
  CommitmentStatus,
  GoalMeasureFormat,
  GoalMeasureKind,
  GoalMeasureUpdateCadence,
  GoalScopeType,
  GoalStatus,
  GoalTimeboxType,
  GoalVisibility,
  MeasureCadence,
  MeasureKind,
  TeamType,
  WorkItemType,
  WorkPriority,
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

export type DbGoal = {
  id: string;
  org_id: string;
  scope_type: GoalScopeType;
  scope_team_id: string | null;
  scope_user_id: string | null;
  title: string;
  description_json: Record<string, unknown> | null;
  description_text: string | null;
  status: GoalStatus;
  timebox_type: GoalTimeboxType;
  start_date: string;
  end_date: string;
  parent_goal_id: string | null;
  visibility: GoalVisibility;
  classification: ClassificationLevel;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

export type DbGoalLink = {
  org_id: string;
  goal_id: string;
  upstream_goal_id: string;
  link_type: "supports" | "related";
  created_by: string;
  created_at: string;
};

export type DbGoalMeasure = {
  id: string;
  org_id: string;
  goal_id: string;
  kind: GoalMeasureKind;
  name: string;
  unit: string | null;
  format: GoalMeasureFormat;
  start_value: number | null;
  target_value: number | null;
  current_value: number | null;
  update_cadence: GoalMeasureUpdateCadence;
  created_by: string;
  created_at: string;
};

export type DbGoalMeasureUpdate = {
  id: string;
  org_id: string;
  goal_measure_id: string;
  value: number | null;
  note_json: Record<string, unknown> | null;
  note_text: string | null;
  occurred_at: string;
  created_by: string;
  created_at: string;
};

export type DbBoard = {
  id: string;
  org_id: string;
  type: BoardType;
  owner_user_id: string | null;
  team_id: string | null;
  name: string;
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type DbBoardColumn = {
  id: string;
  org_id: string;
  board_id: string;
  key: BoardColumnKey;
  name: string;
  sort_order: number;
  wip_limit: number | null;
  created_at: string;
  updated_at: string;
};

export type DbBoardView = {
  id: string;
  org_id: string;
  board_id: string;
  name: string;
  kind: BoardViewKind;
  goal_id: string | null;
  filter_json: Record<string, unknown> | null;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type DbWorkItem = {
  id: string;
  org_id: string;
  type: WorkItemType;
  title: string;
  description_json: Record<string, unknown> | null;
  description_text: string | null;
  status_key: BoardColumnKey;
  priority: WorkPriority;
  due_date: string | null;
  start_date: string | null;
  completed_at: string | null;
  owner_user_id: string;
  team_id: string | null;
  created_by: string;
  updated_by: string;
  visibility: GoalVisibility;
  classification: ClassificationLevel;
  parent_work_item_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DbWorkItemBoardState = {
  org_id: string;
  board_id: string;
  work_item_id: string;
  column_id: string;
  position: number;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type DbWorkItemChecklistItem = {
  id: string;
  org_id: string;
  work_item_id: string;
  text: string;
  is_done: boolean;
  sort_order: number;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type DbWorkItemCard = {
  id: string;
  title: string;
  status_key: BoardColumnKey;
  priority: WorkPriority;
  due_date: string | null;
  owner_user_id: string;
  primary_goal: { id: string; title: string } | null;
  checklist: { total: number; done: number };
  assignees: Array<{
    user_id: string;
    full_name: string;
    email: string;
  }>;
  tags: {
    teams: Array<{ team_id: string; name: string }>;
    missionaries: Array<{ missionary_id: string; name: string }>;
    labels: Array<{ label_id: string; name: string }>;
  };
};

export type DbLabel = {
  id: string;
  org_id: string;
  name: string;
  color_key: string | null;
  created_by: string;
  created_at: string;
};
