import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { ApiError } from "../middleware/errorHandler";
import { CreateSaleInput, UpdateSaleInput } from "../validators/sale.validators";
import { calculateCommissionAmount, calculateCommissionBreakdown } from "../services/commission";

function serializeSale(sale: Prisma.SaleGetPayload<{ include: { member: true } }>) {
  return {
    id: sale.id,
    memberId: sale.memberId,
    memberName: sale.member.name,
    memberCode: sale.member.memberCode,
    plotReference: sale.plotReference,
    area: sale.area.toString(),
    rate: sale.rate.toString(),
    amount: sale.amount.toString(),
    saleDate: sale.saleDate.toISOString(),
    createdAt: sale.createdAt.toISOString(),
  };
}

export async function listSales(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      memberId,
      plotReference,
      search,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      sortBy,
      sortOrder,
      page,
      pageSize,
    } = req.query as Record<string, string | undefined>;

    const where: Prisma.SaleWhereInput = {};
    if (memberId) where.memberId = memberId;
    if (plotReference) where.plotReference = { contains: plotReference, mode: "insensitive" };
    if (search) {
      where.OR = [
        { plotReference: { contains: search, mode: "insensitive" } },
        { member: { name: { contains: search, mode: "insensitive" } } },
        { member: { memberCode: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (dateFrom || dateTo) {
      where.saleDate = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }
    if (minAmount || maxAmount) {
      where.amount = {
        ...(minAmount ? { gte: Number(minAmount) } : {}),
        ...(maxAmount ? { lte: Number(maxAmount) } : {}),
      };
    }

    const take = Math.min(Number(pageSize) || 20, 100);
    const currentPage = Math.max(Number(page) || 1, 1);
    const skip = (currentPage - 1) * take;

    const orderBy: Prisma.SaleOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder === "desc" ? "desc" : "asc" }
      : { saleDate: "desc" };

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({ where, include: { member: true }, orderBy, take, skip }),
      prisma.sale.count({ where }),
    ]);

    res.json({
      sales: sales.map(serializeSale),
      pagination: { page: currentPage, pageSize: take, total, totalPages: Math.ceil(total / take) || 1 },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMySales(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.memberId) {
      throw new ApiError(404, "No member profile linked to this account");
    }
    const sales = await prisma.sale.findMany({
      where: { memberId: req.user.memberId },
      include: { member: true },
      orderBy: { saleDate: "desc" },
    });
    res.json({ sales: sales.map(serializeSale) });
  } catch (err) {
    next(err);
  }
}

export async function createSale(
  req: Request<unknown, unknown, CreateSaleInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError(401, "Not authenticated");
    }
    const input = req.body;

    const sale = await prisma.$transaction(async (tx) => {
      const member = await tx.member.findUnique({
        where: { id: input.memberId },
        include: { sponsor: { include: { rank: true } } },
      });
      if (!member) {
        throw new ApiError(400, "memberId does not reference an existing member");
      }

      const sale = await tx.sale.create({
        data: {
          memberId: input.memberId,
          plotReference: input.plotReference,
          area: input.area,
          rate: input.rate,
          amount: new Prisma.Decimal(input.area).mul(input.rate).toDecimalPlaces(2),
          saleDate: new Date(input.saleDate),
          createdByUserId: req.user!.id,
        },
        include: { member: true },
      });

      if (member.sponsor) {
        const percentage = member.sponsor.rank.commissionPercentage;
        await tx.commission.create({
          data: {
            type: "SALE",
            memberId: member.sponsor.id,
            sourceMemberId: member.id,
            saleId: sale.id,
            baseAmount: sale.amount,
            percentage,
            ...calculateCommissionBreakdown(calculateCommissionAmount(sale.amount, percentage)),
          },
        });
      }

      return sale;
    });

    res.status(201).json({ sale: serializeSale(sale) });
  } catch (err) {
    next(err);
  }
}

export async function updateSale(
  req: Request<{ id: string }, unknown, UpdateSaleInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = req.body;
    const sale = await prisma.$transaction(async (tx) => {
      const member = await tx.member.findUnique({
        where: { id: input.memberId },
        include: { sponsor: { include: { rank: true } } },
      });
      if (!member) {
        throw new ApiError(400, "memberId does not reference an existing member");
      }

      const existingSale = await tx.sale.findUnique({ where: { id: req.params.id } });
      if (!existingSale) {
        throw new ApiError(404, "Sale not found");
      }

      const sale = await tx.sale.update({
        where: { id: req.params.id },
        data: {
          memberId: input.memberId,
          plotReference: input.plotReference,
          area: input.area,
          rate: input.rate,
          amount: new Prisma.Decimal(input.area).mul(input.rate).toDecimalPlaces(2),
          saleDate: new Date(input.saleDate),
        },
        include: { member: true },
      });

      await tx.commission.deleteMany({ where: { saleId: sale.id } });
      if (member.sponsor) {
        const percentage = member.sponsor.rank.commissionPercentage;
        await tx.commission.create({
          data: {
            type: "SALE",
            memberId: member.sponsor.id,
            sourceMemberId: member.id,
            saleId: sale.id,
            baseAmount: sale.amount,
            percentage,
            ...calculateCommissionBreakdown(calculateCommissionAmount(sale.amount, percentage)),
          },
        });
      }

      return sale;
    });

    res.json({ sale: serializeSale(sale) });
  } catch (err) {
    next(err);
  }
}

export async function deleteSale(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.commission.deleteMany({ where: { saleId: req.params.id } });
      return tx.sale.deleteMany({ where: { id: req.params.id } });
    });
    if (result.count === 0) {
      throw new ApiError(404, "Sale not found");
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
