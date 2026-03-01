export type GoalRecord = {
  id: string;
  org_id: string;
  scope_type: "org" | "team" | "user";
  scope_team_id: string | null;
  scope_user_id: string | null;
  title: string;
  description_json: Record<string, unknown> | null;
  description_text: string | null;
  status: "draft" | "active" | "done" | "dropped";
  timebox_type: "annual" | "quarterly" | "monthly" | "weekly" | "custom";
  start_date: string;
  end_date: string;
  parent_goal_id: string | null;
  visibility: "org" | "team" | "private";
  classification: "normal" | "sensitive" | "restricted";
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

export type GoalMeasureRecord = {
  id: string;
  org_id: string;
  goal_id: string;
  kind: "lead" | "outcome";
  name: string;
  unit: string | null;
  format: "number" | "percent" | "boolean" | "text";
  start_value: number | null;
  target_value: number | null;
  current_value: number | null;
  update_cadence: "weekly" | "monthly" | "ad_hoc";
  created_by: string;
  created_at: string;
};
