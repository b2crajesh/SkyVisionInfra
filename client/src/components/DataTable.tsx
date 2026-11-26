import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-charcoal/60">
          <tr>
            {columns.map((col) => {
              const isSorted = sortKey === col.key;

              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={
                    col.sortable && onSort
                      ? isSorted
                        ? sortDir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                      : undefined
                  }
                  className="whitespace-nowrap px-4 py-3.5"
                >
                  {col.sortable && onSort ? (
                    <button
                      type="button"
                      className="flex items-center gap-1.5 transition hover:text-navy"
                      onClick={() => onSort(col.key)}
                    >
                      {col.header}
                      <span
                        aria-hidden="true"
                        className={isSorted ? "text-gold" : "text-charcoal/30"}
                      >
                        {isSorted ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-sm text-charcoal/55"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={`border-t border-slate-100 transition-colors ${
                  onRowClick ? "cursor-pointer hover:bg-lightbg/70" : "hover:bg-slate-50/60"
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5 text-sm text-charcoal/80">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
