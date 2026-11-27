import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import DataTable, { type Column } from "../../components/DataTable";
import ConfirmDialog from "../../components/ConfirmDialog";
import FormField from "../../components/FormField";
import SearchableDropdown, {
  type DropdownOption,
} from "../../components/SearchableDropdown";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useToast } from "../../components/ToastProvider";
import { adminNavItems } from "./adminNav";
import { api } from "../../lib/api";
import type { Sale, SponsorOption } from "../../lib/types";
import { formatDate } from "../../lib/format";
import {
  validateSaleForm,
  type SaleFormErrors,
  type SaleFormValues,
} from "../../lib/validation";

const PAGE_SIZE = 10;

const emptyForm: SaleFormValues = {
  memberId: "",
  plotReference: "",
  area: "",
  rate: "",
  saleDate: "",
};

function calculatedAmount(area: string, rate: string): string {
  const areaValue = Number(area);
  const rateValue = Number(rate);
  return areaValue > 0 && rateValue > 0
    ? (areaValue * rateValue).toFixed(2)
    : "";
}

export default function Sales() {
  const { toast } = useToast();
  const [items, setItems] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState("saleDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [form, setForm] = useState<SaleFormValues>(emptyForm);
  const [member, setMember] = useState<DropdownOption | null>(null);
  const [formErrors, setFormErrors] = useState<SaleFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState(false);

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
          sortBy: sort,
          sortOrder: sortDir,
          page,
          pageSize: PAGE_SIZE,
        },
      })
      .then(({ data }) => {
        if (!active) return;
        setItems(data.sales);
        setTotal(data.pagination.total);
      })
      .catch(() => {
        if (active) toast("Unable to load sales. Please try again.", "error");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [search, dateFrom, dateTo, sort, sortDir, page, toast]);

  const handleSort = (key: string) => {
    if (sort === key) {
      setSortDir((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setSortDir("asc");
    }
  };

  const fetchMembers = async (query: string): Promise<DropdownOption[]> => {
    const { data } = await api.get<{ members: SponsorOption[] }>("/members", {
      params: { forSponsor: "true", search: query },
    });
    return data.members.map((item) => ({
      id: item.id,
      label: `${item.memberCode} - ${item.name}`,
    }));
  };

  const startEditing = (sale: Sale) => {
    setEditingSale(sale);
    setMember({
      id: sale.memberId,
      label: `${sale.memberCode ?? ""} - ${sale.memberName ?? ""}`.trim(),
    });
    setForm({
      memberId: sale.memberId,
      plotReference: sale.plotReference,
      area: sale.area,
      rate: sale.rate,
      saleDate: sale.saleDate.slice(0, 10),
    });
    setFormErrors({});
  };

  const closeEditor = () => {
    setEditingSale(null);
    setMember(null);
    setForm(emptyForm);
    setFormErrors({});
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    const values = { ...form, memberId: member?.id ?? "" };
    const errors = validateSaleForm(values);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0 || !editingSale) return;

    setSaving(true);
    try {
      const { data } = await api.put<{ sale: Sale }>(`/sales/${editingSale.id}`, {
        ...values,
        area: Number(values.area),
        rate: Number(values.rate),
      });
      setItems((current) =>
        current.map((item) => (item.id === data.sale.id ? data.sale : item))
      );
      toast("Sale updated successfully.", "success");
      closeEditor();
    } catch {
      toast("Failed to update sale. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSale) return;
    setDeleting(true);
    try {
      await api.delete(`/sales/${deletingSale.id}`);
      setItems((current) => current.filter((item) => item.id !== deletingSale.id));
      setTotal((count) => Math.max(0, count - 1));
      toast("Sale deleted successfully.", "success");
      setDeletingSale(null);
    } catch {
      toast("Failed to delete sale. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Sale>[] = [
    { key: "memberCode", header: "Associate", render: (sale) => `${sale.memberCode ?? ""} ${sale.memberName ?? ""}` },
    { key: "plotReference", header: "Plot Reference", sortable: true, render: (sale) => sale.plotReference },
    { key: "area", header: "Area", sortable: true, render: (sale) => sale.area },
    { key: "rate", header: "Rate / sq. ft.", sortable: true, render: (sale) => Number(sale.rate).toLocaleString("en-IN") },
    { key: "amount", header: "Amount", sortable: true, render: (sale) => Number(sale.amount).toLocaleString("en-IN") },
    { key: "saleDate", header: "Sale Date", sortable: true, render: (sale) => formatDate(sale.saleDate) },
    {
      key: "actions",
      header: "Actions",
      render: (sale) => (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="px-3 py-1.5"
            onClick={() => startEditing(sale)}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="danger"
            className="px-3 py-1.5"
            onClick={() => setDeletingSale(sale)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const amount = calculatedAmount(form.area, form.rate);

  return (
    <DashboardLayout title="Admin Panel" navItems={adminNavItems}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
            Revenue activity
          </p>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Sales</h1>
          <p className="mt-1 text-sm text-charcoal/60">
            Review, filter, and manage recorded plot sales.
          </p>
        </div>
        <Link
          to="/admin/sales/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          <span aria-hidden="true" className="text-lg leading-none">+</span>
          Record sale
        </Link>
      </div>

      <Card className="mb-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(10rem,0.7fr)_minmax(10rem,0.7fr)]">
          <div>
            <label htmlFor="sales-search" className="mb-1.5 block text-xs font-semibold text-charcoal/70">
              Plot reference
            </label>
            <input
              id="sales-search"
              type="search"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm outline-none transition placeholder:text-charcoal/40 focus:border-gold focus:ring-2 focus:ring-gold/20"
              placeholder="Search plot reference"
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
            />
          </div>
          <div>
            <label htmlFor="sales-date-from" className="mb-1.5 block text-xs font-semibold text-charcoal/70">
              From date
            </label>
            <input
              id="sales-date-from"
              type="date"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
              value={dateFrom}
              onChange={(event) => {
                setPage(1);
                setDateFrom(event.target.value);
              }}
            />
          </div>
          <div>
            <label htmlFor="sales-date-to" className="mb-1.5 block text-xs font-semibold text-charcoal/70">
              To date
            </label>
            <input
              id="sales-date-to"
              type="date"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-navy shadow-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
              value={dateTo}
              onChange={(event) => {
                setPage(1);
                setDateTo(event.target.value);
              }}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-navy">
            {total.toLocaleString("en-IN")} {total === 1 ? "sale" : "sales"}
          </p>
          <p className="text-xs text-charcoal/55">
            {loading ? "Updating results..." : "Sort by selecting a table heading"}
          </p>
        </div>
      </Card>

      <Card className="!p-3 sm:!p-4">
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(sale) => sale.id}
          sortKey={sort}
          sortDir={sortDir}
          onSort={handleSort}
          emptyMessage={loading ? "Loading sales..." : "No sales found."}
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
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="px-4 py-2"
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="px-4 py-2"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {editingSale && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-sale-title"
        >
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-7">
              <h2 id="edit-sale-title" className="text-xl font-bold text-navy">
                Edit Sale
              </h2>
              <p className="mt-1 text-sm text-charcoal/60">
                Update the sale information below.
              </p>
            </div>
            <form onSubmit={handleSave} noValidate className="p-5 sm:p-7">
              <SearchableDropdown
                label="Associate"
                placeholder="Search associate by name or code"
                fetchOptions={fetchMembers}
                value={member}
                onSelect={setMember}
                error={formErrors.memberId}
              />
              <FormField
                label="Plot Reference"
                value={form.plotReference}
                error={formErrors.plotReference}
                onChange={(event) =>
                  setForm((current) => ({ ...current, plotReference: event.target.value }))
                }
              />
              <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                <FormField
                  label="Area (sq. ft.)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.area}
                  error={formErrors.area}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, area: event.target.value }))
                  }
                />
                <FormField
                  label="Rate (per sq. ft.)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.rate}
                  error={formErrors.rate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, rate: event.target.value }))
                  }
                />
              </div>
              <FormField
                label="Amount"
                value={amount}
                readOnly
                hint="Calculated automatically as area × rate."
              />
              <FormField
                label="Sale Date"
                type="date"
                value={form.saleDate}
                error={formErrors.saleDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, saleDate: event.target.value }))
                }
              />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={closeEditor} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deletingSale)}
        title="Delete Sale"
        onClose={() => !deleting && setDeletingSale(null)}
        onConfirm={handleDelete}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
      >
        Are you sure you want to delete the sale for{" "}
        <strong>{deletingSale?.plotReference}</strong>? This action cannot be undone.
      </ConfirmDialog>
    </DashboardLayout>
  );
}
