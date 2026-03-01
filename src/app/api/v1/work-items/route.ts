import { API_ERROR } from "@/lib/api/errors";
import { isOrgAdmin, isTeamDirector } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createServiceClient } from "@/lib/supabase/service";
import { createWorkItemSchema } from "@/lib/validation/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const url = new URL(request.url);
  const ownerUserId = url.searchParams.get("ownerUserId");
  const teamId = url.searchParams.get("teamId");
  const statusKey = url.searchParams.get("statusKey");
  const boardId = url.searchParams.get("boardId");
  const goalId = url.searchParams.get("goalId");
  const includeDone = url.searchParams.get("includeDone") === "true";
  const q = url.searchParams.get("q");

  let query = context.supabase
    .from("work_items")
    .select(
      "id, org_id, type, title, description_json, description_text, status_key, priority, due_date, start_date, completed_at, owner_user_id, team_id, created_by, updated_by, visibility, classification, parent_work_item_id, created_at, updated_at"
    )
    .eq("org_id", context.orgId)
    .order("created_at", { ascending: false });

  if (ownerUserId) query = query.eq("owner_user_id", ownerUserId);
  if (teamId) query = query.eq("team_id", teamId);
  if (
    statusKey === "backlog" ||
    statusKey === "next" ||
    statusKey === "doing" ||
    statusKey === "waiting" ||
    statusKey === "done"
  ) {
    query = query.eq("status_key", statusKey);
  }
  if (!includeDone) {
    query = query.neq("status_key", "done");
  }
  if (q) {
    query = query.or(`title.ilike.%${q}%,description_text.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: error.message },
      requestId,
      500
    );
  }

  let filtered = data ?? [];
  if (goalId && filtered.length > 0) {
    const { data: goalLinks, error: goalLinksError } = await context.supabase
      .from("work_item_goal_links")
      .select("work_item_id")
      .eq("org_id", context.orgId)
      .eq("goal_id", goalId)
      .in(
        "work_item_id",
        filtered.map((item) => item.id)
      );

    if (goalLinksError) {
      return apiError(
        { code: API_ERROR.INTERNAL_ERROR, message: goalLinksError.message },
        requestId,
        500
      );
    }

    const linkedIds = new Set(
      (goalLinks ?? []).map((link) => link.work_item_id)
    );
    filtered = filtered.filter((item) => linkedIds.has(item.id));
  }

  if (boardId && filtered.length > 0) {
    const { data: boardStateRows, error: boardStateError } =
      await context.supabase
        .from("work_item_board_state")
        .select("work_item_id, board_id, column_id, position")
        .eq("org_id", context.orgId)
        .eq("board_id", boardId)
        .in(
          "work_item_id",
          filtered.map((item) => item.id)
        );

    if (boardStateError) {
      return apiError(
        { code: API_ERROR.INTERNAL_ERROR, message: boardStateError.message },
        requestId,
        500
      );
    }

    const stateMap = new Map(
      (boardStateRows ?? []).map((row) => [row.work_item_id, row])
    );
    filtered = filtered
      .filter((item) => stateMap.has(item.id))
      .map((item) => ({
        ...item,
        board_state: stateMap.get(item.id),
      }));
  }

  return apiSuccess(filtered, requestId);
}

export async function POST(request: Request) {
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const parseResult = createWorkItemSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return apiError(
      {
        code: API_ERROR.BAD_REQUEST,
        message: parseResult.error.issues
          .map((issue) => issue.message)
          .join(", "),
      },
      requestId,
      400
    );
  }

  const payload = parseResult.data;
  const ownerUserId = payload.ownerUserId ?? context.user.id;
  const service = createServiceClient();

  const adminCheck = await isOrgAdmin(
    context.supabase,
    context.orgId,
    context.user.id
  );
  if (adminCheck.error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: adminCheck.error.message },
      requestId,
      500
    );
  }

  let authorized = adminCheck.authorized || ownerUserId === context.user.id;
  if (!authorized && payload.teamId) {
    const directorCheck = await isTeamDirector(
      context.supabase,
      context.orgId,
      payload.teamId,
      context.user.id
    );
    if (directorCheck.error) {
      return apiError(
        {
          code: API_ERROR.INTERNAL_ERROR,
          message: directorCheck.error.message,
        },
        requestId,
        500
      );
    }
    authorized = directorCheck.authorized;
  }

  if (!authorized) {
    return apiError(
      {
        code: API_ERROR.FORBIDDEN,
        message: "Insufficient permissions to create work item.",
      },
      requestId,
      403
    );
  }

  const { data, error } = await service
    .from("work_items")
    .insert({
      org_id: context.orgId,
      type: payload.type ?? "task",
      title: payload.title,
      description_json: payload.descriptionJson ?? null,
      description_text: payload.descriptionText ?? null,
      status_key: payload.statusKey ?? "backlog",
      priority: payload.priority ?? "medium",
      due_date: payload.dueDate ?? null,
      start_date: payload.startDate ?? null,
      owner_user_id: ownerUserId,
      team_id: payload.teamId ?? null,
      created_by: context.user.id,
      updated_by: context.user.id,
      visibility: payload.visibility ?? "team",
      classification: payload.classification ?? "normal",
      parent_work_item_id: payload.parentWorkItemId ?? null,
    })
    .select(
      "id, org_id, type, title, description_json, description_text, status_key, priority, due_date, start_date, completed_at, owner_user_id, team_id, created_by, updated_by, visibility, classification, parent_work_item_id, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to create work item.",
      },
      requestId,
      500
    );
  }

  const linkedGoalIds = new Set<string>();
  if (payload.primaryGoalId) linkedGoalIds.add(payload.primaryGoalId);
  for (const goalId of payload.linkedGoalIds ?? []) linkedGoalIds.add(goalId);

  if (linkedGoalIds.size > 0) {
    const links = Array.from(linkedGoalIds).map((goalId) => ({
      org_id: context.orgId,
      work_item_id: data.id,
      goal_id: goalId,
      is_primary: payload.primaryGoalId === goalId,
      created_by: context.user.id,
    }));

    const { error: goalLinksError } = await service
      .from("work_item_goal_links")
      .upsert(links, { onConflict: "work_item_id,goal_id" });

    if (goalLinksError) {
      return apiError(
        { code: API_ERROR.INTERNAL_ERROR, message: goalLinksError.message },
        requestId,
        500
      );
    }
  }

  let boardId: string;
  const { data: existingBoard, error: existingBoardError } = await service
    .from("boards")
    .select("id")
    .eq("org_id", context.orgId)
    .eq("type", "user")
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();

  if (existingBoardError) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: existingBoardError.message },
      requestId,
      500
    );
  }
  boardId = (existingBoard?.id as string | null) ?? "";

  if (!boardId) {
    const { data: createdBoard, error: createBoardError } = await service
      .from("boards")
      .insert({
        org_id: context.orgId,
        type: "user",
        owner_user_id: ownerUserId,
        name: "My Board",
        is_default: true,
        created_by: context.user.id,
      })
      .select("id")
      .single();

    if (createBoardError || !createdBoard) {
      return apiError(
        {
          code: API_ERROR.INTERNAL_ERROR,
          message:
            createBoardError?.message ?? "Unable to provision user board.",
        },
        requestId,
        500
      );
    }
    boardId = createdBoard.id as string;
  }

  const { error: columnUpsertError } = await service
    .from("board_columns")
    .upsert(
      [
        {
          org_id: context.orgId,
          board_id: boardId,
          key: "backlog",
          name: "Backlog",
          sort_order: 1000,
        },
        {
          org_id: context.orgId,
          board_id: boardId,
          key: "next",
          name: "Next",
          sort_order: 2000,
        },
        {
          org_id: context.orgId,
          board_id: boardId,
          key: "doing",
          name: "Doing",
          sort_order: 3000,
        },
        {
          org_id: context.orgId,
          board_id: boardId,
          key: "waiting",
          name: "Waiting",
          sort_order: 4000,
        },
        {
          org_id: context.orgId,
          board_id: boardId,
          key: "done",
          name: "Done",
          sort_order: 5000,
        },
      ],
      { onConflict: "board_id,key" }
    );
  if (columnUpsertError) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: columnUpsertError.message },
      requestId,
      500
    );
  }

  const desiredColumnKey = payload.statusKey ?? "backlog";
  const { data: destinationColumn, error: destinationColumnError } =
    await service
      .from("board_columns")
      .select("id")
      .eq("org_id", context.orgId)
      .eq("board_id", boardId)
      .eq("key", desiredColumnKey)
      .single();

  if (destinationColumnError || !destinationColumn) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message:
          destinationColumnError?.message ?? "Unable to resolve board column.",
      },
      requestId,
      500
    );
  }

  const { data: latestPosition } = await service
    .from("work_item_board_state")
    .select("position")
    .eq("org_id", context.orgId)
    .eq("board_id", boardId)
    .eq("column_id", destinationColumn.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error: boardStateError } = await service
    .from("work_item_board_state")
    .upsert(
      {
        org_id: context.orgId,
        board_id: boardId,
        work_item_id: data.id,
        column_id: destinationColumn.id,
        position: (latestPosition?.position ?? 0) + 1000,
        pinned: true,
      },
      { onConflict: "board_id,work_item_id" }
    );

  if (boardStateError) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: boardStateError.message },
      requestId,
      500
    );
  }

  const { error: assigneeError } = await service
    .from("work_item_assignees")
    .upsert(
      {
        org_id: context.orgId,
        work_item_id: data.id,
        user_id: ownerUserId,
        created_by: context.user.id,
      },
      { onConflict: "work_item_id,user_id" }
    );

  if (assigneeError) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: assigneeError.message },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId, 201);
}
