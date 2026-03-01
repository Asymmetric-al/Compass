export type WorkboardBoard = {
  id: string;
  org_id: string;
  type: "user" | "team";
  owner_user_id: string | null;
  team_id: string | null;
  name: string;
  is_default: boolean;
};

export type WorkboardView = {
  id: string;
  board_id: string;
  name: string;
  kind: "all" | "goal" | "unlinked" | "custom";
  goal_id: string | null;
  sort_order: number;
};

export type WorkboardColumn = {
  id: string;
  board_id: string;
  key: "backlog" | "next" | "doing" | "waiting" | "done";
  name: string;
  sort_order: number;
  wip_limit: number | null;
};

export type WorkboardCard = {
  id: string;
  title: string;
  status_key: "backlog" | "next" | "doing" | "waiting" | "done";
  priority: "low" | "medium" | "high" | "urgent";
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

export type WorkboardColumnResponse = {
  column: WorkboardColumn;
  items: WorkboardCard[];
};

export type WorkboardItemsResponse = {
  boardId: string;
  viewId: string;
  columns: WorkboardColumnResponse[];
};
