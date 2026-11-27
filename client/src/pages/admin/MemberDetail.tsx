import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ConfirmDialog";
import DataTable, { type Column } from "../../components/DataTable";
import { adminNavItems } from "./adminNav";
import { api } from "../../lib/api";
import type { Commission, Member, Sale } from "../../lib/types";
import { formatDate } from "../../lib/format";

function formatINR(amount: number | string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

function MemberInfoField({
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

const saleColumns: Column<Sale>[] = [
  { key: "plotReference", header: "Plot Reference", render: (s) => s.plotReference },
  { key: "area", header: "Area", render: (s) => s.area },
  { key: "rate", header: "Rate / sq. ft.", render: (s) => Number(s.rate).toLocaleString("en-IN") },
  { key: "amount", header: "Amount", render: (s) => Number(s.amount).toLocaleString("en-IN") },
  { key: "saleDate", header: "Sale Date", render: (s) => formatDate(s.saleDate) },
];

const commissionColumns: Column<Commission>[] = [
  {
    key: "sourceMember",
    header: "Source Associate",
    render: (c) => `${c.sourceMember.name} (${c.sourceMember.memberCode})`,
  },
  {
    key: "type",
    header: "Commission Type",
    render: (c) => (c.type === "JOINING" ? "Joining" : "Sale"),
  },
  {
    key: "baseAmount",
    header: "Commission Base Amount",
    render: (c) => formatINR(c.baseAmount),
  },
  { key: "percentage", header: "Commission %", render: (c) => `${c.percentage}%` },
  {
    key: "amount",
    header: "Gross Commission",
    render: (c) => formatINR(c.amount),
  },
  {
    key: "tdsAmount",
    header: "TDS (5%)",
    render: (c) => formatINR(c.tdsAmount),
  },
  {
    key: "netAmount",
    header: "Net Payable",
    render: (c) => formatINR(c.netAmount),
  },
  { key: "createdAt", header: "Date", render: (c) => formatDate(c.createdAt) },
];

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [commissionTotals, setCommissionTotals] = useState({ gross: 0, tds: 0, net: 0 });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetCredentials, setResetCredentials] = useState<{
    userId: string;
    tempPassword: string;
    delivery: {
      email: "sent" | "failed" | "skipped";
      whatsapp: "sent" | "failed" | "skipped";
    };
  } | null>(null);

  const loadMember = () => {
    if (!id) return;
    setLoading(true);
    api
      .get<{ member: Member }>(`/members/${id}`)
      .then(({ data }) => setMember(data.member))
      .catch(() => setError("Unable to load associate details."))
      .finally(() => setLoading(false));
  };

  useEffect(loadMember, [id]);

  useEffect(() => {
    if (!id) return;
    api
      .get<{
        commissions: Commission[];
        totalGrossAmount: string;
        totalTdsAmount: string;
        totalNetAmount: string;
      }>("/commissions", { params: { memberId: id } })
      .then(({ data }) => {
        setCommissions(data.commissions);
        setCommissionTotals({
          gross: Number(data.totalGrossAmount),
          tds: Number(data.totalTdsAmount),
          net: Number(data.totalNetAmount),
        });
      })
      .catch(() => {});
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleteError("");
    try {
      await api.delete(`/members/${id}`);
      navigate("/admin/members");
    } catch (err: any) {
      setDeleteError(
        err?.response?.data?.message ?? "Failed to delete associate."
      );
      setShowDeleteConfirm(false);
    }
  };

  const handleResetPassword = async () => {
    if (!id) return;
    try {
      const { data } = await api.post<{
        credentials: { userId: string; tempPassword: string };
        delivery: {
          email: "sent" | "failed" | "skipped";
          whatsapp: "sent" | "failed" | "skipped";
        };
      }>(`/members/${id}/reset-password`);
      setShowResetConfirm(false);
      setResetCredentials({ ...data.credentials, delivery: data.delivery });
    } catch {
      setShowResetConfirm(false);
    }
  };

  const memberInitials = member
    ? member.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "M"
    : "";

  return (
    <DashboardLayout title="Admin Panel" navItems={adminNavItems}>
      <div className="mb-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
          Associates / Profile
        </p>
        <h1 className="text-2xl font-bold text-navy">Associate details</h1>
        <p className="mt-1 text-sm text-charcoal/60">
          Associate information, sales activity, and sponsor commissions.
        </p>
      </div>
      {loading && <p className="text-charcoal/60">Loading...</p>}
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {deleteError && (
        <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteError}
        </p>
      )}
      {member && (
        <div className="space-y-6">
          <Card className="!overflow-hidden !p-0 sm:!p-0">
            <div className="relative overflow-hidden bg-gradient-to-br from-navy via-charcoal to-gold px-5 py-6 text-white sm:px-7 sm:py-7">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-4 -top-16 h-48 w-48 rounded-full border border-white/10"
              />
              <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-xl font-bold tracking-wide text-white shadow-soft backdrop-blur-sm">
                    {memberInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-light">
                      Associate profile
                    </p>
                    <h2 className="truncate text-xl font-semibold sm:text-2xl">{member.name}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs text-white/85">
                        {member.memberCode}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-white">
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 rounded-full ${
                            member.status.toUpperCase() === "ACTIVE"
                              ? "bg-emerald-400"
                              : "bg-amber-300"
                          }`}
                        />
                        {member.status}
                      </span>
                      <span className="rounded-full border border-gold-light/30 bg-gold-light/15 px-2.5 py-1 text-xs font-medium text-white">
                        {member.rank?.name ?? "Associate"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="!border-white/40 !text-white hover:!bg-white hover:!text-navy"
                    onClick={() => navigate(`/admin/members/${id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button variant="secondary" onClick={() => setShowResetConfirm(true)}>
                    Reset Password
                  </Button>
                  <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-5 sm:p-7">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-navy">Membership details</h3>
                <p className="mt-0.5 text-xs text-charcoal/55">
                  Contact, booking, and nominee information
                </p>
              </div>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                <MemberInfoField label="Email" value={member.email ?? "-"} />
                <MemberInfoField label="Phone" value={member.phone ?? "-"} />
                <MemberInfoField label="Sponsor" value={member.sponsor
                  ? `${member.sponsor.name} (${member.sponsor.memberCode})`
                  : "-"} />
                <MemberInfoField
                  label="Booking amount"
                  value={formatINR(member.bookingAmount)}
                />
                <MemberInfoField label="Aadhaar" value={member.aadhaarNumber} />
                <MemberInfoField label="PAN" value={member.panNumber} />
                <MemberInfoField label="Date of birth" value={formatDate(member.dateOfBirth)} />
                <MemberInfoField label="Nominee" value={member.nomineeName ?? "-"} />
                <MemberInfoField label="Relationship" value={member.relationship ?? "-"} />
                <MemberInfoField label="Joined" value={formatDate(member.createdAt)} />
                <MemberInfoField
                  label="Address"
                  value={member.address ?? "-"}
                  className="sm:col-span-2 xl:col-span-3 2xl:col-span-4"
                />
              </dl>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-navy">Sales history</h3>
                <p className="mt-1 text-xs text-charcoal/55">
                  Sales attributed to this associate
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-charcoal/65">
                {member.sales?.length ?? 0} records
              </span>
            </div>
            <DataTable
              columns={saleColumns}
              rows={member.sales ?? []}
              rowKey={(s) => s.id}
              emptyMessage="No sales recorded for this associate."
            />
          </Card>

          <Card>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-navy">Sponsor commissions</h3>
                <p className="mt-1 text-xs text-charcoal/55">
                  Earnings generated from sponsored associates
                </p>
              </div>
              <span className="rounded-full bg-gold/10 px-2.5 py-1 text-xs font-medium text-navy">
                {commissions.length} records
              </span>
            </div>
            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/55">
                  Gross commission
                </p>
                <p className="mt-1.5 text-lg font-bold text-navy">{formatINR(commissionTotals.gross)}</p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/70">
                  TDS deducted
                </p>
                <p className="mt-1.5 text-lg font-bold text-amber-900">{formatINR(commissionTotals.tds)}</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/70">
                  Net payable
                </p>
                <p className="mt-1.5 text-lg font-bold text-emerald-900">{formatINR(commissionTotals.net)}</p>
              </div>
            </div>
            <DataTable
              columns={commissionColumns}
              rows={commissions}
              rowKey={(c) => c.id}
              emptyMessage="No commissions earned by this associate."
            />
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Associate"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setShowDeleteConfirm(false)}
      >
        Are you sure you want to delete {member?.name}? This action cannot be undone.
      </ConfirmDialog>

      <ConfirmDialog
        open={showResetConfirm}
        title="Reset Password"
        confirmLabel="Reset"
        onConfirm={handleResetPassword}
        onClose={() => setShowResetConfirm(false)}
      >
        This will generate a new temporary password for {member?.name} and require them to change it
        on next login. Continue?
      </ConfirmDialog>

      <ConfirmDialog
        open={resetCredentials !== null}
        title="Password Reset Successfully"
        confirmLabel="Done"
        hideCancel
        onConfirm={() => setResetCredentials(null)}
      >
        {resetCredentials && (
          <div className="space-y-2">
            <p>New login credentials and delivery results:</p>
            <p>
              <strong>User ID:</strong> {resetCredentials.userId}
            </p>
            <p>
              <strong>Temporary Password:</strong> {resetCredentials.tempPassword}
            </p>
            <p>Email delivery: {resetCredentials.delivery.email}</p>
            <p>WhatsApp delivery: {resetCredentials.delivery.whatsapp}</p>
            {(resetCredentials.delivery.email !== "sent" ||
              resetCredentials.delivery.whatsapp !== "sent") && (
              <p className="mt-2 text-amber-700">
                One or more messages could not be delivered. Share the temporary credentials
                securely with the associate.
              </p>
            )}
          </div>
        )}
      </ConfirmDialog>
    </DashboardLayout>
  );
}
