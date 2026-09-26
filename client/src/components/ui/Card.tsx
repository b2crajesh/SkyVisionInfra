import type { HTMLAttributes, ReactNode } from "react";

export default function Card({
  children,
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/60 bg-white p-6 shadow-card transition-shadow hover:shadow-lifted ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
