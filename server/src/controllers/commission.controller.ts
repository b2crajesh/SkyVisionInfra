import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { ApiError } from "../middleware/errorHandler";

const memberSummarySelect = { id: true, name: true, memberCode: true } as const;

function serializeCommission(c: {
  id: string;
  member?: { id: string; name: string; memberCode: string };
  sourceMember: { id: string; name: string; memberCode: string };
  bookingAmount: { toString(): string };
  percentage: { toString(): string };
  amount: { toString(): string };
  createdAt: Date;
}) {
  return {
    id: c.id,
    member: c.member,
    sourceMember: c.sourceMember,
    bookingAmount: c.bookingAmount.toString(),
    percentage: c.percentage.toString(),
    amount: c.amount.toString(),
    createdAt: c.createdAt.toISOString(),
  };
}

export async function getMyCommissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.memberId) {
      throw new ApiError(404, "No member profile linked to this account");
    }

    const commissions = await prisma.commission.findMany({
      where: { memberId: req.user.memberId },
      include: { sourceMember: { select: memberSummarySelect } },
      orderBy: { createdAt: "desc" },
    });

    const totalAmount = commissions.reduce((sum, c) => sum + Number(c.amount), 0);

    res.json({
      commissions: commissions.map((c) => serializeCommission(c)),
      totalAmount: totalAmount.toString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function listCommissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { memberId, page, pageSize } = req.query as Record<string, string | undefined>;

    const where = memberId ? { memberId } : {};
    const take = Math.min(Number(pageSize) || 20, 100);
    const currentPage = Math.max(Number(page) || 1, 1);
    const skip = (currentPage - 1) * take;

    const [commissions, total, totalAmountAgg] = await Promise.all([
      prisma.commission.findMany({
        where,
        include: {
          member: { select: memberSummarySelect },
          sourceMember: { select: memberSummarySelect },
        },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.commission.count({ where }),
      prisma.commission.aggregate({ where, _sum: { amount: true } }),
    ]);

    res.json({
      commissions: commissions.map((c) => serializeCommission(c)),
      totalAmount: (totalAmountAgg._sum.amount ?? 0).toString(),
      pagination: { page: currentPage, pageSize: take, total, totalPages: Math.ceil(total / take) || 1 },
    });
  } catch (err) {
    next(err);
  }
}
