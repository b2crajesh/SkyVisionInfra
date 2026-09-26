import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import type { Role } from "../lib/types";
import ChangePasswordCard from "./ChangePasswordCard";

export default function ProtectedRoute({
  children,
  role,
}: {
  children: ReactNode;
  role: Role;
}) {
  const { user, loading, refresh } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-charcoal/60">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== role) {
    const fallback = user.role === "admin" ? "/admin" : "/member";
    return <Navigate to={fallback} replace />;
  }

  if (user.mustChangePassword) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <ChangePasswordCard forced onSuccess={() => void refresh()} />
      </div>
    );
  }

  return <>{children}</>;
}
