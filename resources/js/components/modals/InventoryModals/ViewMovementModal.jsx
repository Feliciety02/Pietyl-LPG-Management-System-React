import React from "react";
import ModalShell from "../ModalShell";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
} from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function niceText(v) {
  if (v == null) return "—";
  const s = String(v).trim();
  return s ? s : "—";
}

function normalizeDir(dir) {
  return String(dir || "").toLowerCase();
}

function normalizeType(type) {
  return String(type || "").toLowerCase();
}

function DirectionIcon({ dir }) {
  const d = normalizeDir(dir);
  const Icon = d === "in" ? ArrowDownLeft : d === "out" ? ArrowUpRight : Layers;

  const tone =
    d === "in"
      ? "bg-teal-600/10 ring-teal-700/10 text-teal-800"
      : d === "out"
      ? "bg-slate-100 ring-slate-200 text-slate-700"
      : "bg-slate-100 ring-slate-200 text-slate-700";

  return (
    <div className={cx("h-11 w-11 rounded-2xl ring-1 flex items-center justify-center", tone)}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

function Pill({ label, tone }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        tone
      )}
    >
      {label}
    </span>
  );
}

function TypePill({ type }) {
  const t = normalizeType(type);

  const map = {
    purchase: ["Purchase", "bg-teal-600/10 text-teal-900 ring-teal-700/10"],
    refill: ["Refill", "bg-teal-600/10 text-teal-900 ring-teal-700/10"],
    swap: ["Swap", "bg-amber-600/10 text-amber-900 ring-amber-700/10"],
    sale: ["Sale", "bg-slate-100 text-slate-700 ring-slate-200"],
    delivery: ["Delivery", "bg-slate-100 text-slate-700 ring-slate-200"],
  };

  const [label, tone] = map[t] || ["Movement", "bg-slate-100 text-slate-700 ring-slate-200"];

  return <Pill label={label} tone={tone} />;
}

function DirPill({ dir }) {
  const d = normalizeDir(dir);

  return (
    <Pill
      label={d === "in" ? "Inbound" : d === "out" ? "Outbound" : "—"}
      tone={
        d === "in"
          ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
          : "bg-slate-100 text-slate-700 ring-slate-200"
      }
    />
  );
}

function KV({ label, value }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-4">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

export default function ViewMovementModal({ open, onClose, movement }) {
  const m = movement || null;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Movement details"
      subtitle="Read-only record of inventory activity."
      maxWidthClass="max-w-3xl"
      bodyClassName="p-6"
      footerClassName="p-6 pt-0"
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-5 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 focus:ring-4 focus:ring-teal-500/15"
          >
            Close
          </button>
        </div>
      }
    >
      {!m ? (
        <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-10 text-center">
          <div className="text-base font-extrabold text-slate-900">No movement selected</div>
          <div className="mt-2 text-sm text-slate-600">Click View on a record to inspect details.</div>
        </div>
      ) : (
        <div className="grid gap-5">
          {/* header */}
          <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <DirectionIcon dir={m.direction} />
                <div className="min-w-0">
                  <div className="text-base font-extrabold text-slate-900 truncate">
                    {niceText(m.product_name)}{" "}
                    {m.variant ? <span className="text-slate-500">({m.variant})</span> : null}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 truncate">
                    SKU {niceText(m.sku)} • By {niceText(m.actor_name || "System")}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-teal-600/10 ring-1 ring-teal-700/10 px-5 py-4 text-center">
                <div className="text-[11px] font-semibold text-teal-900/70">Quantity</div>
                <div className="mt-1 text-2xl font-extrabold text-teal-900">{m.qty ?? 0}</div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <DirPill dir={m.direction} />
              <TypePill type={m.type} />
              <span className="text-xs text-slate-500">
                Occurred • <span className="font-semibold text-slate-700">{niceText(m.occurred_at)}</span>
              </span>
            </div>
          </div>

          {/* details */}
          <div className="grid gap-3 sm:grid-cols-2">
            <KV
              label="Reference"
              value={
                m.reference_type
                  ? `${String(m.reference_type).toUpperCase()}${m.reference_id ? " • " + m.reference_id : ""}`
                  : "—"
              }
            />
            <KV label="Direction" value={m.direction ? m.direction.toUpperCase() : "—"} />
          </div>
        </div>
      )}
    </ModalShell>
  );
}