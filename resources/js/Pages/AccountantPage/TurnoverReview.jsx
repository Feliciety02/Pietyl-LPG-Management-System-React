import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import { calculateVat } from "@/services/vatCalculator";
import {
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  RotateCcw,
  Check,
  ShieldCheck,
} from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function money(v) {
  const n = Number(String(v ?? 0).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });
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

function Stat({ label, value, tone = "slate" }) {
  const toneMap = {
    slate: "bg-white ring-slate-200",
    teal: "bg-teal-50 ring-teal-200",
    amber: "bg-amber-50 ring-amber-200",
    rose: "bg-rose-50 ring-rose-200",
  };

  return (
    <div className={cx("rounded-2xl px-4 py-3 ring-1", toneMap[tone] || toneMap.slate)}>
      <div className="text-[11px] font-extrabold text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-extrabold tabular-nums text-slate-900">{value}</div>
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

function PesoInput({ value, onChange, placeholder = "0.00", disabled }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 transition focus-within:ring-2 focus-within:ring-teal-500/25">
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 ring-1 ring-teal-200 shrink-0">
        <span className="text-sm font-extrabold text-teal-900">₱</span>
      </div>
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

function MiniPill({ tone = "slate", children }) {
  const map = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    teal: "bg-teal-600/10 text-teal-900 ring-teal-700/10",
    amber: "bg-amber-600/10 text-amber-900 ring-amber-700/10",
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
  const [savingCash, setSavingCash] = useState(false);
  const [cashError, setCashError] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [confirmedIds, setConfirmedIds] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [savingTx, setSavingTx] = useState(false);
  const [txError, setTxError] = useState("");

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [showBreakdown, setShowBreakdown] = useState(false);

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
    setSearch("");
    setMethodFilter("all");
    setShowBreakdown(false);
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
        setTxError(msg || "Unable to load cashless transactions. Try again.");
        setTransactions([]);
      })
      .finally(() => setLoadingTx(false));
  }, [row?.business_date, row?.cashier_user_id]);

  const expectedCash = safeNum(row?.expected_cash);
  const cashAmount = safeNum(cashInput);
  const variance = cashAmount - expectedCash;

  const needsNote = variance !== 0;
  const noteOk = !needsNote || safeText(note).length >= 3;
  const canSaveCash = !savingCash && safeText(cashInput) !== "" && noteOk;

  const varianceTone =
    variance === 0 ? "teal" : variance < 0 ? "rose" : "amber";

  const expectedNonCashTotal = useMemo(() => {
    if (!row?.expected_by_method) return 0;
    return methods.reduce((sum, m) => {
      if (!m.is_cashless) return sum;
      const v = safeNum(row?.expected_by_method?.[m.method_key]);
      return sum + v;
    }, 0);
  }, [methods, row?.expected_by_method]);

  const cashlessBreakdown = useMemo(() => {
    if (!row?.expected_by_method) return [];
    return methods
      .filter((m) => m.is_cashless)
      .map((m) => ({
        key: m.method_key,
        label: m.method_name || m.method_key,
        value: safeNum(row?.expected_by_method?.[m.method_key]),
      }))
      .filter((d) => d.value !== 0);
  }, [methods, row?.expected_by_method]);

  const confirmedSet = useMemo(() => new Set(confirmedIds), [confirmedIds]);

  const pendingRows = useMemo(() => transactions.filter((t) => !t.verified), [transactions]);
  const pendingIdSet = useMemo(() => new Set(pendingRows.map((t) => t.id)), [pendingRows]);

  const methodsList = useMemo(() => {
    const set = new Set();
    pendingRows.forEach((t) => set.add(safeText(t.method_name) || "Cashless"));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [pendingRows]);

  const filteredRows = useMemo(() => {
    const q = safeText(search).toLowerCase();
    const m = String(methodFilter || "all").toLowerCase();

    return pendingRows.filter((t) => {
      if (m !== "all" && String(t.method_name || "").toLowerCase() !== m) return false;
      if (!q) return true;

      const hay = [t.method_name, formatTime(t.paid_at), money(t.amount), String(t.amount), t.reference]
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [pendingRows, methodFilter, search]);

  const verifiedTotal = useMemo(() => {
    return transactions.reduce((sum, t) => {
      const amount = Number(t.amount || 0);
      if (t.verified || confirmedSet.has(t.id)) return sum + amount;
      return sum;
    }, 0);
  }, [transactions, confirmedSet]);

  const confirmedCount = useMemo(
    () => pendingRows.reduce((sum, t) => sum + (confirmedSet.has(t.id) ? 1 : 0), 0),
    [pendingRows, confirmedSet]
  );

  const remainingCount = Math.max(pendingRows.length - confirmedCount, 0);
  const allPendingConfirmed = pendingRows.length === 0 ? true : remainingCount === 0;
  const canSaveCashless = !loadingTx && !savingTx && allPendingConfirmed;

  const missingRefVisible = useMemo(
    () => filteredRows.filter((t) => !safeText(t.reference)).length,
    [filteredRows]
  );

  const toggleConfirm = (id) => {
    if (!pendingIdSet.has(id)) return;
    setConfirmedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const markAllAsConfirmed = () => {
    if (!pendingRows.length) return;
    setConfirmedIds((prev) => {
      const set = new Set(prev);
      pendingRows.forEach((t) => set.add(t.id));
      return Array.from(set);
    });
  };

  const resetConfirmations = () => setConfirmedIds([]);

  const handleSaveCashless = async () => {
    if (!canSaveCashless || !row?.business_date || !row?.cashier_user_id) return;

    setSavingTx(true);
    setTxError("");

    const transactionIds = pendingRows.map((t) => t.id).filter((id) => confirmedSet.has(id));

    try {
      await axios.post("/dashboard/accountant/remittances/cashless-transactions/verify", {
        business_date: row.business_date,
        cashier_user_id: row.cashier_user_id,
        transaction_ids: transactionIds,
      });

      setConfirmedIds([]);
      router.reload({ only: ["row", "remittances"], preserveState: true, preserveScroll: true });
    } catch (err) {
      const msg = err?.response?.data?.message;
      setTxError(msg || "Unable to save cashless verification.");
    } finally {
      setSavingTx(false);
    }
  };

  const handleSaveCash = () => {
    if (!canSaveCash) return;

    setSavingCash(true);
    setCashError("");

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
        onSuccess: () => {
          router.reload({ only: ["row", "remittances"], preserveState: true, preserveScroll: true });
        },
        onError: (errors) => {
          setCashError(errors?.message || "Unable to save cash. Try again.");
        },
        onFinish: () => setSavingCash(false),
      }
    );
  };

  const goBack = () => {
    router.visit(returnUrl, { preserveScroll: true, preserveState: true });
  };

  const pagePills = (
    <div className="flex flex-wrap items-center gap-2">
      <MiniPill tone="white">{row?.cashier_name || "—"}</MiniPill>
      <MiniPill tone="white">{row?.business_date || "—"}</MiniPill>
      {variance === 0 && safeText(cashInput) !== "" ? (
        <MiniPill tone="teal">
          <CheckCircle2 className="h-4 w-4" />
          Cash balanced
        </MiniPill>
      ) : safeText(cashInput) !== "" ? (
        <MiniPill tone="amber">
          <AlertTriangle className="h-4 w-4" />
          Cash variance
        </MiniPill>
      ) : (
        <MiniPill tone="slate">Draft</MiniPill>
      )}
    </div>
  );

  return (
    <Layout title="Turnover Review">
      <div className="grid gap-6">
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
          <div className="p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-lg font-extrabold text-slate-900">Turnover Review</div>
              <div className="mt-1 text-sm text-slate-500">
                Cash and cashless verification in one place.
              </div>
              <div className="mt-3">{pagePills}</div>
            </div>
            <GhostButton onClick={goBack}>Back</GhostButton>
          </div>
        </div>

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
          <div className="p-5 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-extrabold text-slate-900">Gross sales</div>
                <div className="text-xs text-slate-500">
                  {vatActive
                    ? `VAT rate ${(Number(vatSettings.vat_rate ?? 0) * 100).toFixed(2)}% ${
                        vatSettings.vat_effective_date ? `· effective ${vatSettings.vat_effective_date}` : ""
                      }`
                    : "VAT is disabled for this company."}
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{money(expectedGross)}</div>
            </div>
            {vatActive && vatBreakdown ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Stat label="Net sales" value={money(vatBreakdown.net_amount)} tone="slate" />
                <Stat label="VAT collected" value={money(vatBreakdown.vat_amount)} tone="teal" />
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* CASH TURNOVER */}
          <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-slate-900">Cash turnover</div>
                  <div className="mt-1 text-xs text-slate-500">Expected vs counted cash with variance note.</div>
                </div>
                <div className="inline-flex items-center gap-2">
                  <MiniPill tone="teal">Teal flow</MiniPill>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Stat label="Expected" value={money(expectedCash)} tone="slate" />
                <Stat
                  label="Counted"
                  value={safeText(cashInput) === "" ? "—" : money(cashAmount)}
                  tone="slate"
                />
                <Stat
                  label="Variance"
                  value={safeText(cashInput) === "" ? "—" : money(variance)}
                  tone={safeText(cashInput) === "" ? "slate" : varianceTone}
                />
              </div>
            </div>

            <div className="p-5 grid gap-4">
              <Field label="Counted cash" hint="Amount received by the accountant">
                <PesoInput value={cashInput} onChange={setCashInput} disabled={savingCash} />
              </Field>

              <Field label="Note" hint={needsNote ? "Required when variance is not zero" : "Optional"}>
                <div className="flex items-start gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 transition focus-within:ring-2 focus-within:ring-teal-500/25">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder={needsNote ? "Explain variance..." : "Add a note..."}
                    className="w-full resize-none bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>

                {!noteOk ? (
                  <div className="mt-2 text-[11px] font-semibold text-rose-700">
                    Please add at least 3 characters when variance is present.
                  </div>
                ) : null}
              </Field>

              {cashError ? (
                <div className="rounded-2xl bg-rose-50 ring-1 ring-rose-700/10 px-4 py-2 text-xs font-semibold text-rose-800">
                  {cashError}
                </div>
              ) : null}

              <div className="flex items-center justify-end">
                <PrimaryButton onClick={handleSaveCash} disabled={!canSaveCash || savingCash}>
                  {savingCash ? "Saving..." : "Save cash"}
                </PrimaryButton>
              </div>
            </div>
          </div>

          {/* CASHLESS PAYMENTS */}
          <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-slate-900">Cashless payments</div>
                  <div className="mt-1 text-xs text-slate-500">Verify all pending cashless transactions.</div>
                </div>
                <ShieldCheck className="h-5 w-5 text-teal-700" />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <Stat label="Expected" value={money(expectedNonCashTotal)} tone="slate" />
                <Stat label="Verified" value={money(verifiedTotal)} tone="teal" />
                <Stat label="Pending" value={String(pendingRows.length)} tone="slate" />
                <Stat label="Remaining" value={String(remainingCount)} tone={remainingCount ? "amber" : "teal"} />
              </div>

              {cashlessBreakdown.length ? (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowBreakdown((v) => !v)}
                    className="text-[11px] font-extrabold text-teal-700 hover:text-teal-900 transition"
                  >
                    {showBreakdown ? "Hide breakdown" : "Show breakdown"}
                  </button>

                  {showBreakdown ? (
                    <div className="mt-3 grid gap-2">
                      {cashlessBreakdown.map((d) => (
                        <div
                          key={d.key}
                          className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 ring-1 ring-slate-200"
                        >
                          <span className="text-xs font-semibold text-slate-600 truncate pr-3">{d.label}</span>
                          <span className="text-sm font-extrabold text-slate-900 shrink-0">{money(d.value)}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="p-5 border-b border-slate-200">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm font-extrabold text-slate-900">Verification</div>

                <PrimaryButton onClick={handleSaveCashless} disabled={!canSaveCashless || savingTx}>
                  {savingTx ? "Saving..." : "Save cashless"}
                </PrimaryButton>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_280px] lg:items-center">
                <div className="rounded-2xl bg-white ring-1 ring-slate-200 px-4 py-3 flex items-center gap-2">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search reference, method, amount, time..."
                    className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>

                <div className="rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-3 flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                  >
                    {methodsList.map((m) => (
                      <option key={m} value={m}>
                        {m === "all" ? "All methods" : m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <GhostButton onClick={resetConfirmations} disabled={!confirmedCount || loadingTx || savingTx}>
                  <RotateCcw className="h-4 w-4" />
                  Undo
                </GhostButton>

                <PrimaryButton onClick={markAllAsConfirmed} disabled={!pendingRows.length || loadingTx || savingTx}>
                  <Check className="h-4 w-4" />
                  Mark all
                </PrimaryButton>
              </div>

              {txError ? (
                <div className="mt-4 rounded-2xl bg-rose-50 ring-1 ring-rose-700/10 px-4 py-2 text-xs font-semibold text-rose-800">
                  {txError}
                </div>
              ) : null}

              <div className={cx("mt-3 text-xs font-extrabold", allPendingConfirmed ? "text-teal-700" : "text-slate-700")}>
                {pendingRows.length === 0
                  ? "No pending cashless transactions"
                  : allPendingConfirmed
                  ? "Ready to save"
                  : `Check all pending transactions first (${remainingCount} remaining)`}
              </div>

              {missingRefVisible ? (
                <div className="mt-2 text-[11px] font-semibold text-amber-800">
                  {missingRefVisible} visible rows missing reference
                </div>
              ) : null}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white sticky top-0">
                  <tr className="border-b border-slate-200">
                    <th className="px-5 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                      Time
                    </th>
                    <th className="px-5 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                      Method
                    </th>
                    <th className="px-5 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wide text-right">
                      Amount
                    </th>
                    <th className="px-5 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                      Reference
                    </th>
                    <th className="px-5 py-3 text-[11px] font-extrabold text-slate-500 uppercase tracking-wide text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {loadingTx ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-sm font-semibold text-slate-500">
                        Loading transactions...
                      </td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-sm font-semibold text-slate-500">
                        {pendingRows.length === 0
                          ? "No cashless transactions to verify."
                          : "No transactions match the current filter."}
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((txn) => {
                      const isConfirmed = confirmedSet.has(txn.id);
                      const ref = safeText(txn.reference);

                      return (
                        <tr key={txn.id} className={cx(isConfirmed && "bg-teal-50/40")}>
                          <td className="px-5 py-4 text-sm font-extrabold text-slate-900 whitespace-nowrap">
                            {formatTime(txn.paid_at)}
                          </td>

                          <td className="px-5 py-4">
                            <div className="text-sm font-extrabold text-slate-900">
                              {txn.method_name || "Cashless"}
                            </div>
                            {!ref ? (
                              <div className="mt-1">
                                <MiniPill tone="amber">Missing reference</MiniPill>
                              </div>
                            ) : null}
                          </td>

                          <td className="px-5 py-4 text-right text-sm font-extrabold text-slate-900 whitespace-nowrap">
                            {money(txn.amount)}
                          </td>

                          <td className="px-5 py-4">
                            {ref ? (
                              <span className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-2 text-[13px] font-extrabold text-white font-mono tracking-wide">
                                {ref}
                              </span>
                            ) : (
                              <span className="text-sm font-semibold text-slate-400">—</span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => toggleConfirm(txn.id)}
                              disabled={savingTx}
                              className={cx(
                                "inline-flex items-center rounded-2xl px-4 py-2 text-sm font-extrabold ring-1 transition focus:outline-none focus:ring-4",
                                isConfirmed
                                  ? "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50 focus:ring-teal-500/15"
                                  : "bg-teal-600 text-white ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25"
                              )}
                            >
                              {isConfirmed ? "Checked" : "Check"}
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
              <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-slate-600">
                <span className="text-slate-500">Pending</span>
                <span className="text-slate-900">{pendingRows.length}</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">Confirmed</span>
                <span className="text-slate-900">{confirmedCount}</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">Remaining</span>
                <span className="text-slate-900">{remainingCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
