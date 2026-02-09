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

/* ---------------- UI primitives ---------------- */

function Field({ label, hint, error, required = false, children }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <div className="text-xs font-extrabold text-slate-700">{label}</div>
        {required ? (
          <div className="text-[11px] font-semibold text-slate-400">required</div>
        ) : null}
      </div>
      {hint ? <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div> : null}
      <div className="mt-2">{children}</div>
      {error ? <div className="mt-2 text-xs font-semibold text-rose-700">{error}</div> : null}
    </div>
  );
}

function InputShell({ icon: Icon, children, className = "" }) {
  return (
    <div
      className={cx(
        "h-11 w-full flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3",
        "focus-within:ring-teal-500/30",
        className
      )}
    >
      {Icon ? <Icon className="h-4 w-4 text-slate-500 shrink-0" /> : null}
      {children}
    </div>
  );
}

function StatPill({ label, value, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-50 ring-slate-200 text-slate-900",
    teal: "bg-teal-50 ring-teal-700/10 text-teal-950",
    amber: "bg-amber-50 ring-amber-700/10 text-amber-950",
  };

  return (
    <div className={cx("rounded-2xl ring-1 px-4 py-3", tones[tone] || tones.slate)}>
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-extrabold tabular-nums">{value}</div>
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

function ChangeRow({ label, current, next, deltaTone = "slate" }) {
  const delta = safeInt(next) - safeInt(current);
  const rowTone =
    deltaTone === "teal" ? "bg-teal-50 ring-teal-700/10" : "bg-slate-50 ring-slate-200";

  return (
    <div className={cx("rounded-2xl ring-1 px-4 py-3", rowTone)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-extrabold text-slate-700">{label}</div>
          <div className="mt-1 text-sm font-extrabold text-slate-900 tabular-nums">
            {safeInt(current)} <span className="text-slate-400 font-semibold">{"->"}</span> {safeInt(next)}
          </div>
        </div>

        <div className="shrink-0 pt-0.5">
          <DeltaPill delta={delta} />
        </div>
      </div>
    </div>
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

  const canSave =
    Boolean(reasonTrim) &&
    !filledErr &&
    !emptyErr &&
    !submitting &&
    Boolean(item || items.length === 0);

  const currentFilled = safeInt(item?.current_filled);
  const currentEmpty = safeInt(item?.current_empty);
  const currentTotal = currentFilled + currentEmpty;

  const hasCurrent =
    Number.isFinite(Number(item?.current_filled)) || Number.isFinite(Number(item?.current_empty));

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
        {/* Header / item selection */}
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-2xl bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center shrink-0">
                <PackageSearch className="h-5 w-5 text-slate-700" />
              </div>

              <div className="min-w-0 flex-1">
                {!item && items.length ? (
                  <div className="max-w-2xl">
                    <div className="text-xs font-extrabold text-slate-700">Select item</div>
                    <select
                      className="mt-2 h-11 w-full rounded-2xl bg-white px-3 text-sm font-extrabold text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
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

                    <div className="mt-3 rounded-2xl bg-amber-50 ring-1 ring-amber-700/10 px-3 py-2">
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="h-4 w-4 text-amber-700 mt-0.5" />
                        <div className="text-xs font-semibold text-amber-900 leading-relaxed">
                          Use this only to correct a physical count. Always provide a reason.
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Keep just 1 KPI here to avoid redundancy */}
              <div className="hidden lg:block">
                <StatPill label="New total" value={total} tone="teal" />
              </div>
            </div>
          </div>
        </div>

        {/* Main 2-column layout */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* LEFT: inputs */}
          <div className="lg:col-span-7 rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
            <div className="p-5">
              <div className="text-xs font-extrabold text-slate-700">Enter new counts</div>

              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field label="Filled qty" hint="numbers only" error={filledErr} required>
                  <InputShell>
                    <input
                      value={filled}
                      onChange={(e) => setFilled?.(clampNumericInput(e.target.value))}
                      inputMode="numeric"
                      placeholder="24"
                      disabled={submitting}
                      className="w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </InputShell>
                </Field>

                <Field label="Empty qty" hint="numbers only" error={emptyErr} required>
                  <InputShell>
                    <input
                      value={empty}
                      onChange={(e) => setEmpty?.(clampNumericInput(e.target.value))}
                      inputMode="numeric"
                      placeholder="18"
                      disabled={submitting}
                      className="w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </InputShell>
                </Field>
              </div>

              <div className="mt-4">
                <Field
                  label="Reason"
                  hint="required for audit trail"
                  error={reasonErr && !submitting ? reasonErr : ""}
                  required
                >
                  <InputShell>
                    <input
                      value={reason}
                      onChange={(e) => setReason?.(e.target.value)}
                      placeholder="Example: recount after delivery return"
                      disabled={submitting}
                      className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </InputShell>
                </Field>
                {error ? <div className="mt-2 text-xs font-semibold text-rose-700">{error}</div> : null}
              </div>
            </div>
          </div>

          {/* RIGHT: preview + totals (no redundant KPI grid) */}
          <div className="lg:col-span-5 rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-extrabold text-slate-700">Preview</div>
                {hasCurrent ? (
                  <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                    <ArrowRightLeft className="h-4 w-4" />
                    current {"->"} new
                  </div>
                ) : null}
              </div>

              {/* Compact totals (3 pills, not a big KPI wall) */}
              <div className="mt-3 grid grid-cols-3 gap-3">
                <StatPill label="Filled" value={filledN} />
                <StatPill label="Empty" value={emptyN} />
                <StatPill label="Total" value={total} tone="teal" />
              </div>

              {hasCurrent ? (
                <div className="mt-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
                  <div className="text-xs font-extrabold text-slate-700">Change breakdown</div>

                  <div className="mt-3 grid gap-3">
                    <ChangeRow label="Filled" current={currentFilled} next={filledN} />
                    <ChangeRow label="Empty" current={currentEmpty} next={emptyN} />
                    <ChangeRow label="Total" current={currentTotal} next={total} deltaTone="teal" />
                  </div>

                  <div className="mt-3 text-[11px] text-slate-500">
                    Deltas show how much the saved values will adjust the recorded stock.
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3 text-xs text-slate-600">
                  Current counts are not available for comparison. You can still save the new recount.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
