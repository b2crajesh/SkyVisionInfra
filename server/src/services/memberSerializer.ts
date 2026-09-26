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
    amount: string;
    saleDate: string;
  }[];
}

/**
 * Central place mapping a Prisma Member (optionally with `rank`/`sponsor`
 * relations included) into an API-safe object. Sensitive identifiers
 * (aadhaar/PAN) are masked here so no route can accidentally leak them.
 */
export function serializeMember(member: MemberWithRelations, userIdForLogin?: string): SerializedMember {
  return {
    id: member.id,
    memberCode: member.memberCode,
    userId: userIdForLogin ?? member.userId,
    name: member.name,
    phone: member.phone,
    email: member.email,
    address: member.address,
    dateOfBirth: member.dateOfBirth.toISOString(),
    aadhaarNumber: maskAadhaar(member.aadhaarNumber),
    panNumber: maskPan(member.panNumber),
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
      amount: s.amount.toString(),
      saleDate: s.saleDate.toISOString(),
    })),
  };
}
