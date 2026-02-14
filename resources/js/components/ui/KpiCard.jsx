import React from "react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const TONE_MAP = {
  slate: "text-slate-900",
  teal: "text-teal-700",
  amber: "text-amber-700",
  rose: "text-rose-700",
  emerald: "text-emerald-700",
};

export default function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "slate",
  className = "",
}) {
  return (
    <div className={cx("rounded-2xl border border-slate-100 bg-white px-4 py-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold text-slate-400">{label}</div>
        {Icon ? (
          <div className="h-7 w-7 rounded-xl bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center">
            <Icon className="h-4 w-4 text-slate-500" />
          </div>
        ) : null}
      </div>
      <div className={cx("mt-1 text-base font-extrabold tabular-nums", TONE_MAP[tone] || TONE_MAP.slate)}>
        {value}
      </div>
      {hint ? <div className="mt-1 text-[11px] text-slate-400">{hint}</div> : null}
    </div>
  );
}
