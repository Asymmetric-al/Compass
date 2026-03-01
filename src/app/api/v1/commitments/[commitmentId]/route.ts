import { API_ERROR } from "@/lib/api/errors";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { updateCommitmentSchema } from "@/lib/validation/api";

export async function PATCH(
  request: Request,
  routeContext: { params: Promise<{ commitmentId: string }> }
) {
  const { commitmentId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const parseResult = updateCommitmentSchema.safeParse(await request.json());
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
  const { data, error } = await context.supabase
    .from("commitments")
    .update({
      cycle_id: payload.cycleId,
      aim_id: payload.aimId,
      measure_id: payload.measureId,
      owner_user_id: payload.ownerUserId,
      team_id: payload.teamId,
      title: payload.title,
      details_json: payload.detailsJson,
      status: payload.status,
      priority_rank: payload.priorityRank,
      weight: payload.weight,
      due_date: payload.dueDate,
      recurring_rule: payload.recurringRule,
      estimated_minutes: payload.estimatedMinutes,
      classification: payload.classification,
      completed_at: payload.status === "done" ? new Date().toISOString() : null,
    })
    .eq("org_id", context.orgId)
    .eq("id", commitmentId)
    .select(
      "id, cycle_id, aim_id, measure_id, owner_user_id, team_id, title, details_json, status, priority_rank, weight, due_date, recurring_rule, estimated_minutes, completed_at, classification, updated_at"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.NOT_FOUND,
        message: error?.message ?? "Commitment not found.",
      },
      requestId,
      404
    );
  }

  return apiSuccess(data, requestId);
}
