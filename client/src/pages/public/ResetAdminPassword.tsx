import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PublicLayout from "../../components/PublicLayout";
import Card from "../../components/ui/Card";
import FormField from "../../components/FormField";
import Button from "../../components/ui/Button";
import { api } from "../../lib/api";

export default function ResetAdminPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("This password reset link is invalid or expired.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/admin/reset-password", { token, newPassword });
      setSuccess(true);
      window.setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch (requestError) {
      const message = isAxiosError<{ message?: string }>(requestError)
        ? requestError.response?.data?.message
        : undefined;
      setError(message ?? "Unable to reset the password. Please request a new reset link.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <section className="mx-auto flex max-w-md flex-col justify-center px-4 py-20 sm:px-6">
        <Card>
          <h1 className="mb-2 text-2xl font-bold text-navy">Set New Admin Password</h1>
          {success ? (
            <div>
              <p className="text-sm text-green-700">
                Password updated. Redirecting you to sign in...
              </p>
              <Link to="/login" className="mt-4 inline-block text-sm text-gold hover:underline">
                Sign in now
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm text-charcoal/60">
                Choose a new password of at least 12 characters.
              </p>
              <form onSubmit={handleSubmit} noValidate>
                <FormField
                  label="New Password"
                  type="password"
                  value={newPassword}
                  autoComplete="new-password"
                  onChange={(event) => setNewPassword(event.target.value)}
                />
                <FormField
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  autoComplete="new-password"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
                {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </>
          )}
        </Card>
      </section>
    </PublicLayout>
  );
}
