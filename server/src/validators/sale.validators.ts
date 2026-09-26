import { z } from "zod";

export const createSaleSchema = z.object({
  memberId: z.string().uuid("memberId must be a valid id"),
  plotReference: z.string().min(1, "plotReference is required"),
  area: z.number({ invalid_type_error: "area must be a number" }).positive("area must be positive"),
  amount: z.number({ invalid_type_error: "amount must be a number" }).positive("amount must be positive"),
  saleDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "saleDate must be a valid date"),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export const listSalesQuerySchema = z.object({
  memberId: z.string().uuid().optional(),
  plotReference: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),
  sortBy: z.enum(["saleDate", "amount", "createdAt", "plotReference"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});
