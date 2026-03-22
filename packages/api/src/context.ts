import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Practice membership info loaded per-request for RBAC.
 */
export interface PracticeMembership {
  practice_id: string;
  role: "owner" | "therapist" | "admin";
  can_view_notes: boolean;
  therapist_id: string; // the member's therapist_id (may differ from user_id for admin roles)
}

/**
 * Context passed to every tRPC procedure.
 * Created per-request in the Next.js API route handler.
 */
export type Context = {
  supabase: SupabaseClient;
  user: User | null;
  practice?: PracticeMembership | null;
};

/**
 * Creates context for tRPC. Called from the Next.js API route.
 *
 * Usage in apps/web:
 * ```ts
 * import { createContext } from "@mano/api";
 * const handler = fetchRequestHandler({
 *   createContext: () => createContext({ supabase, user }),
 *   ...
 * });
 * ```
 */
export function createContext(opts: {
  supabase: SupabaseClient;
  user: User | null;
}): Context {
  return {
    supabase: opts.supabase,
    user: opts.user,
  };
}
