import type { User } from "@supabase/supabase-js";

import { API_ERROR } from "@/lib/api/errors";
import { apiError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";

type ApiContext = {
  requestId: string;
  user: User;
  orgId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
};

export async function getApiContext() {
  const requestId = crypto.randomUUID();
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      requestId,
      errorResponse: apiError(
        {
          code: API_ERROR.UNAUTHORIZED,
          message: "Authentication required.",
        },
        requestId,
        401
      ),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      requestId,
      errorResponse: apiError(
        {
          code: API_ERROR.FORBIDDEN,
          message: "User profile is not assigned to an organization.",
        },
        requestId,
        403
      ),
    };
  }

  const context: ApiContext = {
    requestId,
    user,
    orgId: profile.org_id as string,
    supabase,
  };

  return { requestId, context };
}
