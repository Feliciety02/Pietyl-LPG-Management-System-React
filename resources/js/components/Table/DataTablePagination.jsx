import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function DataTablePagination({
  meta,
  perPage,
  onPerPage,
  onPrev,
  onNext,
  disablePrev,
  disableNext,
}) {
  if (!meta) return null;

  const from = meta?.from ?? 0;
  const to = meta?.to ?? 0;
  const total = meta?.total ?? 0;
  const currentPage = meta?.current_page ?? 1;
  const lastPage = meta?.last_page ?? 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
      <div className="text-xs font-semibold text-slate-600">
        {from} to {to} of {total}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={perPage}
          onChange={(e) => onPerPage?.(Number(e.target.value))}
          className={cx(
            "rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-800",
            "ring-1 ring-slate-200 outline-none",
            "focus:ring-4 focus:ring-teal-500/15"
          )}
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onPrev}
          disabled={disablePrev}
          aria-label="Previous page"
          className={cx(
            "rounded-xl p-2 ring-1 transition",
            disablePrev
              ? "bg-slate-50 text-slate-400 ring-slate-200 cursor-not-allowed"
              : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="rounded-xl bg-teal-50 px-3 py-2 text-xs font-extrabold text-teal-800 ring-1 ring-teal-100">
          {currentPage}/{lastPage}
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={disableNext}
          aria-label="Next page"
          className={cx(
            "rounded-xl p-2 ring-1 transition",
            disableNext
              ? "bg-slate-50 text-slate-400 ring-slate-200 cursor-not-allowed"
              : "bg-teal-600 text-white ring-teal-600 hover:bg-teal-700 focus:ring-4 focus:ring-teal-500/25"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
