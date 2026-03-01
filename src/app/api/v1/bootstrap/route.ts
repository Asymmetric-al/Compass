import { API_ERROR } from "@/lib/api/errors";
import { isOrgAdmin } from "@/lib/api/authorization";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return apiError(
      { code: API_ERROR.UNAUTHORIZED, message: "Authentication required." },
      requestId,
      401
    );
  }

  let payload: { orgSlug?: string; orgName?: string } = {};
  try {
    payload = (await request.json()) as { orgSlug?: string; orgName?: string };
  } catch {
    return apiError(
      { code: API_ERROR.BAD_REQUEST, message: "Invalid JSON payload." },
      requestId,
      400
    );
  }

  const orgSlug = payload.orgSlug?.trim();
  const orgName = payload.orgName?.trim();
  if (!orgSlug || !orgName) {
    return apiError(
      {
        code: API_ERROR.BAD_REQUEST,
        message: "orgSlug and orgName are required.",
      },
      requestId,
      400
    );
  }

  const { count: orgCount, error: orgCountError } = await supabase
    .from("orgs")
    .select("*", { count: "exact", head: true });

  if (orgCountError) {
    return apiError(
      { code: API_ERROR.INTERNAL_ERROR, message: orgCountError.message },
      requestId,
      500
    );
  }

  if ((orgCount ?? 0) > 0) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return apiError(
        {
          code: API_ERROR.FORBIDDEN,
          message: "Only existing org admins can bootstrap updates.",
        },
        requestId,
        403
      );
    }

    const { authorized, error } = await isOrgAdmin(
      supabase,
      profile.org_id as string,
      user.id
    );
    if (error) {
      return apiError(
        { code: API_ERROR.INTERNAL_ERROR, message: error.message },
        requestId,
        500
      );
    }
    if (!authorized) {
      return apiError(
        { code: API_ERROR.FORBIDDEN, message: "Admin role required." },
        requestId,
        403
      );
    }
  }

  const { data: org, error: orgError } = await supabase
    .from("orgs")
    .insert({
      slug: orgSlug,
      name: orgName,
    })
    .select("id")
    .single();

  if (orgError || !org) {
    return apiError(
      {
        code: API_ERROR.INTERNAL_ERROR,
        message: orgError?.message ?? "Unable to create org.",
      },
      requestId,
      500
    );
  }

  await supabase.from("app_config").upsert({ id: 1, primary_org_id: org.id });
  await supabase.rpc("create_default_teams", { p_org_id: org.id });

  await supabase.from("role_assignments").upsert({
    org_id: org.id,
    user_id: user.id,
    role: "co_ed",
    team_id: null,
  });

  return apiSuccess({ orgId: org.id }, requestId, 201);
}
