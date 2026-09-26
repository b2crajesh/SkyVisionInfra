import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { ApiError } from "../middleware/errorHandler";
import { CreateSaleInput } from "../validators/sale.validators";

function serializeSale(sale: Prisma.SaleGetPayload<{ include: { member: true } }>) {
  return {
    id: sale.id,
    memberId: sale.memberId,
    memberName: sale.member.name,
    memberCode: sale.member.memberCode,
    plotReference: sale.plotReference,
    area: sale.area.toString(),
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

    const member = await prisma.member.findUnique({ where: { id: input.memberId } });
    if (!member) {
      throw new ApiError(400, "memberId does not reference an existing member");
    }

    const sale = await prisma.$transaction(async (tx) => {
      return tx.sale.create({
        data: {
          memberId: input.memberId,
          plotReference: input.plotReference,
          area: input.area,
          amount: input.amount,
          saleDate: new Date(input.saleDate),
          createdByUserId: req.user!.id,
        },
        include: { member: true },
      });
    });

    res.status(201).json({ sale: serializeSale(sale) });
  } catch (err) {
    next(err);
  }
}
