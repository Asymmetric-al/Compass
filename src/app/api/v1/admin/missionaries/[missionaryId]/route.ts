import { API_ERROR } from "@/lib/api/errors";
import { isOrgAdmin } from "@/lib/api/authorization";
import { getApiContext } from "@/lib/api/request-context";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createMissionarySchema } from "@/lib/validation/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function requireAdmin() {
  const { context, requestId, errorResponse } = await getApiContext();
  if (!context) {
    return { context: null, requestId, response: errorResponse };
  }

  const adminCheck = await isOrgAdmin(
    context.supabase,
    context.orgId,
    context.user.id
  );
  if (adminCheck.error) {
    return {
      context: null,
      requestId,
      response: apiError(
        { code: API_ERROR.INTERNAL_ERROR, message: adminCheck.error.message },
        requestId,
        500
      ),
    };
  }
  if (!adminCheck.authorized) {
    return {
      context: null,
      requestId,
      response: apiError(
        { code: API_ERROR.FORBIDDEN, message: "Admin role required." },
        requestId,
        403
      ),
    };
  }

  return { context, requestId, response: null };
}

export async function GET(
  _request: Request,
  routeContext: { params: Promise<{ missionaryId: string }> }
) {
  const { missionaryId } = await routeContext.params;
  const auth = await requireAdmin();
  if (!auth.context) return auth.response;

  const { data, error } = await auth.context.supabase
    .from("missionaries")
    .select(
      "id, org_id, region_team_id, code_name, public_name, status, location_text, classification, created_at, updated_at"
    )
    .eq("org_id", auth.context.orgId)
    .eq("id", missionaryId)
    .single();

  if (error || !data) {
    return apiError(
      { code: API_ERROR.NOT_FOUND, message: "Missionary not found." },
      auth.requestId,
      404
    );
  }

  return apiSuccess(data, auth.requestId);
}

export async function PATCH(
  request: Request,
  routeContext: { params: Promise<{ missionaryId: string }> }
) {
  const { missionaryId } = await routeContext.params;
  const auth = await requireAdmin();
  if (!auth.context) return auth.response;

  const parseResult = createMissionarySchema
    .partial()
    .safeParse(await request.json());
  if (!parseResult.success) {
    return apiError(
      {
        code: API_ERROR.BAD_REQUEST,
        message: parseResult.error.issues
          .map((issue) => issue.message)
          .join(", "),
      },
      auth.requestId,
      400
    );
  }

  const payload = parseResult.data;
  const updates: Record<string, unknown> = {};
  if (payload.regionTeamId !== undefined)
    updates.region_team_id = payload.regionTeamId;
  if (payload.codeName !== undefined) updates.code_name = payload.codeName;
  if (payload.publicName !== undefined)
    updates.public_name = payload.publicName;
  if (payload.status !== undefined) updates.status = payload.status;
  if (payload.locationText !== undefined)
    updates.location_text = payload.locationText;
  if (payload.classification !== undefined)
    updates.classification = payload.classification;

  const { data, error } = await auth.context.supabase
    .from("missionaries")
    .update(updates)
    .eq("org_id", auth.context.orgId)
    .eq("id", missionaryId)
    .select(
      "id, org_id, region_team_id, code_name, public_name, status, location_text, classification, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to update missionary.",
      },
      auth.requestId,
      500
    );
  }

  return apiSuccess(data, auth.requestId);
}

export async function DELETE(
  _request: Request,
  routeContext: { params: Promise<{ missionaryId: string }> }
) {
  const { missionaryId } = await routeContext.params;
  const auth = await requireAdmin();
  if (!auth.context) return auth.response;

  const { error } = await auth.context.supabase
    .from("missionaries")
    .delete()
    .eq("org_id", auth.context.orgId)
    .eq("id", missionaryId);

  if (error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: error.message },
      auth.requestId,
      500
    );
  }

  return apiSuccess({ ok: true }, auth.requestId);
}
