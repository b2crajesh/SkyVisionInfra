import { z } from "zod";

export const relationshipEnum = z.enum([
  "SPOUSE",
  "SON",
  "DAUGHTER",
  "FATHER",
  "MOTHER",
  "BROTHER",
  "SISTER",
  "OTHER",
]);

export const createMemberSchema = z.object({
  name: z.string().min(2, "name is required"),
  phone: z.string().regex(/^\d{10}$/, "phone must be exactly 10 digits"),
  email: z.string().email("email must be a valid email address"),
  address: z.string().min(3, "address is required"),
  dateOfBirth: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "dateOfBirth must be a valid date")
    .refine((v) => new Date(v).getTime() < Date.now(), "dateOfBirth must be in the past"),
  aadhaarNumber: z
    .string()
    .regex(/^\d{12}$/, "aadhaarNumber must be exactly 12 digits"),
  panNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "panNumber must match standard PAN format"),
  bookingAmount: z
    .number({ invalid_type_error: "bookingAmount must be a number" })
    .nonnegative("bookingAmount must not be negative"),
  nomineeName: z.string().min(2, "nomineeName is required"),
  relationship: relationshipEnum,
  rankId: z.string().uuid("rankId must be a valid id"),
  sponsorMemberId: z.string().min(1, "sponsorMemberId is required"),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;

export const updateMemberSchema = createMemberSchema.partial();

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

export const listMembersQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  sortBy: z.enum(["name", "createdAt", "memberCode", "bookingAmount"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  forSponsor: z
    .union([z.literal("true"), z.literal("false")])
    .optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid id"),
});
