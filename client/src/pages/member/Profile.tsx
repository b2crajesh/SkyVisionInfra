import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Card from "../../components/ui/Card";
import ChangePasswordCard from "../../components/ChangePasswordCard";
import { memberNavItems } from "./memberNav";
import { api } from "../../lib/api";
import type { Member } from "../../lib/types";
import { formatDate } from "../../lib/format";

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
      <h1 className="mb-6 text-2xl font-bold text-navy">My Profile</h1>
      {loading && <p className="text-charcoal/60">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {member && (
        <Card className="max-w-2xl">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div><dt className="text-charcoal/50">Member Code</dt><dd>{member.memberCode}</dd></div>
            <div><dt className="text-charcoal/50">Name</dt><dd>{member.name}</dd></div>
            <div><dt className="text-charcoal/50">Email</dt><dd>{member.email ?? "-"}</dd></div>
            <div><dt className="text-charcoal/50">Phone</dt><dd>{member.phone ?? "-"}</dd></div>
            <div><dt className="text-charcoal/50">Rank</dt><dd>{member.rank?.name ?? "-"}</dd></div>
            <div>
              <dt className="text-charcoal/50">Sponsor</dt>
              <dd>
                {member.sponsor
                  ? `${member.sponsor.name} (${member.sponsor.memberCode})`
                  : "-"}
              </dd>
            </div>
            <div><dt className="text-charcoal/50">Aadhaar</dt><dd>{member.aadhaarNumber}</dd></div>
            <div><dt className="text-charcoal/50">PAN</dt><dd>{member.panNumber}</dd></div>
            <div><dt className="text-charcoal/50">Address</dt><dd>{member.address ?? "-"}</dd></div>
            <div><dt className="text-charcoal/50">Date of Birth</dt><dd>{formatDate(member.dateOfBirth)}</dd></div>
            <div><dt className="text-charcoal/50">Nominee</dt><dd>{member.nomineeName ?? "-"}</dd></div>
            <div><dt className="text-charcoal/50">Relationship</dt><dd>{member.relationship ?? "-"}</dd></div>
            <div><dt className="text-charcoal/50">Status</dt><dd>{member.status}</dd></div>
            <div><dt className="text-charcoal/50">Member Since</dt><dd>{formatDate(member.createdAt)}</dd></div>
          </dl>
        </Card>
      )}

      <div className="mt-6">
        <ChangePasswordCard />
      </div>
    </DashboardLayout>
  );
}
