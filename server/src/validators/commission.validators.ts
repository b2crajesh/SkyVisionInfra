import { z } from "zod";

export const listCommissionsQuerySchema = z.object({
  memberId: z.string().uuid().optional(),
  search: z.string().trim().max(100).optional(),
  type: z.enum(["JOINING", "SALE"]).optional(),
  sortBy: z
    .enum(["type", "baseAmount", "percentage", "amount", "tdsPercentage", "tdsAmount", "netAmount", "createdAt"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export type ListCommissionsQuery = z.infer<typeof listCommissionsQuerySchema>;
