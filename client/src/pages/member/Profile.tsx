import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Card from "../../components/ui/Card";
import ChangePasswordCard from "../../components/ChangePasswordCard";
import { memberNavItems } from "./memberNav";
import { api } from "../../lib/api";
import type { Member } from "../../lib/types";
import { formatDate } from "../../lib/format";

function ProfileField({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`min-w-0 rounded-xl border border-slate-200/70 bg-slate-50/70 p-3.5 transition-colors hover:border-gold/40 hover:bg-white ${className}`}
    >
      <dt className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-charcoal/55">
        {label}
      </dt>
      <dd className="break-words text-sm font-medium leading-5 text-navy">{value}</dd>
    </div>
  );
}

export default function Profile() {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ member: Member }>("/members/me")
      .then(({ data }) => setMember(data.member))
      .catch(() => setError("Unable to load your profile."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Member Portal" navItems={memberNavItems}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">My Profile</h1>
        <p className="mt-1 text-sm text-charcoal/60">
          Review your membership details and keep your account secure.
        </p>
      </div>
      {loading && <p className="text-charcoal/60">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid items-start gap-6 xl:grid-cols-3">
        {member && (
          <Card className="!overflow-hidden !p-0 sm:!p-0 xl:col-span-2">
            <div className="relative overflow-hidden bg-gradient-to-br from-navy via-charcoal to-gold px-5 py-6 text-white sm:px-7 sm:py-7">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-4 -top-16 h-48 w-48 rounded-full border border-white/10"
              />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-xl font-bold tracking-wide text-white shadow-soft backdrop-blur-sm">
                    {member.name
                      .trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase() || "M"}
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-light">
                      Member profile
                    </p>
                    <h2 className="truncate text-xl font-semibold sm:text-2xl">{member.name}</h2>
                    <p className="mt-1 text-sm text-white/70">
                      Member code <span className="font-medium text-white">{member.memberCode}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 rounded-full ${
                        member.status.toUpperCase() === "ACTIVE"
                          ? "bg-emerald-400"
                          : "bg-amber-300"
                      }`}
                    />
                    {member.status}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-gold-light/30 bg-gold-light/15 px-3 py-1.5 text-xs font-medium text-white">
                    {member.rank?.name ?? "Unranked"}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-5 sm:p-7">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-navy">Personal details</h3>
                <p className="mt-0.5 text-xs text-charcoal/55">
                  Your account and membership information
                </p>
              </div>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <ProfileField label="Email" value={member.email ?? "-"} />
                <ProfileField label="Phone" value={member.phone ?? "-"} />
                <ProfileField
                  label="Sponsor"
                  value={
                    member.sponsor
                      ? `${member.sponsor.name} (${member.sponsor.memberCode})`
                      : "-"
                  }
                />
                <ProfileField label="Aadhaar" value={member.aadhaarNumber} />
                <ProfileField label="PAN" value={member.panNumber} />
                <ProfileField label="Date of Birth" value={formatDate(member.dateOfBirth)} />
                <ProfileField label="Nominee" value={member.nomineeName ?? "-"} />
                <ProfileField label="Relationship" value={member.relationship ?? "-"} />
                <ProfileField label="Member Since" value={formatDate(member.createdAt)} />
                <ProfileField
                  label="Address"
                  value={member.address ?? "-"}
                  className="sm:col-span-2 xl:col-span-3"
                />
              </dl>
            </div>
          </Card>
        )}
        <ChangePasswordCard />
      </div>
    </DashboardLayout>
  );
}
