import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { ApiError } from "../middleware/errorHandler";
import { serializeAdminMember, serializeMember } from "../services/memberSerializer";
import { generateNextMemberCode } from "../services/memberIdGenerator";
import { generateTempPassword } from "../utils/password";
import { hashPassword } from "../utils/hash";
import {
  calculateCommissionAmount,
  calculateCommissionBreakdown,
  JOINING_COMMISSION_PERCENTAGE,
} from "../services/commission";
import { sendMemberCredentialsWhatsApp } from "../services/whatsapp";
import { sendMemberCredentialsEmail } from "../services/memberCredentialsEmail";
import sharp from "sharp";
import {
  createProfilePhotoUrl,
  deleteProfilePhoto,
  getProfilePhoto,
  storeProfilePhoto,
} from "../services/profilePhotoStorage";
import { createAssociateIdCardPdf } from "../services/associateIdCard";
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
  profilePhotoKey: true,
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
  profilePhotoUrl: string | null;
  sponsoredMembers: NetworkNode[];
}

function toNetworkNode(member: NetworkMemberRecord): NetworkNode {
  return {
    id: member.id,
    name: member.name,
    memberCode: member.memberCode,
    status: member.status,
    rank: member.rank.name,
    profilePhotoUrl: null,
    sponsoredMembers: [],
  };
}

export async function listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      search,
      status,
      createdFrom,
      createdBefore,
      sortBy,
      sortOrder,
      page,
      pageSize,
      forSponsor,
    } = req.query as Record<string, string | undefined>;

    const isSponsorLookup = forSponsor === "true";

    if (
      createdFrom &&
      createdBefore &&
      new Date(createdFrom).getTime() >= new Date(createdBefore).getTime()
    ) {
      throw new ApiError(400, "The associate created-date range is invalid");
    }

    const where: Prisma.MemberWhereInput = {};
    if (status) {
      where.status = status as Prisma.MemberWhereInput["status"];
    }
    if (createdFrom || createdBefore) {
      where.createdAt = {
        ...(createdFrom ? { gte: new Date(createdFrom) } : {}),
        ...(createdBefore ? { lt: new Date(createdBefore) } : {}),
      };
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
      throw new ApiError(404, "No associate profile linked to this account");
    }
    const member = await prisma.member.findUnique({
      where: { id: req.user.memberId },
      include: memberDetailInclude,
    });
    if (!member) {
      throw new ApiError(404, "Associate not found");
    }
    res.json({ member: serializeMember(member, member.user.userId) });
  } catch (err) {
    next(err);
  }
}

export async function getMyNetwork(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.memberId) {
      throw new ApiError(404, "No associate profile linked to this account");
    }

    const member = await prisma.member.findUnique({
      where: { id: req.user.memberId },
      select: networkMemberSelect,
    });
    if (!member) {
      throw new ApiError(404, "Associate not found");
    }

    const sponsorChain: NetworkNode[] = [];
    const profilePhotoKeys = new Map<string, string | null>([
      [member.id, member.profilePhotoKey],
    ]);
    const visited = new Set([member.id]);
    let sponsorId = member.sponsorMemberId;
    while (sponsorId && !visited.has(sponsorId)) {
      visited.add(sponsorId);
      const sponsor = await prisma.member.findUnique({
        where: { id: sponsorId },
        select: networkMemberSelect,
      });
      if (!sponsor) break;
      profilePhotoKeys.set(sponsor.id, sponsor.profilePhotoKey);
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
        profilePhotoKeys.set(child.id, child.profilePhotoKey);
        const childNode = toNetworkNode(child);
        nodes.get(child.sponsorMemberId!)?.sponsoredMembers.push(childNode);
        nodes.set(child.id, childNode);
        nextFrontier.push(child.id);
      }
      frontier = nextFrontier;
    }

    await Promise.all(
      [...sponsorChain, ...nodes.values()].map(async (node) => {
        const key = profilePhotoKeys.get(node.id);
        node.profilePhotoUrl = key ? await createProfilePhotoUrl(key) : null;
      })
    );

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
      throw new ApiError(404, "Associate not found");
    }
    res.json({ member: serializeAdminMember(member, member.user.userId) });
  } catch (err) {
    next(err);
  }
}

async function sendProfilePhotoUrl(memberId: string, res: Response): Promise<void> {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { profilePhotoKey: true },
  });
  if (!member) {
    throw new ApiError(404, "Associate not found");
  }
  if (!member.profilePhotoKey) {
    throw new ApiError(404, "No profile photo has been uploaded");
  }
  res.json({ url: await createProfilePhotoUrl(member.profilePhotoKey) });
}

export async function getMyProfilePhoto(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.memberId) {
      throw new ApiError(404, "No associate profile linked to this account");
    }
    await sendProfilePhotoUrl(req.user.memberId, res);
  } catch (err) {
    next(err);
  }
}

export async function getMemberProfilePhoto(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await sendProfilePhotoUrl(req.params.id, res);
  } catch (err) {
    next(err);
  }
}

async function sendAssociateIdCard(memberId: string, res: Response): Promise<void> {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      name: true,
      phone: true,
      memberCode: true,
      status: true,
      createdAt: true,
      profilePhotoKey: true,
      rank: { select: { name: true } },
    },
  });
  if (!member) {
    throw new ApiError(404, "Associate not found");
  }

  const photo = member.profilePhotoKey ? await getProfilePhoto(member.profilePhotoKey) : null;
  const pdf = await createAssociateIdCardPdf(member, photo);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${member.memberCode}-id-card.pdf"`
  );
  res.setHeader("Cache-Control", "private, no-store");
  res.send(pdf);
}

export async function downloadMyAssociateIdCard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.memberId) {
      throw new ApiError(404, "No associate profile linked to this account");
    }
    await sendAssociateIdCard(req.user.memberId, res);
  } catch (err) {
    next(err);
  }
}

export async function downloadAssociateIdCard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await sendAssociateIdCard(req.params.id, res);
  } catch (err) {
    next(err);
  }
}

async function saveProfilePhoto(
  memberId: string,
  req: Request,
  res: Response
): Promise<void> {
  const contentType = req.header("content-type")?.split(";")[0].trim().toLowerCase();
  if (!contentType || !["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
    throw new ApiError(415, "Choose a JPEG, PNG, or WebP image");
  }
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new ApiError(400, "The uploaded photo is empty or invalid");
  }

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { id: true },
  });
  if (!member) {
    throw new ApiError(404, "Associate not found");
  }

  let optimizedImage: Buffer;
  try {
    const metadata = await sharp(req.body, { limitInputPixels: 40_000_000 }).metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format ?? "")) {
      throw new ApiError(415, "Choose a JPEG, PNG, or WebP image");
    }
    optimizedImage = await sharp(req.body, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize(512, 512, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(400, "The uploaded file is not a valid image");
  }

  const key = `member-photos/${memberId}/profile.webp`;
  await storeProfilePhoto(key, optimizedImage);
  await prisma.member.update({
    where: { id: memberId },
    data: { profilePhotoKey: key },
  });
  res.json({ url: await createProfilePhotoUrl(key), hasProfilePhoto: true });
}

export async function uploadMyProfilePhoto(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.memberId) {
      throw new ApiError(404, "No associate profile linked to this account");
    }
    await saveProfilePhoto(req.user.memberId, req, res);
  } catch (err) {
    next(err);
  }
}

export async function uploadMemberProfilePhoto(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await saveProfilePhoto(req.params.id, req, res);
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
        throw new ApiError(400, "The selected sponsor must be an existing active associate");
      }
    }

    const rank = await prisma.rank.findUnique({ where: { id: input.rankId } });
    if (!rank) {
      throw new ApiError(400, "rankId does not reference an existing rank");
    }
    if (sponsor && rank.commissionPercentage > sponsor.rank.commissionPercentage) {
      throw new ApiError(
        400,
        "An associate's rank cannot be higher than their sponsor's rank",
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
            percentage: JOINING_COMMISSION_PERCENTAGE,
            ...calculateCommissionBreakdown(
              calculateCommissionAmount(input.bookingAmount, JOINING_COMMISSION_PERCENTAGE)
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
      throw new ApiError(404, "Associate not found");
    }

    const sponsorMemberId =
      input.sponsorMemberId !== undefined ? input.sponsorMemberId : existing.sponsorMemberId;
    let sponsorCommissionPercentage: number | null = null;
    if (sponsorMemberId) {
      if (input.sponsorMemberId && sponsorMemberId === id) {
        throw new ApiError(400, "An associate cannot sponsor themselves");
      }
      const sponsor = await prisma.member.findUnique({
        where: { id: sponsorMemberId },
        include: { rank: true },
      });
      if (!sponsor || (input.sponsorMemberId && sponsor.status !== "ACTIVE")) {
        throw new ApiError(400, "The selected sponsor must be an existing active associate");
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
        "An associate's rank cannot be higher than their sponsor's rank",
        "RANK_HIERARCHY"
      );
    }

    const member = await prisma.$transaction(async (tx) => {
      const updatedMember = await tx.member.update({
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

      if (input.bookingAmount !== undefined) {
        const commissionAmount = calculateCommissionAmount(
          input.bookingAmount,
          JOINING_COMMISSION_PERCENTAGE
        );
        await tx.commission.updateMany({
          where: { type: "JOINING", sourceMemberId: id },
          data: {
            baseAmount: input.bookingAmount,
            percentage: JOINING_COMMISSION_PERCENTAGE,
            ...calculateCommissionBreakdown(commissionAmount),
          },
        });
      }

      return updatedMember;
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
        throw new ApiError(404, "Associate not found");
      }

      if (member.sales.length > 0) {
        throw new ApiError(400, "Cannot delete an associate with recorded sales");
      }

      const commissions = [
        ...member.commissionsEarned,
        ...member.commissionsSourced,
      ];
      if (commissions.some((commission) => commission.type !== "JOINING")) {
        throw new ApiError(400, "Cannot delete an associate with sale commissions");
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
      if (member.profilePhotoKey) {
        await deleteProfilePhoto(member.profilePhotoKey);
      }
    }, { timeout: 15_000 });

    res.json({ message: "Associate deleted" });
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
      throw new ApiError(404, "Associate not found");
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
