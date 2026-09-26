import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import PublicLayout from "../../components/PublicLayout";
import Card from "../../components/ui/Card";
import FormField from "../../components/FormField";
import Button from "../../components/ui/Button";
import { useAuth } from "../../lib/auth-context";
import type { Role } from "../../lib/types";

interface LocationState {
  from?: { pathname: string };
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(userId, password);
      const state = location.state as LocationState | null;
      const redirectPath = state?.from?.pathname;
      const defaultPath: Record<Role, string> = {
        admin: "/admin",
        member: "/member",
      };
      navigate(redirectPath ?? defaultPath[user.role], { replace: true });
    } catch (err) {
      setError("Invalid user ID or password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <section className="mx-auto flex max-w-md flex-col justify-center px-4 py-20 sm:px-6">
        <Card>
          <h1 className="mb-1 text-2xl font-bold text-navy">Member & Admin Login</h1>
          <p className="mb-6 text-sm text-charcoal/60">
            Sign in with the credentials provided by our admin team.
          </p>
          <form onSubmit={handleSubmit} noValidate>
            <FormField
              label="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              autoComplete="username"
            />
            <FormField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-charcoal/50">
            Trouble logging in? <Link to="/contact" className="text-gold hover:underline">Contact support</Link>.
          </p>
        </Card>
      </section>
    </PublicLayout>
  );
}
