import { Prisma } from "@prisma/client";

export function calculateCommissionAmount(
  bookingAmount: Prisma.Decimal | number,
  percentage: number
): Prisma.Decimal {
  return new Prisma.Decimal(bookingAmount).mul(percentage).div(100);
}

export function calculateCommissionBreakdown(amount: Prisma.Decimal | number) {
  const grossAmount = new Prisma.Decimal(amount).toDecimalPlaces(2);
  const tdsPercentage = new Prisma.Decimal(5);
  const tdsAmount = grossAmount.mul(tdsPercentage).div(100).toDecimalPlaces(2);

  return {
    amount: grossAmount,
    tdsPercentage,
    tdsAmount,
    netAmount: grossAmount.minus(tdsAmount),
  };
}
