import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import { calculateVat } from "@/services/vatCalculator";
import { ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react";
import TableHeaderCell from "@/components/Table/TableHeaderCell";

import { TableActionButton } from "@/components/Table/ActionTableButton";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const PESO = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function money(v) {
  const n = Number(String(v ?? 0).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n)) return "—";
  return PESO.format(n);
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

function safeText(value) {
  return String(value ?? "").trim();
}

function safeNum(value) {
  const n = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/* -------------------------------------------------------------------------- */
/* UI                                                                         */
/* -------------------------------------------------------------------------- */

function TopCard({ title, subtitle, right }) {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
      <div className="p-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-lg font-extrabold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
        </div>
        {right}
      </div>
    </div>
  );
}

/**
 * Key fix: footer always sits at the bottom of the card
 * 1) root is flex-col + h-full
 * 2) body is flex-1
 * 3) you can pass bodyClassName to control spacing/scroll behavior
 */
function Panel({ title, subtitle, right, children, footer, className = "", bodyClassName = "" }) {
  return (
    <div
      className={cx(
        "rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden",
        "flex flex-col h-full",
        className
      )}
    >
      <div className="px-6 py-5 border-b border-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-base font-extrabold text-slate-900">{title}</div>
            {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
          </div>

          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      </div>

      <div className={cx("p-6 flex-1", bodyClassName)}>{children}</div>

      {footer ? (
        <div className="px-6 py-4 border-t border-slate-200 bg-white mt-auto">{footer}</div>
      ) : null}
    </div>
  );
}

function LabelValue({ label, value, tone = "default" }) {
  const toneClass =
    tone === "danger"
      ? "text-rose-700"
      : tone === "warn"
      ? "text-amber-700"
      : "text-slate-900";

  return (
    <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3">
      <div className="text-[11px] font-extrabold tracking-wide text-slate-500 uppercase">
        {label}
      </div>
      <div className={cx("mt-1 text-sm font-semibold tabular-nums", toneClass)}>{value}</div>
    </div>
  );
}

function InputShell({ children }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-2 focus-within:ring-teal-500/20 transition">
      {children}
    </div>
  );
}

function PesoInput({ value, onChange, placeholder = "0.00", disabled }) {
  return (
    <InputShell>
      <div className="flex items-center gap-2">
        <span className="text-sm font-extrabold text-slate-500 select-none">₱</span>
        <input
          value={value}
          onChange={(e) => {
            const raw = e.target.value;
            const cleaned = raw
              .replace(/[^0-9.]/g, "")
              .replace(/^([0-9]*)\.([0-9]*).*$/, (m, a, b) => `${a}.${b}`);
            onChange?.(cleaned);
          }}
          inputMode="decimal"
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
    </InputShell>
  );
}

function PrimaryButton({ disabled, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold transition focus:outline-none focus:ring-4",
        disabled
          ? "bg-slate-200 text-slate-500 cursor-not-allowed"
          : "bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500/20",
        className
      )}
    >
      {children}
    </button>
  );
}

function GhostButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:outline-none focus:ring-4 focus:ring-teal-500/15"
    >
      {children}
    </button>
  );
}

function KpiFooter({ verified, pending, checked, remaining }) {
  const Item = ({ label, value }) => (
    <div className="flex items-baseline gap-2">
      <span className="text-[11px] font-semibold tracking-[0.22em] text-slate-500 uppercase">
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-900 tabular-nums">{value}</span>
    </div>
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <Item label="Verified" value={money(verified)} />
        <span className="text-slate-300">|</span>
        <Item label="Pending" value={String(pending)} />
        <span className="text-slate-300">|</span>
        <Item label="Checked" value={String(checked)} />
        <span className="text-slate-300">|</span>
        <Item label="Remaining" value={String(remaining)} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function TurnoverReview() {
  const page = usePage();
  const row = page.props?.row || {};
  const vatSettings = page.props?.vat_settings || {};
  const vatActive = Boolean(vatSettings.vat_active);
  const methods = page.props?.methods || [];
  const returnUrl = page.props?.return_url || "/dashboard/accountant/remittances";

  const expectedGross = safeNum(row?.expected_cash) + safeNum(row?.expected_noncash_total);

  const vatBreakdown = vatActive
    ? calculateVat({
        amount: expectedGross,
        rate: Number(vatSettings.vat_rate ?? 0.12),
        inclusive: true,
        treatment: "vatable_12",
      })
    : null;

  const [cashInput, setCashInput] = useState(
    row?.remitted_cash_amount === null || row?.remitted_cash_amount === undefined
      ? ""
      : String(row?.remitted_cash_amount)
  );
  const [note, setNote] = useState(safeText(row?.note));
  const [cashError, setCashError] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [confirmedIds, setConfirmedIds] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [txError, setTxError] = useState("");

  const [savingAll, setSavingAll] = useState(false);

  useEffect(() => {
    setCashInput(
      row?.remitted_cash_amount === null || row?.remitted_cash_amount === undefined
        ? ""
        : String(row?.remitted_cash_amount)
    );
    setNote(safeText(row?.note));
    setCashError("");
  }, [row?.business_date, row?.cashier_user_id]);

  useEffect(() => {
    setConfirmedIds([]);
  }, [row?.business_date, row?.cashier_user_id]);

  useEffect(() => {
    if (!row?.business_date || !row?.cashier_user_id) {
      setTransactions([]);
      return;
    }

    setLoadingTx(true);
    setTxError("");

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
        setTxError(msg || "Unable to load cashless transactions.");
        setTransactions([]);
      })
      .finally(() => setLoadingTx(false));
  }, [row?.business_date, row?.cashier_user_id]);

  const expectedCash = safeNum(row?.expected_cash);
  const cashAmount = safeNum(cashInput);
  const variance = cashAmount - expectedCash;

  const needsNote = variance !== 0;
  const noteOk = !needsNote || safeText(note).length >= 3;
  const canSaveCash = safeText(cashInput) !== "" && noteOk;

  const varianceTone = variance === 0 ? "default" : variance < 0 ? "danger" : "warn";

  const expectedNonCashTotal = useMemo(() => {
    if (!row?.expected_by_method) return safeNum(row?.expected_noncash_total);
    return methods.reduce((sum, m) => {
      if (!m.is_cashless) return sum;
      const v = safeNum(row?.expected_by_method?.[m.method_key]);
      return sum + v;
    }, 0);
  }, [methods, row?.expected_by_method, row?.expected_noncash_total]);

  const confirmedSet = useMemo(() => new Set(confirmedIds), [confirmedIds]);

  const pendingRows = useMemo(() => transactions.filter((t) => !t.verified), [transactions]);
  const pendingIdSet = useMemo(() => new Set(pendingRows.map((t) => t.id)), [pendingRows]);
  const verifiedRows = useMemo(() => transactions.filter((t) => t.verified), [transactions]);

  const verifiedTotal = useMemo(() => {
    return transactions.reduce((sum, t) => {
      const amount = Number(t.amount || 0);
      if (t.verified || confirmedSet.has(t.id)) return sum + amount;
      return sum;
    }, 0);
  }, [transactions, confirmedSet]);

  const checkedCount = useMemo(
    () => pendingRows.reduce((sum, t) => sum + (confirmedSet.has(t.id) ? 1 : 0), 0),
    [pendingRows, confirmedSet]
  );

  const remainingCount = Math.max(pendingRows.length - checkedCount, 0);
  const allPendingChecked = pendingRows.length === 0 ? true : remainingCount === 0;

  const toggleConfirm = (id) => {
    if (!pendingIdSet.has(id)) return;
    setConfirmedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const clearChecks = () => setConfirmedIds([]);

  const goBack = () => {
    router.visit(returnUrl, { preserveScroll: true, preserveState: true });
  };

  const canSaveAll =
    !savingAll &&
    Boolean(row?.business_date) &&
    Boolean(row?.cashier_user_id) &&
    canSaveCash &&
    !loadingTx &&
    allPendingChecked;

  const saveCashPromise = () => {
    return new Promise((resolve, reject) => {
      router.post(
        "/dashboard/accountant/remittances/record-cash",
        {
          business_date: row?.business_date,
          cashier_user_id: row?.cashier_user_id,
          cash_counted: cashAmount,
          note: safeText(note) || null,
        },
        {
          preserveScroll: true,
          preserveState: true,
          onSuccess: () => resolve(true),
          onError: (errors) => reject(errors),
        }
      );
    });
  };

  const saveCashlessPromise = async () => {
    const transactionIds = pendingRows.map((t) => t.id).filter((id) => confirmedSet.has(id));

    await axios.post("/dashboard/accountant/remittances/cashless-transactions/verify", {
      business_date: row.business_date,
      cashier_user_id: row.cashier_user_id,
      verified_transaction_ids: transactionIds,
    });

    if (transactionIds.length > 0) {
      setTransactions((prev) =>
        prev.map((txn) =>
          transactionIds.includes(txn.id) ? { ...txn, verified: true } : txn
        )
      );
    }
  };

  const handleSaveAll = async () => {
    if (!canSaveAll) return;

    setSavingAll(true);
    setCashError("");
    setTxError("");

    try {
      await saveCashPromise();
      await saveCashlessPromise();

      setConfirmedIds([]);
      router.visit(returnUrl, { preserveScroll: true, preserveState: true });
    } catch (err) {
      const msg = err?.response?.data?.message;
      if (msg) setTxError(msg);
      else setCashError("Unable to save turnover.");
    } finally {
      setSavingAll(false);
    }
  };

  const headerRight = (
    <div className="flex flex-wrap items-center gap-2">
      <GhostButton onClick={goBack}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </GhostButton>

      <PrimaryButton disabled={!canSaveAll} onClick={handleSaveAll}>
        <CheckCircle2 className="h-4 w-4" />
        {savingAll ? "Saving..." : "Save turnover"}
      </PrimaryButton>
    </div>
  );

  const cashlessSubtitle =
    pendingRows.length === 0
      ? verifiedRows.length === 0
        ? "No pending cashless transactions."
        : "All pending transactions are checked. Verified history kept for transparency."
      : allPendingChecked
      ? "All pending transactions are checked."
      : "Check all pending transactions before saving.";

  return (
    <Layout title="Turnover Review">
      <div className="grid gap-6">
        <TopCard
          title="Turnover Review"
          subtitle={`${row?.cashier_name || "—"} · ${row?.business_date || "—"}`}
          right={headerRight}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <LabelValue label="Gross sales" value={money(expectedGross)} />
          <LabelValue label="Expected cashless" value={money(expectedNonCashTotal)} />
        </div>

        {vatActive && vatBreakdown ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <LabelValue label="Net sales" value={money(vatBreakdown.net_amount)} />
            <LabelValue label="VAT collected" value={money(vatBreakdown.vat_amount)} />
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <Panel
            title="Cash"
            subtitle="Enter counted cash. Note is required only if variance exists."
            className="h-full"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <LabelValue label="Expected" value={money(expectedCash)} />
              <LabelValue
                label="Counted"
                value={safeText(cashInput) === "" ? "—" : money(cashAmount)}
              />
              <LabelValue
                label="Variance"
                value={safeText(cashInput) === "" ? "—" : money(variance)}
                tone={varianceTone}
              />
            </div>

            <div className="mt-5 grid gap-4">
              <div>
                <div className="text-xs font-extrabold text-slate-700">Counted cash</div>
                <div className="mt-2">
                  <PesoInput value={cashInput} onChange={setCashInput} disabled={savingAll} />
                </div>
              </div>

              <div>
                <div className="text-xs font-extrabold text-slate-700">Note</div>
                <div className="mt-1 text-[11px] text-slate-500">
                  {needsNote ? "Required because variance is not zero." : "Optional."}
                </div>

                <div className="mt-2">
                  <InputShell>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      placeholder={needsNote ? "Explain variance..." : "Add a note..."}
                      className="w-full resize-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      disabled={savingAll}
                    />
                  </InputShell>
                </div>

                {!noteOk ? (
                  <div className="mt-2 text-[11px] text-rose-700">
                    Add at least 3 characters when variance is present.
                  </div>
                ) : null}
              </div>

              {cashError ? (
                <div className="rounded-2xl bg-rose-500/5 ring-1 ring-rose-700/10 px-4 py-3 text-sm text-rose-800">
                  {cashError}
                </div>
              ) : null}
            </div>
          </Panel>

          <Panel
            title="Cashless"
            subtitle={cashlessSubtitle}
            className="h-full"
            bodyClassName="flex flex-col"
            right={
              <TableActionButton
                icon={RotateCcw}
                title="Clear all checks"
                onClick={clearChecks}
                disabled={!checkedCount || savingAll}
              >
                Clear all
              </TableActionButton>
            }
            footer={
              <KpiFooter
                verified={verifiedTotal}
                pending={pendingRows.length}
                checked={checkedCount}
                remaining={remainingCount}
              />
            }
          >
            {txError ? (
              <div className="mb-4 rounded-2xl bg-rose-500/5 ring-1 ring-rose-700/10 px-4 py-3 text-sm text-rose-800">
                {txError}
              </div>
            ) : null}

            <div className="flex-1 min-h-[220px]">
              <div className="h-full overflow-x-auto rounded-2xl ring-1 ring-slate-200">
                <table className="w-full text-left bg-white">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                        <TableHeaderCell label="Time" className="px-4 py-3 text-[11px] text-slate-600 font-extrabold uppercase tracking-wide" />
                        <TableHeaderCell label="Method" className="px-4 py-3 text-[11px] text-slate-600 font-extrabold uppercase tracking-wide" />
                        <TableHeaderCell label="Amount" className="px-4 py-3 text-[11px] text-slate-600 font-extrabold uppercase tracking-wide" contentClassName="justify-end" />
                        <TableHeaderCell label="Reference" className="px-4 py-3 text-[11px] text-slate-600 font-extrabold uppercase tracking-wide" />
                        <TableHeaderCell label="Action" className="px-4 py-3 text-[11px] text-slate-600 font-extrabold uppercase tracking-wide" contentClassName="justify-end" />
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {loadingTx ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                          Loading...
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                          Nothing to verify.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((txn) => {
                        const isPending = !txn.verified;
                        const isChecked = isPending ? confirmedSet.has(txn.id) : false;
                        const ref = safeText(txn.reference);

                        return (
                          <tr
                            key={txn.id}
                            className={cx(isChecked && "bg-teal-600/5", txn.verified && "bg-slate-50")}
                          >
                            <td className="px-4 py-4 text-sm font-extrabold text-slate-900 whitespace-nowrap">
                              {formatTime(txn.paid_at)}
                            </td>

                            <td className="px-4 py-4 text-sm text-slate-700">
                              {txn.method_name || "Cashless"}
                            </td>

                            <td className="px-4 py-4 text-right text-sm font-extrabold text-slate-900 whitespace-nowrap tabular-nums">
                              {money(txn.amount)}
                            </td>

                            <td className="px-4 py-4">
                              {ref ? (
                                <span className="font-mono text-sm text-slate-900">{ref}</span>
                              ) : (
                                <span className="text-sm text-slate-400">—</span>
                              )}
                            </td>

                            <td className="px-4 py-4 text-right whitespace-nowrap">
                              {txn.verified ? (
                                <TableActionButton
                                  icon={CheckCircle2}
                                  tone="primary"
                                  title="Verified transaction"
                                  disabled
                                >
                                  Verified
                                </TableActionButton>
                              ) : isChecked ? (
                                <TableActionButton
                                  icon={RotateCcw}
                                  title="Clear check"
                                  onClick={() => toggleConfirm(txn.id)}
                                  disabled={savingAll}
                                >
                                  Clear
                                </TableActionButton>
                              ) : (
                                <TableActionButton
                                  icon={CheckCircle2}
                                  tone="primary"
                                  title="Check transaction"
                                  onClick={() => toggleConfirm(txn.id)}
                                  disabled={savingAll}
                                >
                                  Check
                                </TableActionButton>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </Layout>
  );
}
