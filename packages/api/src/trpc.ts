import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

/**
 * Auth middleware — ensures the user is logged in via Supabase Auth.
 * Throws UNAUTHORIZED if no session exists.
 */
const isAuthed = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // now guaranteed non-null
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

/**
 * Practice membership middleware — loads the user's practice membership (if any).
 * Falls back gracefully to single-therapist mode when no membership exists.
 */
const withPractice = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // Fetch practice membership (cached per request via context)
  const { data: membership } = await ctx.supabase
    .from("practice_members")
    .select("practice_id, role, can_view_notes, therapist_id")
    .eq("user_id", ctx.user.id)
    .single();

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // re-assert non-null for downstream type inference
      practice: membership ?? null,
    },
  });
});

/**
 * Practice-aware procedure: loads practice membership info into context.
 * Use this for any procedure that needs to scope data by practice role.
 */
export const practiceProcedure = t.procedure.use(isAuthed).use(withPractice);

/**
 * Owner-only procedure: requires the user to have the "owner" role in their practice.
 */
const requireOwner = middleware(async ({ ctx, next }) => {
  if (ctx.practice?.role !== "owner") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only practice owners can perform this action",
    });
  }
  return next();
});

export const ownerProcedure = practiceProcedure.use(requireOwner);

/**
 * Clinical procedure: requires the user to have clinical notes access.
 * - Therapists always see their own notes (no practice membership needed).
 * - Owners with can_view_notes=true can see all practice notes.
 * - Admins with can_view_notes=false are blocked.
 */
const requireNotesAccess = middleware(async ({ ctx, next }) => {
  if (ctx.practice && !ctx.practice.can_view_notes) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to clinical notes",
    });
  }
  return next();
});

export const clinicalProcedure = practiceProcedure.use(requireNotesAccess);
