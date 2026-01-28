import React, { useMemo } from "react";
import { ShieldAlert, CheckCircle2, Info, PackageSearch } from "lucide-react";
import ModalShell from "../ModalShell";

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

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="text-xs font-extrabold text-slate-700">{label}</div>
      {hint ? <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div> : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Metric({ label, value, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-50 ring-slate-200 text-slate-900",
    teal: "bg-teal-50 ring-teal-700/10 text-teal-950",
  };

  return (
    <div className={cx("rounded-2xl ring-1 px-4 py-3", tones[tone] || tones.slate)}>
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-extrabold tabular-nums">{value}</div>
    </div>
  );
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
  const total = useMemo(() => filledN + emptyN, [filledN, emptyN]);

  const reasonTrim = String(reason ?? "").trim();
  const canSave = Boolean(reasonTrim) && !submitting;

  const submit = () => {
    if (!canSave) return;
    onSubmit?.();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-5xl"
      layout="compact"
      title="Fix stock count"
      subtitle="Use only after a physical recount."
      icon={ShieldAlert}
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <Info className="h-4 w-4" />
            This change is logged for review
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={submit}
              disabled={!canSave}
              className={cx(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4",
                !canSave
                  ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                  : "bg-teal-600 ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25"
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center shrink-0">
              <PackageSearch className="h-5 w-5 text-slate-600" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-extrabold text-slate-900 truncate">
                {niceText(item?.product_name)}{" "}
                {item?.variant ? <span className="text-slate-500">({item.variant})</span> : null}
              </div>

              <div className="mt-2 text-xs font-semibold text-slate-600">
                SKU {niceText(item?.sku)}
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-2xl bg-amber-50 ring-1 ring-amber-700/10 px-3 py-2">
                <ShieldAlert className="h-4 w-4 text-amber-700 mt-0.5" />
                <div className="text-xs font-semibold text-amber-900 leading-relaxed">
                  Use this to correct a physical count. Always provide a reason.
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <Metric label="Total after save" value={total} tone="teal" />
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-12 items-end">
          <div className="lg:col-span-3">
            <Field label="Filled qty" hint="numbers only">
              <input
                value={filled}
                onChange={(e) => setFilled?.(e.target.value)}
                inputMode="numeric"
                placeholder="24"
                className="w-full rounded-2xl bg-white px-3 py-2 text-sm font-extrabold text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
              />
            </Field>
          </div>

          <div className="lg:col-span-3">
            <Field label="Empty qty" hint="numbers only">
              <input
                value={empty}
                onChange={(e) => setEmpty?.(e.target.value)}
                inputMode="numeric"
                placeholder="18"
                className="w-full rounded-2xl bg-white px-3 py-2 text-sm font-extrabold text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
              />
            </Field>
          </div>

          <div className="lg:col-span-6">
            <Field label="Reason" hint="required for audit trail">
              <input
                value={reason}
                onChange={(e) => setReason?.(e.target.value)}
                placeholder="Example: recount after delivery return"
                className="w-full rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
              />
            </Field>

            <div className="mt-3 grid grid-cols-3 gap-3">
              <Metric label="Filled" value={filledN} />
              <Metric label="Empty" value={emptyN} />
              <Metric label="Total" value={total} tone="teal" />
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
