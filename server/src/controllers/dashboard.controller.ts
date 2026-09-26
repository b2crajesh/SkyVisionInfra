import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { serializeMember } from "../services/memberSerializer";

export async function getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [totalMembers, recentMembers, totalSalesCount, salesAggregate] = await Promise.all([
      prisma.member.count(),
      prisma.member.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { rank: true, sponsor: true, user: true },
      }),
      prisma.sale.count(),
      prisma.sale.aggregate({ _sum: { amount: true } }),
    ]);

    res.json({
      totalMembers,
      recentMembers: recentMembers.map((m) => serializeMember(m, m.user.userId)),
      totalSalesCount,
      totalSalesAmount: salesAggregate._sum.amount?.toString() ?? "0",
    });
  } catch (err) {
    next(err);
  }
}
