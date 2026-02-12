import React from "react";

export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Card({ children, className = "" }) {
  return (
    <div className={cx("rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function Section({ title, subtitle, right, children }) {
  return (
    <Card>
      <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-slate-900">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-slate-600">{subtitle}</div> : null}
        </div>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}

export function EmptyState({ title, desc }) {
  return (
    <div className="rounded-3xl bg-slate-50 ring-1 ring-dashed ring-slate-200 p-6">
      <div className="text-sm font-extrabold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{desc}</div>
    </div>
  );
}

export function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
      <div className="h-10 w-10 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
        {Icon ? <Icon className="h-5 w-5 text-slate-500" /> : null}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-extrabold text-slate-500">{label}</div>
        <div className="mt-0.5 text-sm font-semibold text-slate-900 break-words">
          {value || "-"}
        </div>
      </div>
    </div>
  );
}

export function StatusPill({ status }) {
  const s = String(status || "").toLowerCase();

  const meta =
    s === "pending" || s === "assigned"
      ? { label: "Pending", cls: "bg-slate-100 text-slate-700 ring-slate-200" }
      : s === "in_transit" || s === "on_the_way" || s === "on the way"
      ? { label: "On the way", cls: "bg-teal-50 text-teal-800 ring-teal-200" }
      : s === "delivered"
      ? { label: "Delivered", cls: "bg-emerald-50 text-emerald-800 ring-emerald-200" }
      : s === "failed" || s === "rescheduled"
      ? { label: s === "failed" ? "Failed" : "Rescheduled", cls: "bg-rose-50 text-rose-800 ring-rose-200" }
      : { label: status || "Unknown", cls: "bg-slate-100 text-slate-700 ring-slate-200" };

  return (
    <span className={cx("inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold ring-1", meta.cls)}>
      {meta.label}
    </span>
  );
}

export function ActionBtn({ tone = "neutral", disabled, onClick, icon: Icon, children }) {
  const toneCls =
    tone === "primary"
      ? "bg-teal-600 text-white ring-teal-700/10 hover:bg-teal-700"
      : tone === "danger"
      ? "bg-white text-rose-700 ring-rose-200 hover:bg-rose-50"
      : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold ring-1 transition",
        disabled ? "bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed" : toneCls
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

export function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export function mapsEmbedUrl(address) {
  const q = encodeURIComponent(address || "");
  return `https://www.google.com/maps?q=${q}&output=embed`;
}

export function mapsOpenUrl(address) {
  const q = encodeURIComponent(address || "");
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
