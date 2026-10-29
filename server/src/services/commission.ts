import { Prisma } from "@prisma/client";

export function calculateCommissionAmount(
  bookingAmount: Prisma.Decimal | number,
  percentage: number
): Prisma.Decimal {
  return new Prisma.Decimal(bookingAmount).mul(percentage).div(100);
}
