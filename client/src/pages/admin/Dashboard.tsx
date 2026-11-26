import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import Card from "../../components/ui/Card";
import { adminNavItems } from "./adminNav";
import { api } from "../../lib/api";
import type { DashboardSummary } from "../../lib/types";
import { formatDate } from "../../lib/format";

function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
}

function CurrentMonthMetric({
  title,
  value,
  detail,
  symbol,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  symbol: string;
  tone: "gold" | "blue";
}) {
  const toneStyles = {
    gold: {
      icon: "bg-gold/10 text-gold",
      border: "border-gold/20",
      glow: "bg-gold/5",
      label: "text-gold",
    },
    blue: {
      icon: "bg-blue-50 text-blue-700",
      border: "border-blue-100",
      glow: "bg-blue-50",
      label: "text-blue-700",
    },
  }[tone];
  return (
    <Card className={`relative overflow-hidden border ${toneStyles.border}`}>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full ${toneStyles.glow}`}
      />
      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wide ${toneStyles.label}`}>
            {title}
          </p>
          <p className="mt-3 break-words text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            {value}
          </p>
          <p className="mt-2 text-sm text-charcoal/60">{detail}</p>
        </div>
        <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold ${toneStyles.icon}`}>
          {symbol}
        </span>
      </div>
    </Card>
  );
}

function SummaryMetric({
  label,
  value,
  detail,
  symbol,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  symbol: string;
  tone: "gold" | "blue" | "green";
}) {
  const toneStyles = {
    gold: {
      icon: "bg-gold/10 text-gold",
      border: "border-l-gold",
      glow: "bg-gold/5",
    },
    blue: {
      icon: "bg-blue-50 text-blue-700",
      border: "border-l-blue-500",
      glow: "bg-blue-50",
    },
    green: {
      icon: "bg-emerald-50 text-emerald-700",
      border: "border-l-emerald-500",
      glow: "bg-emerald-50",
    },
  }[tone];

  return (
    <Card className={`relative overflow-hidden border-l-4 ${toneStyles.border}`}>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-7 -top-8 h-24 w-24 rounded-full ${toneStyles.glow}`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">{label}</p>
          <p className="mt-3 break-words text-2xl font-bold tracking-tight text-navy sm:text-3xl">
            {value}
          </p>
          <p className="mt-1 text-xs text-charcoal/55">{detail}</p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${toneStyles.icon}`}>
          {symbol}
        </span>
      </div>
    </Card>
  );
}

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "M"
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<DashboardSummary>("/dashboard/summary");
        setSummary(data);
      } catch {
        setError("Unable to load dashboard summary.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <DashboardLayout title="Admin Panel" navItems={adminNavItems}>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
            Admin overview
          </p>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-charcoal/60">
            Track membership growth, sales performance, and recent activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/members/new"
            className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-navy/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <span aria-hidden="true" className="text-lg leading-none">+</span>
            Add member
          </Link>
          <Link
            to="/admin/sales/new"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Record sale
          </Link>
        </div>
      </div>

      {loading && <p className="text-sm text-charcoal/60">Loading dashboard data...</p>}
      {error && (
        <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {summary && (
        <div className="space-y-6">
          <section aria-label="Business summary" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryMetric
              label="Total members"
              value={summary.totalMembers.toLocaleString("en-IN")}
              detail="Registered member accounts"
              symbol="M"
              tone="gold"
            />
            <SummaryMetric
              label="Recorded sales"
              value={summary.totalSalesCount.toLocaleString("en-IN")}
              detail="Completed sale records"
              symbol="S"
              tone="blue"
            />
            <SummaryMetric
              label="Total sales value"
              value={Number(summary.totalSalesAmount).toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              })}
              detail="Value of all recorded sales"
              symbol="₹"
              tone="green"
            />
          </section>

          <section aria-label="Current month activity">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-navy">Current month</h2>
                <p className="mt-1 text-xs text-charcoal/55">
                  Sales and member registrations for this month
                </p>
              </div>
              <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-navy">
                {formatMonth(summary.currentMonthActivity.month)}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <CurrentMonthMetric
                title="Sales performance"
                value={Number(summary.currentMonthActivity.salesAmount).toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                })}
                detail={`${summary.currentMonthActivity.salesCount.toLocaleString("en-IN")} ${
                  summary.currentMonthActivity.salesCount === 1 ? "sale" : "sales"
                } recorded this month`}
                symbol="₹"
                tone="gold"
              />
              <CurrentMonthMetric
                title="Member growth"
                value={summary.currentMonthActivity.memberCount.toLocaleString("en-IN")}
                detail={`${
                  summary.currentMonthActivity.memberCount === 1 ? "New member" : "New members"
                } registered this month`}
                symbol="M"
                tone="blue"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-navy">Recent members</h2>
                  <p className="mt-1 text-xs text-charcoal/55">
                    Latest registrations in your organization
                  </p>
                </div>
                <Link
                  to="/admin/members"
                  className="shrink-0 text-sm font-semibold text-gold hover:text-navy"
                >
                  View all
                </Link>
              </div>
              {summary.recentMembers.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-charcoal/55">
                  No members have been registered yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {summary.recentMembers.map((member) => (
                    <Link
                      key={member.id}
                      to={`/admin/members/${member.id}`}
                      className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-3 transition hover:border-gold/30 hover:bg-lightbg/70 sm:px-4"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy/5 text-xs font-bold text-navy">
                          {getInitials(member.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-navy group-hover:text-gold">
                            {member.name}
                          </span>
                          <span className="mt-0.5 block text-xs text-charcoal/55">
                            {member.memberCode}
                          </span>
                        </span>
                      </span>
                      <span className="ml-12 flex items-center gap-3 text-right sm:ml-0">
                        <span className="hidden rounded-full bg-gold/10 px-2.5 py-1 text-[11px] font-medium text-navy sm:inline-flex">
                          {member.rank?.name ?? "Member"}
                        </span>
                        <span className="text-xs text-charcoal/55">
                          {formatDate(member.createdAt)}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="text-base font-semibold text-navy">Quick actions</h2>
              <p className="mt-1 text-xs text-charcoal/55">Common administration tasks</p>
              <div className="mt-4 space-y-2">
                {[
                  { to: "/admin/members/new", label: "Register a member", mark: "+" },
                  { to: "/admin/sales/new", label: "Record a sale", mark: "₹" },
                  { to: "/admin/reports", label: "Open reports", mark: "↗" },
                ].map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3 transition hover:border-gold/30 hover:bg-lightbg/70"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 font-semibold text-gold">
                        {action.mark}
                      </span>
                      <span className="text-sm font-medium text-navy">{action.label}</span>
                    </span>
                    <span aria-hidden="true" className="text-charcoal/35">→</span>
                  </Link>
                ))}
              </div>
            </Card>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
