import { describe, expect, test } from "vitest";

import {
  canManageOrganization,
  getUserRoles,
  hasAnyRole,
} from "@/lib/auth/permissions";

const userWithRoles = {
  app_metadata: {
    roles: ["staff", "admin"],
  },
} as const;

describe("auth permissions", () => {
  test("extracts typed roles from app metadata", () => {
    expect(getUserRoles(userWithRoles as never)).toEqual(["staff", "admin"]);
  });

  test("checks role membership", () => {
    expect(hasAnyRole(userWithRoles as never, ["co_ed", "admin"])).toBe(true);
    expect(hasAnyRole(userWithRoles as never, ["co_ed"])).toBe(false);
  });

  test("allows admin-level management", () => {
    expect(canManageOrganization(userWithRoles as never)).toBe(true);
  });
});
