import React, { useState } from "react";
import { CheckCircle2, XCircle, ClipboardCheck } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function ReviewStockCountModal({
  open,
  onClose,
  item,
  onApprove,
  onReject,
  loading = false,
}) {
  const [note, setNote] = useState("");

  if (!open) return null;

  const submitApprove = () => {
    onApprove?.(note.trim() || null);
  };

  const submitReject = () => {
    onReject?.(note.trim() || null);
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-lg"
      layout="compact"
      title="Review stock count"
      subtitle="Approve or reject this submission."
      icon={ClipboardCheck}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submitReject}
            className={cx(
              "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4",
              loading ? "bg-slate-300 ring-slate-300 cursor-not-allowed" : "bg-rose-600 ring-rose-600 hover:bg-rose-700 focus:ring-rose-500/25"
            )}
            disabled={loading}
          >
            <XCircle className="h-4 w-4" />
            Reject
          </button>

          <button
            type="button"
            onClick={submitApprove}
            className={cx(
              "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4",
              loading ? "bg-slate-300 ring-slate-300 cursor-not-allowed" : "bg-teal-600 ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25"
            )}
            disabled={loading}
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve
          </button>
        </div>
      }
    >
      <div className="grid gap-3">
        <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4 text-sm text-slate-700">
          <div className="font-extrabold text-slate-900">
            {item?.product_name || "Item"}{" "}
            <span className="text-slate-500 font-semibold">
              {item?.variant ? `(${item.variant})` : ""}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            SKU: {item?.sku || "—"} • Location: {item?.location_name || "—"}
          </div>
          <div className="mt-2 text-xs text-slate-600">
            System: {item?.system_qty ?? 0} • Counted: {item?.counted_qty ?? 0} • Variance: {item?.variance_qty ?? 0}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Submitted by {item?.submitted_by || "—"} at {item?.submitted_at || "—"}
          </div>
        </div>

        <div>
          <div className="text-xs font-extrabold text-slate-700">Review note (optional)</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
            placeholder="Add a short note if needed..."
          />
        </div>
      </div>
    </ModalShell>
  );
}
