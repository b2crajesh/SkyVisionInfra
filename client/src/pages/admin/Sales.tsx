import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import DataTable, { type Column } from "../../components/DataTable";
import { adminNavItems } from "./adminNav";
import { api } from "../../lib/api";
import type { Sale } from "../../lib/types";
import { formatDate } from "../../lib/format";

const PAGE_SIZE = 10;

export default function Sales() {
  const [items, setItems] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState("saleDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get<{
        sales: Sale[];
        pagination: { page: number; pageSize: number; total: number; totalPages: number };
      }>("/sales", {
        params: {
          search: search || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          sort: `${sort}:${sortDir}`,
          page,
          pageSize: PAGE_SIZE,
        },
      })
      .then(({ data }) => {
        if (!active) return;
        setItems(data.sales);
        setTotal(data.pagination.total);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [search, dateFrom, dateTo, sort, sortDir, page]);

  const handleSort = (key: string) => {
    if (sort === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setSortDir("asc");
    }
  };

  const columns: Column<Sale>[] = [
    { key: "memberCode", header: "Member", render: (s) => `${s.memberCode ?? ""} ${s.memberName ?? ""}` },
    { key: "plotReference", header: "Plot Reference", sortable: true, render: (s) => s.plotReference },
    { key: "area", header: "Area", sortable: true, render: (s) => s.area },
    { key: "amount", header: "Amount", sortable: true, render: (s) => Number(s.amount).toLocaleString("en-IN") },
    { key: "saleDate", header: "Sale Date", sortable: true, render: (s) => formatDate(s.saleDate) },
  ];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <DashboardLayout title="Admin Panel" navItems={adminNavItems}>
      <h1 className="mb-6 text-2xl font-bold text-navy">Sales</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          placeholder="Search by plot reference"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <input
          type="date"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={dateFrom}
          onChange={(e) => {
            setPage(1);
            setDateFrom(e.target.value);
          }}
        />
        <input
          type="date"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={dateTo}
          onChange={(e) => {
            setPage(1);
            setDateTo(e.target.value);
          }}
        />
      </div>

      <DataTable
        columns={columns}
        rows={items}
        rowKey={(s) => s.id}
        sortKey={sort}
        sortDir={sortDir}
        onSort={handleSort}
        emptyMessage={loading ? "Loading sales..." : "No sales found."}
      />

      <div className="mt-4 flex items-center justify-between text-sm text-charcoal/60">
        <span>
          Page {page} of {totalPages} ({total} total)
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
