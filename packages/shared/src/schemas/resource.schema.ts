import { z } from "zod";

export const resourceTypeEnum = z.enum(["file", "link", "worksheet"]);

export const createResourceSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).nullable().optional(),
  resource_type: resourceTypeEnum,
  file_url: z.string().url().nullable().optional(),
  external_url: z.string().url().nullable().optional(),
  modality_tags: z.array(z.string()).default([]),
  category_tags: z.array(z.string()).default([]),
});

export const updateResourceSchema = createResourceSchema.partial();

export const shareResourceSchema = z.object({
  resource_id: z.string().uuid(),
  client_id: z.string().uuid(),
  note: z.string().max(1000).nullable().optional(),
});

export type ResourceType = z.infer<typeof resourceTypeEnum>;
export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type ShareResourceInput = z.infer<typeof shareResourceSchema>;
