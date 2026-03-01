import { API_ERROR } from "@/lib/api/errors";
import { canViewBoard } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type WorkItemCard = {
  id: string;
  title: string;
  status_key: "backlog" | "next" | "doing" | "waiting" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  owner_user_id: string;
  primary_goal: { id: string; title: string } | null;
  checklist: { total: number; done: number };
  assignees: Array<{ user_id: string; full_name: string; email: string }>;
  tags: {
    teams: Array<{ team_id: string; name: string }>;
    missionaries: Array<{ missionary_id: string; name: string }>;
    labels: Array<{ label_id: string; name: string }>;
  };
};

export async function GET(
  request: Request,
  routeContext: { params: Promise<{ boardId: string; viewId: string }> }
) {
  const { boardId, viewId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const accessCheck = await canViewBoard(context.supabase, boardId);
  if (accessCheck.error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: accessCheck.error.message },
      requestId,
      500
    );
  }
  if (!accessCheck.authorized) {
    return apiError(
      { code: API_ERROR.FORBIDDEN, message: "Board not accessible." },
      requestId,
      403
    );
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const dueBefore = url.searchParams.get("dueBefore");
  const dueAfter = url.searchParams.get("dueAfter");
  const assigneeUserId = url.searchParams.get("assigneeUserId");
  const includeDone = url.searchParams.get("includeDone") === "true";

  const { data: columns, error: columnsError } = await context.supabase
    .from("board_columns")
    .select("id, org_id, board_id, key, name, sort_order, wip_limit")
    .eq("org_id", context.orgId)
    .eq("board_id", boardId)
    .order("sort_order");
  if (columnsError) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: columnsError.message },
      requestId,
      500
    );
  }

  const { data: states, error: statesError } = await context.supabase
    .from("work_item_board_state")
    .select("work_item_id, column_id, position")
    .eq("org_id", context.orgId)
    .eq("board_id", boardId)
    .order("position");
  if (statesError) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: statesError.message },
      requestId,
      500
    );
  }

  const allStateRows = states ?? [];
  const allWorkItemIds = allStateRows.map((state) => state.work_item_id);
  if (allWorkItemIds.length === 0) {
    return apiSuccess(
      {
        boardId,
        viewId,
        columns: (columns ?? []).map((column) => ({ column, items: [] })),
      },
      requestId
    );
  }

  let filteredIds = new Set(allWorkItemIds);
  if (viewId !== "all") {
    const { data: view, error: viewError } = await context.supabase
      .from("board_views")
      .select("id, kind, goal_id, filter_json")
      .eq("org_id", context.orgId)
      .eq("board_id", boardId)
      .eq("id", viewId)
      .single();

    if (viewError || !view) {
      return apiError(
        { code: API_ERROR.NOT_FOUND, message: "View not found." },
        requestId,
        404
      );
    }

    if (view.kind === "goal" && view.goal_id) {
      const { data: links, error: linksError } = await context.supabase
        .from("work_item_goal_links")
        .select("work_item_id")
        .eq("org_id", context.orgId)
        .eq("goal_id", view.goal_id)
        .in("work_item_id", allWorkItemIds);

      if (linksError) {
        return apiError(
          { code: API_ERROR.INTERNAL_ERROR, message: linksError.message },
          requestId,
          500
        );
      }
      filteredIds = new Set((links ?? []).map((link) => link.work_item_id));
    }

    if (view.kind === "unlinked") {
      const { data: links, error: linksError } = await context.supabase
        .from("work_item_goal_links")
        .select("work_item_id")
        .eq("org_id", context.orgId)
        .in("work_item_id", allWorkItemIds);

      if (linksError) {
        return apiError(
          { code: API_ERROR.INTERNAL_ERROR, message: linksError.message },
          requestId,
          500
        );
      }

      const linkedIds = new Set((links ?? []).map((link) => link.work_item_id));
      filteredIds = new Set(allWorkItemIds.filter((id) => !linkedIds.has(id)));
    }
  }

  const visibleStateRows = allStateRows.filter((state) =>
    filteredIds.has(state.work_item_id)
  );
  const visibleWorkItemIds = visibleStateRows.map(
    (state) => state.work_item_id
  );
  if (visibleWorkItemIds.length === 0) {
    return apiSuccess(
      {
        boardId,
        viewId,
        columns: (columns ?? []).map((column) => ({ column, items: [] })),
      },
      requestId
    );
  }

  const { data: workItems, error: workItemsError } = await context.supabase
    .from("work_items")
    .select("id, title, status_key, priority, due_date, owner_user_id")
    .eq("org_id", context.orgId)
    .in("id", visibleWorkItemIds);
  if (workItemsError) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: workItemsError.message },
      requestId,
      500
    );
  }

  let filteredWorkItems = workItems ?? [];
  if (!includeDone) {
    filteredWorkItems = filteredWorkItems.filter(
      (workItem) => workItem.status_key !== "done"
    );
  }
  if (q) {
    const normalized = q.toLowerCase();
    filteredWorkItems = filteredWorkItems.filter((workItem) =>
      workItem.title.toLowerCase().includes(normalized)
    );
  }
  if (dueBefore) {
    filteredWorkItems = filteredWorkItems.filter(
      (workItem) => !workItem.due_date || workItem.due_date <= dueBefore
    );
  }
  if (dueAfter) {
    filteredWorkItems = filteredWorkItems.filter(
      (workItem) => !workItem.due_date || workItem.due_date >= dueAfter
    );
  }

  if (assigneeUserId) {
    const { data: assignmentRows, error: assigneeError } =
      await context.supabase
        .from("work_item_assignees")
        .select("work_item_id")
        .eq("org_id", context.orgId)
        .eq("user_id", assigneeUserId)
        .in(
          "work_item_id",
          filteredWorkItems.map((workItem) => workItem.id)
        );
    if (assigneeError) {
      return apiError(
        { code: API_ERROR.INTERNAL_ERROR, message: assigneeError.message },
        requestId,
        500
      );
    }
    const assignedIds = new Set(
      (assignmentRows ?? []).map((assignment) => assignment.work_item_id)
    );
    filteredWorkItems = filteredWorkItems.filter((workItem) =>
      assignedIds.has(workItem.id)
    );
  }

  const visibleIdsSet = new Set(
    filteredWorkItems.map((workItem) => workItem.id)
  );
  const finalStateRows = visibleStateRows.filter((state) =>
    visibleIdsSet.has(state.work_item_id)
  );
  const finalWorkItemIds = Array.from(visibleIdsSet);

  const [
    { data: primaryGoalLinks },
    { data: checklistRows },
    { data: assigneeRows },
  ] = await Promise.all([
    context.supabase
      .from("work_item_goal_links")
      .select("work_item_id, goal_id")
      .eq("org_id", context.orgId)
      .eq("is_primary", true)
      .in("work_item_id", finalWorkItemIds),
    context.supabase
      .from("work_item_checklist_summary")
      .select("work_item_id, total, done")
      .in("work_item_id", finalWorkItemIds),
    context.supabase
      .from("work_item_assignees")
      .select("work_item_id, user_id")
      .eq("org_id", context.orgId)
      .in("work_item_id", finalWorkItemIds),
  ]);

  const primaryGoalIds = (primaryGoalLinks ?? []).map((link) => link.goal_id);
  const { data: primaryGoals } = primaryGoalIds.length
    ? await context.supabase
        .from("goals")
        .select("id, title")
        .eq("org_id", context.orgId)
        .in("id", primaryGoalIds)
    : { data: [] as Array<{ id: string; title: string }> };

  const { data: assigneeProfiles } =
    (assigneeRows?.length ?? 0) > 0
      ? await context.supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .eq("org_id", context.orgId)
          .in(
            "user_id",
            Array.from(new Set((assigneeRows ?? []).map((row) => row.user_id)))
          )
      : {
          data: [] as Array<{
            user_id: string;
            full_name: string;
            email: string;
          }>,
        };

  const [
    { data: teamTagRows },
    { data: missionaryTagRows },
    { data: labelTagRows },
  ] = await Promise.all([
    context.supabase
      .from("work_item_team_tags")
      .select("work_item_id, team_id")
      .eq("org_id", context.orgId)
      .in("work_item_id", finalWorkItemIds),
    context.supabase
      .from("work_item_missionary_tags")
      .select("work_item_id, missionary_id")
      .eq("org_id", context.orgId)
      .in("work_item_id", finalWorkItemIds),
    context.supabase
      .from("label_links")
      .select("entity_id, label_id")
      .eq("org_id", context.orgId)
      .eq("entity_type", "work_item")
      .in("entity_id", finalWorkItemIds),
  ]);

  const teamIds = Array.from(
    new Set((teamTagRows ?? []).map((teamTag) => teamTag.team_id))
  );
  const missionaryIds = Array.from(
    new Set((missionaryTagRows ?? []).map((tag) => tag.missionary_id))
  );
  const labelIds = Array.from(
    new Set((labelTagRows ?? []).map((labelTag) => labelTag.label_id))
  );

  const [{ data: teams }, { data: missionaries }, { data: labels }] =
    await Promise.all([
      teamIds.length
        ? context.supabase
            .from("teams")
            .select("id, name")
            .eq("org_id", context.orgId)
            .in("id", teamIds)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
      missionaryIds.length
        ? context.supabase
            .from("missionaries")
            .select("id, code_name, public_name")
            .eq("org_id", context.orgId)
            .in("id", missionaryIds)
        : Promise.resolve({
            data: [] as Array<{
              id: string;
              code_name: string | null;
              public_name: string | null;
            }>,
          }),
      labelIds.length
        ? context.supabase
            .from("labels")
            .select("id, name")
            .eq("org_id", context.orgId)
            .in("id", labelIds)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    ]);

  const primaryGoalMap = new Map(
    (primaryGoals ?? []).map((goal) => [goal.id, goal])
  );
  const primaryGoalByWorkItem = new Map<
    string,
    { id: string; title: string }
  >();
  for (const link of primaryGoalLinks ?? []) {
    const goal = primaryGoalMap.get(link.goal_id);
    if (goal) {
      primaryGoalByWorkItem.set(link.work_item_id, {
        id: goal.id,
        title: goal.title,
      });
    }
  }

  const checklistByWorkItem = new Map(
    (checklistRows ?? []).map((row) => [
      row.work_item_id,
      { total: row.total ?? 0, done: row.done ?? 0 },
    ])
  );

  const profileMap = new Map(
    (assigneeProfiles ?? []).map((profile) => [profile.user_id, profile])
  );
  const assigneesByWorkItem = new Map<
    string,
    Array<{ user_id: string; full_name: string; email: string }>
  >();
  for (const assignment of assigneeRows ?? []) {
    const profile = profileMap.get(assignment.user_id);
    if (!profile) continue;
    if (!assigneesByWorkItem.has(assignment.work_item_id)) {
      assigneesByWorkItem.set(assignment.work_item_id, []);
    }
    assigneesByWorkItem.get(assignment.work_item_id)?.push({
      user_id: profile.user_id,
      full_name: profile.full_name,
      email: profile.email,
    });
  }

  const teamMap = new Map((teams ?? []).map((team) => [team.id, team.name]));
  const missionaryMap = new Map(
    (missionaries ?? []).map((missionary) => [
      missionary.id,
      missionary.public_name ?? missionary.code_name ?? "Missionary",
    ])
  );
  const labelMap = new Map(
    (labels ?? []).map((label) => [label.id, label.name])
  );

  const tagsByWorkItem = new Map<string, WorkItemCard["tags"]>();
  for (const workItemId of finalWorkItemIds) {
    tagsByWorkItem.set(workItemId, { teams: [], missionaries: [], labels: [] });
  }

  for (const row of teamTagRows ?? []) {
    const name = teamMap.get(row.team_id);
    if (!name) continue;
    tagsByWorkItem.get(row.work_item_id)?.teams.push({
      team_id: row.team_id,
      name,
    });
  }
  for (const row of missionaryTagRows ?? []) {
    const name = missionaryMap.get(row.missionary_id);
    if (!name) continue;
    tagsByWorkItem.get(row.work_item_id)?.missionaries.push({
      missionary_id: row.missionary_id,
      name,
    });
  }
  for (const row of labelTagRows ?? []) {
    const name = labelMap.get(row.label_id);
    if (!name) continue;
    tagsByWorkItem.get(row.entity_id)?.labels.push({
      label_id: row.label_id,
      name,
    });
  }

  const itemMap = new Map<string, WorkItemCard>();
  for (const workItem of filteredWorkItems) {
    itemMap.set(workItem.id, {
      id: workItem.id,
      title: workItem.title,
      status_key: workItem.status_key,
      priority: workItem.priority,
      due_date: workItem.due_date,
      owner_user_id: workItem.owner_user_id,
      primary_goal: primaryGoalByWorkItem.get(workItem.id) ?? null,
      checklist: checklistByWorkItem.get(workItem.id) ?? { total: 0, done: 0 },
      assignees: assigneesByWorkItem.get(workItem.id) ?? [],
      tags: tagsByWorkItem.get(workItem.id) ?? {
        teams: [],
        missionaries: [],
        labels: [],
      },
    });
  }

  const itemsByColumnId = new Map<string, WorkItemCard[]>();
  for (const state of finalStateRows) {
    const card = itemMap.get(state.work_item_id);
    if (!card) continue;
    if (!itemsByColumnId.has(state.column_id)) {
      itemsByColumnId.set(state.column_id, []);
    }
    itemsByColumnId.get(state.column_id)?.push(card);
  }

  return apiSuccess(
    {
      boardId,
      viewId,
      columns: (columns ?? []).map((column) => ({
        column,
        items: itemsByColumnId.get(column.id) ?? [],
      })),
    },
    requestId
  );
}
