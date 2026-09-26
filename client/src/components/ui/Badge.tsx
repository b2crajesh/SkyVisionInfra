import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "danger" | "gold";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
  gold: "bg-gold/15 text-navy",
};

export default function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
