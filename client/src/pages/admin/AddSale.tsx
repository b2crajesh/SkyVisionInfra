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
      <h1 className="mb-6 text-2xl font-bold text-navy">Add Sale</h1>
      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} noValidate>
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
          <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
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
            label="Amount"
            value={amount}
            readOnly
            hint="Calculated automatically as area × rate."
          />
          <FormField
            label="Sale Date"
            type="date"
            value={values.saleDate}
            error={errors.saleDate}
            onChange={(e) => update("saleDate", e.target.value)}
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Record Sale"}
          </Button>
        </form>
      </Card>
    </DashboardLayout>
  );
}
