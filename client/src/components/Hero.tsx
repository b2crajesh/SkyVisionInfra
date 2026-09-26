import { Link } from "react-router-dom";
import Button from "./ui/Button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy to-indigo-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.25),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.15),transparent_55%)]" />
      <div
        aria-hidden="true"
        className="absolute -right-16 top-16 h-72 w-72 rounded-full bg-gold/20 blur-3xl animate-floatSlow"
      />
      <div
        aria-hidden="true"
        className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-indiaGreen/10 blur-3xl animate-floatSlow"
        style={{ animationDelay: "1.5s" }}
      />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-gold">
          Sky Vision Infra & Developers
        </p>
        <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
          Land, Legacy, and a Network Built to Grow With You
        </h1>
        <p className="mt-6 max-w-xl text-lg text-white/80">
          We identify, develop, and manage real estate opportunities while
          empowering a community of members and sponsors to share in
          transparent, well-governed growth.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link to="/properties">
            <Button variant="secondary" className="px-6 py-3 text-base">
              Explore Properties
            </Button>
          </Link>
          <Link to="/membership">
            <Button
              variant="outline"
              className="border-white px-6 py-3 text-base text-white hover:bg-white hover:text-navy"
            >
              Become a Member
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
