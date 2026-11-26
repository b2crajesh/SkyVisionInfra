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

const formatCurrency = (value: number) =>
  value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

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
      <div className="mb-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
          Business overview
        </p>
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">Reports</h1>
        <p className="mt-1 text-sm text-charcoal/60">
          Review membership, sales, and commission activity.
        </p>
      </div>

      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="relative overflow-hidden !p-5">
            <div className="absolute inset-y-0 left-0 w-1 bg-gold" />
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Total members</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-navy">
              {Number(summary.totalMembers).toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-charcoal/55">Registered accounts</p>
          </Card>
          <Card className="relative overflow-hidden !p-5">
            <div className="absolute inset-y-0 left-0 w-1 bg-blue-500" />
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Total sales</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-navy">
              {Number(summary.totalSalesCount).toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-charcoal/55">Recorded transactions</p>
          </Card>
          <Card className="relative overflow-hidden !p-5">
            <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500" />
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Sales value</p>
            <p className="mt-3 break-words text-2xl font-bold tracking-tight text-navy">
              {formatCurrency(Number(summary.totalSalesAmount))}
            </p>
            <p className="mt-1 text-xs text-charcoal/55">Total recorded amount</p>
          </Card>
        </div>
      )}

      <Card className="mb-6 !p-4 sm:!p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-navy">Recent sales</h2>
            <p className="mt-1 text-sm text-charcoal/55">The 10 latest recorded transactions</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-charcoal/65">
            {sales.length} records
          </span>
        </div>
        <DataTable columns={columns} rows={sales} rowKey={(s) => s.id} />
      </Card>

      <Card className="!p-4 sm:!p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-navy">Commission history</h2>
          <p className="mt-1 text-sm text-charcoal/55">
            Summary of gross earnings, tax withheld, and net payable.
          </p>
        </div>
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Gross commission</p>
            <p className="mt-2 break-words text-lg font-bold text-navy">
              {formatCurrency(commissionTotals.gross)}
            </p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/70">TDS to remit</p>
            <p className="mt-2 break-words text-lg font-bold text-amber-900">
              {formatCurrency(commissionTotals.tds)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">Net payable</p>
            <p className="mt-2 break-words text-lg font-bold text-emerald-900">
              {formatCurrency(commissionTotals.net)}
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
