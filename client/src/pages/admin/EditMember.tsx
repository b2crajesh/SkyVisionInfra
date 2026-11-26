import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import type { Member, Rank, SponsorOption } from "../../lib/types";
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

const emptyValues: MemberFormValues = {
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

export default function EditMember() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [values, setValues] = useState<MemberFormValues>(emptyValues);
  const [errors, setErrors] = useState<MemberFormErrors>({});
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [sponsor, setSponsor] = useState<DropdownOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<{ ranks: Rank[] }>("/ranks").then(({ data }) => setRanks(data.ranks));
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<{ member: Member }>(`/members/${id}`)
      .then(({ data }) => {
        const m = data.member;
        setValues({
          name: m.name,
          phone: m.phone ?? "",
          email: m.email ?? "",
          address: m.address ?? "",
          dateOfBirth: m.dateOfBirth ? m.dateOfBirth.slice(0, 10) : "",
          aadhaarNumber: m.aadhaarNumber,
          panNumber: m.panNumber,
          sponsorMemberId: m.sponsor?.id ?? "",
          bookingAmount: String(m.bookingAmount),
          nomineeName: m.nomineeName ?? "",
          relationship: m.relationship ?? "",
          rankId: m.rank?.id ?? "",
        });
        if (m.sponsor) {
          setSponsor({ id: m.sponsor.id, label: `${m.sponsor.memberCode} - ${m.sponsor.name}` });
        }
      })
      .catch(() => toast("Unable to load member details.", "error"))
      .finally(() => setLoading(false));
  }, [id, toast]);

  const update = (field: keyof MemberFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (field === "rankId" || field === "sponsorMemberId") {
      setErrors((prev) => ({ ...prev, rankId: undefined }));
    }
  };

  const fetchSponsors = async (query: string): Promise<DropdownOption[]> => {
    const { data } = await api.get<{ members: SponsorOption[] }>("/members", {
      params: { forSponsor: "true", search: query },
    });
    if (data.members.length === 0) {
      return [{ id: "COMP", label: "Company" }];
    }
    return data.members
      .filter((s) => s.id !== id)
      .map((s) => ({ id: s.id, label: `${s.memberCode} - ${s.name}` }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const validationErrors = validateMemberForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api.patch(`/members/${id}`, {
        name: values.name,
        phone: values.phone,
        email: values.email,
        address: values.address,
        dateOfBirth: values.dateOfBirth,
        aadhaarNumber: values.aadhaarNumber,
        panNumber: values.panNumber.toUpperCase(),
        sponsorMemberId: values.sponsorMemberId === "COMP" ? null : values.sponsorMemberId,
        bookingAmount: Number(values.bookingAmount),
        nomineeName: values.nomineeName,
        relationship: values.relationship,
        rankId: values.rankId,
      });
      toast("Member updated successfully.", "success");
      navigate(`/admin/members/${id}`);
    } catch (err) {
      const response = axios.isAxiosError<{ message?: string; code?: string }>(err)
        ? err.response?.data
        : undefined;
      if (response?.code === "RANK_HIERARCHY") {
        setErrors((prev) => ({ ...prev, rankId: response.message }));
        return;
      }
      const message = response?.message;
      toast(message ?? "Failed to update member. Please check the details and try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Admin Panel" navItems={adminNavItems}>
      <div className="mb-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
          Members / Account
        </p>
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">Edit Member</h1>
        <p className="mt-1 text-sm text-charcoal/60">
          Update contact, membership, and nominee details.
        </p>
      </div>
      {loading ? (
        <Card className="max-w-5xl">
          <div className="animate-pulse space-y-4" aria-label="Loading member details">
            <div className="h-5 w-48 rounded bg-slate-100" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-11 rounded-xl bg-slate-100" />
              <div className="h-11 rounded-xl bg-slate-100" />
              <div className="h-11 rounded-xl bg-slate-100" />
              <div className="h-11 rounded-xl bg-slate-100" />
            </div>
          </div>
        </Card>
      ) : (
        <Card className="!overflow-hidden !p-0 sm:!p-0">
          <form onSubmit={handleSubmit} noValidate>
            <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-8">
              <h2 className="text-sm font-semibold text-navy">Member details</h2>
              <p className="mt-1 text-xs text-charcoal/55">
                Make changes carefully; updated details will be saved to this account.
              </p>
            </div>
            <div className="grid gap-5 p-5 sm:p-8 xl:grid-cols-2">
              <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-navy">Personal information</h3>
                  <p className="mt-0.5 text-xs text-charcoal/55">Contact and identity details</p>
                </div>
                <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
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
                  <div className="sm:col-span-2">
                    <FormField
                      label="Address"
                      value={values.address}
                      error={errors.address}
                      onChange={(e) => update("address", e.target.value)}
                    />
                  </div>
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
              </section>

              <div className="space-y-5">
                <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-navy">Membership setup</h3>
                    <p className="mt-0.5 text-xs text-charcoal/55">Sponsor, rank, and booking amount</p>
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
                  <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
                    <FormField
                      label="Booking Amount"
                      type="number"
                      value={values.bookingAmount}
                      error={errors.bookingAmount}
                      onChange={(e) => update("bookingAmount", e.target.value)}
                    />
                    <div className="mb-4">
                      <label htmlFor="edit-member-rank" className="mb-1 block text-sm font-medium text-charcoal">
                        Rank
                      </label>
                      <select
                        id="edit-member-rank"
                        className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-navy shadow-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20 ${
                          errors.rankId ? "border-red-500" : "border-slate-200"
                        }`}
                        value={values.rankId}
                        onChange={(e) => update("rankId", e.target.value)}
                      >
                        <option value="">Select rank</option>
                        {ranks.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.commissionPercentage}%)
                          </option>
                        ))}
                      </select>
                      {errors.rankId && (
                        <p className="mt-1 text-xs text-red-600">{errors.rankId}</p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-navy">Nominee information</h3>
                    <p className="mt-0.5 text-xs text-charcoal/55">Nominated contact details</p>
                  </div>
                  <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
                    <FormField
                      label="Nominee Name"
                      value={values.nomineeName}
                      error={errors.nomineeName}
                      onChange={(e) => update("nomineeName", e.target.value)}
                    />
                    <div className="mb-4">
                      <label htmlFor="edit-nominee-relationship" className="mb-1 block text-sm font-medium text-charcoal">
                        Relationship with Nominee
                      </label>
                      <select
                        id="edit-nominee-relationship"
                        className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-navy shadow-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20 ${
                          errors.relationship ? "border-red-500" : "border-slate-200"
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
                </section>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <Link
                to={`/admin/members/${id}`}
                className="text-center text-sm font-medium text-charcoal/65 transition hover:text-navy sm:text-left"
              >
                Cancel and return to member
              </Link>
              <Button type="submit" disabled={submitting} className="min-w-40">
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </DashboardLayout>
  );
}
