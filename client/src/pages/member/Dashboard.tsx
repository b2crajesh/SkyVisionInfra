import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Card from "../../components/ui/Card";
import DataTable, { type Column } from "../../components/DataTable";
import { memberNavItems } from "./memberNav";
import { api } from "../../lib/api";
import type { Commission, Member, MemberNetworkNode, Sale } from "../../lib/types";
import { formatDate } from "../../lib/format";

interface MemberNetwork {
  sponsorChain: MemberNetworkNode[];
  member: MemberNetworkNode;
}

type CommissionSortKey =
  | "sourceMember"
  | "type"
  | "baseAmount"
  | "percentage"
  | "amount"
  | "tdsAmount"
  | "netAmount"
  | "createdAt";

type CommissionSortDirection = "asc" | "desc";

const commissionHeaders: {
  key: CommissionSortKey;
  label: string;
  alignRight?: boolean;
}[] = [
  { key: "sourceMember", label: "Source member" },
  { key: "type", label: "Type" },
  { key: "baseAmount", label: "Base amount", alignRight: true },
  { key: "percentage", label: "Rate", alignRight: true },
  { key: "amount", label: "Gross", alignRight: true },
  { key: "tdsAmount", label: "TDS", alignRight: true },
  { key: "netAmount", label: "Net payable", alignRight: true },
  { key: "createdAt", label: "Date" },
];

function formatINR(amount: number | string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

function getCommissionSortValue(
  commission: Commission,
  key: CommissionSortKey
): string | number {
  switch (key) {
    case "sourceMember":
      return commission.sourceMember.name;
    case "type":
      return commission.type === "JOINING" ? "Joining" : "Sale";
    case "baseAmount":
      return Number(commission.baseAmount);
    case "percentage":
      return Number(commission.percentage);
    case "amount":
      return Number(commission.amount);
    case "tdsAmount":
      return Number(commission.tdsAmount);
    case "netAmount":
      return Number(commission.netAmount);
    case "createdAt":
      return new Date(commission.createdAt).getTime();
  }
}

function ProfileField({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`min-w-0 rounded-xl border border-slate-200/70 bg-slate-50/70 p-3.5 transition-colors hover:border-gold/40 hover:bg-white ${className}`}
    >
      <dt className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-charcoal/55">
        {label}
      </dt>
      <dd className="break-words text-sm font-medium leading-5 text-navy">{value}</dd>
    </div>
  );
}

function NetworkNodeCard({
  node,
  isCurrent = false,
}: {
  node: MemberNetworkNode;
  isCurrent?: boolean;
}) {
  const initials = node.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div
      tabIndex={0}
      title={`${node.name} (${node.memberCode}) - ${node.rank}`}
      className={`group relative flex h-36 w-36 shrink-0 flex-col items-center justify-center gap-1 rounded-full border-2 bg-white p-3 text-center shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
        isCurrent ? "border-gold bg-gold/5 ring-2 ring-gold/20" : "border-slate-200"
      }`}
    >
      {isCurrent && (
        <span className="absolute right-5 top-4 rounded-full bg-gold px-2 py-0.5 text-[9px] font-bold text-white">
          YOU
        </span>
      )}
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          isCurrent ? "bg-gold text-white" : "bg-navy/10 text-navy"
        }`}
      >
        {initials}
      </div>
      <p className="line-clamp-2 w-full text-xs font-semibold leading-tight text-navy">{node.name}</p>
      <p className="max-w-full truncate text-[10px] leading-none text-charcoal/60">{node.memberCode}</p>
      <p className="line-clamp-2 w-full text-[10px] font-medium leading-tight text-charcoal/80">{node.rank}</p>
    </div>
  );
}

function NetworkBranch({
  node,
  isCurrent = false,
}: {
  node: MemberNetworkNode;
  isCurrent?: boolean;
}) {
  const [childrenExpanded, setChildrenExpanded] = useState(false);

  return (
    <div className="flex w-full flex-col items-center xl:w-auto">
      <NetworkNodeCard node={node} isCurrent={isCurrent} />
      {node.sponsoredMembers.length > 0 && (
        <>
          <button
            type="button"
            aria-expanded={childrenExpanded}
            aria-controls={`network-children-${node.id}`}
            aria-label={`${childrenExpanded ? "Collapse" : "Expand"} ${node.sponsoredMembers.length} members sponsored by ${node.name}`}
            onClick={() => setChildrenExpanded((expanded) => !expanded)}
            className="relative z-10 my-1 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-navy shadow-soft transition-colors hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <span aria-hidden="true">{childrenExpanded ? "-" : "+"}</span>
            {childrenExpanded ? "Collapse" : "Expand"} {node.sponsoredMembers.length}
          </button>
          <div
            className={`flex w-full flex-col items-center xl:w-auto ${
              childrenExpanded ? "" : "hidden"
            }`}
          >
            <div className="hidden h-7 w-px bg-slate-300 xl:block" />
            <ul
              id={`network-children-${node.id}`}
              className="relative mt-4 flex w-full flex-col gap-3 border-l border-slate-300 pl-4 xl:mt-0 xl:w-auto xl:flex-row xl:items-start xl:justify-center xl:gap-6 xl:border-l-0 xl:pl-0 xl:before:absolute xl:before:left-[4.5rem] xl:before:right-[4.5rem] xl:before:top-0 xl:before:h-px xl:before:bg-slate-300"
            >
              {node.sponsoredMembers.map((sponsoredMember) => (
                <li
                  key={sponsoredMember.id}
                  className="relative flex w-full flex-col items-center before:absolute before:left-[-1rem] before:top-6 before:h-px before:w-3 before:bg-slate-300 xl:w-auto xl:shrink-0 xl:before:left-0 xl:before:top-0 xl:before:h-7 xl:before:w-px"
                >
                  <div className="hidden h-7 xl:block" />
                  <NetworkBranch node={sponsoredMember} />
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

const saleColumns: Column<Sale>[] = [
  { key: "plotReference", header: "Plot Reference", render: (s) => s.plotReference },
  { key: "area", header: "Area", render: (s) => s.area },
  { key: "rate", header: "Rate / sq. ft.", render: (s) => Number(s.rate).toLocaleString("en-IN") },
  { key: "amount", header: "Amount", render: (s) => Number(s.amount).toLocaleString("en-IN") },
  { key: "saleDate", header: "Sale Date", render: (s) => formatDate(s.saleDate) },
];

export default function MemberDashboard() {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [commissionTotals, setCommissionTotals] = useState({ gross: 0, tds: 0, net: 0 });
  const [commissionSearch, setCommissionSearch] = useState("");
  const [commissionSort, setCommissionSort] = useState<{
    key: CommissionSortKey;
    direction: CommissionSortDirection;
  }>({ key: "createdAt", direction: "desc" });
  const [network, setNetwork] = useState<MemberNetwork | null>(null);
  const [networkError, setNetworkError] = useState("");

  useEffect(() => {
    api
      .get<{ member: Member }>("/members/me")
      .then(({ data }) => setMember(data.member))
      .catch(() => setError("Unable to load your member record."))
      .finally(() => setLoading(false));

    api
      .get<MemberNetwork>("/members/me/network")
      .then(({ data }) => setNetwork(data))
      .catch(() => setNetworkError("Unable to load your sponsor tree. Please try again later."));

    api
      .get<{
        commissions: Commission[];
        totalGrossAmount: string;
        totalTdsAmount: string;
        totalNetAmount: string;
      }>("/commissions/me")
      .then(({ data }) => {
        setCommissions(data.commissions);
        setCommissionTotals({
          gross: Number(data.totalGrossAmount),
          tds: Number(data.totalTdsAmount),
          net: Number(data.totalNetAmount),
        });
      })
      .catch(() => {});
  }, []);

  const memberInitials = member
    ? member.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "M"
    : "";

  const matchingCommissions = useMemo(() => {
    const query = commissionSearch.trim().toLocaleLowerCase("en-IN");
    const filtered = commissions.filter((commission) => {
      if (!query) return true;

      const searchableText = [
        commission.sourceMember.name,
        commission.sourceMember.memberCode,
        commission.type,
        commission.type === "JOINING" ? "Joining" : "Sale",
        commission.baseAmount,
        commission.percentage,
        commission.amount,
        commission.tdsAmount,
        commission.netAmount,
        formatDate(commission.createdAt),
      ]
        .join(" ")
        .toLocaleLowerCase("en-IN");

      return searchableText.includes(query);
    });

    return filtered.sort((left, right) => {
      const leftValue = getCommissionSortValue(left, commissionSort.key);
      const rightValue = getCommissionSortValue(right, commissionSort.key);
      const comparison =
        typeof leftValue === "number" && typeof rightValue === "number"
          ? leftValue - rightValue
          : String(leftValue).localeCompare(String(rightValue), "en", {
              sensitivity: "base",
            });

      return commissionSort.direction === "asc" ? comparison : -comparison;
    });
  }, [commissions, commissionSearch, commissionSort]);

  return (
    <DashboardLayout title="Member Portal" navItems={memberNavItems}>
      <h1 className="mb-6 text-2xl font-bold text-navy">My Dashboard</h1>
      {loading && <p className="text-charcoal/60">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {member && (
        <div className="space-y-6">
          <Card className="!overflow-hidden !p-0 sm:!p-0">
            <div className="relative overflow-hidden bg-gradient-to-br from-navy via-charcoal to-gold px-5 py-6 text-white sm:px-7 sm:py-7">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-4 -top-16 h-48 w-48 rounded-full border border-white/10"
              />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-xl font-bold tracking-wide text-white shadow-soft backdrop-blur-sm">
                    {memberInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-light">
                      Member profile
                    </p>
                    <h2 className="truncate text-xl font-semibold sm:text-2xl">{member.name}</h2>
                    <p className="mt-1 text-sm text-white/70">
                      Member code <span className="font-medium text-white">{member.memberCode}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 rounded-full ${
                        member.status.toUpperCase() === "ACTIVE" ? "bg-emerald-400" : "bg-amber-300"
                      }`}
                    />
                    {member.status}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-gold-light/30 bg-gold-light/15 px-3 py-1.5 text-xs font-medium text-white">
                    {member.rank?.name ?? "Member"}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-5 sm:p-7">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-navy">Member details</h3>
                  <p className="mt-0.5 text-xs text-charcoal/55">
                    Personal and account information
                  </p>
                </div>
              </div>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <ProfileField
                  label="Sponsor"
                  value={
                    member.sponsor
                      ? `${member.sponsor.name} (${member.sponsor.memberCode})`
                      : "-"
                  }
                />
                <ProfileField
                  label="Booking Amount"
                  value={Number(member.bookingAmount).toLocaleString("en-IN")}
                />
                <ProfileField label="Email" value={member.email ?? "-"} />
                <ProfileField label="Phone" value={member.phone ?? "-"} />
                <ProfileField label="Aadhaar" value={member.aadhaarNumber} />
                <ProfileField label="PAN" value={member.panNumber} />
                <ProfileField label="Date of Birth" value={formatDate(member.dateOfBirth)} />
                <ProfileField label="Nominee" value={member.nomineeName ?? "-"} />
                <ProfileField label="Relationship" value={member.relationship ?? "-"} />
                <ProfileField
                  label="Address"
                  value={member.address ?? "-"}
                  className="sm:col-span-2 xl:col-span-4"
                />
              </dl>
            </div>
          </Card>

          <Card>
            <h3 className="mb-1 text-lg font-semibold text-navy">My Sponsor Tree</h3>
            <p className="mb-5 text-sm text-charcoal/60">
              Your sponsors are shown above you, and the members you sponsored appear below.
            </p>
            <p className="mb-3 text-xs text-charcoal/60">
              Scroll within this panel to explore the full tree.
            </p>
            {networkError && <p className="text-sm text-red-600">{networkError}</p>}
            {!network && !networkError && <p className="text-sm text-charcoal/60">Loading sponsor tree...</p>}
            {network && (
              <div className="network-tree-viewport rounded-xl bg-slate-50/70 p-3 sm:p-6">
                <div className="flex w-max min-w-full flex-col items-center">
                {network.sponsorChain.map((sponsor) => (
                  <div key={sponsor.id} className="flex w-full flex-col items-center xl:w-auto">
                    <NetworkNodeCard node={sponsor} />
                    <div className="h-7 w-px bg-slate-300" />
                  </div>
                ))}
                <NetworkBranch node={network.member} isCurrent />
                {network.member.sponsoredMembers.length === 0 && (
                  <p className="mt-4 rounded-full bg-white px-4 py-2 text-center text-sm text-charcoal/60 shadow-soft">
                    You have not sponsored any members yet.
                  </p>
                )}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-semibold text-navy">My Sales</h3>
            <DataTable
              columns={saleColumns}
              rows={member.sales ?? []}
              rowKey={(s) => s.id}
              emptyMessage="No sales recorded yet."
            />
          </Card>

          <Card>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-lg font-bold text-gold">
                ₹
              </div>
              <div>
                <h3 className="text-lg font-semibold text-navy">Commission Summary</h3>
                <p className="text-sm text-charcoal/60">
                  Your earnings, deductions, and commission history
                </p>
              </div>
            </div>
            <div className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">
                  Gross commission
                </p>
                <p className="mt-2 text-xl font-bold text-navy">
                  {formatINR(commissionTotals.gross)}
                </p>
                <p className="mt-1 text-xs text-charcoal/55">Before TDS deduction</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/70">
                  TDS deducted
                </p>
                <p className="mt-2 text-xl font-bold text-amber-900">
                  {formatINR(commissionTotals.tds)}
                </p>
                <p className="mt-1 text-xs text-amber-800/70">Tax withheld at source</p>
              </div>
              <div className="rounded-2xl border border-navy bg-gradient-to-br from-navy via-charcoal to-gold p-4 text-white shadow-soft sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                  Net payable
                </p>
                <p className="mt-2 text-xl font-bold">{formatINR(commissionTotals.net)}</p>
                <p className="mt-1 text-xs text-white/70">After TDS deduction</p>
              </div>
            </div>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-navy">Commission history</h4>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-charcoal/65">
                  {commissionSearch.trim()
                    ? `${matchingCommissions.length} of ${commissions.length}`
                    : commissions.length}{" "}
                  {commissions.length === 1 ? "record" : "records"}
                </span>
              </div>
              <label className="relative block w-full sm:max-w-xs">
                <span className="sr-only">Search commission history</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/45"
                >
                  <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  value={commissionSearch}
                  onChange={(event) => setCommissionSearch(event.target.value)}
                  placeholder="Search name, code, type, or date"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-navy outline-none transition placeholder:text-charcoal/40 focus:border-gold focus:ring-2 focus:ring-gold/15"
                />
              </label>
            </div>
            <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full min-w-[980px] text-left text-sm">
                <caption className="sr-only">Commission history and payment details</caption>
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-charcoal/60">
                  <tr>
                    {commissionHeaders.map((header) => {
                      const active = commissionSort.key === header.key;

                      return (
                        <th
                          key={header.key}
                          scope="col"
                          aria-sort={
                            active
                              ? commissionSort.direction === "asc"
                                ? "ascending"
                                : "descending"
                              : "none"
                          }
                          className={`whitespace-nowrap px-4 py-3 ${
                            header.alignRight ? "text-right" : "text-left"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setCommissionSort((current) => ({
                                key: header.key,
                                direction:
                                  current.key === header.key && current.direction === "asc"
                                    ? "desc"
                                    : "asc",
                              }))
                            }
                            className={`inline-flex items-center gap-1.5 hover:text-navy ${
                              header.alignRight ? "justify-end" : "justify-start"
                            }`}
                          >
                            {header.label}
                            <span
                              aria-hidden="true"
                              className={active ? "text-gold" : "text-charcoal/30"}
                            >
                              {active
                                ? commissionSort.direction === "asc"
                                  ? "↑"
                                  : "↓"
                                : "↕"}
                            </span>
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commissions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        <p className="font-medium text-navy">No commissions yet</p>
                        <p className="mt-1 text-sm text-charcoal/55">
                          Commission entries will appear here when they are recorded.
                        </p>
                      </td>
                    </tr>
                  ) : matchingCommissions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        <p className="font-medium text-navy">No matching commissions</p>
                        <p className="mt-1 text-sm text-charcoal/55">
                          Try another name, member code, commission type, or date.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    matchingCommissions.map((commission) => (
                      <tr
                        key={commission.id}
                        className="transition-colors hover:bg-lightbg/70"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-navy">{commission.sourceMember.name}</p>
                          <p className="mt-0.5 text-xs text-charcoal/55">
                            {commission.sourceMember.memberCode}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              commission.type === "JOINING"
                                ? "bg-gold/10 text-navy"
                                : "bg-indigo-50 text-indigo-700"
                            }`}
                          >
                            {commission.type === "JOINING" ? "Joining" : "Sale"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-charcoal/75">
                          {formatINR(commission.baseAmount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold tabular-nums text-charcoal/75">
                            {commission.percentage}%
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-charcoal/75">
                          {formatINR(commission.amount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-charcoal/75">
                          {formatINR(commission.tdsAmount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-emerald-800">
                          {formatINR(commission.netAmount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-charcoal/70">
                          {formatDate(commission.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
