import { SupabaseClient } from "@supabase/supabase-js";
import { PracticeMembership } from "../context";

/**
 * Get the list of therapist IDs that the current user can access.
 * - Owner/Admin: all therapists in the practice
 * - Therapist: only their own therapist_id
 * - No practice: only the user's own id (single-therapist mode)
 */
export async function getAccessibleTherapistIds(
  supabase: SupabaseClient,
  userId: string,
  practice: PracticeMembership | null | undefined
): Promise<string[]> {
  // No practice membership — single therapist mode
  if (!practice) return [userId];

  // Therapist role — only own data
  if (practice.role === "therapist") return [userId];

  // Owner or Admin — all practice members who are therapists
  const { data: members } = await supabase
    .from("practice_members")
    .select("user_id")
    .eq("practice_id", practice.practice_id);

  return members?.map((m) => m.user_id) ?? [userId];
}

/**
 * Apply therapist scope filter to a Supabase query.
 * For single-therapist: eq("therapist_id", userId)
 * For practice owner/admin: in("therapist_id", allTherapistIds)
 * For practice therapist: eq("therapist_id", userId)
 */
export function applyTherapistScope(
  query: any, // Supabase query builder
  userId: string,
  practice: PracticeMembership | null | undefined,
  therapistIds: string[]
): any {
  if (therapistIds.length === 1) {
    return query.eq("therapist_id", therapistIds[0]);
  }
  return query.in("therapist_id", therapistIds);
}
