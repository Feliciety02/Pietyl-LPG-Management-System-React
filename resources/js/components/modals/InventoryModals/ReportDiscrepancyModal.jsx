import React, { useEffect, useMemo, useState } from "react";
import ModalShell from "../ModalShell";

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function ReportDiscrepancyModal({
  open,
  onClose,
  purchase,
  onSubmit,
  loading = false,
}) {
  const [receivedQty, setReceivedQty] = useState("");
  const [damagedQty, setDamagedQty] = useState("");
  const [missingQty, setMissingQty] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setReceivedQty("");
    setDamagedQty("");
    setMissingQty("");
    setNotes("");
  }, [open]);

  if (!purchase) return null;

  const ordered = safeNum(purchase.qty);

  const totals = useMemo(() => {
    const received = safeNum(receivedQty);
    const damaged = safeNum(damagedQty);
    const missing = safeNum(missingQty);
    const reportedTotal = received + damaged + missing;

    return {
      received,
      damaged,
      missing,
      reportedTotal,
      ordered,
      ok: ordered <= 0 ? true : reportedTotal === ordered,
    };
  }, [receivedQty, damagedQty, missingQty, ordered]);

  const canSubmit =
    totals.received >= 0 &&
    totals.damaged >= 0 &&
    totals.missing >= 0 &&
    totals.reportedTotal > 0 &&
    (ordered <= 0 ? true : totals.ok);

  const submit = () => {
    if (!canSubmit || loading) return;

    onSubmit?.({
      received_qty: totals.received,
      damaged_qty: totals.damaged,
      missing_qty: totals.missing,
      notes: notes?.trim() || null,
    });
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Report discrepancy"
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
            {loading ? "Saving..." : "Submit report"}
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
            ordered: <span className="font-semibold text-slate-700">{ordered || "—"}</span>
          </div>
        </div>

        <div className="grid gap-3">
          <div>
            <div className="text-xs font-extrabold text-slate-700">Received quantity</div>
            <input
              value={receivedQty}
              onChange={(e) => setReceivedQty(e.target.value)}
              type="number"
              min="0"
              className="mt-2 w-full rounded-2xl bg-white px-3 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
              placeholder="0"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="text-xs font-extrabold text-slate-700">Damaged quantity</div>
              <input
                value={damagedQty}
                onChange={(e) => setDamagedQty(e.target.value)}
                type="number"
                min="0"
                className="mt-2 w-full rounded-2xl bg-white px-3 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
                placeholder="0"
              />
            </div>

            <div>
              <div className="text-xs font-extrabold text-slate-700">Missing quantity</div>
              <input
                value={missingQty}
                onChange={(e) => setMissingQty(e.target.value)}
                type="number"
                min="0"
                className="mt-2 w-full rounded-2xl bg-white px-3 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
                placeholder="0"
              />
            </div>
          </div>

          <div
            className={[
              "rounded-2xl p-3 text-xs ring-1",
              totals.ok ? "bg-slate-50 text-slate-700 ring-slate-200" : "bg-rose-600/10 text-rose-900 ring-rose-700/10",
            ].join(" ")}
          >
            <div className="font-extrabold">
              total reported: {totals.reportedTotal}
              {ordered > 0 ? ` of ${ordered}` : ""}
            </div>
            {ordered > 0 && !totals.ok ? (
              <div className="mt-1">
                total must match ordered quantity before submitting
              </div>
            ) : (
              <div className="mt-1">use this when there is damage or missing items</div>
            )}
          </div>

          <div>
            <div className="text-xs font-extrabold text-slate-700">Notes</div>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 w-full rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
              placeholder="Required if needed"
            />
            <div className="mt-1 text-xs text-slate-500">optional but recommended</div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
