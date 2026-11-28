import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
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

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    memberId: string;
    userId: string;
    tempPassword: string;
    photoUploadError?: string;
    delivery: { email: "sent" | "failed" | "skipped"; whatsapp: "sent" | "failed" | "skipped" };
  } | null>(null);

  useEffect(() => {
    api.get<{ ranks: Rank[] }>("/ranks").then(({ data }) => setRanks(data.ranks));
  }, []);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(photo);
    setPhotoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [photo]);

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
    return data.members.map((s) => ({ id: s.id, label: `${s.memberCode} - ${s.name}` }));
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedPhoto = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!selectedPhoto) return;

    if (!ACCEPTED_PHOTO_TYPES.has(selectedPhoto.type)) {
      setPhotoError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (selectedPhoto.size > MAX_PHOTO_SIZE) {
      setPhotoError("Photo must be 5 MB or smaller.");
      return;
    }

    setPhotoError("");
    setPhoto(selectedPhoto);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (photoError) return;
    const validationErrors = validateMemberForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const { data } = await api.post<{
        member: { id: string };
        credentials: { userId: string; tempPassword: string };
        delivery: {
          email: "sent" | "failed" | "skipped";
          whatsapp: "sent" | "failed" | "skipped";
        };
      }>("/members", {
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
      let photoUploadError: string | undefined;
      if (photo) {
        try {
          await api.post(`/members/${data.member.id}/photo`, photo, {
            headers: { "Content-Type": photo.type },
          });
        } catch (uploadError) {
          const response = axios.isAxiosError<{ message?: string }>(uploadError)
            ? uploadError.response?.data
            : undefined;
          photoUploadError =
            response?.message ?? "The associate was created, but the photo upload failed.";
        }
      }
      setResult({
        memberId: data.member.id,
        userId: data.credentials.userId,
        tempPassword: data.credentials.tempPassword,
        photoUploadError,
        delivery: data.delivery,
      });
    } catch (err) {
      const response = axios.isAxiosError<{ message?: string; code?: string }>(err)
        ? err.response?.data
        : undefined;
      if (response?.code === "RANK_HIERARCHY") {
        setErrors((prev) => ({ ...prev, rankId: response.message }));
        return;
      }
      const message = response?.message;
      toast(message ?? "Failed to create associate. Please check the details and try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setValues(initialValues);
    setSponsor(null);
    setPhoto(null);
    setPhotoError("");
    setErrors({});
    setResult(null);
  };

  return (
    <DashboardLayout title="Admin Panel" navItems={adminNavItems}>
      <div className="mb-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
          Associates / Registration
        </p>
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">Add Associate</h1>
        <p className="mt-1 text-sm text-charcoal/60">
          Enter the associate’s personal information, program details, and nominee.
        </p>
      </div>
      <Card className="!overflow-hidden !p-0 sm:!p-0">
        <form onSubmit={handleSubmit} noValidate>
          <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-8">
            <h2 className="text-sm font-semibold text-navy">Associate registration</h2>
            <p className="mt-1 text-xs text-charcoal/55">
              Complete each section before creating the account.
            </p>
          </div>

          <div className="grid gap-5 p-5 sm:p-8 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-xs font-bold text-gold">
                  01
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-navy">Personal information</h3>
                  <p className="mt-0.5 text-xs text-charcoal/55">Contact and identity details</p>
                </div>
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
                <div className="mb-4 sm:col-span-2">
                  <label
                    htmlFor="associate-photo"
                    className="mb-1.5 block text-sm font-medium text-charcoal"
                  >
                    Profile photo <span className="font-normal text-charcoal/55">(optional)</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-navy text-lg font-semibold text-white">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Selected associate profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        values.name
                          .trim()
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase() || "A"
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="associate-photo"
                        className="inline-flex cursor-pointer items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-navy transition hover:border-gold hover:bg-gold/5"
                      >
                        {photo ? "Choose a different photo" : "Choose photo"}
                      </label>
                      <input
                        id="associate-photo"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={submitting}
                        onChange={handlePhotoChange}
                      />
                      <p className="mt-1 text-xs text-charcoal/55">
                        JPEG, PNG, or WebP; maximum 5 MB.
                      </p>
                    </div>
                    {photo && (
                      <button
                        type="button"
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                        disabled={submitting}
                        onClick={() => {
                          setPhoto(null);
                          setPhotoError("");
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {photoError && (
                    <p role="alert" className="mt-1 text-xs text-red-600">
                      {photoError}
                    </p>
                  )}
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
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-700">
                    02
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-navy">Membership setup</h3>
                    <p className="mt-0.5 text-xs text-charcoal/55">Sponsor and booking information</p>
                  </div>
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
                    <label htmlFor="member-rank" className="mb-1 block text-sm font-medium text-charcoal">
                      Rank
                    </label>
                    <select
                      id="member-rank"
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
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700">
                    03
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-navy">Nominee information</h3>
                    <p className="mt-0.5 text-xs text-charcoal/55">Add the nominated contact</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
                  <FormField
                    label="Nominee Name"
                    value={values.nomineeName}
                    error={errors.nomineeName}
                    onChange={(e) => update("nomineeName", e.target.value)}
                  />
                  <div className="mb-4">
                    <label htmlFor="nominee-relationship" className="mb-1 block text-sm font-medium text-charcoal">
                      Relationship with Nominee
                    </label>
                    <select
                      id="nominee-relationship"
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
            <p className="text-xs text-charcoal/55">
              Login credentials are generated after the associate is created.
            </p>
            <Button type="submit" disabled={submitting} className="min-w-40">
              {submitting ? "Creating..." : "Create Associate"}
            </Button>
          </div>
        </form>
      </Card>

      <ConfirmDialog
        open={!!result}
        title="Associate Created Successfully"
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
        <div className="mt-4 space-y-1">
          {result?.photoUploadError && (
            <div role="alert" className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
              <p>{result.photoUploadError}</p>
              <Link
                to={`/admin/members/${result.memberId}`}
                className="mt-1 inline-block font-semibold underline underline-offset-2"
              >
                Open associate profile to upload the photo
              </Link>
            </div>
          )}
          <p>Email delivery: {result?.delivery.email}</p>
          <p>WhatsApp delivery: {result?.delivery.whatsapp}</p>
          {(result?.delivery.email !== "sent" || result?.delivery.whatsapp !== "sent") && (
            <p className="mt-2 text-amber-700">
              One or more messages could not be delivered. Share the temporary credentials
              securely with the associate.
            </p>
          )}
        </div>
      </ConfirmDialog>
    </DashboardLayout>
  );
}
