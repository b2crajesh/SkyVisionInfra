import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { env } from "./env";

// Single shared PrismaClient instance across the app.
export const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: env.DATABASE_URL }),
});
