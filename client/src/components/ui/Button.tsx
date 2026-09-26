import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-navy text-white shadow-soft hover:bg-navy/90 focus-visible:ring-navy",
  secondary: "bg-gold text-white shadow-soft hover:bg-gold/90 focus-visible:ring-gold",
  outline:
    "border border-navy/20 text-navy hover:bg-navy hover:text-white focus-visible:ring-navy",
  ghost: "text-navy hover:bg-navy/10 focus-visible:ring-navy",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
