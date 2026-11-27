import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Card from "../../components/ui/Card";
import DataTable, { type Column } from "../../components/DataTable";
import Button from "../../components/ui/Button";
import { useToast } from "../../components/ToastProvider";
import { adminNavItems } from "./adminNav";
import { api } from "../../lib/api";
import type { Commission, DashboardSummary, Sale } from "../../lib/types";
import { formatDate } from "../../lib/format";

const PAGE_SIZE = 10;

const formatCurrency = (value: number) =>
  value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

const formatPercentage = (value: string) =>
  `${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`;

const saleColumns: Column<Sale>[] = [
  {
    key: "member",
    header: "Associate",
    render: (sale) => `${sale.memberCode ?? ""} ${sale.memberName ?? ""}`.trim(),
  },
  {
    key: "plotReference",
    header: "Plot reference",
    sortable: true,
    render: (sale) => sale.plotReference,
  },
  {
    key: "area",
    header: "Area (sq. ft.)",
    sortable: true,
    render: (sale) => Number(sale.area).toLocaleString("en-IN"),
  },
  {
    key: "rate",
    header: "Rate / sq. ft.",
    sortable: true,
    render: (sale) => formatCurrency(Number(sale.rate)),
  },
  {
    key: "amount",
    header: "Sale amount",
    sortable: true,
    render: (sale) => formatCurrency(Number(sale.amount)),
  },
  {
    key: "saleDate",
    header: "Sale date",
    sortable: true,
    render: (sale) => formatDate(sale.saleDate),
  },
];

const commissionColumns: Column<Commission>[] = [
  {
    key: "member",
    header: "Commission recipient",
    render: (commission) =>
      commission.member
        ? `${commission.member.name} (${commission.member.memberCode})`
        : "-",
  },
  {
    key: "sourceMember",
    header: "Source associate",
    render: (commission) =>
      `${commission.sourceMember.name} (${commission.sourceMember.memberCode})`,
  },
  {
    key: "type",
    header: "Type",
    sortable: true,
    render: (commission) => (commission.type === "JOINING" ? "Joining" : "Sale"),
  },
  {
    key: "baseAmount",
    header: "Base amount",
    sortable: true,
    render: (commission) => formatCurrency(Number(commission.baseAmount)),
  },
  {
    key: "percentage",
    header: "Commission %",
    sortable: true,
    render: (commission) => formatPercentage(commission.percentage),
  },
  {
    key: "amount",
    header: "Commission amount",
    sortable: true,
    render: (commission) => formatCurrency(Number(commission.amount)),
  },
  {
    key: "tdsPercentage",
    header: "TDS %",
    sortable: true,
    render: (commission) => formatPercentage(commission.tdsPercentage),
  },
  {
    key: "tdsAmount",
    header: "TDS amount",
    sortable: true,
    render: (commission) => formatCurrency(Number(commission.tdsAmount)),
  },
  {
    key: "netAmount",
    header: "Net payable",
    sortable: true,
    render: (commission) => formatCurrency(Number(commission.netAmount)),
  },
  {
    key: "createdAt",
    header: "Date",
    sortable: true,
    render: (commission) => formatDate(commission.createdAt),
  },
];

function PaginationControls({
  page,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstRecord = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRecord = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-charcoal/60">
        Showing {firstRecord}-{lastRecord} of {total.toLocaleString("en-IN")}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="px-4 py-2"
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="px-4 py-2"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default function Reports() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const [sales, setSales] = useState<Sale[]>([]);
  const [salesTotal, setSalesTotal] = useState(0);
  const [salesPage, setSalesPage] = useState(1);
  const [salesSearch, setSalesSearch] = useState("");
  const [salesSort, setSalesSort] = useState("saleDate");
  const [salesSortDir, setSalesSortDir] = useState<"asc" | "desc">("desc");
  const [salesLoading, setSalesLoading] = useState(true);

  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [commissionsTotal, setCommissionsTotal] = useState(0);
  const [commissionPage, setCommissionPage] = useState(1);
  const [commissionSearch, setCommissionSearch] = useState("");
  const [commissionType, setCommissionType] = useState("");
  const [commissionSort, setCommissionSort] = useState("createdAt");
  const [commissionSortDir, setCommissionSortDir] = useState<"asc" | "desc">("desc");
  const [commissionTotals, setCommissionTotals] = useState({ gross: 0, tds: 0, net: 0 });
  const [commissionLoading, setCommissionLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get<DashboardSummary>("/dashboard/summary")
      .then(({ data }) => active && setSummary(data))
      .catch(() => active && toast("Unable to load report summary.", "error"));
    return () => {
      active = false;
    };
  }, [toast]);

  useEffect(() => {
    let active = true;
    setSalesLoading(true);
    api
      .get<{
        sales: Sale[];
        pagination: { total: number };
      }>("/sales", {
        params: {
          search: salesSearch || undefined,
          sortBy: salesSort,
          sortOrder: salesSortDir,
          page: salesPage,
          pageSize: PAGE_SIZE,
        },
      })
      .then(({ data }) => {
        if (!active) return;
        setSales(data.sales);
        setSalesTotal(data.pagination.total);
      })
      .catch(() => active && toast("Unable to load sales report.", "error"))
      .finally(() => active && setSalesLoading(false));
    return () => {
      active = false;
    };
  }, [salesSearch, salesSort, salesSortDir, salesPage, toast]);

  useEffect(() => {
    let active = true;
    setCommissionLoading(true);
    api
      .get<{
        commissions: Commission[];
        totalGrossAmount: string;
        totalTdsAmount: string;
        totalNetAmount: string;
        pagination: { total: number };
      }>("/commissions", {
        params: {
          search: commissionSearch || undefined,
          type: commissionType || undefined,
          sortBy: commissionSort,
          sortOrder: commissionSortDir,
          page: commissionPage,
          pageSize: PAGE_SIZE,
        },
      })
      .then(({ data }) => {
        if (!active) return;
        setCommissions(data.commissions);
        setCommissionsTotal(data.pagination.total);
        setCommissionTotals({
          gross: Number(data.totalGrossAmount),
          tds: Number(data.totalTdsAmount),
          net: Number(data.totalNetAmount),
        });
      })
      .catch(() => active && toast("Unable to load commission report.", "error"))
      .finally(() => active && setCommissionLoading(false));
    return () => {
      active = false;
    };
  }, [commissionSearch, commissionType, commissionSort, commissionSortDir, commissionPage, toast]);

  const handleSalesSort = (key: string) => {
    setSalesPage(1);
    if (salesSort === key) {
      setSalesSortDir((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSalesSort(key);
      setSalesSortDir("asc");
    }
  };

  const handleCommissionSort = (key: string) => {
    setCommissionPage(1);
    if (commissionSort === key) {
      setCommissionSortDir((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setCommissionSort(key);
      setCommissionSortDir("asc");
    }
  };

  return (
    <DashboardLayout title="Admin Panel" navItems={adminNavItems}>
      <div className="mb-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
          Business overview
        </p>
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">Reports</h1>
        <p className="mt-1 text-sm text-charcoal/60">
          Review sales, commission rates, and payout activity.
        </p>
      </div>

      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="relative overflow-hidden !p-5">
            <div className="absolute inset-y-0 left-0 w-1 bg-gold" />
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">
              Total associates
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-navy">
              {Number(summary.totalMembers).toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-charcoal/55">Registered accounts</p>
          </Card>
          <Card className="relative overflow-hidden !p-5">
            <div className="absolute inset-y-0 left-0 w-1 bg-blue-500" />
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">
              Total sales
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-navy">
              {Number(summary.totalSalesCount).toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-charcoal/55">Recorded transactions</p>
          </Card>
          <Card className="relative overflow-hidden !p-5">
            <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500" />
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">
              Total sales amount
            </p>
            <p className="mt-3 break-words text-2xl font-bold tracking-tight text-navy">
              {formatCurrency(Number(summary.totalSalesAmount))}
            </p>
            <p className="mt-1 text-xs text-charcoal/55">Total recorded value</p>
          </Card>
        </div>
      )}

      <Card className="mb-6 !p-4 sm:!p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-navy">Sales report</h2>
            <p className="mt-1 text-sm text-charcoal/55">
              Search transactions and sort by amount, date, area, or rate.
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
            {salesTotal.toLocaleString("en-IN")} sales
          </span>
        </div>
        <label htmlFor="report-sales-search" className="mb-1.5 block text-xs font-semibold text-charcoal/70">
          Search sales
        </label>
        <input
          id="report-sales-search"
          type="search"
          className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm outline-none transition placeholder:text-charcoal/40 focus:border-gold focus:ring-2 focus:ring-gold/20 sm:max-w-md"
          placeholder="Associate name, associate code, or plot reference"
          value={salesSearch}
          onChange={(event) => {
            setSalesPage(1);
            setSalesSearch(event.target.value);
          }}
        />
        <DataTable
          columns={saleColumns}
          rows={sales}
          rowKey={(sale) => sale.id}
          sortKey={salesSort}
          sortDir={salesSortDir}
          onSort={handleSalesSort}
          emptyMessage={salesLoading ? "Loading sales..." : "No sales match your search."}
        />
        <PaginationControls
          page={salesPage}
          total={salesTotal}
          pageSize={PAGE_SIZE}
          onPageChange={setSalesPage}
        />
      </Card>

      <Card className="!p-4 sm:!p-6">
        <div className="mb-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-navy">Commission report</h2>
              <p className="mt-1 text-sm text-charcoal/55">
                Review commission percentages, amounts, TDS, and net payouts.
              </p>
            </div>
            <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-navy">
              {commissionsTotal.toLocaleString("en-IN")} records
            </span>
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
          <div>
            <label htmlFor="report-commission-search" className="mb-1.5 block text-xs font-semibold text-charcoal/70">
              Search commissions
            </label>
            <input
              id="report-commission-search"
              type="search"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm outline-none transition placeholder:text-charcoal/40 focus:border-gold focus:ring-2 focus:ring-gold/20"
              placeholder="Recipient or source associate name/code"
              value={commissionSearch}
              onChange={(event) => {
                setCommissionPage(1);
                setCommissionSearch(event.target.value);
              }}
            />
          </div>
          <div>
            <label htmlFor="report-commission-type" className="mb-1.5 block text-xs font-semibold text-charcoal/70">
              Commission type
            </label>
            <select
              id="report-commission-type"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
              value={commissionType}
              onChange={(event) => {
                setCommissionPage(1);
                setCommissionType(event.target.value);
              }}
            >
              <option value="">All commission types</option>
              <option value="JOINING">Joining</option>
              <option value="SALE">Sale</option>
            </select>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">
              Gross commission
            </p>
            <p className="mt-2 break-words text-lg font-bold text-navy">
              {formatCurrency(commissionTotals.gross)}
            </p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/70">
              TDS withheld
            </p>
            <p className="mt-2 break-words text-lg font-bold text-amber-900">
              {formatCurrency(commissionTotals.tds)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">
              Net payable
            </p>
            <p className="mt-2 break-words text-lg font-bold text-emerald-900">
              {formatCurrency(commissionTotals.net)}
            </p>
          </div>
        </div>
        <p className="mb-3 text-xs text-charcoal/50">
          Amount totals reflect the selected commission type and search.
        </p>
        <DataTable
          columns={commissionColumns}
          rows={commissions}
          rowKey={(commission) => commission.id}
          sortKey={commissionSort}
          sortDir={commissionSortDir}
          onSort={handleCommissionSort}
          emptyMessage={commissionLoading ? "Loading commissions..." : "No commissions match your search."}
        />
        <PaginationControls
          page={commissionPage}
          total={commissionsTotal}
          pageSize={PAGE_SIZE}
          onPageChange={setCommissionPage}
        />
      </Card>
    </DashboardLayout>
  );
}
