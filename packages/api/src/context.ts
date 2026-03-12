import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Context passed to every tRPC procedure.
 * Created per-request in the Next.js API route handler.
 */
export type Context = {
  supabase: SupabaseClient;
  user: User | null;
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
