import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { ApiError } from "../middleware/errorHandler";
import { serializeMember } from "../services/memberSerializer";
import { generateNextMemberCode } from "../services/memberIdGenerator";
import { generateTempPassword } from "../utils/password";
import { hashPassword } from "../utils/hash";
import { calculateCommissionAmount, calculateCommissionBreakdown } from "../services/commission";
import { sendMemberCredentialsWhatsApp } from "../services/whatsapp";
import { sendMemberCredentialsEmail } from "../services/memberCredentialsEmail";
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

const networkMemberSelect = {
  id: true,
  name: true,
  memberCode: true,
  sponsorMemberId: true,
  status: true,
  rank: { select: { name: true } },
} satisfies Prisma.MemberSelect;

type NetworkMemberRecord = Prisma.MemberGetPayload<{ select: typeof networkMemberSelect }>;

interface NetworkNode {
  id: string;
  name: string;
  memberCode: string;
  status: string;
  rank: string;
  sponsoredMembers: NetworkNode[];
}

function toNetworkNode(member: NetworkMemberRecord): NetworkNode {
  return {
    id: member.id,
    name: member.name,
    memberCode: member.memberCode,
    status: member.status,
    rank: member.rank.name,
    sponsoredMembers: [],
  };
}

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

export async function getMyNetwork(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.memberId) {
      throw new ApiError(404, "No member profile linked to this account");
    }

    const member = await prisma.member.findUnique({
      where: { id: req.user.memberId },
      select: networkMemberSelect,
    });
    if (!member) {
      throw new ApiError(404, "Member not found");
    }

    const sponsorChain: NetworkNode[] = [];
    const visited = new Set([member.id]);
    let sponsorId = member.sponsorMemberId;
    while (sponsorId && !visited.has(sponsorId)) {
      visited.add(sponsorId);
      const sponsor = await prisma.member.findUnique({
        where: { id: sponsorId },
        select: networkMemberSelect,
      });
      if (!sponsor) break;
      sponsorChain.unshift(toNetworkNode(sponsor));
      sponsorId = sponsor.sponsorMemberId;
    }

    const tree = toNetworkNode(member);
    const nodes = new Map([[member.id, tree]]);
    let frontier = [member.id];
    while (frontier.length > 0) {
      const children = await prisma.member.findMany({
        where: { sponsorMemberId: { in: frontier } },
        select: networkMemberSelect,
        orderBy: [{ name: "asc" }, { memberCode: "asc" }],
      });
      const nextFrontier: string[] = [];
      for (const child of children) {
        if (visited.has(child.id)) continue;
        visited.add(child.id);
        const childNode = toNetworkNode(child);
        nodes.get(child.sponsorMemberId!)?.sponsoredMembers.push(childNode);
        nodes.set(child.id, childNode);
        nextFrontier.push(child.id);
      }
      frontier = nextFrontier;
    }

    res.json({ sponsorChain, member: tree });
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

    const sponsor = input.sponsorMemberId
      ? await prisma.member.findUnique({
          where: { id: input.sponsorMemberId },
          include: { rank: true },
        })
      : null;
    if (input.sponsorMemberId) {
      if (!sponsor || sponsor.status !== "ACTIVE") {
        throw new ApiError(400, "sponsorMemberId must reference an existing active member");
      }
    }

    const rank = await prisma.rank.findUnique({ where: { id: input.rankId } });
    if (!rank) {
      throw new ApiError(400, "rankId does not reference an existing rank");
    }
    if (sponsor && rank.commissionPercentage > sponsor.rank.commissionPercentage) {
      throw new ApiError(
        400,
        "A member's rank cannot be higher than their sponsor's rank",
        "RANK_HIERARCHY"
      );
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

      if (sponsor) {
        await tx.commission.create({
          data: {
            type: "JOINING",
            memberId: sponsor.id,
            sourceMemberId: member.id,
            baseAmount: input.bookingAmount,
            percentage: sponsor.rank.commissionPercentage,
            ...calculateCommissionBreakdown(
              calculateCommissionAmount(input.bookingAmount, sponsor.rank.commissionPercentage)
            ),
          },
        });
      }

      return { member, user };
    });

    const [email, whatsapp] = await Promise.all([
      sendMemberCredentialsEmail(
        result.member.email,
        result.member.name,
        result.user.userId,
        tempPassword
      ),
      sendMemberCredentialsWhatsApp(result.member.phone, result.user.userId, tempPassword),
    ]);

    res.status(201).json({
      member: serializeMember(result.member, result.user.userId),
      credentials: {
        userId: result.user.userId,
        tempPassword,
      },
      delivery: { email, whatsapp },
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

    const existing = await prisma.member.findUnique({ where: { id }, include: { rank: true } });
    if (!existing) {
      throw new ApiError(404, "Member not found");
    }

    const sponsorMemberId =
      input.sponsorMemberId !== undefined ? input.sponsorMemberId : existing.sponsorMemberId;
    let sponsorCommissionPercentage: number | null = null;
    if (sponsorMemberId) {
      if (input.sponsorMemberId && sponsorMemberId === id) {
        throw new ApiError(400, "A member cannot sponsor themselves");
      }
      const sponsor = await prisma.member.findUnique({
        where: { id: sponsorMemberId },
        include: { rank: true },
      });
      if (!sponsor || (input.sponsorMemberId && sponsor.status !== "ACTIVE")) {
        throw new ApiError(400, "sponsorMemberId must reference an existing active member");
      }
      sponsorCommissionPercentage = sponsor.rank.commissionPercentage;
    }

    const rank = input.rankId
      ? await prisma.rank.findUnique({ where: { id: input.rankId } })
      : existing.rank;
    if (!rank) {
      throw new ApiError(400, "rankId does not reference an existing rank");
    }
    if (
      sponsorCommissionPercentage !== null &&
      rank.commissionPercentage > sponsorCommissionPercentage
    ) {
      throw new ApiError(
        400,
        "A member's rank cannot be higher than their sponsor's rank",
        "RANK_HIERARCHY"
      );
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

    await prisma.$transaction(async (tx) => {
      const member = await tx.member.findUnique({
        where: { id },
        include: {
          sales: true,
          sponsees: true,
          commissionsEarned: true,
          commissionsSourced: true,
        },
      });
      if (!member) {
        throw new ApiError(404, "Member not found");
      }

      if (member.sales.length > 0) {
        throw new ApiError(400, "Cannot delete a member with recorded sales");
      }

      const commissions = [
        ...member.commissionsEarned,
        ...member.commissionsSourced,
      ];
      if (commissions.some((commission) => commission.type !== "JOINING")) {
        throw new ApiError(400, "Cannot delete a member with sale commissions");
      }

      await tx.commission.deleteMany({
        where: {
          type: "JOINING",
          OR: [{ memberId: id }, { sourceMemberId: id }],
        },
      });

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

    const [email, whatsapp] = await Promise.all([
      sendMemberCredentialsEmail(
        member.email,
        member.name,
        member.user.userId,
        tempPassword
      ),
      sendMemberCredentialsWhatsApp(member.phone, member.user.userId, tempPassword),
    ]);

    res.json({
      credentials: {
        userId: member.user.userId,
        tempPassword,
      },
      delivery: { email, whatsapp },
    });
  } catch (err) {
    next(err);
  }
}
