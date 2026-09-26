import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ConfirmDialog";
import DataTable, { type Column } from "../../components/DataTable";
import { adminNavItems } from "./adminNav";
import { api } from "../../lib/api";
import type { Commission, Member, Sale } from "../../lib/types";
import { formatDate } from "../../lib/format";

const saleColumns: Column<Sale>[] = [
  { key: "plotReference", header: "Plot Reference", render: (s) => s.plotReference },
  { key: "area", header: "Area", render: (s) => s.area },
  { key: "amount", header: "Amount", render: (s) => Number(s.amount).toLocaleString("en-IN") },
  { key: "saleDate", header: "Sale Date", render: (s) => formatDate(s.saleDate) },
];

const commissionColumns: Column<Commission>[] = [
  {
    key: "sourceMember",
    header: "New Member",
    render: (c) => `${c.sourceMember.name} (${c.sourceMember.memberCode})`,
  },
  {
    key: "bookingAmount",
    header: "Booking Amount",
    render: (c) => Number(c.bookingAmount).toLocaleString("en-IN"),
  },
  { key: "percentage", header: "Commission %", render: (c) => `${c.percentage}%` },
  {
    key: "amount",
    header: "Commission Amount",
    render: (c) => Number(c.amount).toLocaleString("en-IN"),
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
  const [totalCommission, setTotalCommission] = useState(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetCredentials, setResetCredentials] = useState<{ userId: string; tempPassword: string } | null>(
    null
  );

  const loadMember = () => {
    if (!id) return;
    setLoading(true);
    api
      .get<{ member: Member }>(`/members/${id}`)
      .then(({ data }) => setMember(data.member))
      .catch(() => setError("Unable to load member details."))
      .finally(() => setLoading(false));
  };

  useEffect(loadMember, [id]);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ commissions: Commission[]; totalAmount: string }>("/commissions", { params: { memberId: id } })
      .then(({ data }) => {
        setCommissions(data.commissions);
        setTotalCommission(Number(data.totalAmount));
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
        err?.response?.data?.message ?? "Failed to delete member."
      );
      setShowDeleteConfirm(false);
    }
  };

  const handleResetPassword = async () => {
    if (!id) return;
    try {
      const { data } = await api.post<{ credentials: { userId: string; tempPassword: string } }>(
        `/members/${id}/reset-password`
      );
      setShowResetConfirm(false);
      setResetCredentials(data.credentials);
    } catch {
      setShowResetConfirm(false);
    }
  };

  return (
    <DashboardLayout title="Admin Panel" navItems={adminNavItems}>
      <h1 className="mb-6 text-2xl font-bold text-navy">Member Detail</h1>
      {loading && <p className="text-charcoal/60">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {deleteError && <p className="mb-4 text-red-600">{deleteError}</p>}
      {member && (
        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-navy">{member.name}</h2>
                <Badge tone={member.status === "active" ? "success" : "neutral"}>
                  {member.status}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => navigate(`/admin/members/${id}/edit`)}>
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
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div><dt className="text-charcoal/50">Member Code</dt><dd>{member.memberCode}</dd></div>
              <div><dt className="text-charcoal/50">Phone</dt><dd>{member.phone ?? "-"}</dd></div>
              <div><dt className="text-charcoal/50">Email</dt><dd>{member.email ?? "-"}</dd></div>
              <div><dt className="text-charcoal/50">Rank</dt><dd>{member.rank?.name ?? "-"}</dd></div>
              <div>
                <dt className="text-charcoal/50">Sponsor</dt>
                <dd>
                  {member.sponsor
                    ? `${member.sponsor.name} (${member.sponsor.memberCode})`
                    : "-"}
                </dd>
              </div>
              <div><dt className="text-charcoal/50">Booking Amount</dt><dd>{Number(member.bookingAmount).toLocaleString("en-IN")}</dd></div>
              <div><dt className="text-charcoal/50">Aadhaar</dt><dd>{member.aadhaarNumber}</dd></div>
              <div><dt className="text-charcoal/50">PAN</dt><dd>{member.panNumber}</dd></div>
              <div><dt className="text-charcoal/50">Address</dt><dd>{member.address ?? "-"}</dd></div>
              <div><dt className="text-charcoal/50">Date of Birth</dt><dd>{formatDate(member.dateOfBirth)}</dd></div>
              <div><dt className="text-charcoal/50">Nominee</dt><dd>{member.nomineeName ?? "-"}</dd></div>
              <div><dt className="text-charcoal/50">Relationship</dt><dd>{member.relationship ?? "-"}</dd></div>
              <div><dt className="text-charcoal/50">Joined</dt><dd>{formatDate(member.createdAt)}</dd></div>
            </dl>
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-semibold text-navy">Sales History</h3>
            <DataTable
              columns={saleColumns}
              rows={member.sales ?? []}
              rowKey={(s) => s.id}
              emptyMessage="No sales recorded for this member."
            />
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-navy">Commissions Earned (as Sponsor)</h3>
              <span className="text-xl font-bold text-navy">
                {totalCommission.toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            <DataTable
              columns={commissionColumns}
              rows={commissions}
              rowKey={(c) => c.id}
              emptyMessage="No commissions earned by this member."
            />
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Member"
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
            <p>Share these new login credentials with the member:</p>
            <p>
              <strong>User ID:</strong> {resetCredentials.userId}
            </p>
            <p>
              <strong>Temporary Password:</strong> {resetCredentials.tempPassword}
            </p>
          </div>
        )}
      </ConfirmDialog>
    </DashboardLayout>
  );
}
