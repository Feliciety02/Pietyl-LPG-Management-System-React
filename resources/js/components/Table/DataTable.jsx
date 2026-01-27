import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function DataTable({
  columns = [],
  rows = [],
  loading = false,
  emptyTitle = "No results",
  emptyHint = "Try adjusting your filters.",
  sort = { key: null, dir: "asc" },
  onSort,
  renderActions,
}) {
  const colCount = columns.length + (renderActions ? 1 : 0);

  const handleSort = (key, sortable) => {
    if (!sortable || !onSort) return;
    onSort(key);
  };

  return (
    <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200">
      <table className="min-w-full text-left table-fixed">
        {/* HEADER */}
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-slate-500">
            {columns.map((col) => {
              const isSorted = sort?.key === col.key;
              const dir = isSorted ? sort?.dir : null;

              return (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key, col.sortable)}
                  className={cx(
                    "px-4 py-3 font-semibold border-b border-slate-200",
                    col.sortable && "cursor-pointer hover:text-slate-800"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label}</span>

                    {col.sortable && (
                      <span className="flex flex-col leading-none opacity-40">
                        <ChevronUp
                          className={cx(
                            "h-3 w-3",
                            isSorted && dir === "asc" && "opacity-100 text-slate-700"
                          )}
                        />
                        <ChevronDown
                          className={cx(
                            "h-3 w-3 -mt-1",
                            isSorted && dir === "desc" && "opacity-100 text-slate-700"
                          )}
                        />
                      </span>
                    )}
                  </div>
                </th>
              );
            })}

            {renderActions && (
              <th className="px-4 py-3 text-right border-b border-slate-200">
                Actions
              </th>
            )}
          </tr>
        </thead>

        {/* BODY */}
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <tr key={i}>
                <td colSpan={colCount} className="px-4 py-4">
                  <div className="h-4 w-full rounded bg-slate-100 animate-pulse" />
                </td>
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="px-4 py-16 text-center">
                <div className="text-sm font-semibold text-slate-900">
                  {emptyTitle}
                </div>
                <div className="mt-1 text-sm text-slate-500">{emptyHint}</div>
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr
                key={row?.id ?? idx}
                className="hover:bg-teal-50/40 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cx(
                      "px-4 py-3 text-sm text-slate-700",
                      col.nowrap && "whitespace-nowrap",
                      col.truncate && "truncate"
                    )}
                  >
                    {col.render ? col.render(row) : row?.[col.key]}
                  </td>
                ))}

                {renderActions && (
                  <td className="px-4 py-3 text-right">
                    {renderActions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
