import { z } from "zod";

export const therapyModalityEnum = z.string().min(1);

export const treatmentPlanStatusEnum = z.enum(["draft", "active", "completed", "archived"]);

export const subGoalSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500),
  completed: z.boolean().default(false),
});

export const goalSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500),
  sub_goals: z.array(subGoalSchema).default([]),
  completed: z.boolean().default(false),
});

export const createTreatmentPlanSchema = z.object({
  client_id: z.string().uuid(),
  title: z.string().max(200).default("Treatment Plan"),
  modality: therapyModalityEnum,
  modality_other: z.string().max(200).nullable().optional(),
  presenting_concerns: z.string().nullable().optional(),
  diagnosis: z.string().nullable().optional(),
  goals: z.array(goalSchema).optional(),
  start_date: z.string().nullable().optional(),
  target_end_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const updateTreatmentPlanSchema = createTreatmentPlanSchema
  .omit({ client_id: true })
  .partial();

export type TherapyModality = z.infer<typeof therapyModalityEnum>;
export type TreatmentPlanStatus = z.infer<typeof treatmentPlanStatusEnum>;
export type Goal = z.infer<typeof goalSchema>;
export type SubGoal = z.infer<typeof subGoalSchema>;
export type CreateTreatmentPlanInput = z.infer<typeof createTreatmentPlanSchema>;
export type UpdateTreatmentPlanInput = z.infer<typeof updateTreatmentPlanSchema>;
