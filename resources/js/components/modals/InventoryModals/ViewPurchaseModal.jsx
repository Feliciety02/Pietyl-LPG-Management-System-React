import React, { useMemo } from "react";
import ModalShell from "../ModalShell";
import { PurchaseSummary, niceText, money } from "@/components/modals/InventoryModals/PurchaseSummary";

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
          <PurchaseSummary purchase={p} />

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
