import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Card from "../../components/ui/Card";
import DataTable, { type Column } from "../../components/DataTable";
import { adminNavItems } from "./adminNav";
import { api } from "../../lib/api";
import type { Commission, DashboardSummary, Sale } from "../../lib/types";
import { formatDate } from "../../lib/format";

const columns: Column<Sale>[] = [
  { key: "memberCode", header: "Member", render: (s) => `${s.memberCode ?? ""} ${s.memberName ?? ""}` },
  { key: "plotReference", header: "Plot Reference", render: (s) => s.plotReference },
  { key: "amount", header: "Amount", render: (s) => Number(s.amount).toLocaleString("en-IN") },
  { key: "saleDate", header: "Sale Date", render: (s) => formatDate(s.saleDate) },
];

const commissionColumns: Column<Commission>[] = [
  {
    key: "member",
    header: "Sponsor",
    render: (c) => (c.member ? `${c.member.name} (${c.member.memberCode})` : "-"),
  },
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
  {
    key: "amount",
    header: "Commission Amount",
    render: (c) => Number(c.amount).toLocaleString("en-IN"),
  },
  { key: "createdAt", header: "Date", render: (c) => formatDate(c.createdAt) },
];

export default function Reports() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [totalCommission, setTotalCommission] = useState(0);

  useEffect(() => {
    api.get<DashboardSummary>("/dashboard/summary").then(({ data }) => setSummary(data));
    api
      .get<{ sales: Sale[] }>("/sales", { params: { page: 1, pageSize: 10, sort: "saleDate:desc" } })
      .then(({ data }) => setSales(data.sales));
    api
      .get<{ commissions: Commission[]; totalAmount: string }>("/commissions", {
        params: { page: 1, pageSize: 10 },
      })
      .then(({ data }) => {
        setCommissions(data.commissions);
        setTotalCommission(Number(data.totalAmount));
      });
  }, []);

  return (
    <DashboardLayout title="Admin Panel" navItems={adminNavItems}>
      <h1 className="mb-6 text-2xl font-bold text-navy">Reports</h1>

      {summary && (
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Card>
            <p className="text-sm text-charcoal/60">Total Members</p>
            <p className="mt-2 text-2xl font-bold text-navy">{summary.totalMembers}</p>
          </Card>
          <Card>
            <p className="text-sm text-charcoal/60">Total Sales</p>
            <p className="mt-2 text-2xl font-bold text-navy">{summary.totalSalesCount}</p>
          </Card>
          <Card>
            <p className="text-sm text-charcoal/60">Total Sales Amount</p>
            <p className="mt-2 text-2xl font-bold text-navy">
              {Number(summary.totalSalesAmount).toLocaleString("en-IN")}
            </p>
          </Card>
        </div>
      )}

      <Card className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-navy">Recent Sales</h2>
        <DataTable columns={columns} rows={sales} rowKey={(s) => s.id} />
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy">Sponsor Commissions</h2>
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
          emptyMessage="No commissions recorded yet."
        />
      </Card>
    </DashboardLayout>
  );
}
