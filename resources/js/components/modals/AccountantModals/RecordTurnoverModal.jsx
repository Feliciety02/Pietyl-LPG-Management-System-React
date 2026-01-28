import React, { useEffect, useMemo, useState } from "react";
import { Banknote, Calculator, FileText, CalendarDays, User2, BadgeCheck, AlertTriangle } from "lucide-react";
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

function Field({ label, hint, children }) {
  return (
    <div className="space-y-2">
      <div>
        <div className="text-xs font-extrabold text-slate-700">{label}</div>
        {hint ? <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div> : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Input({ icon: Icon, ...props }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 transition focus-within:ring-2 focus-within:ring-teal-500/25">
      {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
      <input
        {...props}
        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}

function Textarea({ icon: Icon, ...props }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 transition focus-within:ring-2 focus-within:ring-teal-500/25">
      {Icon ? <Icon className="mt-0.5 h-4 w-4 text-slate-500" /> : null}
      <textarea
        {...props}
        className="w-full resize-none bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}

function InfoPill({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-3 py-2.5">
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
        <div className="text-[11px] font-extrabold text-slate-600">{label}</div>
      </div>
      <div className="mt-1 text-sm font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

function Banner({ ok, variance }) {
  return (
    <div
      className={cx(
        "rounded-3xl p-4 ring-1",
        ok ? "bg-teal-600/10 ring-teal-700/10" : "bg-amber-600/10 ring-amber-700/10"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-2xl bg-white ring-1 ring-white/60 flex items-center justify-center">
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
          <div className={cx("mt-1 text-xs", ok ? "text-teal-900/80" : "text-amber-900/80")}>
            {ok
              ? "Turned over cash matches expected cash."
              : `Preview variance is ${money(variance)}. Add a short note before saving.`}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecordTurnoverModal({ open, onClose, onSubmit, row, loading = false }) {
  const expected = useMemo(() => safeNum(row?.expected_amount), [row?.expected_amount]);

  const [remitted, setRemitted] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;

    const initialRemitted =
      row?.remitted_amount === null || row?.remitted_amount === undefined
        ? ""
        : String(row?.remitted_amount);

    setRemitted(initialRemitted);
    setNote(safeText(row?.note));
  }, [open, row?.id]);

  const remittedNum = useMemo(() => safeNum(remitted), [remitted]);
  const variancePreview = useMemo(() => remittedNum - expected, [remittedNum, expected]);
  const okPreview = variancePreview === 0;

  const needsNote = !okPreview;
  const noteOk = !needsNote || safeText(note).length >= 3;

  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (safeText(remitted) === "") return false;
    if (!noteOk) return false;
    return true;
  }, [loading, remitted, noteOk]);

  const submit = () => {
    if (!canSubmit) return;

    onSubmit?.({
      business_date: row?.business_date,
      remitted_amount: remittedNum,
      note: safeText(note) ? safeText(note) : null,
    });
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-lg"
      layout="compact"
      title="Edit turnover"
      subtitle="Enter the actual cash received. Variance is computed automatically."
      icon={Banknote}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25",
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
      <div className="grid gap-5">
        <Banner ok={okPreview} variance={variancePreview} />

        <div className="grid gap-3 sm:grid-cols-3">
          <InfoPill icon={CalendarDays} label="Business date" value={safeText(row?.business_date) || "Not available"} />
          <InfoPill icon={User2} label="Cashier" value={safeText(row?.cashier_name) || "Not available"} />
          <InfoPill icon={Calculator} label="Expected cash" value={money(expected)} />
        </div>

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-4">
          <div className="grid gap-4">
            <Field label="Turned over cash" hint="Amount received by the accountant">
              <Input
                icon={Banknote}
                value={remitted}
                onChange={(e) => setRemitted(e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
                autoFocus
              />
            </Field>

            <Field label="Variance preview" hint="Preview only. Final variance is computed and saved by the server">
              <Input icon={Calculator} value={money(variancePreview)} readOnly />
              <div className="text-[11px] font-semibold">
                {okPreview ? (
                  <span className="text-teal-700">Balanced</span>
                ) : (
                  <span className="text-amber-800">Variance detected</span>
                )}
              </div>
            </Field>

            <Field label="Note" hint={needsNote ? "Required when variance is not zero" : "Optional"}>
              <Textarea
                icon={FileText}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder={needsNote ? "Explain why there is a variance..." : "Add an optional note..."}
              />
              {!noteOk ? (
                <div className="text-[11px] font-semibold text-amber-800">
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
