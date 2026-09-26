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
          className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy ${
            error ? "border-red-500" : "border-gray-300"
          }`}
          {...rest}
        />
      )}
      {hint && !error && <p className="mt-1 text-xs text-charcoal/60">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
