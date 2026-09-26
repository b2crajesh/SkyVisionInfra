import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().min(2, "name is required"),
  email: z.string().email("email must be valid"),
  phone: z.string().min(7, "phone is required"),
  subject: z.string().min(2, "subject is required"),
  message: z.string().min(5, "message is required"),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
