import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Filter,
  XCircle,
  Check,
  RotateCcw,
} from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatTime(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return String(value);
  }
}

function money(v) {
  const n = Number(String(v ?? 0).replace(/[^0-9.\-]/g, ""));
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });
}

function safeText(v) {
  return String(v ?? "").trim();
}

function Pill({ tone = "slate", children }) {
  const map = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    teal: "bg-teal-600/10 text-teal-900 ring-teal-700/10",
    amber: "bg-amber-600/10 text-amber-900 ring-amber-700/10",
    rose: "bg-rose-600/10 text-rose-900 ring-rose-700/10",
    white: "bg-white text-slate-800 ring-slate-200",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold ring-1 whitespace-nowrap",
        map[tone] || map.slate
      )}
    >
      {children}
    </span>
  );
}

function MiniStat({ label, value, tone = "white" }) {
  const tones = {
    white: "bg-white ring-slate-200 text-slate-900",
    teal: "bg-teal-600/10 ring-teal-700/10 text-teal-950",
    amber: "bg-amber-600/10 ring-amber-700/10 text-amber-950",
  };

  return (
    <div className={cx("rounded-2xl px-4 py-3 ring-1", tones[tone] || tones.white)}>
      <div className="text-[11px] font-extrabold text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-extrabold tabular-nums">{value}</div>
    </div>
  );
}

function PrimaryButton({ disabled, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold ring-1 transition focus:outline-none focus:ring-4",
        disabled
          ? "bg-slate-200 text-slate-500 ring-slate-200 cursor-not-allowed"
          : "bg-teal-600 text-white ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25",
        className
      )}
    >
      {children}
    </button>
  );
}

function GhostButton({ disabled, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold ring-1 transition focus:outline-none focus:ring-4",
        disabled
          ? "text-slate-400 ring-slate-200 cursor-not-allowed"
          : "text-slate-800 ring-slate-200 hover:bg-slate-50 focus:ring-teal-500/15",
        className
      )}
    >
      {children}
    </button>
  );
}

export default function NonCashVerificationModal({ open, onClose, row, onSubmit }) {
  const [transactions, setTransactions] = useState([]);
  const [confirmedIds, setConfirmedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [method, setMethod] = useState("all");

  useEffect(() => {
    if (!open) {
      setTransactions([]);
      setConfirmedIds([]);
      setError("");
      setQ("");
      setMethod("all");
      setLoading(false);
      setSaving(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !row?.business_date || !row?.cashier_user_id) return;

    setLoading(true);
    setError("");

    axios
      .get("/dashboard/accountant/remittances/cashless-transactions", {
        params: {
          business_date: row.business_date,
          cashier_user_id: row.cashier_user_id,
        },
      })
      .then(({ data }) => {
        const list = Array.isArray(data?.transactions) ? data.transactions : [];
        const normalized = list
          .map((t) => ({
            id: t.id,
            paid_at: t.paid_at || t.created_at || "",
            method_name: t.method_name || t.payment_method || "Cashless",
            amount: Number.isFinite(Number(t.amount)) ? Number(t.amount) : 0,
            reference: t.reference || t.reference_number || t.receipt_number || "",
            verified: Boolean(t.verified || t.is_verified),
            is_cashless: t.is_cashless !== false,
          }))
          .filter((t) => t.id && t.is_cashless);

        setTransactions(normalized);
      })
      .catch((err) => {
        const msg = err?.response?.data?.message;
        setError(msg || "Unable to load transactions. Try again.");
        setTransactions([]);
      })
      .finally(() => setLoading(false));
  }, [open, row?.business_date, row?.cashier_user_id]);

  const pendingRows = useMemo(() => transactions.filter((t) => !t.verified), [transactions]);

  const methods = useMemo(() => {
    const set = new Set();
    pendingRows.forEach((t) => set.add(String(t.method_name || "").trim() || "Cashless"));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [pendingRows]);

  const filteredRows = useMemo(() => {
    const query = safeText(q).toLowerCase();
    const m = String(method || "all").toLowerCase();

    return pendingRows.filter((t) => {
      if (m !== "all" && String(t.method_name || "").toLowerCase() !== m) return false;
      if (!query) return true;

      const hay = [
        formatTime(t.paid_at),
        t.method_name,
        money(t.amount),
        String(t.amount),
        t.reference,
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(query);
    });
  }, [pendingRows, q, method]);

  const confirmedVisibleCount = useMemo(() => {
    const ids = new Set(confirmedIds);
    return filteredRows.reduce((sum, t) => sum + (ids.has(t.id) ? 1 : 0), 0);
  }, [filteredRows, confirmedIds]);

  const remainingVisibleCount = Math.max(filteredRows.length - confirmedVisibleCount, 0);

  const cashlessTotalVisible = useMemo(
    () => filteredRows.reduce((sum, t) => sum + Number(t.amount || 0), 0),
    [filteredRows]
  );

  const missingRefVisible = useMemo(
    () => filteredRows.filter((t) => !safeText(t.reference)).length,
    [filteredRows]
  );

  const allVisibleConfirmed = filteredRows.length > 0 && remainingVisibleCount === 0;
  const canSave = !loading && !saving && allVisibleConfirmed;

  const toggleConfirm = (id) => {
    setConfirmedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const markVisibleAsConfirmed = () => {
    if (!filteredRows.length) return;
    setConfirmedIds((prev) => {
      const set = new Set(prev);
      filteredRows.forEach((t) => set.add(t.id));
      return Array.from(set);
    });
  };

  const undoVisibleConfirmations = () => {
    if (!filteredRows.length) return;
    setConfirmedIds((prev) => {
      const set = new Set(prev);
      filteredRows.forEach((t) => set.delete(t.id));
      return Array.from(set);
    });
  };

  const handleSubmit = async () => {
    if (!canSave || !row) return;
    setSaving(true);
    setError("");

    try {
      await onSubmit?.({
        business_date: row.business_date,
        cashier_user_id: row.cashier_user_id,
        verified_transaction_ids: filteredRows.map((t) => t.id),
      });

      setSaving(false);
      setConfirmedIds([]);
      onClose?.();
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(msg || "Unable to save. Try again.");
      setSaving(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Verify cashless transactions"
      subtitle="Confirm each row, then save to add them to cashless remittance."
      icon={ShieldCheck}
      layout="compact"
      maxWidthClass="max-w-6xl"
      bodyClassName="p-6 sm:p-8"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-slate-600">
            <span className="text-slate-500">Pending</span>
            <span className="text-slate-900">{filteredRows.length}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Confirmed</span>
            <span className="text-slate-900">{confirmedVisibleCount}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Remaining</span>
            <span className="text-slate-900">{remainingVisibleCount}</span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={cx(
                "rounded-2xl bg-white px-4 py-2 text-sm font-extrabold ring-1 transition focus:outline-none focus:ring-4",
                saving
                  ? "text-slate-400 ring-slate-200 cursor-not-allowed"
                  : "text-slate-800 ring-slate-200 hover:bg-slate-50 focus:ring-teal-500/15"
              )}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSave}
              className={cx(
                "rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4",
                !canSave
                  ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                  : "bg-teal-600 ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25"
              )}
            >
              {saving ? "Saving..." : "Save to remittance"}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid gap-4">
        {/* SMART TOP BAR (smaller, so table gets space) */}
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
          <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-slate-900">Quick check</div>
                <div className="mt-1 text-xs text-slate-500">
                  Search a reference fast, confirm the matching row, then save.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <MiniStat label="Cashless total" value={money(cashlessTotalVisible)} tone="teal" />
                {missingRefVisible ? (
                  <Pill tone="amber">{missingRefVisible} missing reference</Pill>
                ) : (
                  <Pill tone="teal">All references captured</Pill>
                )}
              </div>
            </div>

            {/* controls: compact, stays out of the way */}
            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
  {/* left: search + method side by side */}
  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-1">
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 px-4 py-3 flex items-center gap-2 lg:flex-1">
      <Search className="h-4 w-4 text-slate-500" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search reference, method, amount, time..."
        className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
      />
    </div>

    <div className="rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-3 flex items-center gap-2 lg:w-72">
      <Filter className="h-4 w-4 text-slate-500" />
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
      >
        {methods.map((m) => (
          <option key={m} value={m}>
            {m === "all" ? "All methods" : m}
          </option>
        ))}
      </select>
    </div>
  </div>

  {/* right: actions side by side */}
  <div className="flex items-center gap-2 justify-end">
    <PrimaryButton
      onClick={markVisibleAsConfirmed}
      disabled={!filteredRows.length || loading || saving}
    >
      <Check className="h-4 w-4" />
      Mark all as checked
    </PrimaryButton>

    <GhostButton
      onClick={undoVisibleConfirmations}
      disabled={!confirmedVisibleCount || loading || saving}
      title="Undo checked rows (visible only)"
    >
      <RotateCcw className="h-4 w-4" />
      Undo
    </GhostButton>
  </div>
</div>

            {error ? (
              <div className="mt-4 rounded-2xl bg-rose-50 ring-1 ring-rose-700/10 px-4 py-3 text-sm font-semibold text-rose-800">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        {/* TABLE: now gets most of the height */}
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white sticky top-0">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-4 text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                    Time
                  </th>
                  <th className="px-5 py-4 text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                    Method
                  </th>
                  <th className="px-5 py-4 text-[11px] font-extrabold text-slate-500 uppercase tracking-wide text-right">
                    Amount
                  </th>
                  <th className="px-5 py-4 text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                    Reference
                  </th>
                  <th className="px-5 py-4 text-[11px] font-extrabold text-slate-500 uppercase tracking-wide text-right">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-sm font-semibold text-slate-500">
                      Loading transactions...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-sm font-semibold text-slate-500">
                      No cashless transactions to verify.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((txn) => {
                    const isConfirmed = confirmedIds.includes(txn.id);
                    const ref = safeText(txn.reference);

                    return (
                      <tr key={txn.id} className={cx(isConfirmed && "bg-slate-50")}>
                        <td className="px-5 py-4 text-sm font-extrabold text-slate-900 whitespace-nowrap">
                          {formatTime(txn.paid_at)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-sm font-extrabold text-slate-900">
                            {txn.method_name || "Cashless"}
                          </div>
                          {!ref ? (
                            <div className="mt-1">
                              <Pill tone="amber">Missing reference</Pill>
                            </div>
                          ) : null}
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-extrabold text-slate-900 whitespace-nowrap">
                          {money(txn.amount)}
                        </td>

                        {/* BIGGER reference for visibility */}
                        <td className="px-5 py-4">
                          {ref ? (
                            <span className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-2 text-[14px] font-extrabold text-white font-mono tracking-wide">
                              {ref}
                            </span>
                          ) : (
                            <span className="text-sm font-semibold text-slate-400">—</span>
                          )}
                        </td>

                        {/* Practical naming: Checked / Check */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleConfirm(txn.id)}
                            disabled={saving}
                            className={cx(
                              "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold ring-1 transition focus:outline-none focus:ring-4",
                              isConfirmed
                                ? "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50 focus:ring-teal-500/15"
                                : "bg-teal-600 text-white ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25"
                            )}
                          >
                            {isConfirmed ? (
                              <>
                                <XCircle className="h-4 w-4" />
                                Checked
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4" />
                                Check
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-4 border-t border-slate-200 bg-white">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                Tip: check rows first, then press Save to remittance.
              </div>

              {!allVisibleConfirmed && filteredRows.length ? (
                <div className="text-xs font-extrabold text-slate-700">
                  Check all pending rows first
                </div>
              ) : (
                <div className="text-xs font-extrabold text-teal-700">Ready to save</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
