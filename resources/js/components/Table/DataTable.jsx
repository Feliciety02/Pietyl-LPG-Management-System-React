import React from "react";
import TableHeaderCell from "@/components/Table/TableHeaderCell";

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
  rowKey,
  onRowClick,
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

  const handleSort = (key) => {
    if (!onSort) return;
    onSort(key);
  };

  return (
    <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200">
      <table className="min-w-full text-left table-fixed">
        {/* HEADER */}
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-slate-500">
            {columns.map((col) => (
              <TableHeaderCell
                key={col.key}
                label={col.label}
                sortable={Boolean(col.sortable)}
                sortKey={col.key}
                activeSortKey={sort?.key}
                sortDir={sort?.dir}
                onSort={handleSort}
                className={col.headerClassName}
                buttonClassName={col.headerButtonClassName}
                contentClassName={col.headerContentClassName}
              />
            ))}

            {renderActions && (
              <th className="px-4 py-3 text-right border-b border-slate-200">Actions</th>
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
            displayRows.map((row, idx) => {
              const computedKey = rowKey
                ? rowKey(row, idx)
                : row?.id !== undefined && row?.id !== null
                ? `${String(row.id)}__${idx}`
                : `__row__${idx}`;

              // Legacy behavior: previously used row?.id or index; keep stable fallback plus index suffix to avoid duplicates.
              return (
                <tr
                  key={computedKey}
                  className={cx(
                    "hover:bg-teal-50/40 transition-colors",
                    onRowClick && !row?.__filler ? "cursor-pointer" : ""
                  )}
                  onClick={() => {
                    if (!onRowClick || row?.__filler) return;
                    onRowClick(row);
                  }}
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
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
