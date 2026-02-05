import React, { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Calculator,
  FileText,
  CalendarDays,
  User2,
  BadgeCheck,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeText(v) {
  return String(v ?? "").trim();
}

function safeNum(v) {
  const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function money(v) {
  const n = safeNum(v);
  return n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });
}

function Banner({ ok, variance }) {
  return (
    <div
      className={cx(
        "rounded-2xl p-3 ring-1",
        ok ? "bg-teal-600/10 ring-teal-700/10" : "bg-amber-600/10 ring-amber-700/10"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
          {ok ? (
            <BadgeCheck className="h-5 w-5 text-teal-700" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-800" />
          )}
        </div>

        <div className="min-w-0">
          <div className={cx("text-sm font-extrabold", ok ? "text-teal-900" : "text-amber-900")}>
            {ok ? "Balanced turnover" : "Variance detected"}
          </div>
          <div className={cx("mt-0.5 text-xs", ok ? "text-teal-900/80" : "text-amber-900/80")}>
            {ok
              ? "Turned over cash matches expected cash."
              : `Preview variance is ${money(variance)}. Add a short note before saving.`}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-white ring-1 ring-slate-200 flex items-center justify-center shrink-0">
          {Icon ? <Icon className="h-4 w-4 text-slate-600" /> : null}
        </div>

        <div className="min-w-0">
          <div className="text-[11px] font-extrabold text-slate-600">{label}</div>
          <div className="mt-0.5 text-sm font-extrabold text-slate-900 truncate">{value}</div>
        </div>
      </div>
    </div>
  );
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

function Input({ icon: Icon, ...props }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 transition focus-within:ring-2 focus-within:ring-teal-500/25">
      {Icon ? <Icon className="h-4 w-4 text-slate-500 shrink-0" /> : null}
      <input
        {...props}
        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}

function PesoInput({ value, onChange, placeholder = "0.00", autoFocus, disabled }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 transition focus-within:ring-2 focus-within:ring-teal-500/25">
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-200 shrink-0">
        <span className="text-sm font-extrabold text-slate-700">₱</span>
      </div>

      <input
        value={value}
        onChange={(e) => {
          const raw = e.target.value;

          const cleaned = raw
            .replace(/[^0-9.]/g, "")
            .replace(/^(\d*)\.(\d*).*$/, (m, a, b) => `${a}.${b}`);

          onChange?.(cleaned);
        }}
        onKeyDown={(e) => {
          const allowed = [
            "Backspace",
            "Delete",
            "ArrowLeft",
            "ArrowRight",
            "Home",
            "End",
            "Tab",
            "Enter",
          ];
          if (allowed.includes(e.key)) return;

          const isDigit = /^[0-9]$/.test(e.key);
          const isDot = e.key === ".";

          if (!isDigit && !isDot) {
            e.preventDefault();
            return;
          }

          if (isDot && String(value || "").includes(".")) {
            e.preventDefault();
          }
        }}
        inputMode="decimal"
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}

export function RecordTurnoverModal({
  open,
  onClose,
  onSubmit,
  row,
  methods = [],
  loading = false,
}) {
  const expected = useMemo(() => safeNum(row?.expected_cash), [row?.expected_cash]);

  const [remitted, setRemitted] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;

    const initialRemitted =
      row?.remitted_cash_amount === null || row?.remitted_cash_amount === undefined
        ? ""
        : String(row?.remitted_cash_amount);

    setRemitted(initialRemitted);
    setNote(safeText(row?.note));
  }, [open, row?.id]);

  const remittedNum = useMemo(() => safeNum(remitted), [remitted]);
  const variancePreview = useMemo(() => remittedNum - expected, [remittedNum, expected]);
  const okPreview = variancePreview === 0;

  const needsNote = !okPreview;
  const noteOk = !needsNote || safeText(note).length >= 3;

  const expectedNonCashTotal = useMemo(() => {
    if (!row?.expected_by_method) return 0;
    return methods.reduce((sum, method) => {
      if (!method.is_cashless) return sum;
      const value = safeNum(row?.expected_by_method?.[method.method_key]);
      return sum + value;
    }, 0);
  }, [methods, row?.expected_by_method]);

  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (safeText(remitted) === "") return false;
    if (!noteOk) return false;
    return true;
  }, [loading, remitted, noteOk]);

  const submit = () => {
    if (!canSubmit) return;

    onSubmit?.({
      cash_counted: remittedNum,
      note: safeText(note) ? safeText(note) : null,
    });
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-6xl"
      layout="compact"
      title="Edit turnover"
      subtitle="Wide view for faster review and entry"
      icon={Banknote}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className={cx(
              "w-full sm:w-auto rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25",
              !canSubmit
                ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                : "bg-teal-600 ring-teal-600 hover:bg-teal-700"
            )}
            title={!noteOk ? "Add a short note to save" : "Save turnover"}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Column 1 */}
        <div className="grid gap-3">
          <Banner ok={okPreview} variance={variancePreview} />

          <InfoCard
            icon={CalendarDays}
            label="Business date"
            value={safeText(row?.business_date) || "Not available"}
          />
          <InfoCard
            icon={User2}
            label="Cashier"
            value={safeText(row?.cashier_name) || "Not available"}
          />
          <InfoCard icon={ShieldCheck} label="Non cash methods" value={`${methods.length} methods`} />
        </div>

        {/* Column 2 */}
        <div className="grid gap-3">
          <InfoCard icon={Calculator} label="Expected cash" value={money(expected)} />
          <InfoCard icon={FileText} label="Expected non cash" value={money(expectedNonCashTotal)} />

          {methods.length ? (
            <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-3">
              <div className="text-[11px] font-extrabold text-slate-600">Non cash breakdown</div>
              <div className="mt-2 max-h-[170px] overflow-auto pr-1">
                <div className="grid gap-2">
                  {methods.map((method) => (
                    <div
                      key={method.method_key}
                      className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 ring-1 ring-slate-200"
                    >
                      <span className="text-xs font-semibold text-slate-600 truncate pr-3">
                        {method.name}
                      </span>
                      <span className="text-sm font-extrabold text-slate-900 shrink-0">
                        {money(row?.expected_by_method?.[method.method_key] ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Column 3 */}
        <div className="grid gap-3">
          <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-3">
            <div className="grid gap-3">
              <Field label="Turned over cash" hint="Amount received by the accountant">
                <PesoInput
                  value={remitted}
                  onChange={(next) => setRemitted(next)}
                  placeholder="0.00"
                  autoFocus
                  disabled={loading}
                />
              </Field>

              <Field label="Variance preview" hint="Preview only. Final variance is computed and saved by the server">
                <Input icon={Calculator} value={money(variancePreview)} readOnly />
                <div className="mt-2 text-[11px] font-semibold">
                  {okPreview ? (
                    <span className="text-teal-700">Balanced</span>
                  ) : (
                    <span className="text-amber-800">Variance detected</span>
                  )}
                </div>
              </Field>
            </div>
          </div>

          <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-3">
            <Field label="Note" hint={needsNote ? "Required when variance is not zero" : "Optional"}>
              <div className="flex items-start gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 transition focus-within:ring-2 focus-within:ring-teal-500/25">
                <FileText className="mt-0.5 h-4 w-4 text-slate-500 shrink-0" />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder={needsNote ? "Explain why there is a variance..." : "Add an optional note..."}
                  className="w-full resize-none bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>

              {!noteOk ? (
                <div className="mt-2 text-[11px] font-semibold text-amber-800">
                  Please add a short note (at least 3 characters).
                </div>
              ) : null}
            </Field>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

export default RecordTurnoverModal;
