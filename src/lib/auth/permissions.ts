import type { User } from "@supabase/supabase-js";

export type OrgRole =
  | "co_ed"
  | "admin"
  | "staff"
  | "department_director"
  | "department_staff"
  | "regional_director"
  | "regional_staff"
  | "read_only";

export function getUserRoles(user: User): OrgRole[] {
  const metadataRoles = user.app_metadata?.roles;
  if (!Array.isArray(metadataRoles)) {
    return [];
  }

  return metadataRoles.filter((role): role is OrgRole =>
    [
      "co_ed",
      "admin",
      "staff",
      "department_director",
      "department_staff",
      "regional_director",
      "regional_staff",
      "read_only",
    ].includes(String(role))
  );
}

export function hasAnyRole(user: User, roles: OrgRole[]) {
  const currentRoles = getUserRoles(user);
  return roles.some((role) => currentRoles.includes(role));
}

export function canManageOrganization(user: User) {
  return hasAnyRole(user, ["co_ed", "admin"]);
}
