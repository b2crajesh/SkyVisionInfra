import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import Card from "../../components/ui/Card";
import { adminNavItems } from "./adminNav";
import { api } from "../../lib/api";
import type { DashboardSummary } from "../../lib/types";

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<DashboardSummary>("/dashboard/summary");
        setSummary(data);
      } catch {
        setError("Unable to load dashboard summary.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <DashboardLayout title="Admin Panel" navItems={adminNavItems}>
      <h1 className="mb-6 text-2xl font-bold text-navy">Dashboard</h1>

      {loading && <p className="text-charcoal/60">Loading summary...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {summary && (
        <>
          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Card>
              <p className="text-sm text-charcoal/60">Total Members</p>
              <p className="mt-2 text-3xl font-bold text-navy">{summary.totalMembers}</p>
            </Card>
            <Card>
              <p className="text-sm text-charcoal/60">Total Sales</p>
              <p className="mt-2 text-3xl font-bold text-navy">{summary.totalSalesCount}</p>
            </Card>
            <Card>
              <p className="text-sm text-charcoal/60">Total Sales Amount</p>
              <p className="mt-2 text-3xl font-bold text-navy">
                {Number(summary.totalSalesAmount).toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                })}
              </p>
            </Card>
          </div>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-navy">Recent Members</h2>
            <div className="space-y-3">
              {summary.recentMembers.length === 0 && (
                <p className="text-sm text-charcoal/50">No recent members.</p>
              )}
              {summary.recentMembers.map((m) => (
                <Link
                  key={m.id}
                  to={`/admin/members/${m.id}`}
                  className="flex items-center justify-between rounded-md border border-black/5 px-4 py-3 hover:bg-lightbg"
                >
                  <span className="font-medium text-navy">{m.name}</span>
                  <span className="text-xs text-charcoal/50">{m.memberCode}</span>
                </Link>
              ))}
            </div>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
