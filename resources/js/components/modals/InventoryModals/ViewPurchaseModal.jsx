import React, { useMemo } from "react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `₱${n.toLocaleString()}`;
}

function niceText(v) {
  if (v == null) return "—";
  const s = String(v).trim();
  return s ? s : "—";
}

function toStatusKey(status) {
  return String(status || "").toLowerCase().replace(/\s+/g, "_");
}

function statusLabel(status) {
  const s = toStatusKey(status);
  if (s === "awaiting_confirmation") return "For checking";
  if (s === "discrepancy_reported") return "Issue reported";
  if (s === "delivered") return "Delivered";
  if (s === "pending") return "Pending";
  if (s === "approved") return "Approved";
  if (s === "completed") return "Completed";
  if (s === "rejected") return "Rejected";
  return status ? String(status) : "—";
}

function StatusBadge({ status }) {
  const s = toStatusKey(status);

  const tone =
    s === "approved" || s === "completed"
      ? "bg-emerald-600/10 text-emerald-900 ring-emerald-700/10"
      : s === "pending"
      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
      : s === "rejected"
      ? "bg-rose-600/10 text-rose-900 ring-rose-700/10"
      : s === "delivered" || s === "awaiting_confirmation"
      ? "bg-sky-600/10 text-sky-900 ring-sky-700/10"
      : s === "discrepancy_reported"
      ? "bg-orange-600/10 text-orange-900 ring-orange-700/10"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ring-1",
        tone
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/70 ring-1 ring-slate-200/70 px-4 py-3">
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function SoftBox({ title, children }) {
  return (
    <div className="rounded-3xl bg-slate-50/70 ring-1 ring-slate-200/70 p-4">
      <div className="text-sm font-extrabold text-slate-900">{title}</div>
      <div className="mt-3 grid gap-3">{children}</div>
    </div>
  );
}

export default function ViewPurchaseModal({ open, onClose, purchase }) {
  const p = purchase || null;

  const meta = useMemo(() => {
    if (!p) return null;

    const ref = niceText(p.reference_no);
    const supplier = niceText(p.supplier_name);

    const item = [
      niceText(p.product_name),
      p.variant ? `(${String(p.variant).trim()})` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const created = niceText(p.created_at);

    const ordered = niceText(p.qty);
    const received = p.received_qty != null ? p.received_qty : "—";
    const damaged = p.damaged_qty != null ? p.damaged_qty : "—";
    const missing = p.missing_qty != null ? p.missing_qty : "—";

    const noteText = p.notes || p.remarks || "";
    const hasNotes = Boolean(noteText.trim());

    return {
      ref,
      supplier,
      item,
      created,
      ordered,
      received,
      damaged,
      missing,
      hasNotes,
      noteText,
    };
  }, [p]);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Purchase"
      subtitle="Quick, easy summary."
      maxWidthClass="max-w-2xl"
      bodyClassName="p-4"
      footerClassName="p-4 pt-0"
      footer={
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 focus:ring-4 focus:ring-teal-500/15"
          >
            Close
          </button>
        </div>
      }
    >
      {!p ? (
        <div className="rounded-3xl bg-slate-50/70 ring-1 ring-slate-200/70 p-7 text-center">
          <div className="text-base font-extrabold text-slate-900">No purchase selected</div>
          <div className="mt-2 text-sm text-slate-600">Pick a purchase row and press View.</div>
        </div>
      ) : (
        <div className="grid gap-4">
          {/* TOP: plain language + compact */}
{/* TOP HEADER */}
<div className="rounded-3xl bg-white/80 ring-1 ring-slate-200/70 shadow-sm p-5">
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-base font-extrabold text-slate-900 truncate">
          {meta.ref}
        </div>
        <StatusBadge status={p.status} />
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex items-baseline gap-2 text-sm">
          <span className="w-16 shrink-0 text-xs font-semibold text-slate-500">Supplier</span>
          <span className="text-slate-800 font-semibold truncate">{meta.supplier}</span>
        </div>

        <div className="flex items-baseline gap-2 text-sm">
          <span className="w-16 shrink-0 text-xs font-semibold text-slate-500">Item</span>
          <span className="text-slate-800 font-semibold truncate">{meta.item}</span>
        </div>

        <div className="flex items-baseline gap-2 text-sm">
          <span className="w-16 shrink-0 text-xs font-semibold text-slate-500">Date</span>
          <span className="text-slate-700 font-medium truncate">{meta.created}</span>
        </div>
      </div>
    </div>

    <div className="rounded-3xl bg-teal-600/10 ring-1 ring-teal-700/10 px-5 py-4">
      <div className="text-[11px] font-semibold text-teal-900/70">Total</div>
      <div className="mt-1 text-2xl font-extrabold text-teal-900">
        {money(p.total_cost)}
      </div>
    </div>
  </div>
</div>


          {/* BOTTOM: only show what matters, less words */}
          <div className="grid gap-4 lg:grid-cols-2">
            <SoftBox title="Cost">
              <MiniStat label="Price per item" value={money(p.unit_cost)} />
              <MiniStat label="Total cost" value={money(p.total_cost)} />
            </SoftBox>

            <SoftBox title="Notes">
              {meta.hasNotes ? (
                <div className="rounded-3xl bg-white/70 ring-1 ring-slate-200/70 p-4">
                  <div className="text-xs font-semibold text-slate-600">Message</div>
                  <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">
                    {meta.noteText}
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl bg-white/60 ring-1 ring-slate-200/60 p-4">
                  <div className="text-sm font-semibold text-slate-700">No notes</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Nothing was written for this purchase.
                  </div>
                </div>
              )}
            </SoftBox>
          </div>
        </div>
      )}
    </ModalShell>
  );
}