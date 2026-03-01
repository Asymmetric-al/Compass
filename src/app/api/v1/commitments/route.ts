import { API_ERROR } from "@/lib/api/errors";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createCommitmentSchema } from "@/lib/validation/api";

export async function GET(request: Request) {
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const url = new URL(request.url);
  const ownerUserId = url.searchParams.get("ownerUserId");
  const status = url.searchParams.get("status");
  const cycleId = url.searchParams.get("cycleId");
  const dueBefore = url.searchParams.get("dueBefore");

  let query = context.supabase
    .from("commitments")
    .select(
      "id, cycle_id, aim_id, measure_id, owner_user_id, team_id, title, details_json, status, priority_rank, weight, due_date, recurring_rule, estimated_minutes, completed_at, classification, updated_at"
    )
    .eq("org_id", context.orgId)
    .order("priority_rank", { ascending: true });

  if (ownerUserId) query = query.eq("owner_user_id", ownerUserId);
  if (
    status === "planned" ||
    status === "in_progress" ||
    status === "blocked" ||
    status === "done" ||
    status === "dropped"
  ) {
    query = query.eq("status", status);
  }
  if (cycleId) query = query.eq("cycle_id", cycleId);
  if (dueBefore) query = query.lte("due_date", dueBefore);

  const { data, error } = await query;
  if (error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: error.message },
      requestId,
      500
    );
  }

  return apiSuccess(data ?? [], requestId);
}

export async function POST(request: Request) {
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const parseResult = createCommitmentSchema.safeParse(await request.json());
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

  const { data, error } = await context.supabase
    .from("commitments")
    .insert({
      org_id: context.orgId,
      cycle_id: payload.cycleId ?? null,
      aim_id: payload.aimId ?? null,
      measure_id: payload.measureId ?? null,
      owner_user_id: ownerUserId,
      team_id: payload.teamId ?? null,
      title: payload.title,
      details_json: payload.detailsJson ?? {},
      status: payload.status ?? "planned",
      priority_rank: payload.priorityRank ?? 0,
      weight: payload.weight ?? 10,
      due_date: payload.dueDate ?? null,
      recurring_rule: payload.recurringRule ?? null,
      estimated_minutes: payload.estimatedMinutes ?? null,
      classification: payload.classification ?? "normal",
      created_by: context.user.id,
    })
    .select(
      "id, cycle_id, aim_id, measure_id, owner_user_id, team_id, title, details_json, status, priority_rank, weight, due_date, recurring_rule, estimated_minutes, completed_at, classification, updated_at"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to create commitment.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId, 201);
}
