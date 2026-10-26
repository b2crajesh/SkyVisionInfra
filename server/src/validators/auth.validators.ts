import { z } from "zod";

export const loginSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  password: z.string().min(1, "password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "currentPassword is required"),
  newPassword: z.string().min(8, "newPassword must be at least 8 characters"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const adminRecoveryRequestSchema = z.object({
  userId: z.string().trim().min(1, "userId is required").max(100),
});

export type AdminRecoveryRequestInput = z.infer<typeof adminRecoveryRequestSchema>;

export const adminRecoveryResetSchema = z.object({
  token: z.string().min(1, "token is required").max(256),
  newPassword: z.string().min(12, "newPassword must be at least 12 characters").max(128),
});

export type AdminRecoveryResetInput = z.infer<typeof adminRecoveryResetSchema>;
