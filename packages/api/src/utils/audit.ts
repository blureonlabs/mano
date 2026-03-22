import { SupabaseClient } from "@supabase/supabase-js";

export type AuditAction = "create" | "update" | "delete" | "view" | "decrypt" | "export";

export type AuditEntityType =
  | "client"
  | "session"
  | "session_note"
  | "treatment_plan"
  | "message"
  | "invoice"
  | "resource"
  | "intake_response"
  | "recurring_reservation"
  | "practice_member"
  | "broadcast";

interface AuditLogEntry {
  therapist_id: string;
  actor_id: string;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id?: string;
  changes?: Record<string, unknown>;
  ip_address?: string;
}

/**
 * Log an auditable action. Fire-and-forget — never throws or blocks the caller.
 */
export function logAudit(supabase: SupabaseClient, entry: AuditLogEntry): void {
  // Fire-and-forget: don't await, don't throw
  supabase
    .from("audit_logs")
    .insert({
      therapist_id: entry.therapist_id,
      actor_id: entry.actor_id,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      changes: entry.changes ?? null,
      ip_address: entry.ip_address ?? null,
    })
    .then(({ error }) => {
      if (error) console.error("Audit log failed:", error.message);
    });
}
