import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import DataTable, { type Column } from "../../components/DataTable";
import { adminNavItems } from "./adminNav";
import { api } from "../../lib/api";
import type { Member } from "../../lib/types";
import Badge from "../../components/ui/Badge";

const PAGE_SIZE = 10;

export default function Members() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get<{
        members: Member[];
        pagination: { page: number; pageSize: number; total: number; totalPages: number };
      }>("/members", {
        params: {
          search: search || undefined,
          status: status || undefined,
          sort: `${sort}:${sortDir}`,
          page,
          pageSize: PAGE_SIZE,
        },
      })
      .then(({ data }) => {
        if (!active) return;
        setItems(data.members);
        setTotal(data.pagination.total);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [search, status, sort, sortDir, page]);

  const handleSort = (key: string) => {
    if (sort === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setSortDir("asc");
    }
  };

  const columns: Column<Member>[] = [
    { key: "memberCode", header: "Code", sortable: true, render: (m) => m.memberCode },
    { key: "name", header: "Name", sortable: true, render: (m) => m.name },
    { key: "sponsor", header: "Sponsor", render: (m) => m.sponsor?.name ?? "-" },
    { key: "rank", header: "Rank", render: (m) => m.rank?.name ?? "-" },
    {
      key: "bookingAmount",
      header: "Booking Amount",
      sortable: true,
      render: (m) => Number(m.bookingAmount).toLocaleString("en-IN"),
    },
    {
      key: "status",
      header: "Status",
      render: (m) => (
        <Badge tone={m.status === "active" ? "success" : "neutral"}>
          {m.status}
        </Badge>
      ),
    },
  ];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <DashboardLayout title="Admin Panel" navItems={adminNavItems}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-navy">Members</h1>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          placeholder="Search by name or code"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={items}
        rowKey={(m) => m.id}
        sortKey={sort}
        sortDir={sortDir}
        onSort={handleSort}
        onRowClick={(m) => navigate(`/admin/members/${m.id}`)}
        emptyMessage={loading ? "Loading members..." : "No members found."}
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
