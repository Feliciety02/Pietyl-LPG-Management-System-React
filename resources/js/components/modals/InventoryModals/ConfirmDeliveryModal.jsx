import React, { useEffect, useState } from "react";
import ModalShell from "../ModalShell";

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function ConfirmDeliveryModal({
  open,
  onClose,
  purchase,
  onSubmit,
  loading = false,
}) {
  const [receivedQty, setReceivedQty] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setReceivedQty("");
    setNotes("");
  }, [open]);

  if (!purchase) return null;

  const canSubmit = safeNum(receivedQty) > 0;

  const submit = () => {
    if (!canSubmit || loading) return;

    onSubmit?.({
      received_qty: safeNum(receivedQty),
      notes: notes?.trim() || null,
    });
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Confirm delivery"
      subtitle={purchase.reference_no || "Purchase"}
      maxWidthClass="max-w-xl"
      bodyClassName="p-6"
      footerClassName="p-6 pt-0"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 focus:ring-4 focus:ring-teal-500/15"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || loading}
            className={[
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white focus:ring-4",
              !canSubmit || loading
                ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                : "bg-teal-600 ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25",
            ].join(" ")}
          >
            {loading ? "Saving..." : "Confirm"}
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4 text-sm text-slate-700">
          <div className="font-extrabold text-slate-900">
            {purchase.product_name || "Item"}{" "}
            <span className="text-slate-500 font-semibold">
              {purchase.variant ? `(${purchase.variant})` : ""}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            supplier: {purchase.supplier_name || "—"}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            ordered: <span className="font-semibold text-slate-700">{purchase.qty ?? "—"}</span>
          </div>
        </div>

        <div>
          <div className="text-xs font-extrabold text-slate-700">Received quantity</div>
          <input
            value={receivedQty}
            onChange={(e) => setReceivedQty(e.target.value)}
            type="number"
            min="1"
            className="mt-2 w-full rounded-2xl bg-white px-3 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
            placeholder="0"
          />
          <div className="mt-1 text-xs text-slate-500">required</div>
        </div>

        <div>
          <div className="text-xs font-extrabold text-slate-700">Notes</div>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2 w-full rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
            placeholder="Optional"
          />
          <div className="mt-1 text-xs text-slate-500">optional</div>
        </div>
      </div>
    </ModalShell>
  );
}
