import { useEffect, useState, type FormEvent } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import DataTable, { type Column } from "../../components/DataTable";
import ConfirmDialog from "../../components/ConfirmDialog";
import FormField from "../../components/FormField";
import SearchableDropdown, {
  type DropdownOption,
} from "../../components/SearchableDropdown";
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
    { key: "memberCode", header: "Member", render: (sale) => `${sale.memberCode ?? ""} ${sale.memberName ?? ""}` },
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
            className="rounded-md px-3 py-1.5"
            onClick={() => startEditing(sale)}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="danger"
            className="rounded-md px-3 py-1.5"
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
      <h1 className="mb-6 text-2xl font-bold text-navy">Sales</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          placeholder="Search by plot reference"
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
        />
        <input
          type="date"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={dateFrom}
          onChange={(event) => {
            setPage(1);
            setDateFrom(event.target.value);
          }}
        />
        <input
          type="date"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={dateTo}
          onChange={(event) => {
            setPage(1);
            setDateTo(event.target.value);
          }}
        />
      </div>

      <DataTable
        columns={columns}
        rows={items}
        rowKey={(sale) => sale.id}
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
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {editingSale && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-sale-title"
        >
          <div className="my-auto w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <h2 id="edit-sale-title" className="mb-5 text-xl font-bold text-navy">
              Edit Sale
            </h2>
            <form onSubmit={handleSave} noValidate>
              <SearchableDropdown
                label="Member"
                placeholder="Search member by name or code"
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
