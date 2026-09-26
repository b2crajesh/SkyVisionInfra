import { Prisma } from "@prisma/client";

export const COMMISSION_PERCENTAGE = 20;

export function calculateCommissionAmount(bookingAmount: Prisma.Decimal | number): Prisma.Decimal {
  return new Prisma.Decimal(bookingAmount).mul(COMMISSION_PERCENTAGE).div(100);
}
