import React, { useEffect, useState } from "react";
import ModalShell from "../ModalShell";
import { CreditCard, Info } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function MarkPaidModal({
  open,
  onClose,
  sale,
  onConfirm,
  loading = false,
}) {
  const [ref, setRef] = useState("");

  useEffect(() => {
    if (!open) return;
    setRef(sale?.payment_ref || "");
  }, [open, sale]);

  if (!sale) return null;

  const method = String(sale.payment_method || sale.method || "cash").toLowerCase();
  const needsRef = method === "gcash" || method === "card";

  const canSubmit = !loading && (!needsRef || String(ref || "").trim().length >= 4);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-md"
      title="Mark sale as paid"
      subtitle="Confirm that this transaction has been fully settled."
      icon={CreditCard}
      bodyClassName="p-6 grid gap-4"
      footerClassName="p-6 pt-0"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() =>
              onConfirm?.({
                sale_id: sale.id,
                payment_ref: needsRef ? String(ref || "").trim() : null,
              })
            }
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white focus:outline-none focus:ring-4",
              !canSubmit
                ? "bg-slate-300 cursor-not-allowed ring-slate-300"
                : "bg-teal-600 hover:bg-teal-700 focus:ring-teal-500/25 ring-teal-600"
            )}
            disabled={!canSubmit}
          >
            {loading ? "Saving..." : "Confirm payment"}
          </button>
        </div>
      }
    >
      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <div className="font-extrabold text-slate-900">Sale reference</div>
        <div className="mt-1 text-sm font-semibold text-slate-700">{sale.ref}</div>

        <div className="mt-2 text-xs text-slate-500">
          Customer: {sale.customer || sale.customer_name || "Walk in"}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
            <div className="text-[11px] font-extrabold text-slate-500">Amount</div>
            <div className="mt-1 text-base font-extrabold text-slate-900">
              ₱{Number(sale.total || 0).toLocaleString()}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
            <div className="text-[11px] font-extrabold text-slate-500">Method</div>
            <div className="mt-1 text-base font-extrabold text-slate-900">
              {method.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {needsRef ? (
        <div>
          <label className="text-xs font-extrabold text-slate-700">
            Payment reference number
          </label>
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-extrabold focus:outline-none focus:ring-4 focus:ring-teal-500/15"
            placeholder={method === "gcash" ? "Enter GCash reference" : "Enter card reference"}
          />
          <div className="mt-2 flex items-start gap-2 text-xs text-slate-500">
            <Info className="mt-0.5 h-4 w-4 text-slate-400" />
            <div className="leading-relaxed">
              Required for {method.toUpperCase()} so you can trace the settlement.
            </div>
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-slate-500">
          This action will mark the sale as fully paid and lock further edits.
        </div>
      )}
    </ModalShell>
  );
}
