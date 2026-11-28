import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import DataTable, { type Column } from "../../components/DataTable";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { adminNavItems } from "./adminNav";
import { api } from "../../lib/api";
import type { Member } from "../../lib/types";
import Badge from "../../components/ui/Badge";
import AssociateAvatar from "../../components/AssociateAvatar";

const PAGE_SIZE = 10;

function startOfLocalDay(value: string, daysOffset = 0): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day + daysOffset).toISOString();
}

export default function Members() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const invalidDateRange = Boolean(createdFrom && createdTo && createdFrom > createdTo);

  useEffect(() => {
    if (invalidDateRange) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setLoadError("");
    api
      .get<{
        members: Member[];
        pagination: { page: number; pageSize: number; total: number; totalPages: number };
      }>("/members", {
        params: {
          search: search || undefined,
          status: status || undefined,
          createdFrom: createdFrom ? startOfLocalDay(createdFrom) : undefined,
          createdBefore: createdTo ? startOfLocalDay(createdTo, 1) : undefined,
          sortBy: sort,
          sortOrder: sortDir,
          page,
          pageSize: PAGE_SIZE,
        },
      })
      .then(({ data }) => {
        if (!active) return;
        setItems(data.members);
        setTotal(data.pagination.total);
      })
      .catch(() => {
        if (active) setLoadError("Unable to load associates. Please try again.");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [search, status, createdFrom, createdTo, sort, sortDir, page, invalidDateRange]);

  const handleSort = (key: string) => {
    if (sort === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setSortDir("asc");
    }
  };

  const columns: Column<Member>[] = [
    {
      key: "photo",
      header: "Photo",
      render: (m) => (
        <AssociateAvatar
          memberId={m.id}
          name={m.name}
          hasPhoto={m.hasProfilePhoto}
          photoEndpoint={`/members/${m.id}/photo`}
          className="h-10 w-10 rounded-full border border-slate-200 bg-navy text-xs"
        />
      ),
    },
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
        <Badge tone={m.status.toUpperCase() === "ACTIVE" ? "success" : "neutral"}>
          {m.status}
        </Badge>
      ),
    },
  ];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <DashboardLayout title="Admin Panel" navItems={adminNavItems}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
            Associate directory
          </p>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Associates</h1>
          <p className="mt-1 text-sm text-charcoal/60">
            Search, review, and manage associate accounts.
          </p>
        </div>
        <Link
          to="/admin/members/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          <span aria-hidden="true" className="text-lg leading-none">+</span>
          Add associate
        </Link>
      </div>

      <Card className="mb-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 sm:items-end">
          <div>
            <label htmlFor="member-search" className="mb-1.5 block text-xs font-semibold text-charcoal/70">
              Search associates
            </label>
            <input
              id="member-search"
              type="search"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm outline-none transition placeholder:text-charcoal/40 focus:border-gold focus:ring-2 focus:ring-gold/20"
              placeholder="Search by name or associate code"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
          <div>
            <label htmlFor="member-status" className="mb-1.5 block text-xs font-semibold text-charcoal/70">
              Account status
            </label>
            <select
              id="member-status"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div>
            <label htmlFor="member-created-from" className="mb-1.5 block text-xs font-semibold text-charcoal/70">
              Created from
            </label>
            <input
              id="member-created-from"
              type="date"
              max={createdTo || undefined}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
              value={createdFrom}
              onChange={(event) => {
                setPage(1);
                setCreatedFrom(event.target.value);
              }}
            />
          </div>
          <div>
            <label htmlFor="member-created-to" className="mb-1.5 block text-xs font-semibold text-charcoal/70">
              Created to
            </label>
            <input
              id="member-created-to"
              type="date"
              min={createdFrom || undefined}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
              value={createdTo}
              onChange={(event) => {
                setPage(1);
                setCreatedTo(event.target.value);
              }}
            />
          </div>
        </div>
        {invalidDateRange && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            The start date must be on or before the end date.
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-navy">
            {total.toLocaleString("en-IN")} {total === 1 ? "associate" : "associates"}
          </p>
          <p className="text-xs text-charcoal/55">
            {loading ? "Updating results..." : "Click a row to view associate details"}
          </p>
        </div>
      </Card>

      <Card className="!p-3 sm:!p-4">
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(m) => m.id}
          sortKey={sort}
          sortDir={sortDir}
          onSort={handleSort}
          onRowClick={(m) => navigate(`/admin/members/${m.id}`)}
          emptyMessage={
            loadError ||
            (loading ? "Loading associates..." : "No associates found.")
          }
        />
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-charcoal/60">
            Page {page} of {totalPages}
            <span className="ml-1 text-xs">({total.toLocaleString("en-IN")} total)</span>
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2"
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
}
