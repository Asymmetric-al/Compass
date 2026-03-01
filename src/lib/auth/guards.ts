import { NextResponse } from "next/server";

import { canManageOrganization } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";

export async function requireAuthenticatedResponse() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
        meta: { requestId: crypto.randomUUID() },
      },
      { status: 401 }
    );
  }

  return user;
}

export async function requireAdminResponse() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
        meta: { requestId: crypto.randomUUID() },
      },
      { status: 401 }
    );
  }

  if (!canManageOrganization(user)) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "FORBIDDEN", message: "Insufficient permissions." },
        meta: { requestId: crypto.randomUUID() },
      },
      { status: 403 }
    );
  }

  return user;
}
