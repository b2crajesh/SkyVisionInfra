import { useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import Button from "./ui/Button";

interface NavItem {
  to: string;
  label: string;
}

export default function DashboardLayout({
  children,
  title,
  navItems,
}: {
  children: ReactNode;
  title: string;
  navItems: NavItem[];
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navLinks = (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to.endsWith("admin") || item.to.endsWith("member")}
          onClick={() => setMobileNavOpen(false)}
          className={({ isActive }) =>
            `block rounded-xl px-3 py-2 text-sm font-medium ${
              isActive ? "bg-gold text-white" : "text-white/80 hover:bg-white/10"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col bg-lightbg md:flex-row">
      <aside className="hidden w-64 flex-col bg-navy text-white md:flex">
        <div className="flex items-center gap-2 border-b border-white/10 px-6 py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold text-xs font-bold text-white">
            SV
          </span>
          <span className="font-bold">{title}</span>
        </div>
        {navLinks}
        <div className="border-t border-white/10 p-4 text-xs text-white/60">
          Signed in as {user?.userId}
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-[100] flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative flex w-64 flex-col bg-navy text-white">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold text-xs font-bold text-white">
                  SV
                </span>
                <span className="font-bold">{title}</span>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                className="text-white/70 hover:text-white"
                onClick={() => setMobileNavOpen(false)}
              >
                ✕
              </button>
            </div>
            {navLinks}
            <div className="border-t border-white/10 p-4 text-xs text-white/60">
              Signed in as {user?.userId}
            </div>
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-x-hidden">
        <header className="flex items-center justify-between gap-2 bg-white px-4 py-3 shadow-soft md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              className="rounded-md border border-black/10 p-2 text-navy md:hidden"
              onClick={() => setMobileNavOpen(true)}
            >
              <span className="block h-0.5 w-5 bg-navy" />
              <span className="mt-1 block h-0.5 w-5 bg-navy" />
              <span className="mt-1 block h-0.5 w-5 bg-navy" />
            </button>
            <Link to="/" className="text-sm font-medium text-navy hover:text-gold">
              &larr; Back to site
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden text-sm font-medium text-charcoal sm:inline">
              {user?.name ?? user?.userId}
              {user?.memberCode && (
                <span className="ml-1 text-charcoal/50">({user.memberCode})</span>
              )}
            </span>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
