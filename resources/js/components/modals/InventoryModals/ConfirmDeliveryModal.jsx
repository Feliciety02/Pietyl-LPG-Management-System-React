import React, { useEffect, useMemo, useState } from "react";
import ModalShell from "../ModalShell";
import { PackageCheck, AlertTriangle } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function ConfirmDeliveryModal({
  open,
  onClose,
  item = null,
  onSubmit,
  loading = false,
}) {
  const orderedQty = useMemo(() => safeNum(item?.qty), [item]);

  const [receivedQty, setReceivedQty] = useState("");
  const [damagedQty, setDamagedQty] = useState("");
  const [missingQty, setMissingQty] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;

    setReceivedQty(item?.received_qty != null ? String(item.received_qty) : "");
    setDamagedQty(item?.damaged_qty != null ? String(item.damaged_qty) : "");
    setMissingQty(item?.missing_qty != null ? String(item.missing_qty) : "");
    setNotes(item?.confirm_notes || "");
  }, [open, item]);

  const received = safeNum(receivedQty);
  const damaged = safeNum(damagedQty);
  const missing = safeNum(missingQty);

  const accounted = received + damaged + missing;
  const hasMismatch = orderedQty > 0 && accounted !== orderedQty;

  const canSubmit = orderedQty > 0 && !hasMismatch && (received >= 0 && damaged >= 0 && missing >= 0);

  const submit = () => {
    if (!canSubmit || loading) return;

    onSubmit?.({
      purchase_id: item?.id ?? null,
      received_qty: received,
      damaged_qty: damaged,
      missing_qty: missing,
      notes: notes?.trim() || null,
    });
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <PackageCheck className="h-5 w-5 text-teal-700" />
          <span>Confirm delivery</span>
        </div>
      }
      subtitle="Confirm quantities received. This will be used for stock updates and discrepancy records."
      maxWidthClass="max-w-2xl"
      bodyClassName="p-6"
      footerClassName="p-6 pt-0"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 focus:ring-4 focus:ring-teal-500/15"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || loading}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white focus:ring-4",
              !canSubmit || loading
                ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                : "bg-teal-600 ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25"
            )}
          >
            {loading ? "Saving..." : "Confirm delivery"}
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
          <div className="text-xs font-extrabold text-slate-600">Purchase</div>
          <div className="mt-1 text-sm font-extrabold text-slate-900">
            {item?.reference_no || `Purchase #${item?.id ?? "—"}`}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            {item?.supplier_name ? `Supplier: ${item.supplier_name}` : null}
            {item?.product_name ? ` • Item: ${item.product_name}${item?.variant ? ` (${item.variant})` : ""}` : null}
          </div>
          <div className="mt-2 text-xs font-semibold text-slate-700">
            Ordered qty: <span className="font-extrabold">{orderedQty}</span>
          </div>
        </div>

        {orderedQty > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <div className="text-xs font-extrabold text-slate-700">Received good</div>
              <input
                value={receivedQty}
                onChange={(e) => setReceivedQty(e.target.value)}
                type="number"
                min="0"
                className="mt-2 w-full rounded-2xl bg-white px-3 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
                placeholder="0"
              />
              <div className="mt-1 text-xs text-slate-500">counts toward stock</div>
            </div>

            <div>
              <div className="text-xs font-extrabold text-slate-700">Damaged</div>
              <input
                value={damagedQty}
                onChange={(e) => setDamagedQty(e.target.value)}
                type="number"
                min="0"
                className="mt-2 w-full rounded-2xl bg-white px-3 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
                placeholder="0"
              />
              <div className="mt-1 text-xs text-slate-500">for discrepancy</div>
            </div>

            <div>
              <div className="text-xs font-extrabold text-slate-700">Missing</div>
              <input
                value={missingQty}
                onChange={(e) => setMissingQty(e.target.value)}
                type="number"
                min="0"
                className="mt-2 w-full rounded-2xl bg-white px-3 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
                placeholder="0"
              />
              <div className="mt-1 text-xs text-slate-500">for discrepancy</div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-rose-600/10 ring-1 ring-rose-700/10 p-4 text-sm font-semibold text-rose-900">
            Ordered qty is missing. Please make sure the row has a qty field.
          </div>
        )}

        <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-extrabold text-slate-700">Summary</div>
            <div className="text-xs font-semibold text-slate-600">
              Accounted: <span className="font-extrabold text-slate-900">{accounted}</span> of{" "}
              <span className="font-extrabold text-slate-900">{orderedQty}</span>
            </div>
          </div>

          {hasMismatch ? (
            <div className="mt-3 flex items-start gap-2 rounded-2xl bg-amber-600/10 ring-1 ring-amber-700/10 px-4 py-3 text-xs font-semibold text-amber-900">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <span>
                Total must equal ordered qty. Please adjust received, damaged, and missing so the sum becomes{" "}
                <span className="font-extrabold">{orderedQty}</span>.
              </span>
            </div>
          ) : (
            <div className="mt-3 text-xs text-slate-500">
              Tip: received good will be added to stock. damaged and missing will be recorded for follow up.
            </div>
          )}
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





