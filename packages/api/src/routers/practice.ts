import { router, protectedProcedure, publicProcedure } from "../trpc";
import {
  createPracticeSchema,
  inviteMemberSchema,
  updateMemberSchema,
  createInvitationSchema,
  acceptInvitationSchema,
  revokeInvitationSchema,
} from "@mano/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { logAudit } from "../utils/audit";

export const practiceRouter = router({
  /** Get the current user's practice (if any) */
  me: protectedProcedure.query(async ({ ctx }) => {
    // Check if user is a member of any practice
    const { data: membership } = await ctx.supabase
      .from("practice_members")
      .select("*, practices(*)")
      .eq("user_id", ctx.user.id)
      .single();

    if (!membership) return null;

    return {
      ...membership.practices,
      role: membership.role,
      can_view_notes: membership.can_view_notes,
    };
  }),

  /** Create a practice (current therapist becomes owner) */
  create: protectedProcedure
    .input(createPracticeSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user already owns a practice
      const { data: existing } = await ctx.supabase
        .from("practices")
        .select("id")
        .eq("owner_id", ctx.user.id)
        .single();

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "You already have a practice." });
      }

      // Create practice
      const { data: practice, error } = await ctx.supabase
        .from("practices")
        .insert({
          name: input.name,
          owner_id: ctx.user.id,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create practice" });

      // Add owner as member
      await ctx.supabase.from("practice_members").insert({
        practice_id: practice!.id,
        user_id: ctx.user.id,
        therapist_id: ctx.user.id,
        role: "owner",
        can_view_notes: true,
      });

      // Update therapist with practice_id
      await ctx.supabase
        .from("therapists")
        .update({ practice_id: practice!.id })
        .eq("id", ctx.user.id);

      return practice;
    }),

  /** List all members of the current user's practice */
  listMembers: protectedProcedure.query(async ({ ctx }) => {
    // Get user's practice
    const { data: membership } = await ctx.supabase
      .from("practice_members")
      .select("practice_id")
      .eq("user_id", ctx.user.id)
      .single();

    if (!membership) return [];

    const { data, error } = await ctx.supabase
      .from("practice_members")
      .select("*, therapists(full_name, email:slug, avatar_url)")
      .eq("practice_id", membership.practice_id)
      .order("role");

    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch practice members" });
    return data;
  }),

  /** Update a member's role or permissions (owner only) */
  updateMember: protectedProcedure
    .input(updateMemberSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify caller is owner
      const { data: practice } = await ctx.supabase
        .from("practices")
        .select("id")
        .eq("owner_id", ctx.user.id)
        .single();

      if (!practice) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the practice owner can manage members." });
      }

      const { member_id, ...updates } = input;
      const { data, error } = await ctx.supabase
        .from("practice_members")
        .update(updates)
        .eq("id", member_id)
        .eq("practice_id", practice.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update practice member" });

      logAudit(ctx.supabase, {
        therapist_id: ctx.user.id,
        actor_id: ctx.user.id,
        action: "update",
        entity_type: "practice_member",
        entity_id: input.member_id,
      });

      return data;
    }),

  /** Remove a member from the practice (owner only) */
  removeMember: protectedProcedure
    .input(z.object({ member_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: practice } = await ctx.supabase
        .from("practices")
        .select("id")
        .eq("owner_id", ctx.user.id)
        .single();

      if (!practice) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the practice owner can remove members." });
      }

      // Don't allow removing self (owner) — scope by practice_id
      const { data: member } = await ctx.supabase
        .from("practice_members")
        .select("user_id")
        .eq("id", input.member_id)
        .eq("practice_id", practice.id)
        .single();

      if (member?.user_id === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot remove yourself from the practice." });
      }

      const { error } = await ctx.supabase
        .from("practice_members")
        .delete()
        .eq("id", input.member_id)
        .eq("practice_id", practice.id);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to remove practice member" });

      logAudit(ctx.supabase, {
        therapist_id: ctx.user.id,
        actor_id: ctx.user.id,
        action: "delete",
        entity_type: "practice_member",
        entity_id: input.member_id,
      });

      return { success: true };
    }),

  /** Create an invitation link (owner only) */
  createInvitation: protectedProcedure
    .input(createInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      const { data: practice } = await ctx.supabase
        .from("practices")
        .select("id")
        .eq("owner_id", ctx.user.id)
        .single();

      if (!practice) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the practice owner can create invitations." });
      }

      const { data: invitation, error } = await ctx.supabase
        .from("practice_invitations")
        .insert({
          practice_id: practice.id,
          invited_by: ctx.user.id,
          email: input.email ?? null,
          role: input.role,
          can_view_notes: input.can_view_notes,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create invitation" });
      return invitation;
    }),

  /** List invitations for the current practice */
  listInvitations: protectedProcedure.query(async ({ ctx }) => {
    const { data: membership } = await ctx.supabase
      .from("practice_members")
      .select("practice_id")
      .eq("user_id", ctx.user.id)
      .single();

    if (!membership) return [];

    const { data, error } = await ctx.supabase
      .from("practice_invitations")
      .select("*")
      .eq("practice_id", membership.practice_id)
      .order("created_at", { ascending: false });

    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch invitations" });
    return data;
  }),

  /** Get invitation details by token (PUBLIC — for accept page) */
  getInvitationByToken: publicProcedure
    .input(z.object({ token: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data } = await ctx.supabase
        .from("practice_invitations")
        .select("id, token, email, role, can_view_notes, status, expires_at, practices(name)")
        .eq("token", input.token)
        .single();

      if (!data) return null;

      return {
        ...data,
        practice_name: (data.practices as unknown as { name: string } | null)?.name ?? "Unknown",
      };
    }),

  /** Accept an invitation (authenticated user) */
  acceptInvitation: protectedProcedure
    .input(acceptInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      const { data: invitation } = await ctx.supabase
        .from("practice_invitations")
        .select("*")
        .eq("token", input.token)
        .eq("status", "pending")
        .single();

      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found or already used." });
      }

      if (new Date(invitation.expires_at) < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This invitation has expired." });
      }

      if (invitation.email && invitation.email !== ctx.user.email) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This invitation is for a different email." });
      }

      // Add user as practice member
      const { error: memberError } = await ctx.supabase
        .from("practice_members")
        .insert({
          practice_id: invitation.practice_id,
          user_id: ctx.user.id,
          therapist_id: ctx.user.id,
          role: invitation.role,
          can_view_notes: invitation.can_view_notes,
        });

      if (memberError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to add practice member" });

      // Update therapist's practice_id
      await ctx.supabase
        .from("therapists")
        .update({ practice_id: invitation.practice_id })
        .eq("id", ctx.user.id);

      // Mark invitation as accepted
      await ctx.supabase
        .from("practice_invitations")
        .update({
          status: "accepted",
          accepted_by: ctx.user.id,
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);

      return { success: true };
    }),

  /** Revoke a pending invitation (owner only) */
  revokeInvitation: protectedProcedure
    .input(revokeInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      const { data: practice } = await ctx.supabase
        .from("practices")
        .select("id")
        .eq("owner_id", ctx.user.id)
        .single();

      if (!practice) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the practice owner can revoke invitations." });
      }

      const { error } = await ctx.supabase
        .from("practice_invitations")
        .update({ status: "revoked" })
        .eq("id", input.invitation_id)
        .eq("practice_id", practice.id)
        .eq("status", "pending");

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to revoke invitation" });
      return { success: true };
    }),
});
