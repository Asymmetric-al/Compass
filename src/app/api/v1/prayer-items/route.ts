import { API_ERROR } from "@/lib/api/errors";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createPrayerItemSchema } from "@/lib/validation/api";

export async function GET() {
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return errorResponse;
  }

  const { data, error } = await context.supabase
    .from("prayer_items")
    .select(
      "id, team_id, aim_id, owner_user_id, text, status, classification, updated_at"
    )
    .eq("org_id", context.orgId)
    .order("created_at", { ascending: false });

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

  const parseResult = createPrayerItemSchema.safeParse(await request.json());
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
    .from("prayer_items")
    .insert({
      org_id: context.orgId,
      team_id: payload.teamId ?? null,
      aim_id: payload.aimId ?? null,
      owner_user_id: payload.ownerUserId ?? context.user.id,
      text: payload.text,
      status: payload.status ?? "open",
      classification: payload.classification ?? "normal",
    })
    .select(
      "id, team_id, aim_id, owner_user_id, text, status, classification, updated_at"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to create prayer item.",
      },
      requestId,
      500
    );
  }

  return apiSuccess(data, requestId, 201);
}
