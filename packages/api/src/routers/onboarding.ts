import { router, publicProcedure, protectedProcedure } from "../trpc";
import { createOnboardingTokenSchema, toggleOnboardingTokenSchema } from "@mano/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const onboardingRouter = router({
  /** Create a client onboarding token/link */
  createToken: protectedProcedure
    .input(createOnboardingTokenSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("client_onboarding_tokens")
        .insert({
          therapist_id: ctx.user.id,
          label: input.label ?? null,
          max_uses: input.max_uses ?? null,
          expires_at: input.expires_at ?? null,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create onboarding token" });
      return data;
    }),

  /** List therapist's onboarding tokens */
  listTokens: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("client_onboarding_tokens")
      .select("*")
      .eq("therapist_id", ctx.user.id)
      .order("created_at", { ascending: false });

    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch onboarding tokens" });
    return data;
  }),

  /** Toggle a token active/inactive */
  toggleToken: protectedProcedure
    .input(toggleOnboardingTokenSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("client_onboarding_tokens")
        .update({ is_active: input.is_active })
        .eq("id", input.token_id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to toggle onboarding token" });
      return data;
    }),

  /** Get onboarding token details (PUBLIC — for onboarding page) */
  getByToken: publicProcedure
    .input(z.object({ token: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data } = await ctx.supabase
        .from("client_onboarding_tokens")
        .select("id, token, label, is_active, max_uses, use_count, expires_at, therapist_id, therapists(display_name, full_name, slug, avatar_url)")
        .eq("token", input.token)
        .single();

      if (!data) return null;

      const therapist = data.therapists as unknown as {
        display_name: string;
        full_name: string;
        slug: string;
        avatar_url: string | null;
      } | null;

      // Check if token is usable
      const isExpired = data.expires_at && new Date(data.expires_at) < new Date();
      const isMaxed = data.max_uses && data.use_count >= data.max_uses;
      const isUsable = data.is_active && !isExpired && !isMaxed;

      return {
        id: data.id,
        token: data.token,
        label: data.label,
        is_usable: isUsable,
        therapist_name: therapist?.display_name ?? therapist?.full_name ?? "Unknown",
        therapist_slug: therapist?.slug ?? null,
        therapist_avatar: therapist?.avatar_url ?? null,
      };
    }),

  /** Register a client via onboarding token (PUBLIC) */
  registerClient: publicProcedure
    .input(z.object({
      token: z.string().uuid(),
      full_name: z.string().min(1).max(200),
      email: z.string().email(),
      phone: z.string().max(20).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate token
      const { data: tokenData } = await ctx.supabase
        .from("client_onboarding_tokens")
        .select("id, therapist_id, is_active, max_uses, use_count, expires_at")
        .eq("token", input.token)
        .single();

      if (!tokenData) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid onboarding link." });
      }

      if (!tokenData.is_active) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This onboarding link is no longer active." });
      }

      if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This onboarding link has expired." });
      }

      if (tokenData.max_uses && tokenData.use_count >= tokenData.max_uses) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This onboarding link has reached its maximum uses." });
      }

      // Find or create client record for this therapist
      let { data: client } = await ctx.supabase
        .from("clients")
        .select("*")
        .eq("therapist_id", tokenData.therapist_id)
        .eq("email", input.email)
        .single();

      if (!client) {
        const { data: newClient, error } = await ctx.supabase
          .from("clients")
          .insert({
            therapist_id: tokenData.therapist_id,
            full_name: input.full_name,
            email: input.email,
            phone: input.phone ?? null,
          })
          .select()
          .single();

        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create client" });
        client = newClient;
      }

      // Increment use count
      await ctx.supabase
        .from("client_onboarding_tokens")
        .update({ use_count: tokenData.use_count + 1 })
        .eq("id", tokenData.id);

      return {
        client_id: client!.id,
        therapist_id: tokenData.therapist_id,
      };
    }),
});
