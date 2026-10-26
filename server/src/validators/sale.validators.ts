import { z } from "zod";

export const createSaleSchema = z.object({
  memberId: z.string().uuid("memberId must be a valid id"),
  plotReference: z.string().min(1, "plotReference is required"),
  area: z.number({ invalid_type_error: "area must be a number" }).positive("area must be positive"),
  rate: z.number({ invalid_type_error: "rate must be a number" }).positive("rate must be positive"),
  saleDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "saleDate must be a valid date"),
});

export const updateSaleSchema = createSaleSchema;

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;

export const saleIdParamsSchema = z.object({
  id: z.string().uuid("Sale id must be a valid id"),
});

export const listSalesQuerySchema = z.object({
  memberId: z.string().uuid().optional(),
  plotReference: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),
  sortBy: z.enum(["saleDate", "amount", "area", "rate", "createdAt", "plotReference"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});
