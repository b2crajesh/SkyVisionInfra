import DashboardLayout from "../../components/DashboardLayout";
import Card from "../../components/ui/Card";
import ChangePasswordCard from "../../components/ChangePasswordCard";
import { adminNavItems } from "./adminNav";
import { useAuth } from "../../lib/auth-context";

export default function Settings() {
  const { user } = useAuth();

  return (
    <DashboardLayout title="Admin Panel" navItems={adminNavItems}>
      <h1 className="mb-6 text-2xl font-bold text-navy">Settings</h1>
      <div className="space-y-6">
        <Card className="max-w-lg">
          <h2 className="mb-4 text-lg font-semibold text-navy">Profile</h2>
          <p className="text-sm text-charcoal/70">
            User ID: <span className="font-medium">{user?.userId}</span>
          </p>
        </Card>

        <ChangePasswordCard />
      </div>
    </DashboardLayout>
  );
}
