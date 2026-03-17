import { SupabaseClient } from "@supabase/supabase-js";

interface AuditEntry {
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  resource_title: string;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  details?: Record<string, unknown>;
}

export async function logAudit(supabase: SupabaseClient, entry: AuditEntry) {
  try {
    const { error } = await supabase.from("sm_audit_log").insert({
      actor_id: entry.actor_id,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id,
      resource_title: entry.resource_title,
      old_values: entry.old_values || null,
      new_values: entry.new_values || null,
      details: entry.details || {},
    });
    if (error) console.error("Audit log error:", error);
  } catch (error) {
    console.error("Failed to log audit entry:", error);
  }
}
