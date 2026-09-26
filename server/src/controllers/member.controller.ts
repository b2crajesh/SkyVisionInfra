import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { ApiError } from "../middleware/errorHandler";
import { serializeMember } from "../services/memberSerializer";
import { generateNextMemberCode } from "../services/memberIdGenerator";
import { generateTempPassword } from "../utils/password";
import { hashPassword } from "../utils/hash";
import { calculateCommissionAmount, COMMISSION_PERCENTAGE } from "../services/commission";
import { sendMemberCredentialsWhatsApp } from "../services/whatsapp";
import { CreateMemberInput, UpdateMemberInput } from "../validators/member.validators";

const memberInclude = {
  rank: true,
  sponsor: true,
  user: true,
} satisfies Prisma.MemberInclude;

const memberDetailInclude = {
  ...memberInclude,
  sales: { orderBy: { saleDate: "desc" } },
} satisfies Prisma.MemberInclude;

export async function listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search, status, sortBy, sortOrder, page, pageSize, forSponsor } = req.query as Record<
      string,
      string | undefined
    >;

    const isSponsorLookup = forSponsor === "true";

    const where: Prisma.MemberWhereInput = {};
    if (status) {
      where.status = status as Prisma.MemberWhereInput["status"];
    }
    if (isSponsorLookup) {
      where.status = "ACTIVE";
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { memberCode: { contains: search, mode: "insensitive" } },
      ];
    }

    const take = isSponsorLookup ? 50 : Math.min(Number(pageSize) || 20, 100);
    const currentPage = Math.max(Number(page) || 1, 1);
    const skip = isSponsorLookup ? 0 : (currentPage - 1) * take;

    const orderBy: Prisma.MemberOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder === "desc" ? "desc" : "asc" }
      : { createdAt: "desc" };

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        include: memberInclude,
        orderBy,
        take,
        skip,
      }),
      prisma.member.count({ where }),
    ]);

    if (isSponsorLookup) {
      res.json({
        members: members.map((m) => ({ id: m.id, name: m.name, memberCode: m.memberCode })),
      });
      return;
    }

    res.json({
      members: members.map((m) => serializeMember(m, m.user.userId)),
      pagination: { page: currentPage, pageSize: take, total, totalPages: Math.ceil(total / take) || 1 },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.memberId) {
      throw new ApiError(404, "No member profile linked to this account");
    }
    const member = await prisma.member.findUnique({
      where: { id: req.user.memberId },
      include: memberDetailInclude,
    });
    if (!member) {
      throw new ApiError(404, "Member not found");
    }
    res.json({ member: serializeMember(member, member.user.userId) });
  } catch (err) {
    next(err);
  }
}

export async function getMemberById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const member = await prisma.member.findUnique({
      where: { id },
      include: memberDetailInclude,
    });
    if (!member) {
      throw new ApiError(404, "Member not found");
    }
    res.json({ member: serializeMember(member, member.user.userId) });
  } catch (err) {
    next(err);
  }
}

export async function createMember(
  req: Request<unknown, unknown, CreateMemberInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = req.body;

    if (input.sponsorMemberId) {
      const sponsor = await prisma.member.findUnique({ where: { id: input.sponsorMemberId } });
      if (!sponsor || sponsor.status !== "ACTIVE") {
        throw new ApiError(400, "sponsorMemberId must reference an existing active member");
      }
    }

    const rank = await prisma.rank.findUnique({ where: { id: input.rankId } });
    if (!rank) {
      throw new ApiError(400, "rankId does not reference an existing rank");
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const result = await prisma.$transaction(async (tx) => {
      const memberCode = await generateNextMemberCode(tx);
      const loginUserId = memberCode; // member logs in using their member code

      const user = await tx.user.create({
        data: {
          userId: loginUserId,
          passwordHash,
          role: "MEMBER",
          mustChangePassword: true,
        },
      });

      const member = await tx.member.create({
        data: {
          userId: user.id,
          memberCode,
          name: input.name,
          phone: input.phone,
          email: input.email,
          address: input.address,
          dateOfBirth: new Date(input.dateOfBirth),
          aadhaarNumber: input.aadhaarNumber,
          panNumber: input.panNumber,
          bookingAmount: input.bookingAmount,
          nomineeName: input.nomineeName,
          relationship: input.relationship,
          rankId: input.rankId,
          sponsorMemberId: input.sponsorMemberId ?? null,
        },
        include: memberInclude,
      });

      if (input.sponsorMemberId) {
        await tx.commission.create({
          data: {
            memberId: input.sponsorMemberId,
            sourceMemberId: member.id,
            bookingAmount: input.bookingAmount,
            percentage: COMMISSION_PERCENTAGE,
            amount: calculateCommissionAmount(input.bookingAmount),
          },
        });
      }

      return { member, user };
    });

    await sendMemberCredentialsWhatsApp(result.member.phone, result.user.userId, tempPassword);

    res.status(201).json({
      member: serializeMember(result.member, result.user.userId),
      credentials: {
        userId: result.user.userId,
        tempPassword,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateMember(
  req: Request<{ id: string }, unknown, UpdateMemberInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const input = req.body;

    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, "Member not found");
    }

    if (input.sponsorMemberId) {
      if (input.sponsorMemberId === id) {
        throw new ApiError(400, "A member cannot sponsor themselves");
      }
      const sponsor = await prisma.member.findUnique({ where: { id: input.sponsorMemberId } });
      if (!sponsor || sponsor.status !== "ACTIVE") {
        throw new ApiError(400, "sponsorMemberId must reference an existing active member");
      }
    }

    if (input.rankId) {
      const rank = await prisma.rank.findUnique({ where: { id: input.rankId } });
      if (!rank) {
        throw new ApiError(400, "rankId does not reference an existing rank");
      }
    }

    const member = await prisma.member.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.dateOfBirth !== undefined ? { dateOfBirth: new Date(input.dateOfBirth) } : {}),
        ...(input.aadhaarNumber !== undefined ? { aadhaarNumber: input.aadhaarNumber } : {}),
        ...(input.panNumber !== undefined ? { panNumber: input.panNumber } : {}),
        ...(input.bookingAmount !== undefined ? { bookingAmount: input.bookingAmount } : {}),
        ...(input.nomineeName !== undefined ? { nomineeName: input.nomineeName } : {}),
        ...(input.relationship !== undefined ? { relationship: input.relationship } : {}),
        ...(input.rankId !== undefined ? { rankId: input.rankId } : {}),
        ...(input.sponsorMemberId !== undefined ? { sponsorMemberId: input.sponsorMemberId } : {}),
      },
      include: memberDetailInclude,
    });

    res.json({ member: serializeMember(member, member.user.userId) });
  } catch (err) {
    next(err);
  }
}

export async function deleteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const member = await prisma.member.findUnique({
      where: { id },
      include: { sales: true, sponsees: true },
    });
    if (!member) {
      throw new ApiError(404, "Member not found");
    }

    if (member.sales.length > 0) {
      throw new ApiError(400, "Cannot delete a member with recorded sales");
    }

    await prisma.$transaction(async (tx) => {
      if (member.sponsees.length > 0) {
        await tx.member.updateMany({
          where: { sponsorMemberId: id },
          data: { sponsorMemberId: null },
        });
      }
      await tx.member.delete({ where: { id } });
      await tx.user.delete({ where: { id: member.userId } });
    });

    res.json({ message: "Member deleted" });
  } catch (err) {
    next(err);
  }
}

export async function resetMemberPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const member = await prisma.member.findUnique({ where: { id }, include: { user: true } });
    if (!member) {
      throw new ApiError(404, "Member not found");
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    await prisma.user.update({
      where: { id: member.userId },
      data: { passwordHash, mustChangePassword: true },
    });

    await sendMemberCredentialsWhatsApp(member.phone, member.user.userId, tempPassword);

    res.json({
      credentials: {
        userId: member.user.userId,
        tempPassword,
      },
    });
  } catch (err) {
    next(err);
  }
}
