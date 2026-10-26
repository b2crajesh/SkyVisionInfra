import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().trim().min(2, "name is required").max(120),
  email: z.string().trim().email("email must be valid").max(254),
  phone: z.string().trim().min(7, "phone is required").max(30),
  subject: z.string().trim().min(2, "subject is required").max(200),
  message: z.string().trim().min(5, "message is required").max(5000),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
