import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold text-sm font-bold text-white">
              SV
            </span>
            <span className="text-lg font-bold">Sky Vision Infra</span>
          </div>
          <p className="text-sm text-white/70">
            Building lasting value through land, property development, and a
            transparent, member-driven referral network.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gold">
            Quick Links
          </h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/about" className="hover:text-white">About Us</Link></li>
            <li><Link to="/services" className="hover:text-white">Services</Link></li>
            <li><Link to="/membership" className="hover:text-white">Membership</Link></li>
            <li><Link to="/sponsor" className="hover:text-white">Sponsor Program</Link></li>
            <li><Link to="/commission" className="hover:text-white">Commission Plan</Link></li>
            <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gold">
            Contact
          </h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li>Sky Vision Towers, Sector 62, Noida, Uttar Pradesh, India</li>
            <li>+91 98765 43210</li>
            <li>[REDACTED_EMAIL_ADDRESS]</li>
            <li>Mon - Sat, 10:00 AM - 7:00 PM</li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gold">
            Legal
          </h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
            <li><Link to="/disclaimer" className="hover:text-white">Disclaimer</Link></li>
          </ul>
          <div className="mt-4 flex gap-3">
            {["FB", "IG", "LI", "YT"].map((s) => (
              <span
                key={s}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        &copy; {year} Sky Vision Infra & Developers. All rights reserved.
      </div>
    </footer>
  );
}
