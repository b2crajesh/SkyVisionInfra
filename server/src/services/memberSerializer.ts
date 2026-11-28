import { Member, Rank, Sale } from "@prisma/client";
import { maskAadhaar, maskPan } from "../utils/mask";

export type MemberWithRelations = Member & {
  rank?: Rank | null;
  sponsor?: Member | null;
  sales?: Sale[];
};

export interface SerializedMember {
  id: string;
  memberCode: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  hasProfilePhoto: boolean;
  address: string;
  dateOfBirth: string;
  aadhaarNumber: string;
  panNumber: string;
  bookingAmount: string;
  nomineeName: string;
  relationship: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  rank: { id: string; name: string } | null;
  sponsor: { id: string; name: string; memberCode: string } | null;
  sales?: {
    id: string;
    plotReference: string;
    area: string;
    rate: string;
    amount: string;
    saleDate: string;
  }[];
}

function serializeMemberData(
  member: MemberWithRelations,
  userIdForLogin: string | undefined,
  maskSensitiveIdentifiers: boolean
): SerializedMember {
  return {
    id: member.id,
    memberCode: member.memberCode,
    userId: userIdForLogin ?? member.userId,
    name: member.name,
    phone: member.phone,
    email: member.email,
    hasProfilePhoto: Boolean(member.profilePhotoKey),
    address: member.address,
    dateOfBirth: member.dateOfBirth.toISOString(),
    aadhaarNumber: maskSensitiveIdentifiers ? maskAadhaar(member.aadhaarNumber) : member.aadhaarNumber,
    panNumber: maskSensitiveIdentifiers ? maskPan(member.panNumber) : member.panNumber,
    bookingAmount: member.bookingAmount.toString(),
    nomineeName: member.nomineeName,
    relationship: member.relationship,
    status: member.status,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
    rank: member.rank ? { id: member.rank.id, name: member.rank.name } : null,
    sponsor: member.sponsor
      ? { id: member.sponsor.id, name: member.sponsor.name, memberCode: member.sponsor.memberCode }
      : null,
    sales: member.sales?.map((s) => ({
      id: s.id,
      plotReference: s.plotReference,
      area: s.area.toString(),
      rate: s.rate.toString(),
      amount: s.amount.toString(),
      saleDate: s.saleDate.toISOString(),
    })),
  };
}

/**
 * Safe for general API responses: sensitive identifiers remain masked.
 */
export function serializeMember(
  member: MemberWithRelations,
  userIdForLogin?: string
): SerializedMember {
  return serializeMemberData(member, userIdForLogin, true);
}

/**
 * Use only for member detail responses behind administrator authorization.
 */
export function serializeAdminMember(
  member: MemberWithRelations,
  userIdForLogin?: string
): SerializedMember {
  return serializeMemberData(member, userIdForLogin, false);
}
