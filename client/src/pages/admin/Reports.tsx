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
  { key: "rate", header: "Rate / sq. ft.", render: (s) => Number(s.rate).toLocaleString("en-IN") },
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

export default function Reports() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [commissionTotals, setCommissionTotals] = useState({ gross: 0, tds: 0, net: 0 });

  useEffect(() => {
    api.get<DashboardSummary>("/dashboard/summary").then(({ data }) => setSummary(data));
    api
      .get<{ sales: Sale[] }>("/sales", { params: { page: 1, pageSize: 10, sortBy: "saleDate", sortOrder: "desc" } })
      .then(({ data }) => setSales(data.sales));
    api
      .get<{
        commissions: Commission[];
        totalGrossAmount: string;
        totalTdsAmount: string;
        totalNetAmount: string;
      }>("/commissions", {
        params: { page: 1, pageSize: 10 },
      })
      .then(({ data }) => {
        setCommissions(data.commissions);
        setCommissionTotals({
          gross: Number(data.totalGrossAmount),
          tds: Number(data.totalTdsAmount),
          net: Number(data.totalNetAmount),
        });
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
          <h2 className="text-lg font-semibold text-navy">Commission History</h2>
          <div className="text-right">
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
          emptyMessage="No commissions recorded yet."
        />
      </Card>
    </DashboardLayout>
  );
}
