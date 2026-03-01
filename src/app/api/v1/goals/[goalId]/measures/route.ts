import { API_ERROR } from "@/lib/api/errors";
import { canEditGoal, canViewGoal } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createGoalMeasureSchema } from "@/lib/validation/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  routeContext: { params: Promise<{ goalId: string }> }
) {
  const { goalId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const viewCheck = await canViewGoal(context.supabase, goalId);
  if (viewCheck.error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: viewCheck.error.message },
      requestId,
      500
    );
  }
  if (!viewCheck.authorized) {
    return apiError(
      { code: API_ERROR.FORBIDDEN, message: "Goal not accessible." },
      requestId,
      403
    );
  }

  const { data, error } = await context.supabase
    .from("goal_measures")
    .select(
      "id, org_id, goal_id, kind, name, unit, format, start_value, target_value, current_value, update_cadence, created_by, created_at"
    )
    .eq("org_id", context.orgId)
    .eq("goal_id", goalId)
    .order("created_at");

  if (error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: error.message },
      requestId,
      500
    );
  }

  return apiSuccess(data ?? [], requestId);
}

export async function POST(
  request: Request,
  routeContext: { params: Promise<{ goalId: string }> }
) {
  const { goalId } = await routeContext.params;
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) return errorResponse;

  const parseResult = createGoalMeasureSchema.safeParse(await request.json());
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

  const editCheck = await canEditGoal(context.supabase, goalId);
  if (editCheck.error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: editCheck.error.message },
      requestId,
      500
    );
  }
  if (!editCheck.authorized) {
    return apiError(
      { code: API_ERROR.FORBIDDEN, message: "Insufficient permissions." },
      requestId,
      403
    );
  }

  const payload = parseResult.data;
  const { data, error } = await context.supabase
    .from("goal_measures")
    .insert({
      org_id: context.orgId,
      goal_id: goalId,
      kind: payload.kind,
      name: payload.name,
      unit: payload.unit ?? null,
      format: payload.format ?? "number",
      start_value: payload.startValue ?? null,
      target_value: payload.targetValue ?? null,
      current_value: payload.currentValue ?? payload.startValue ?? null,
      update_cadence: payload.updateCadence ?? "ad_hoc",
      created_by: context.user.id,
    })
    .select(
      "id, org_id, goal_id, kind, name, unit, format, start_value, target_value, current_value, update_cadence, created_by, created_at"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to create goal measure.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId, 201);
}
