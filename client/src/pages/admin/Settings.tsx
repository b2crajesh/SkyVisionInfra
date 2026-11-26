import DashboardLayout from "../../components/DashboardLayout";
import Card from "../../components/ui/Card";
import ChangePasswordCard from "../../components/ChangePasswordCard";
import { adminNavItems } from "./adminNav";
import { useAuth } from "../../lib/auth-context";

export default function Settings() {
  const { user } = useAuth();

  return (
    <DashboardLayout title="Admin Panel" navItems={adminNavItems}>
      <div className="mb-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
          Account security
        </p>
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-charcoal/60">
          Manage your administrator account and password.
        </p>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(20rem,1fr)]">
        <Card className="h-full">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-sm font-bold text-gold">
              A
            </div>
            <div>
              <h2 className="text-lg font-semibold text-navy">Administrator profile</h2>
              <p className="mt-0.5 text-sm text-charcoal/55">Signed-in account details</p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">User ID</p>
            <p className="mt-1 break-all text-sm font-semibold text-navy">
              {user?.userId || "Unavailable"}
            </p>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-charcoal/55">
            Keep your login credentials private. Administrators should use a unique password that is not shared with other accounts.
          </p>
        </Card>

        <ChangePasswordCard />
      </div>
    </DashboardLayout>
  );
}
