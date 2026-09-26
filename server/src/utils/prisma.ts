import { PrismaClient } from "@prisma/client";

// Single shared PrismaClient instance across the app.
export const prisma = new PrismaClient();
