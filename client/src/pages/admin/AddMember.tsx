import { useEffect, useState, type FormEvent } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Card from "../../components/ui/Card";
import FormField from "../../components/FormField";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ConfirmDialog";
import SearchableDropdown, {
  type DropdownOption,
} from "../../components/SearchableDropdown";
import { adminNavItems } from "./adminNav";
import { api } from "../../lib/api";
import { useToast } from "../../components/ToastProvider";
import type { Rank, SponsorOption } from "../../lib/types";
import {
  validateMemberForm,
  type MemberFormErrors,
  type MemberFormValues,
} from "../../lib/validation";

const RELATIONSHIP_OPTIONS = [
  "SPOUSE",
  "SON",
  "DAUGHTER",
  "FATHER",
  "MOTHER",
  "BROTHER",
  "SISTER",
  "OTHER",
] as const;

const initialValues: MemberFormValues = {
  name: "",
  phone: "",
  email: "",
  address: "",
  dateOfBirth: "",
  aadhaarNumber: "",
  panNumber: "",
  sponsorMemberId: "",
  bookingAmount: "",
  nomineeName: "",
  relationship: "",
  rankId: "",
};

export default function AddMember() {
  const { toast } = useToast();
  const [values, setValues] = useState<MemberFormValues>(initialValues);
  const [errors, setErrors] = useState<MemberFormErrors>({});
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [sponsor, setSponsor] = useState<DropdownOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    userId: string;
    tempPassword: string;
  } | null>(null);

  useEffect(() => {
    api.get<{ ranks: Rank[] }>("/ranks").then(({ data }) => setRanks(data.ranks));
  }, []);

  const update = (field: keyof MemberFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const fetchSponsors = async (query: string): Promise<DropdownOption[]> => {
    const { data } = await api.get<{ members: SponsorOption[] }>("/members", {
      params: { forSponsor: "true", search: query },
    });
    if (data.members.length === 0) {
      return [{ id: "COMP", label: "Company" }];
    }
    return data.members.map((s) => ({ id: s.id, label: `${s.memberCode} - ${s.name}` }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateMemberForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const { data } = await api.post<{
        credentials: { userId: string; tempPassword: string };
      }>("/members", {
        name: values.name,
        phone: values.phone,
        email: values.email,
        address: values.address,
        dateOfBirth: values.dateOfBirth,
        aadhaarNumber: values.aadhaarNumber,
        panNumber: values.panNumber.toUpperCase(),
        sponsorMemberId: values.sponsorMemberId,
        bookingAmount: Number(values.bookingAmount),
        nomineeName: values.nomineeName,
        relationship: values.relationship,
        rankId: values.rankId,
      });
      setResult({ userId: data.credentials.userId, tempPassword: data.credentials.tempPassword });
    } catch (err) {
      toast("Failed to create member. Please check the details and try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setValues(initialValues);
    setSponsor(null);
    setErrors({});
    setResult(null);
  };

  return (
    <DashboardLayout title="Admin Panel" navItems={adminNavItems}>
      <h1 className="mb-6 text-2xl font-bold text-navy">Add Member</h1>
      <Card className="max-w-3xl">
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            <FormField
              label="Full Name"
              value={values.name}
              error={errors.name}
              onChange={(e) => update("name", e.target.value)}
            />
            <FormField
              label="Date of Birth"
              type="date"
              value={values.dateOfBirth}
              error={errors.dateOfBirth}
              onChange={(e) => update("dateOfBirth", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            <FormField
              label="Phone Number"
              value={values.phone}
              error={errors.phone}
              hint="10 digits, no spaces"
              onChange={(e) => update("phone", e.target.value)}
            />
            <FormField
              label="Email Address"
              type="email"
              value={values.email}
              error={errors.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
          <FormField
            label="Address"
            value={values.address}
            error={errors.address}
            onChange={(e) => update("address", e.target.value)}
          />
          <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            <FormField
              label="Aadhaar Number"
              value={values.aadhaarNumber}
              error={errors.aadhaarNumber}
              hint="12 digits, no spaces"
              onChange={(e) => update("aadhaarNumber", e.target.value)}
            />
            <FormField
              label="PAN Number"
              value={values.panNumber}
              error={errors.panNumber}
              hint="Format: ABCDE1234F"
              onChange={(e) => update("panNumber", e.target.value.toUpperCase())}
            />
          </div>

          <SearchableDropdown
            label="Sponsor"
            placeholder="Search sponsor by name or code"
            fetchOptions={fetchSponsors}
            value={sponsor}
            onSelect={(opt) => {
              setSponsor(opt);
              update("sponsorMemberId", opt?.id ?? "");
            }}
            error={errors.sponsorMemberId}
          />

          <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            <FormField
              label="Booking Amount"
              type="number"
              value={values.bookingAmount}
              error={errors.bookingAmount}
              onChange={(e) => update("bookingAmount", e.target.value)}
            />
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-charcoal">
                Rank
              </label>
              <select
                className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy ${
                  errors.rankId ? "border-red-500" : "border-gray-300"
                }`}
                value={values.rankId}
                onChange={(e) => update("rankId", e.target.value)}
              >
                <option value="">Select rank</option>
                {ranks.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              {errors.rankId && (
                <p className="mt-1 text-xs text-red-600">{errors.rankId}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            <FormField
              label="Nominee Name"
              value={values.nomineeName}
              error={errors.nomineeName}
              onChange={(e) => update("nomineeName", e.target.value)}
            />
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-charcoal">
                Relationship with Nominee
              </label>
              <select
                className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy ${
                  errors.relationship ? "border-red-500" : "border-gray-300"
                }`}
                value={values.relationship}
                onChange={(e) => update("relationship", e.target.value)}
              >
                <option value="">Select relationship</option>
                {RELATIONSHIP_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              {errors.relationship && (
                <p className="mt-1 text-xs text-red-600">{errors.relationship}</p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Member"}
          </Button>
        </form>
      </Card>

      <ConfirmDialog
        open={!!result}
        title="Member Created Successfully"
        confirmLabel="Done"
        hideCancel
        onConfirm={resetForm}
      >
        <p className="mb-2">
          Please copy this temporary password now - it will not be shown
          again.
        </p>
        <div className="rounded-md bg-lightbg p-3 font-mono text-sm">
          <p>User ID: {result?.userId}</p>
          <p>Temporary Password: {result?.tempPassword}</p>
        </div>
      </ConfirmDialog>
    </DashboardLayout>
  );
}
