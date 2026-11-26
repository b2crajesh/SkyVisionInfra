import { useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import Card from "./ui/Card";
import FormField from "./FormField";
import Button from "./ui/Button";
import { api } from "../lib/api";
import { useToast } from "./ToastProvider";

export default function ChangePasswordCard({
  onSuccess,
  forced,
}: {
  onSuccess?: () => void;
  forced?: boolean;
}) {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast("New password must be at least 8 characters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast("New password and confirmation do not match.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      toast("Password updated successfully.", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess?.();
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data as { message?: string } | undefined)?.message
          : undefined;
      toast(message ?? "Unable to update password.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="h-full max-w-lg">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
          >
            <path
              d="M12 3 19 6v5c0 4.5-2.9 8-7 10-4.1-2-7-5.5-7-10V6l7-3Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="m9 12 2 2 4-4"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-navy">Change Password</h2>
          <p className="mt-1 text-sm text-charcoal/60">
            Choose a strong password to protect your account.
          </p>
        </div>
      </div>
      {forced && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          You must change your temporary password before continuing.
        </p>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Current Password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <FormField
          label="New Password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <FormField
          label="Confirm New Password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <p className="-mt-1 mb-4 text-xs text-charcoal/55">
          Use at least 8 characters. Your new password must match the confirmation.
        </p>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </Card>
  );
}
