import React, { useMemo } from "react";
import { ShieldAlert, CheckCircle2, X } from "lucide-react";
import ModalShell from "./ModalShell";
import { router } from "@inertiajs/react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeNumber(v) {
  const n = Number(v);
  if (Number.isNaN(n) || n < 0) return 0;
  return n;
}

export default function RecountStockModal({
  open,
  onClose,
  onSubmit,
  item,
  filled,
  empty,
  reason,
  setFilled,
  setEmpty,
  setReason,
  submitting = false,
}) {
  const filledN = safeNumber(filled);
  const emptyN = safeNumber(empty);
  const computedTotal = useMemo(() => filledN + emptyN, [filledN, emptyN]);

  const canSave = Boolean(String(reason || "").trim()) && !submitting;

  const handleSubmit = () => {
    router.post(
      `/dashboard/inventory/counts/${item.id}`,
      {
        filled_qty: filledN,
        empty_qty: emptyN,
        reason,
      },
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => onClose(),
      }
    );
  };

  return (
    <ModalShell open={open} onClose={onClose} maxWidthClass="max-w-xl">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-base font-extrabold text-slate-900">
            Recount and fix numbers
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Enter what you counted physically. Add a reason so the owner can review later.
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-2xl bg-white p-2 ring-1 ring-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-500/20"
          title="Close"
        >
          <X className="h-4 w-4 text-slate-600" />
        </button>
      </div>

      {/* Body */}
      <div className="p-6">
        <form
            onSubmit={(e) => {
            e.preventDefault();
            if (!canSave) return;
            handleSubmit();
          }}
          className="grid gap-4"
        >
          <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
            <div className="text-sm font-extrabold text-slate-900">
              {item?.product_name || "Product"}{" "}
              <span className="text-slate-500 font-semibold">
                ({item?.variant || "—"})
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-600">{item?.sku || ""}</div>
          </div>

          <div className="rounded-2xl bg-amber-50 ring-1 ring-amber-700/10 p-4">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-700 mt-0.5" />
              <div className="text-sm text-amber-900">
                Use this only after a physical recount. Normal stock changes happen through Purchases and Movements.
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-slate-600">
                Filled cylinders (ready to sell)
              </div>
              <input
                value={filled}
                onChange={(e) => setFilled?.(e.target.value)}
                inputMode="numeric"
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-teal-500/20"
                placeholder="Example: 24"
              />
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-600">
                Empty cylinders (to refill)
              </div>
              <input
                value={empty}
                onChange={(e) => setEmpty?.(e.target.value)}
                inputMode="numeric"
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-teal-500/20"
                placeholder="Example: 18"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-extrabold text-slate-900">
                Total after recount
              </div>
              <div className="text-sm font-extrabold text-slate-900">
                {computedTotal}
              </div>
            </div>
            <div className="mt-1 text-xs text-slate-600">
              Total is computed automatically (filled + empty).
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-600">Reason (required)</div>
            <textarea
              value={reason}
              onChange={(e) => setReason?.(e.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-teal-500/20"
              placeholder="Example: recount after delivery return, found 2 damaged cylinders"
            />
            <div className="mt-2 flex items-start gap-2 text-xs text-slate-600">
              <ShieldAlert className="h-4 w-4 text-slate-500 mt-0.5" />
              <div>This will be saved in audit logs for the owner to review.</div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSave}
              className={cx(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold text-white transition focus:ring-4 focus:ring-teal-500/25",
                canSave ? "bg-teal-600 hover:bg-teal-700" : "bg-slate-300 cursor-not-allowed"
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? "Saving..." : "Save correction"}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}
