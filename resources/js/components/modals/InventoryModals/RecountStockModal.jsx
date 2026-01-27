import React, { useMemo } from "react";
import { ShieldAlert, CheckCircle2, Info } from "lucide-react";
import ModalShell from "../ModalShell";
import { router } from "@inertiajs/react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeNumber(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function niceText(v) {
  if (v == null) return "—";
  const s = String(v).trim();
  return s ? s : "—";
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3">
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

export default function RecountStockModal({
  open,
  onClose,
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
  const total = useMemo(() => filledN + emptyN, [filledN, emptyN]);

  const canSave = Boolean(String(reason || "").trim()) && !submitting;

  const submit = () => {
    if (!item?.id) return;

    router.post(
      `/dashboard/inventory/counts/${item.id}`,
      { filled_qty: filledN, empty_qty: emptyN, reason },
      { preserveScroll: true, preserveState: true, onSuccess: () => onClose?.() }
    );
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Fix stock count"
      subtitle="Use this only after a physical count."
      maxWidthClass="max-w-3xl"
      bodyClassName="p-6"
      footerClassName="p-6 pt-0"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="h-4 w-4" />
            Owner can review this change later
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!canSave}
              onClick={submit}
              className={cx(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold text-white focus:ring-4 focus:ring-teal-500/25",
                canSave ? "bg-teal-600 hover:bg-teal-700" : "bg-slate-300 cursor-not-allowed"
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid gap-4">
        {/* PRODUCT + NOTICE (ROW) */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2 rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
            <div className="text-sm font-extrabold text-slate-900 truncate">
              {niceText(item?.product_name)}{" "}
              {item?.variant ? (
                <span className="text-slate-500">({item.variant})</span>
              ) : null}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              SKU {niceText(item?.sku)}
            </div>
          </div>

          <div className="rounded-2xl bg-amber-50 ring-1 ring-amber-700/10 p-4">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-700 mt-0.5" />
              <div className="text-xs text-amber-900">
                Use only after a real recount
              </div>
            </div>
          </div>
        </div>

        {/* INPUTS + TOTAL (ONE LINE) */}
        <div className="grid gap-3 sm:grid-cols-5">
          <div>
            <div className="text-xs font-semibold text-slate-600">Filled</div>
            <input
              value={filled}
              onChange={(e) => setFilled?.(e.target.value)}
              inputMode="numeric"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base font-extrabold focus:ring-4 focus:ring-teal-500/15"
              placeholder="24"
            />
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-600">Empty</div>
            <input
              value={empty}
              onChange={(e) => setEmpty?.(e.target.value)}
              inputMode="numeric"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base font-extrabold focus:ring-4 focus:ring-teal-500/15"
              placeholder="18"
            />
          </div>

          <Stat label="Filled" value={filledN} />
          <Stat label="Empty" value={emptyN} />
          <Stat label="Total" value={total} />
        </div>

        {/* REASON (SHORT) */}
        <div>
          <div className="text-xs font-semibold text-slate-600">Reason</div>
          <textarea
            value={reason}
            onChange={(e) => setReason?.(e.target.value)}
            rows={2}
            className="mt-1 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:ring-4 focus:ring-teal-500/15"
            placeholder="Example: recount after delivery return"
          />
        </div>
      </div>
    </ModalShell>
  );
}
