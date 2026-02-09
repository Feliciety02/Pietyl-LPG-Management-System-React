import React, { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Columns, CalendarDays } from "lucide-react";
import TableHeaderCell from "@/components/Table/TableHeaderCell";

import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatCurrency(value) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "N/A";
  return n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });
}

function formatDate(value) {
  if (!value) return "N/A";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return String(value);
  }
}

function Badge({ tone = "teal", children }) {
  const palette = {
    teal: "bg-teal-600/10 text-teal-900 ring-teal-600/20",
    amber: "bg-amber-600/10 text-amber-900 ring-amber-600/20",
    slate: "bg-slate-100 text-slate-800 ring-slate-200",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-2xl px-3 py-1 text-xs font-extrabold ring-1",
        palette[tone] || palette.teal
      )}
    >
      {children}
    </span>
  );
}

function TotalsStat({ label, value, tone = "white" }) {
  const bg =
    tone === "teal"
      ? "bg-teal-600/10 ring-teal-600/20 text-teal-900"
      : tone === "amber"
      ? "bg-amber-600/10 ring-amber-600/20 text-amber-900"
      : "bg-white ring-slate-200 text-slate-900";
  return (
    <div className={`rounded-2xl px-4 py-3 ring-1 ${bg}`}>
      <div className="text-[11px] font-extrabold text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-extrabold tabular-nums">{value}</div>
    </div>
  );
}

export default function LedgerReferenceModal({
  open,
  onClose,
  loading,
  error,
  referenceId,
  referenceType,
  postedAt,
  lines = [],
  totals = null,
  balanced = true,
}) {
  const summaryTotals = totals || { debit: 0, credit: 0, net: 0 };
  const netTone = summaryTotals.net >= 0 ? "teal" : "amber";
  const refLabel = referenceType ? String(referenceType).toUpperCase() : "ENTRY";

  const headerLabel = useMemo(() => {
    if (loading) return "Loading ledger lines...";
    if (referenceId) return referenceId;
    return "Reference details";
  }, [loading, referenceId]);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Transaction lines"
      subtitle="All ledger lines tied to the selected reference"
      icon={Columns}
      maxWidthClass="max-w-5xl"
      layout="compact"
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <div className="text-sm font-extrabold text-slate-900">{headerLabel}</div>
          <div className="mt-1 text-xs text-slate-500">
            {referenceId ? `Posted ${formatDate(postedAt)}` : "Reference not selected"}
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end flex-wrap">
          <Badge tone="slate">{refLabel}</Badge>
          {loading ? null : balanced ? (
            <Badge tone="teal">
              <CheckCircle2 className="h-3 w-3" />
              Balanced
            </Badge>
          ) : (
            <Badge tone="amber">
              <AlertTriangle className="h-3 w-3" />
              Totals mismatch
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <TotalsStat label="Total debit" value={formatCurrency(summaryTotals.debit)} tone="teal" />
        <TotalsStat label="Total credit" value={formatCurrency(summaryTotals.credit)} />
        <TotalsStat label="Net (debit - credit)" value={formatCurrency(summaryTotals.net)} tone={netTone} />
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl bg-rose-50 ring-1 ring-rose-700/20 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="mt-6 rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500 uppercase tracking-wide">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            Ledger lines
          </div>
          <div className="text-xs font-semibold text-slate-500">
            {loading ? "Loading..." : `${lines.length} line${lines.length === 1 ? "" : "s"}`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-white">
              <tr className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                <TableHeaderCell label="Account" className="px-5 py-3" />
                <TableHeaderCell label="Description" className="px-5 py-3" />
                <TableHeaderCell label="Debit" className="px-5 py-3" contentClassName="justify-end" />
                <TableHeaderCell label="Credit" className="px-5 py-3" contentClassName="justify-end" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                    Loading transaction lines...
                  </td>
                </tr>
              ) : lines.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center font-semibold text-slate-500">
                    No ledger lines found for this reference.
                  </td>
                </tr>
              ) : (
                lines.map((line) => (
                  <tr key={line.id}>
                    <td className="px-5 py-4 font-extrabold text-slate-900">
                      {line.account_code}
                      <div className="text-xs font-semibold text-slate-500">{line.account_name}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{line.description || "N/A"}</td>
                    <td className="px-5 py-4 text-right font-semibold tabular-nums">
                      {formatCurrency(line.debit)}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold tabular-nums">
                      {formatCurrency(line.credit)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ModalShell>
  );
}