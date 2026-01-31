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
  searchQuery,
  searchAccessor,
}) {
  const colCount = columns.length + (renderActions ? 1 : 0);
  const normalizedQuery = String(searchQuery || "").trim().toLowerCase();

  const collectStrings = (value, out, depth) => {
    if (value == null || depth > 2) return;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      out.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => collectStrings(item, out, depth + 1));
      return;
    }
    if (typeof value === "object") {
      Object.values(value).forEach((item) => collectStrings(item, out, depth + 1));
    }
  };

  const buildSearchText = (row) => {
    if (typeof searchAccessor === "function") {
      return String(searchAccessor(row) || "");
    }
    const parts = [];
    collectStrings(row, parts, 0);
    return parts.join(" ");
  };

  const filteredRows =
    normalizedQuery && !loading
      ? rows.filter((row) => {
          if (!row || row.__filler) return false;
          const text = buildSearchText(row).toLowerCase();
          return text.includes(normalizedQuery);
        })
      : rows;

  const displayRows = loading ? rows : filteredRows;

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
          ) : displayRows.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="px-4 py-16 text-center">
                <div className="text-sm font-semibold text-slate-900">
                  {emptyTitle}
                </div>
                <div className="mt-1 text-sm text-slate-500">{emptyHint}</div>
              </td>
            </tr>
          ) : (
            displayRows.map((row, idx) => (
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
