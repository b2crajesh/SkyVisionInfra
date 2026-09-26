import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import Button from "./ui/Button";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/properties", label: "Properties" },
  { to: "/membership", label: "Membership" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/faq", label: "FAQ" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const dashboardPath = user?.role === "admin" ? "/admin" : "/member";

  return (
    <header className="sticky top-0 z-50 bg-white/80 shadow-soft backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-sm font-bold text-white">
            SV
          </span>
          <span className="text-lg font-bold text-navy">
            Sky Vision <span className="text-gold">Infra</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-gold ${
                  isActive ? "text-gold" : "text-charcoal"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/contact">
            <Button variant="secondary">Contact Us</Button>
          </Link>
          {user ? (
            <>
              <Link to={dashboardPath}>
                <Button variant="outline">Dashboard</Button>
              </Link>
              <Button variant="ghost" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="primary">Login</Button>
            </Link>
          )}
        </div>

        <button
          aria-label="Toggle menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 lg:hidden"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="sr-only">Menu</span>
          <div className="space-y-1.5">
            <span className="block h-0.5 w-6 bg-navy" />
            <span className="block h-0.5 w-6 bg-navy" />
            <span className="block h-0.5 w-6 bg-navy" />
          </div>
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-charcoal hover:text-gold"
              >
                {link.label}
              </NavLink>
            ))}
            <Link to="/contact" onClick={() => setOpen(false)}>
              <Button variant="secondary" className="w-full">
                Contact Us
              </Button>
            </Link>
            {user ? (
              <>
                <Link to={dashboardPath} onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)}>
                <Button variant="primary" className="w-full">
                  Login
                </Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
