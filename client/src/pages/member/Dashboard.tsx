import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import DataTable, { type Column } from "../../components/DataTable";
import { memberNavItems } from "./memberNav";
import { api } from "../../lib/api";
import type { Commission, Member, Sale } from "../../lib/types";
import { formatDate } from "../../lib/format";

const saleColumns: Column<Sale>[] = [
  { key: "plotReference", header: "Plot Reference", render: (s) => s.plotReference },
  { key: "area", header: "Area", render: (s) => s.area },
  { key: "amount", header: "Amount", render: (s) => Number(s.amount).toLocaleString("en-IN") },
  { key: "saleDate", header: "Sale Date", render: (s) => formatDate(s.saleDate) },
];

const commissionColumns: Column<Commission>[] = [
  {
    key: "sourceMember",
    header: "New Member",
    render: (c) => `${c.sourceMember.name} (${c.sourceMember.memberCode})`,
  },
  {
    key: "bookingAmount",
    header: "Booking Amount",
    render: (c) => Number(c.bookingAmount).toLocaleString("en-IN"),
  },
  { key: "percentage", header: "Commission %", render: (c) => `${c.percentage}%` },
  {
    key: "amount",
    header: "Commission Amount",
    render: (c) => Number(c.amount).toLocaleString("en-IN"),
  },
  { key: "createdAt", header: "Date", render: (c) => formatDate(c.createdAt) },
];

export default function MemberDashboard() {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [totalCommission, setTotalCommission] = useState(0);

  useEffect(() => {
    api
      .get<{ member: Member }>("/members/me")
      .then(({ data }) => setMember(data.member))
      .catch(() => setError("Unable to load your member record."))
      .finally(() => setLoading(false));

    api
      .get<{ commissions: Commission[]; totalAmount: string }>("/commissions/me")
      .then(({ data }) => {
        setCommissions(data.commissions);
        setTotalCommission(Number(data.totalAmount));
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
            <h3 className="mb-4 text-lg font-semibold text-navy">My Sales</h3>
            <DataTable
              columns={saleColumns}
              rows={member.sales ?? []}
              rowKey={(s) => s.id}
              emptyMessage="No sales recorded yet."
            />
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-navy">Commission Earned</h3>
              <span className="text-xl font-bold text-navy">
                {totalCommission.toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                })}
              </span>
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
