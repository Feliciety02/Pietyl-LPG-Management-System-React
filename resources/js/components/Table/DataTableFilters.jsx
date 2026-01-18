import React from "react";
import { Search } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function DataTableFilters({
  q,
  onQ,
  placeholder = "Search...",
  filters = [],
  rightSlot,
}) {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
      <div className="p-5 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 ring-1 ring-slate-200">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={q}
              onChange={(e) => onQ?.(e.target.value)}
              className="w-64 bg-transparent text-sm outline-none placeholder:text-slate-400"
              placeholder={placeholder}
            />
          </div>

          {filters.map((f) => (
            <select
              key={f.key}
              value={f.value}
              onChange={(e) => f.onChange?.(e.target.value)}
              className={cx(
                "rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-800",
                "ring-1 ring-slate-200 outline-none",
                "focus:ring-4 focus:ring-teal-500/15"
              )}
            >
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>

        {rightSlot ? <div className="flex items-center gap-2">{rightSlot}</div> : null}
      </div>
    </div>
  );
}