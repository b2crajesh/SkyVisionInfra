import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import DataTable, { type Column } from "../../components/DataTable";
import { memberNavItems } from "./memberNav";
import { api } from "../../lib/api";
import type { Commission, Member, MemberNetworkNode, Sale } from "../../lib/types";
import { formatDate } from "../../lib/format";

interface MemberNetwork {
  sponsorChain: MemberNetworkNode[];
  member: MemberNetworkNode;
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

const commissionColumns: Column<Commission>[] = [
  {
    key: "sourceMember",
    header: "Source Member",
    render: (c) => `${c.sourceMember.name} (${c.sourceMember.memberCode})`,
  },
  {
    key: "type",
    header: "Commission Type",
    render: (c) => (c.type === "JOINING" ? "Joining" : "Sale"),
  },
  {
    key: "baseAmount",
    header: "Commission Base Amount",
    render: (c) => Number(c.baseAmount).toLocaleString("en-IN"),
  },
  { key: "percentage", header: "Commission %", render: (c) => `${c.percentage}%` },
  {
    key: "amount",
    header: "Gross Commission",
    render: (c) => Number(c.amount).toLocaleString("en-IN"),
  },
  {
    key: "tdsAmount",
    header: "TDS (5%)",
    render: (c) => Number(c.tdsAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
  },
  {
    key: "netAmount",
    header: "Net Payable",
    render: (c) => Number(c.netAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
  },
  { key: "createdAt", header: "Date", render: (c) => formatDate(c.createdAt) },
];

export default function MemberDashboard() {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [commissionTotals, setCommissionTotals] = useState({ gross: 0, tds: 0, net: 0 });
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

  return (
    <DashboardLayout title="Member Portal" navItems={memberNavItems}>
      <h1 className="mb-6 text-2xl font-bold text-navy">My Dashboard</h1>
      {loading && <p className="text-charcoal/60">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {member && (
        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-navy">{member.name}</h2>
              <Badge tone="gold">{member.rank?.name ?? "Member"}</Badge>
            </div>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div><dt className="text-charcoal/50">Member Code</dt><dd>{member.memberCode}</dd></div>
              <div>
                <dt className="text-charcoal/50">Sponsor</dt>
                <dd>
                  {member.sponsor
                    ? `${member.sponsor.name} (${member.sponsor.memberCode})`
                    : "-"}
                </dd>
              </div>
              <div><dt className="text-charcoal/50">Booking Amount</dt><dd>{Number(member.bookingAmount).toLocaleString("en-IN")}</dd></div>
              <div><dt className="text-charcoal/50">Status</dt><dd>{member.status}</dd></div>
              <div><dt className="text-charcoal/50">Email</dt><dd>{member.email ?? "-"}</dd></div>
              <div><dt className="text-charcoal/50">Phone</dt><dd>{member.phone ?? "-"}</dd></div>
              <div><dt className="text-charcoal/50">Aadhaar</dt><dd>{member.aadhaarNumber}</dd></div>
              <div><dt className="text-charcoal/50">PAN</dt><dd>{member.panNumber}</dd></div>
              <div><dt className="text-charcoal/50">Date of Birth</dt><dd>{formatDate(member.dateOfBirth)}</dd></div>
              <div><dt className="text-charcoal/50">Rank</dt><dd>{member.rank?.name ?? "-"}</dd></div>
              <div><dt className="text-charcoal/50">Nominee</dt><dd>{member.nomineeName ?? "-"}</dd></div>
              <div><dt className="text-charcoal/50">Relationship</dt><dd>{member.relationship ?? "-"}</dd></div>
              <div className="sm:col-span-2"><dt className="text-charcoal/50">Address</dt><dd>{member.address ?? "-"}</dd></div>
            </dl>
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
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-navy">Commission Summary</h3>
              <div className="text-left sm:text-right">
                <p className="text-xl font-bold text-navy">
                  Net payable: {commissionTotals.net.toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-charcoal/60">
                  Gross {commissionTotals.gross.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 })}
                  {" | "}TDS to remit {commissionTotals.tds.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <DataTable
              columns={commissionColumns}
              rows={commissions}
              rowKey={(c) => c.id}
              emptyMessage="No commissions earned yet."
            />
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
