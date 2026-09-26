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
    <div className="w-full overflow-x-auto rounded-lg border border-black/5 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-lightbg text-xs font-semibold uppercase tracking-wide text-charcoal/60">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3">
                {col.sortable && onSort ? (
                  <button
                    className="flex items-center gap-1 hover:text-navy"
                    onClick={() => onSort(col.key)}
                  >
                    {col.header}
                    {sortKey === col.key && (
                      <span>{sortDir === "asc" ? "▲" : "▼"}</span>
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-charcoal/50"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={`border-t border-black/5 ${
                  onRowClick ? "cursor-pointer hover:bg-lightbg" : ""
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
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
