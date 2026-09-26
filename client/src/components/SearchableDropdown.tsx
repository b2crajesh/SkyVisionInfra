import { useEffect, useRef, useState } from "react";

export interface DropdownOption {
  id: string;
  label: string;
}

interface SearchableDropdownProps {
  label: string;
  placeholder?: string;
  fetchOptions: (query: string) => Promise<DropdownOption[]>;
  onSelect: (option: DropdownOption | null) => void;
  value?: DropdownOption | null;
  error?: string;
  debounceMs?: number;
}

export default function SearchableDropdown({
  label,
  placeholder = "Search...",
  fetchOptions,
  onSelect,
  value,
  error,
  debounceMs = 300,
}: SearchableDropdownProps) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value?.label ?? "");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    onSelect(null);
    setOpen(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const results = await fetchOptions(val);
        setOptions(results);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
  };

  return (
    <div className="mb-4" ref={containerRef}>
      <label className="mb-1 block text-sm font-medium text-charcoal">
        {label}
      </label>
      <div className="relative">
        <input
          className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy ${
            error ? "border-red-500" : "border-gray-300"
          }`}
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => handleChange(e.target.value)}
        />
        {open && (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-black/10 bg-white shadow-lg">
            {loading && (
              <div className="px-3 py-2 text-sm text-charcoal/50">
                Searching...
              </div>
            )}
            {!loading && options.length === 0 && (
              <div className="px-3 py-2 text-sm text-charcoal/50">
                No matches found.
              </div>
            )}
            {!loading &&
              options.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-lightbg"
                  onClick={() => {
                    onSelect(opt);
                    setQuery(opt.label);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              ))}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
