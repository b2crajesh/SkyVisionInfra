import type { InputHTMLAttributes, ReactNode } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  as?: "input";
  children?: ReactNode;
}

export default function FormField({
  label,
  error,
  hint,
  id,
  children,
  ...rest
}: FormFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="mb-4">
      <label
        htmlFor={fieldId}
        className="mb-1 block text-sm font-medium text-charcoal"
      >
        {label}
      </label>
      {children ?? (
        <input
          id={fieldId}
          className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-navy shadow-sm transition placeholder:text-charcoal/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 ${
            error ? "border-red-500" : "border-slate-200"
          }`}
          {...rest}
        />
      )}
      {hint && !error && <p className="mt-1 text-xs text-charcoal/60">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
