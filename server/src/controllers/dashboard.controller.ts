import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { serializeMember } from "../services/memberSerializer";

export async function getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(
      2,
      "0"
    )}`;

    const [
      totalMembers,
      recentMembers,
      totalSalesCount,
      salesAggregate,
      currentMonthMembers,
      currentMonthSales,
    ] = await Promise.all([
      prisma.member.count(),
      prisma.member.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { rank: true, sponsor: true, user: true },
      }),
      prisma.sale.count(),
      prisma.sale.aggregate({ _sum: { amount: true } }),
      prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int AS count
        FROM "Member"
        WHERE "createdAt" >= ${monthStart} AND "createdAt" < ${nextMonthStart}
      `,
      prisma.$queryRaw<Array<{ count: number; amount: string }>>`
        SELECT COUNT(*)::int AS count,
          COALESCE(SUM("amount"), 0)::text AS amount
        FROM "Sale"
        WHERE "saleDate" >= ${monthStart} AND "saleDate" < ${nextMonthStart}
      `,
    ]);

    res.json({
      totalMembers,
      recentMembers: recentMembers.map((m) => serializeMember(m, m.user.userId)),
      totalSalesCount,
      totalSalesAmount: salesAggregate._sum.amount?.toString() ?? "0",
      currentMonthActivity: {
        month: currentMonth,
        memberCount: currentMonthMembers[0]?.count ?? 0,
        salesCount: currentMonthSales[0]?.count ?? 0,
        salesAmount: currentMonthSales[0]?.amount ?? "0",
      },
    });
  } catch (err) {
    next(err);
  }
}
