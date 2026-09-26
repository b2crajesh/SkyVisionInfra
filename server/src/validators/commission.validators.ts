import { z } from "zod";

export const listCommissionsQuerySchema = z.object({
  memberId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export type ListCommissionsQuery = z.infer<typeof listCommissionsQuerySchema>;
