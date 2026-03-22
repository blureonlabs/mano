import { z } from "zod";

/** Standardized cursor-based pagination input. */
export const paginationSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(), // ISO datetime or UUID for cursor-based pagination
});

/** Offset-based pagination input (for simple cases like client-portal pastSessions). */
export const offsetPaginationSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});
