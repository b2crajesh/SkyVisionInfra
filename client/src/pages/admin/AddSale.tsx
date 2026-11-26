import { useState, type FormEvent } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Card from "../../components/ui/Card";
import FormField from "../../components/FormField";
import Button from "../../components/ui/Button";
import SearchableDropdown, {
  type DropdownOption,
} from "../../components/SearchableDropdown";
import { adminNavItems } from "./adminNav";
import { api } from "../../lib/api";
import { useToast } from "../../components/ToastProvider";
import type { SponsorOption } from "../../lib/types";
import {
  validateSaleForm,
  type SaleFormErrors,
  type SaleFormValues,
} from "../../lib/validation";

const initialValues: SaleFormValues = {
  memberId: "",
  plotReference: "",
  area: "",
  rate: "",
  saleDate: "",
};

export default function AddSale() {
  const { toast } = useToast();
  const [values, setValues] = useState<SaleFormValues>(initialValues);
  const [errors, setErrors] = useState<SaleFormErrors>({});
  const [member, setMember] = useState<DropdownOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const amount =
    Number(values.area) > 0 && Number(values.rate) > 0
      ? (Number(values.area) * Number(values.rate)).toFixed(2)
      : "";

  const update = (field: keyof SaleFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const fetchMembers = async (query: string): Promise<DropdownOption[]> => {
    const { data } = await api.get<{ members: SponsorOption[] }>("/members", {
      params: { forSponsor: "true", search: query },
    });
    return data.members.map((m) => ({ id: m.id, label: `${m.memberCode} - ${m.name}` }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const formValues = { ...values, memberId: member?.id ?? "" };
    const validationErrors = validateSaleForm(formValues);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api.post("/sales", {
        memberId: formValues.memberId,
        plotReference: values.plotReference,
        area: Number(values.area),
        rate: Number(values.rate),
        saleDate: values.saleDate,
      });
      toast("Sale recorded successfully.", "success");
      setValues(initialValues);
      setMember(null);
      setErrors({});
    } catch (err) {
      toast("Failed to record sale. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Admin Panel" navItems={adminNavItems}>
      <div className="mb-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
          Sales / Record
        </p>
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">Record a Sale</h1>
        <p className="mt-1 text-sm text-charcoal/60">
          Add a plot sale and associate it with the responsible member.
        </p>
      </div>
      <Card className="!overflow-hidden !p-0 sm:!p-0">
        <form onSubmit={handleSubmit} noValidate>
          <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-8">
            <h2 className="text-sm font-semibold text-navy">Sale details</h2>
            <p className="mt-1 text-xs text-charcoal/55">
              Enter the plot and transaction information.
            </p>
          </div>
          <div className="grid gap-5 p-5 sm:p-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(17rem,0.7fr)]">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-navy">Transaction information</h3>
                <p className="mt-0.5 text-xs text-charcoal/55">
                  Select the member and enter the plot measurements.
                </p>
              </div>
              <SearchableDropdown
                label="Member"
                placeholder="Search member by name or code"
                fetchOptions={fetchMembers}
                value={member}
                onSelect={setMember}
                error={errors.memberId}
              />
              <FormField
                label="Plot Reference"
                value={values.plotReference}
                error={errors.plotReference}
                onChange={(e) => update("plotReference", e.target.value)}
              />
              <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
                <FormField
                  label="Area (sq. ft.)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={values.area}
                  error={errors.area}
                  onChange={(e) => update("area", e.target.value)}
                />
                <FormField
                  label="Rate (per sq. ft.)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={values.rate}
                  error={errors.rate}
                  onChange={(e) => update("rate", e.target.value)}
                />
              </div>
              <FormField
                label="Sale Date"
                type="date"
                value={values.saleDate}
                error={errors.saleDate}
                onChange={(e) => update("saleDate", e.target.value)}
              />
            </section>

            <aside className="flex flex-col rounded-2xl bg-navy p-5 text-white sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
                  Sale amount
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight">
                  {amount
                    ? Number(amount).toLocaleString("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 2,
                      })
                    : "₹0.00"}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-white/65">
                  Calculated automatically from area × rate.
                </p>
              </div>
              <div className="mt-5 border-t border-white/15 pt-4">
                <p className="text-xs font-medium text-white/70">Calculated amount</p>
                <output className="mt-1 block rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white">
                  {amount || "Enter area and rate"}
                </output>
                <p className="mt-1 text-xs text-white/55">
                  Amount is saved from the entered area and rate.
                </p>
              </div>
              <div className="mt-auto pt-3">
                <Button type="submit" disabled={submitting} className="w-full !bg-gold hover:!bg-gold/90">
                  {submitting ? "Saving..." : "Record Sale"}
                </Button>
              </div>
            </aside>
          </div>
        </form>
      </Card>
    </DashboardLayout>
  );
}
