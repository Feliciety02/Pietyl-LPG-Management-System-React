import React from "react";
import ModalShell from "../ModalShell";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function niceText(v) {
  if (v == null) return "—";
  const s = String(v).trim();
  return s ? s : "—";
}

function getRisk(level) {
  const v = String(level || "ok").toLowerCase();
  if (v === "critical") return { label: "URGENT", tone: "bg-rose-600/10 text-rose-900 ring-rose-700/10" };
  if (v === "warning") return { label: "LOW", tone: "bg-amber-600/10 text-amber-900 ring-amber-700/10" };
  return { label: "OK", tone: "bg-slate-100 text-slate-700 ring-slate-200" };
}

function Pill({ label, tone }) {
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1", tone)}>
      {label}
    </span>
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

export default function StockViewModal({ open, onClose, item }) {
  const row = item || null;
  const risk = getRisk(row?.risk_level);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Stock details"
      subtitle="Quick snapshot of this item."
      maxWidthClass="max-w-2xl"
      bodyClassName="p-5"
      footerClassName="p-5 pt-0"
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 focus:ring-4 focus:ring-teal-500/15"
          >
            Close
          </button>
        </div>
      }
    >
      {!row ? (
        <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-8 text-center">
          <div className="text-base font-extrabold text-slate-900">No item selected</div>
          <div className="mt-2 text-sm text-slate-600">Click View on a row to inspect details.</div>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-base font-extrabold text-slate-900 truncate">
                  {niceText(row.name)}
                </div>
                {row.sku ? (
                  <div className="mt-1 text-xs text-slate-500 truncate">SKU {niceText(row.sku)}</div>
                ) : null}
                {row.variant ? (
                  <div className="mt-1 text-xs text-slate-500 truncate">{niceText(row.variant)}</div>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <Pill label={risk.label} tone={risk.tone} />
                {String(row.purchase_request_status || "none") === "pending" ? (
                  <Pill label="PENDING" tone="bg-amber-600/10 text-amber-900 ring-amber-700/10" />
                ) : String(row.purchase_request_status || "none") === "approved" ? (
                  <Pill label="APPROVED" tone="bg-teal-600/10 text-teal-900 ring-teal-700/10" />
                ) : String(row.purchase_request_status || "none") === "rejected" ? (
                  <Pill label="REJECTED" tone="bg-rose-600/10 text-rose-900 ring-rose-700/10" />
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <KV label="Current stock" value={niceText(row.current_qty)} />
            <KV label="Reorder level" value={niceText(row.reorder_level)} />
            <KV label="Location" value={niceText(row.location_name)} />
            <KV label="Supplier" value={niceText(row.supplier_name)} />
            <KV label="Last updated" value={niceText(row.last_movement_at)} />
            <KV
              label="Requested by"
              value={row.purchase_request_status ? niceText(row.requested_by_name) : "—"}
            />
          </div>

          {String(row.purchase_request_status || "none") === "pending" ? (
            <div className="rounded-2xl bg-amber-600/10 ring-1 ring-amber-700/10 px-4 py-3 text-xs font-semibold text-amber-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Waiting for owner approval.
            </div>
          ) : String(row.purchase_request_status || "none") === "approved" ? (
            <div className="rounded-2xl bg-teal-600/10 ring-1 ring-teal-700/10 px-4 py-3 text-xs font-semibold text-teal-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Request approved.
            </div>
          ) : null}
        </div>
      )}
    </ModalShell>
  );
}
