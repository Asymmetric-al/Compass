import type { SupabaseClient } from "@supabase/supabase-js";

type WriteAuditLogInput = {
  supabase: SupabaseClient;
  orgId: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog({
  supabase,
  orgId,
  actorUserId,
  action,
  entityType,
  entityId,
  metadata = {},
}: WriteAuditLogInput) {
  const { error } = await supabase.from("audit_log").insert({
    org_id: orgId,
    actor_user_id: actorUserId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    metadata,
  });

  if (error) {
    // Non-blocking audit log write failure.
    console.error("audit_log_insert_failed", error.message);
  }
}
