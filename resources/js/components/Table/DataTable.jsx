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
    if (!sortable) return;
    if (!onSort) return;
    onSort(key);
  };

  return (
    <div className="overflow-x-auto rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
      <table className="min-w-full text-left table-fixed">
        <thead className="bg-slate-50">
          <tr className="text-xs font-extrabold text-slate-600">
            {columns.map((col) => {
              const isSorted = sort?.key === col.key;
              const dir = isSorted ? sort?.dir : null;

              return (
                <th
                  key={col.key}
                  className={cx(
                    "px-4 py-3 whitespace-nowrap",
                    col.sortable ? "cursor-pointer select-none hover:text-teal-700" : ""
                  )}
                  onClick={() => handleSort(col.key, col.sortable)}
                >
                  <div className="flex items-center gap-2">
                    {col.label}

                    {col.sortable ? (
                      <span className="flex flex-col leading-none">
                        <ChevronUp
                          className={cx(
                            "h-3 w-3",
                            isSorted && dir === "asc" ? "text-teal-600" : "text-slate-300"
                          )}
                        />
                        <ChevronDown
                          className={cx(
                            "h-3 w-3 -mt-1",
                            isSorted && dir === "desc" ? "text-teal-600" : "text-slate-300"
                          )}
                        />
                      </span>
                    ) : null}
                  </div>
                </th>
              );
            })}

            {renderActions ? (
              <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
            ) : null}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-4" colSpan={colCount}>
                  <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                </td>
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td className="px-4 py-14 text-center" colSpan={colCount}>
                <div className="text-sm font-extrabold text-slate-900">{emptyTitle}</div>
                <div className="mt-1 text-sm text-slate-600">{emptyHint}</div>
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={row?.id ?? idx} className="hover:bg-slate-50/60 transition">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cx(
                      "px-4 py-3 text-sm text-slate-800 align-middle",
                      col.nowrap ? "whitespace-nowrap" : "",
                      col.truncate ? "truncate" : ""
                    )}
                  >
                    {col.render ? col.render(row) : row?.[col.key]}
                  </td>
                ))}

                {renderActions ? (
                  <td className="px-4 py-3 text-right whitespace-nowrap align-middle">
                    {renderActions(row)}
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
