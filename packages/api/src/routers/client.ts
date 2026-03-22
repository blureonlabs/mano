import { router, protectedProcedure, practiceProcedure } from "../trpc";
import { createClientSchema, updateClientSchema, clientStatusEnum, PRICING_TIERS, type PricingTier } from "@mano/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { logAudit } from "../utils/audit";
import { getAccessibleTherapistIds, applyTherapistScope } from "../utils/practice-scope";

export const clientRouter = router({
  /** List all clients for the current therapist / practice (filterable by status) */
  list: practiceProcedure
    .input(
      z.object({
        status: clientStatusEnum.optional(),
        includeAll: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const therapistIds = await getAccessibleTherapistIds(
        ctx.supabase,
        ctx.user.id,
        ctx.practice
      );

      let query = ctx.supabase
        .from("clients")
        .select("*")
        .order("full_name");

      query = applyTherapistScope(query, ctx.user.id, ctx.practice, therapistIds);

      if (input?.status) {
        query = query.eq("status", input.status);
      } else if (!input?.includeAll) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch clients" });
      return data;
    }),

  /** Get a single client by ID */
  getById: practiceProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const therapistIds = await getAccessibleTherapistIds(
        ctx.supabase,
        ctx.user.id,
        ctx.practice
      );

      let query = ctx.supabase
        .from("clients")
        .select("*")
        .eq("id", input.id);

      query = applyTherapistScope(query, ctx.user.id, ctx.practice, therapistIds);

      const { data, error } = await query.single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch client" });
      return data;
    }),

  /** Create a new client */
  create: protectedProcedure
    .input(createClientSchema)
    .mutation(async ({ ctx, input }) => {
      // Enforce client limit based on therapist's plan tier
      const [countRes, therapistRes] = await Promise.all([
        ctx.supabase
          .from("clients")
          .select("*", { count: "exact", head: true })
          .eq("therapist_id", ctx.user.id)
          .eq("is_active", true),
        ctx.supabase
          .from("therapists")
          .select("plan_tier")
          .eq("id", ctx.user.id)
          .single(),
      ]);

      // plan_tier column may not exist yet — default to "free"
      const tier = ((therapistRes.data as Record<string, unknown> | null)?.plan_tier as PricingTier) ?? "free";
      const tierConfig = PRICING_TIERS[tier] ?? PRICING_TIERS.free;
      const maxClients = tierConfig.max_clients;

      if (maxClients !== null && (countRes.count ?? 0) >= maxClients) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Your ${tierConfig.name} plan allows up to ${maxClients} active clients. Please upgrade to add more.`,
        });
      }

      const { data, error } = await ctx.supabase
        .from("clients")
        .insert({
          therapist_id: ctx.user.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create client" });

      logAudit(ctx.supabase, {
        therapist_id: ctx.user.id,
        actor_id: ctx.user.id,
        action: "create",
        entity_type: "client",
        entity_id: data.id,
      });

      return data;
    }),

  /** Update an existing client */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: updateClientSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("clients")
        .update({ ...input.data, updated_at: new Date().toISOString() })
        .eq("id", input.id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update client" });

      logAudit(ctx.supabase, {
        therapist_id: ctx.user.id,
        actor_id: ctx.user.id,
        action: "update",
        entity_type: "client",
        entity_id: input.id,
      });

      return data;
    }),

  /** Get detailed client profile with stats */
  getDetail: practiceProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const therapistIds = await getAccessibleTherapistIds(
        ctx.supabase,
        ctx.user.id,
        ctx.practice
      );

      // Build the client query with practice scope
      let clientQuery = ctx.supabase
        .from("clients")
        .select("*, recurring_reservations(*)")
        .eq("id", input.id)
        .eq("recurring_reservations.is_active", true);

      clientQuery = applyTherapistScope(clientQuery, ctx.user.id, ctx.practice, therapistIds);

      // Run all queries in parallel
      const [clientRes, countRes, lastSessionRes] = await Promise.all([
        clientQuery.single(),
        // Session count — scope by accessible therapists
        (async () => {
          let q = ctx.supabase
            .from("sessions")
            .select("*", { count: "exact", head: true })
            .eq("client_id", input.id);
          q = applyTherapistScope(q, ctx.user.id, ctx.practice, therapistIds);
          return q;
        })(),
        // Last session — scope by accessible therapists
        (async () => {
          let q = ctx.supabase
            .from("sessions")
            .select("starts_at, status")
            .eq("client_id", input.id)
            .order("starts_at", { ascending: false })
            .limit(1);
          q = applyTherapistScope(q, ctx.user.id, ctx.practice, therapistIds);
          return q;
        })(),
      ]);

      if (clientRes.error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch client details" });

      const { recurring_reservations, ...client } = clientRes.data;

      return {
        ...client,
        session_count: countRes.count ?? 0,
        last_session: lastSessionRes.data?.[0] ?? null,
        recurring_reservations: recurring_reservations ?? [],
      };
    }),

  /** Deactivate a client (soft delete) */
  deactivate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("clients")
        .update({
          is_active: false,
          status: "inactive",
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to deactivate client" });

      logAudit(ctx.supabase, {
        therapist_id: ctx.user.id,
        actor_id: ctx.user.id,
        action: "update",
        entity_type: "client",
        entity_id: input.id,
        changes: { status: "inactive", is_active: false },
      });

      return data;
    }),

  /** Update client status */
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      status: clientStatusEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("clients")
        .update({
          status: input.status,
          is_active: input.status !== "terminated",
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update client status" });

      logAudit(ctx.supabase, {
        therapist_id: ctx.user.id,
        actor_id: ctx.user.id,
        action: "update",
        entity_type: "client",
        entity_id: input.id,
        changes: { status: input.status },
      });

      return data;
    }),
});
