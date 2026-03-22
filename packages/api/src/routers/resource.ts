import { router, protectedProcedure } from "../trpc";
import { createResourceSchema, updateResourceSchema, shareResourceSchema } from "@mano/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const resourceRouter = router({
  /** List therapist's resource library */
  list: protectedProcedure
    .input(z.object({
      modality_tag: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    }).optional())
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("resources")
        .select("*")
        .eq("therapist_id", ctx.user.id)
        .order("created_at", { ascending: false })
        .limit(input?.limit ?? 50);

      if (input?.modality_tag) {
        query = query.contains("modality_tags", [input.modality_tag]);
      }

      const { data, error } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch resources" });
      return data;
    }),

  /** Get a single resource */
  getById: protectedProcedure
    .input(z.object({ resource_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("resources")
        .select("*")
        .eq("id", input.resource_id)
        .eq("therapist_id", ctx.user.id)
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch resource" });
      return data;
    }),

  /** Create a resource */
  create: protectedProcedure
    .input(createResourceSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("resources")
        .insert({ therapist_id: ctx.user.id, ...input })
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create resource" });
      return data;
    }),

  /** Update a resource */
  update: protectedProcedure
    .input(z.object({
      resource_id: z.string().uuid(),
      data: updateResourceSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("resources")
        .update({ ...input.data, updated_at: new Date().toISOString() })
        .eq("id", input.resource_id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update resource" });
      return data;
    }),

  /** Soft-delete a resource (sets deleted_at, RLS hides from future reads) */
  delete: protectedProcedure
    .input(z.object({ resource_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("resources")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", input.resource_id)
        .eq("therapist_id", ctx.user.id);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete resource" });
      return { success: true };
    }),

  /** Share a resource with a client */
  share: protectedProcedure
    .input(shareResourceSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("client_resources")
        .insert({
          therapist_id: ctx.user.id,
          resource_id: input.resource_id,
          client_id: input.client_id,
          note: input.note ?? null,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to share resource" });
      return data;
    }),

  /** Unshare a resource from a client */
  unshare: protectedProcedure
    .input(z.object({
      resource_id: z.string().uuid(),
      client_id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("client_resources")
        .delete()
        .eq("resource_id", input.resource_id)
        .eq("client_id", input.client_id)
        .eq("therapist_id", ctx.user.id);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to unshare resource" });
      return { success: true };
    }),

  /** List resources shared with a specific client */
  listShared: protectedProcedure
    .input(z.object({ client_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("client_resources")
        .select("*, resources(*)")
        .eq("client_id", input.client_id)
        .eq("therapist_id", ctx.user.id)
        .order("shared_at", { ascending: false });

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch shared resources" });
      return data;
    }),
});
