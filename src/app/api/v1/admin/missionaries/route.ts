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

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.context) return auth.response;

  const url = new URL(request.url);
  const regionTeamId = url.searchParams.get("regionTeamId");
  const status = url.searchParams.get("status");

  let query = auth.context.supabase
    .from("missionaries")
    .select(
      "id, org_id, region_team_id, code_name, public_name, status, location_text, classification, created_at, updated_at"
    )
    .eq("org_id", auth.context.orgId)
    .order("created_at", { ascending: false });

  if (regionTeamId) query = query.eq("region_team_id", regionTeamId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: error.message },
      auth.requestId,
      500
    );
  }

  return apiSuccess(data ?? [], auth.requestId);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.context) return auth.response;

  const parseResult = createMissionarySchema.safeParse(await request.json());
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
  const { data, error } = await auth.context.supabase
    .from("missionaries")
    .insert({
      org_id: auth.context.orgId,
      region_team_id: payload.regionTeamId,
      code_name: payload.codeName ?? null,
      public_name: payload.publicName ?? null,
      status: payload.status ?? "active",
      location_text: payload.locationText ?? null,
      classification: payload.classification ?? "sensitive",
    })
    .select(
      "id, org_id, region_team_id, code_name, public_name, status, location_text, classification, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: error?.message ?? "Unable to create missionary.",
      },
      auth.requestId,
      500
    );
  }

  return apiSuccess(data, auth.requestId, 201);
}
