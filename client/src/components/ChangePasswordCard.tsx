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
    <Card className="max-w-lg">
      <h2 className="mb-4 text-lg font-semibold text-navy">Change Password</h2>
      {forced && (
        <p className="mb-4 text-sm text-red-600">
          You must change your temporary password before continuing.
        </p>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Current Password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <FormField
          label="New Password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <FormField
          label="Confirm New Password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </Card>
  );
}
