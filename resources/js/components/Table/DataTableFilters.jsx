import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function DataTableFilters({
  q,
  onQ,
  onQDebounced,
  placeholder = "Search...",
  debounceMs = 300,
  filters = [],
  rightSlot,
  variant = "card",
  containerClass,
  innerClass,
}) {
  const [localQ, setLocalQ] = useState(q || "");
  const skipRef = useRef(false);
  const typedRef = useRef(false);
  const onQDebouncedRef = useRef(onQDebounced);
  const safeFilters = Array.isArray(filters) ? filters : [];

  useEffect(() => {
    skipRef.current = true;
    setLocalQ(q || "");
    typedRef.current = false;
  }, [q]);

  useEffect(() => {
    onQDebouncedRef.current = onQDebounced;
  }, [onQDebounced]);

  useEffect(() => {
    const callback = onQDebouncedRef.current;
    if (!callback) return;
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }
    if (!typedRef.current) {
      return;
    }
    if (debounceMs <= 0) {
      callback(localQ);
      return;
    }
    const handle = setTimeout(() => callback(localQ), debounceMs);
    return () => clearTimeout(handle);
  }, [localQ, debounceMs]);

  const isInline = variant === "inline";

  const container = isInline
    ? cx("flex flex-wrap items-center gap-3 justify-end", containerClass)
    : cx("rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm", containerClass);

  const inner = isInline
    ? cx("flex flex-wrap items-center gap-3", innerClass)
    : cx("p-5 flex flex-wrap items-center gap-3 justify-between", innerClass);

  return (
    <div className={container}>
      <div className={inner}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 ring-1 ring-slate-200">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={localQ}
              onChange={(e) => {
                const next = e.target.value;
                setLocalQ(next);
                typedRef.current = true;
                onQ?.(next);
              }}
              className={cx(
                "bg-transparent text-sm outline-none placeholder:text-slate-400",
                isInline ? "w-56" : "w-64"
              )}
              placeholder={placeholder}
            />
          </div>

          {safeFilters.map((f) => {
            const safeOptions = Array.isArray(f.options) ? f.options : [];
            return (
              <select
                key={f.key}
                value={f.value}
                onChange={(e) => f.onChange?.(e.target.value)}
                disabled={!safeOptions.length}
                className={cx(
                  "rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-800",
                  "ring-1 ring-slate-200 outline-none",
                  "focus:ring-4 focus:ring-teal-500/15",
                  !safeOptions.length && "opacity-50 cursor-not-allowed"
                )}
              >
                {safeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            );
          })}
        </div>

        {rightSlot ? <div className="flex items-center gap-2">{rightSlot}</div> : null}
      </div>
    </div>
  );
}
