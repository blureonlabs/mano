import { router, protectedProcedure, publicProcedure } from "../trpc";
import {
  createIntakeFormSchema,
  updateIntakeFormSchema,
  submitIntakeResponseSchema,
  intakeFormStatusEnum,
} from "@mano/shared";
import type { IntakeFieldResponse, IntakeField } from "@mano/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { encryptJSON, decryptJSON } from "../utils/encryption";

export const intakeFormRouter = router({
  // ─── PROTECTED: Therapist CRUD ───────────────────────────

  /** List therapist's form templates */
  list: protectedProcedure
    .input(z.object({ status: intakeFormStatusEnum.optional() }).optional())
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("intake_forms")
        .select("*")
        .eq("therapist_id", ctx.user.id)
        .order("created_at", { ascending: false });

      if (input?.status) {
        query = query.eq("status", input.status);
      }

      const { data, error } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to load forms" });
      return data ?? [];
    }),

  /** Get single template */
  getById: protectedProcedure
    .input(z.object({ form_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("intake_forms")
        .select("*")
        .eq("id", input.form_id)
        .eq("therapist_id", ctx.user.id)
        .single();

      if (error || !data) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
      }
      return data;
    }),

  /** Create form template */
  create: protectedProcedure
    .input(createIntakeFormSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("intake_forms")
        .insert({
          therapist_id: ctx.user.id,
          name: input.name,
          description: input.description ?? null,
          form_type: input.form_type,
          status: input.status,
          fields: input.fields,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create form" });
      return data;
    }),

  /** Update form template */
  update: protectedProcedure
    .input(updateIntakeFormSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const { data, error } = await ctx.supabase
        .from("intake_forms")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("therapist_id", ctx.user.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update form" });
      return data;
    }),

  /** Delete form template */
  delete: protectedProcedure
    .input(z.object({ form_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("intake_forms")
        .delete()
        .eq("id", input.form_id)
        .eq("therapist_id", ctx.user.id);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete form" });
      return { success: true };
    }),

  // ─── PUBLIC: Client-facing ───────────────────────────────

  /** Load form for client by access_token (returns form_snapshot) */
  getPublicForm: publicProcedure
    .input(z.object({ access_token: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("intake_responses")
        .select("id, status, form_snapshot, expires_at, intake_forms(name, description, form_type), clients(full_name)")
        .eq("access_token", input.access_token)
        .single();

      if (error || !data) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Form not found or link has expired." });
      }

      // Check expiry
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        throw new TRPCError({ code: "NOT_FOUND", message: "This intake form link has expired." });
      }

      const formInfo = data.intake_forms as unknown as { name: string; description: string | null; form_type: string } | null;
      const clientInfo = data.clients as unknown as { full_name: string } | null;

      return {
        status: data.status as "pending" | "submitted",
        form_snapshot: data.form_snapshot as IntakeField[],
        form_name: formInfo?.name ?? "Intake Form",
        form_description: formInfo?.description ?? null,
        form_type: formInfo?.form_type ?? "individual",
        client_name: clientInfo?.full_name ?? "",
      };
    }),

  /** Submit intake form responses (public) */
  submit: publicProcedure
    .input(submitIntakeResponseSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Get the response record
      const { data: record, error: fetchError } = await ctx.supabase
        .from("intake_responses")
        .select("id, status, form_snapshot, client_id, therapist_id, expires_at")
        .eq("access_token", input.access_token)
        .single();

      if (fetchError || !record) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Form not found." });
      }

      if (record.status === "submitted") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This form has already been submitted." });
      }

      if (record.expires_at && new Date(record.expires_at) < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This form link has expired." });
      }

      // 2. Validate required fields
      const fields = record.form_snapshot as IntakeField[];
      for (const field of fields) {
        if (!field.required) continue;
        if (field.type === "heading") continue;

        const response = input.responses.find((r) => r.field_id === field.id);
        if (!response || response.value === null || response.value === "") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `"${field.label}" is required.`,
          });
        }

        // Consent fields must be true
        if (field.type === "consent" && response.value !== true) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `You must agree to "${field.label}".`,
          });
        }
      }

      // 3. Encrypt responses
      const encrypted = encryptJSON(input.responses);

      // 4. Update the response record
      const { error: updateError } = await ctx.supabase
        .from("intake_responses")
        .update({
          responses: encrypted,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", record.id);

      if (updateError) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to submit form." });
      }

      // 5. Mark client intake as completed
      await ctx.supabase
        .from("clients")
        .update({ intake_completed: true })
        .eq("id", record.client_id);

      return { success: true };
    }),

  // ─── PROTECTED: View responses ───────────────────────────

  /** List intake responses for a client */
  listResponses: protectedProcedure
    .input(z.object({ client_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("intake_responses")
        .select("*, intake_forms(name, form_type)")
        .eq("therapist_id", ctx.user.id)
        .eq("client_id", input.client_id)
        .order("created_at", { ascending: false });

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to load responses" });

      return (data ?? []).map((r) => ({
        ...r,
        responses: r.responses ? decryptJSON<IntakeFieldResponse[]>(r.responses) : null,
      }));
    }),

  /** Get single response detail (decrypted) */
  getResponse: protectedProcedure
    .input(z.object({ response_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("intake_responses")
        .select("*, intake_forms(name, form_type), clients(full_name)")
        .eq("id", input.response_id)
        .eq("therapist_id", ctx.user.id)
        .single();

      if (error || !data) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Response not found" });
      }

      return {
        ...data,
        responses: data.responses ? decryptJSON<IntakeFieldResponse[]>(data.responses) : null,
      };
    }),
});
