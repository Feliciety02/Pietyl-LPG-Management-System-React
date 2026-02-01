import React, { useMemo } from "react";
import { ShieldAlert, CheckCircle2, Info, PackageSearch, ArrowRightLeft } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeInt(v) {
  const n = Number(String(v ?? "").trim());
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  return Math.floor(n);
}

function niceText(v) {
  if (v == null) return "--";
  const s = String(v).trim();
  return s ? s : "--";
}

function clampNumericInput(raw) {
  const s = String(raw ?? "");
  const digits = s.replace(/[^\d]/g, "");
  if (!digits) return "";
  const n = Math.min(999999, Number(digits));
  return String(Number.isFinite(n) ? n : "");
}

function Field({ label, hint, error, children }) {
  return (
    <div>
      <div className="text-xs font-extrabold text-slate-700">{label}</div>
      {hint ? <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div> : null}
      <div className="mt-2">{children}</div>
      {error ? <div className="mt-2 text-xs font-semibold text-rose-700">{error}</div> : null}
    </div>
  );
}

function Metric({ label, value, tone = "slate", sub }) {
  const tones = {
    slate: "bg-slate-50 ring-slate-200 text-slate-900",
    teal: "bg-teal-50 ring-teal-700/10 text-teal-950",
    amber: "bg-amber-50 ring-amber-700/10 text-amber-950",
  };

  return (
    <div className={cx("rounded-2xl ring-1 px-4 py-3", tones[tone] || tones.slate)}>
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-extrabold tabular-nums">{value}</div>
      {sub ? <div className="mt-1 text-[11px] text-slate-500">{sub}</div> : null}
    </div>
  );
}

function DeltaPill({ delta }) {
  const n = Number(delta);
  const isZero = n === 0;
  const isUp = n > 0;

  const cls = isZero
    ? "bg-slate-100 text-slate-700 ring-slate-200"
    : isUp
    ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
    : "bg-rose-600/10 text-rose-900 ring-rose-700/10";

  const sign = isZero ? "+/-" : isUp ? "+" : "-";

  return (
    <span
      className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1", cls)}
    >
      {sign}
      {Math.abs(n)}
    </span>
  );
}

export default function RecountStockModal({
  open,
  onClose,
  onSubmit,
  item,
  items = [],
  onPickItem,
  filled,
  empty,
  reason,
  setFilled,
  setEmpty,
  setReason,
  submitting = false,
  error = "",
  title = "Fix stock count",
  subtitle = "Use only after a physical recount.",
  submitLabel = "Save changes",
}) {
  const filledN = safeInt(filled);
  const emptyN = safeInt(empty);
  const total = useMemo(() => filledN + emptyN, [filledN, emptyN]);

  const reasonTrim = String(reason ?? "").trim();

  const filledErr = filled !== "" && !/^\d+$/.test(String(filled)) ? "Numbers only" : "";
  const emptyErr = empty !== "" && !/^\d+$/.test(String(empty)) ? "Numbers only" : "";
  const reasonErr = !reasonTrim ? "Reason is required" : "";

  const canSave = Boolean(reasonTrim) && !filledErr && !emptyErr && !submitting && Boolean(item || items.length === 0);

  const currentFilled = safeInt(item?.current_filled);
  const currentEmpty = safeInt(item?.current_empty);
  const currentTotal = currentFilled + currentEmpty;

  const hasCurrent = Number.isFinite(Number(item?.current_filled)) || Number.isFinite(Number(item?.current_empty));
  const deltaFilled = filledN - currentFilled;
  const deltaEmpty = emptyN - currentEmpty;
  const deltaTotal = total - currentTotal;

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
      title={title}
      subtitle={subtitle}
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
              title={!reasonTrim ? "Add a reason to enable saving" : undefined}
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? "Saving..." : submitLabel}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid gap-4">
        {/* Item header */}
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-2xl bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center shrink-0">
                <PackageSearch className="h-5 w-5 text-slate-700" />
              </div>

              <div className="min-w-0 flex-1">
                {!item && items.length ? (
                  <div className="max-w-xl">
                    <div className="text-xs font-extrabold text-slate-700">Select item</div>
                    <select
                      className="mt-2 w-full rounded-2xl bg-white px-3 py-2 text-sm font-extrabold text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
                      onChange={(e) => onPickItem?.(e.target.value)}
                      defaultValue=""
                      disabled={submitting}
                    >
                      <option value="" disabled>
                        Choose a product
                      </option>
                      {items.map((x) => (
                        <option key={x.id} value={String(x.id)}>
                          {x.product_name} {x.variant ? `(${x.variant})` : ""} {x.sku ? `- ${x.sku}` : ""}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 text-[11px] text-slate-500">
                      Pick the exact variant before applying the recount.
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-xs font-extrabold text-slate-500">Item being recounted</div>
                    <div className="mt-1 text-sm font-extrabold text-slate-900 truncate">
                      {niceText(item?.product_name)}{" "}
                      {item?.variant ? <span className="text-slate-500">{item.variant}</span> : null}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      SKU <span className="font-semibold text-slate-700">{niceText(item?.sku)}</span>
                    </div>

                    <div className="mt-3 flex items-start gap-2 rounded-2xl bg-amber-50 ring-1 ring-amber-700/10 px-3 py-2">
                      <ShieldAlert className="h-4 w-4 text-amber-700 mt-0.5" />
                      <div className="text-xs font-semibold text-amber-900 leading-relaxed">
                        Use this only to correct a physical count. Always provide a reason.
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="hidden lg:block">
                <Metric label="Total after save" value={total} tone="teal" sub="Filled + Empty" />
              </div>
            </div>
          </div>
        </div>

        {/* Counts */}
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7 rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
            <div className="p-5">
              <div className="text-xs font-extrabold text-slate-700">Enter new counts</div>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field label="Filled qty" hint="numbers only" error={filledErr}>
                  <input
                    value={filled}
                    onChange={(e) => setFilled?.(clampNumericInput(e.target.value))}
                    inputMode="numeric"
                    placeholder="24"
                    disabled={submitting}
                    className="w-full rounded-2xl bg-white px-3 py-2 text-sm font-extrabold text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
                  />
                </Field>
                <Field label="Empty qty" hint="numbers only" error={emptyErr}>
                  <input
                    value={empty}
                    onChange={(e) => setEmpty?.(clampNumericInput(e.target.value))}
                    inputMode="numeric"
                    placeholder="18"
                    disabled={submitting}
                    className="w-full rounded-2xl bg-white px-3 py-2 text-sm font-extrabold text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Reason" hint="required for audit trail" error={reasonErr && !submitting ? reasonErr : ""}>
                  <input
                    value={reason}
                    onChange={(e) => setReason?.(e.target.value)}
                    placeholder="Example: recount after delivery return"
                    disabled={submitting}
                    className="w-full rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
                  />
                </Field>
                {error ? <div className="mt-2 text-xs font-semibold text-rose-700">{error}</div> : null}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
            <div className="p-5">
              <div className="text-xs font-extrabold text-slate-700">Totals</div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <Metric label="Filled" value={filledN} />
                <Metric label="Empty" value={emptyN} />
                <Metric label="Total" value={total} tone="teal" />
              </div>

              {hasCurrent ? (
                <div className="mt-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-extrabold text-slate-700">Change preview</div>
                    <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                      <ArrowRightLeft className="h-4 w-4" />
                      current {"->"} new
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3">
                    <Metric
                      label="Filled"
                      value={`${currentFilled} -> ${filledN}`}
                      tone="slate"
                      sub={
                        <span className="inline-flex mt-1">
                          <DeltaPill delta={deltaFilled} />
                        </span>
                      }
                    />
                    <Metric
                      label="Empty"
                      value={`${currentEmpty} -> ${emptyN}`}
                      tone="slate"
                      sub={
                        <span className="inline-flex mt-1">
                          <DeltaPill delta={deltaEmpty} />
                        </span>
                      }
                    />
                    <Metric
                      label="Total"
                      value={`${currentTotal} -> ${total}`}
                      tone="teal"
                      sub={
                        <span className="inline-flex mt-1">
                          <DeltaPill delta={deltaTotal} />
                        </span>
                      }
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
