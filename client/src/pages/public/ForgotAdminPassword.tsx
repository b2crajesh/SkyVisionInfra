import { useState, type FormEvent } from "react";
import PublicLayout from "../../components/PublicLayout";
import Card from "../../components/ui/Card";
import FormField from "../../components/FormField";
import Button from "../../components/ui/Button";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

export default function ForgotAdminPassword() {
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const { data } = await api.post<{ message: string }>(
        "/auth/admin/password-recovery",
        { userId }
      );
      setMessage(data.message);
    } catch {
      setError("Unable to process the request right now. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <section className="mx-auto flex max-w-md flex-col justify-center px-4 py-20 sm:px-6">
        <Card>
          <h1 className="mb-2 text-2xl font-bold text-navy">Recover Admin Password</h1>
          <p className="mb-6 text-sm text-charcoal/60">
            Enter your admin user ID. If the account is eligible, a one-time reset link will be
            sent to the configured admin recovery email.
          </p>
          <form onSubmit={handleSubmit} noValidate>
            <FormField
              label="Admin User ID"
              value={userId}
              autoComplete="username"
              onChange={(event) => setUserId(event.target.value)}
            />
            {message && <p className="mb-4 text-sm text-green-700">{message}</p>}
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting || !userId.trim()}>
              {submitting ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            <Link to="/login" className="text-gold hover:underline">
              Back to sign in
            </Link>
          </p>
        </Card>
      </section>
    </PublicLayout>
  );
}
