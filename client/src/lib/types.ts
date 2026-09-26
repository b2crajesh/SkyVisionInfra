export type Role = "admin" | "member";

export interface AuthUser {
  id: string;
  userId: string;
  role: Role;
  memberId?: string;
  name?: string | null;
  memberCode?: string | null;
  mustChangePassword?: boolean;
}

export interface Rank {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Member {
  id: string;
  memberCode: string;
  name: string;
  phone?: string;
  email?: string;
  sponsor?: { id: string; name: string; memberCode: string } | null;
  rank?: { id: string; name: string } | null;
  bookingAmount: string;
  aadhaarNumber: string;
  panNumber: string;
  status: string;
  createdAt: string;
  address?: string;
  dateOfBirth?: string;
  nomineeName?: string;
  relationship?: string;
  sales?: Sale[];
}

export interface Sale {
  id: string;
  memberId: string;
  memberCode?: string;
  memberName?: string;
  plotReference: string;
  area: string;
  amount: string;
  saleDate: string;
}

export interface DashboardSummary {
  totalMembers: number;
  recentMembers: Member[];
  totalSalesCount: number;
  totalSalesAmount: string;
}

export interface SponsorOption {
  id: string;
  memberCode: string;
  name: string;
}

export interface Commission {
  id: string;
  member?: { id: string; name: string; memberCode: string };
  sourceMember: { id: string; name: string; memberCode: string };
  bookingAmount: string;
  percentage: string;
  amount: string;
  createdAt: string;
}
