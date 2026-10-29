import type { HTMLAttributes, ReactNode } from "react";

export default function Card({
  children,
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`min-w-0 rounded-xl border border-slate-200/60 bg-white p-4 shadow-card transition-shadow hover:shadow-lifted sm:rounded-2xl sm:p-6 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
