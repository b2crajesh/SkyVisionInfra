import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";

export async function listRanks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ranks = await prisma.rank.findMany({ orderBy: { sortOrder: "asc" } });
    res.json({
      ranks: ranks.map((r) => ({ id: r.id, name: r.name, sortOrder: r.sortOrder })),
    });
  } catch (err) {
    next(err);
  }
}
