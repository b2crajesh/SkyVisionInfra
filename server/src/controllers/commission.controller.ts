import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { ApiError } from "../middleware/errorHandler";

const memberSummarySelect = { id: true, name: true, memberCode: true } as const;

function serializeCommission(c: {
  id: string;
  type: "JOINING" | "SALE";
  member?: { id: string; name: string; memberCode: string };
  sourceMember: { id: string; name: string; memberCode: string };
  baseAmount: { toString(): string };
  percentage: { toString(): string };
  amount: { toString(): string };
  tdsPercentage: { toString(): string };
  tdsAmount: { toString(): string };
  netAmount: { toString(): string };
  createdAt: Date;
}) {
  return {
    id: c.id,
    type: c.type,
    member: c.member,
    sourceMember: c.sourceMember,
    baseAmount: c.baseAmount.toString(),
    percentage: c.percentage.toString(),
    amount: c.amount.toString(),
    tdsPercentage: c.tdsPercentage.toString(),
    tdsAmount: c.tdsAmount.toString(),
    netAmount: c.netAmount.toString(),
    createdAt: c.createdAt.toISOString(),
  };
}

function getCommissionOrderBy(
  sortBy: string | undefined,
  sortOrder: string | undefined
): Prisma.CommissionOrderByWithRelationInput {
  const direction = sortOrder === "asc" ? "asc" : "desc";
  switch (sortBy) {
    case "type":
      return { type: direction };
    case "baseAmount":
      return { baseAmount: direction };
    case "percentage":
      return { percentage: direction };
    case "amount":
      return { amount: direction };
    case "tdsPercentage":
      return { tdsPercentage: direction };
    case "tdsAmount":
      return { tdsAmount: direction };
    case "netAmount":
      return { netAmount: direction };
    default:
      return { createdAt: direction };
  }
}

export async function getMyCommissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.memberId) {
      throw new ApiError(404, "No member profile linked to this account");
    }

    const where = { memberId: req.user.memberId };
    const [commissions, totals] = await Promise.all([
      prisma.commission.findMany({
        where,
        include: { sourceMember: { select: memberSummarySelect } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.commission.aggregate({ where, _sum: { amount: true, tdsAmount: true, netAmount: true } }),
    ]);

    res.json({
      commissions: commissions.map((c) => serializeCommission(c)),
      totalAmount: (totals._sum.amount ?? 0).toString(),
      totalGrossAmount: (totals._sum.amount ?? 0).toString(),
      totalTdsAmount: (totals._sum.tdsAmount ?? 0).toString(),
      totalNetAmount: (totals._sum.netAmount ?? 0).toString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function listCommissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { memberId, search, type, sortBy, sortOrder, page, pageSize } =
      req.query as Record<string, string | undefined>;

    const where: Prisma.CommissionWhereInput = {};
    if (memberId) where.memberId = memberId;
    if (type === "JOINING" || type === "SALE") where.type = type;
    if (search) {
      where.OR = [
        { member: { name: { contains: search, mode: "insensitive" } } },
        { member: { memberCode: { contains: search, mode: "insensitive" } } },
        { sourceMember: { name: { contains: search, mode: "insensitive" } } },
        { sourceMember: { memberCode: { contains: search, mode: "insensitive" } } },
      ];
    }

    const take = Math.min(Number(pageSize) || 20, 100);
    const currentPage = Math.max(Number(page) || 1, 1);
    const skip = (currentPage - 1) * take;
    const orderBy = getCommissionOrderBy(sortBy, sortOrder);

    const [commissions, total, totals] = await Promise.all([
      prisma.commission.findMany({
        where,
        include: {
          member: { select: memberSummarySelect },
          sourceMember: { select: memberSummarySelect },
        },
        orderBy,
        take,
        skip,
      }),
      prisma.commission.count({ where }),
      prisma.commission.aggregate({ where, _sum: { amount: true, tdsAmount: true, netAmount: true } }),
    ]);

    res.json({
      commissions: commissions.map((c) => serializeCommission(c)),
      totalAmount: (totals._sum.amount ?? 0).toString(),
      totalGrossAmount: (totals._sum.amount ?? 0).toString(),
      totalTdsAmount: (totals._sum.tdsAmount ?? 0).toString(),
      totalNetAmount: (totals._sum.netAmount ?? 0).toString(),
      pagination: { page: currentPage, pageSize: take, total, totalPages: Math.ceil(total / take) || 1 },
    });
  } catch (err) {
    next(err);
  }
}
