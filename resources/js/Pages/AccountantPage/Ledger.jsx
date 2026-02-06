import React, { useMemo, useState, useEffect, useCallback } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";

import axios from "axios";
import { Info, FileText } from "lucide-react";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";
import { TableActionButton } from "@/components/Table/ActionTableButton";

import LedgerCodeReminderModal from "@/components/modals/AccountantModals/LedgerCodeReminderModal";
import LedgerReferenceModal from "@/components/modals/AccountantModals/LedgerReferenceModal";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function money(v) {
  if (v === null || v === undefined || v === "") return "N/A";
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });
}

function moneyOrNA(v) {
  if (v === null || v === undefined || v === "") return "N/A";
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n)) return String(v);
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

function formatDateTime(value) {
  if (!value) return "N/A";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(value);
  }
}

function RefPill({ type }) {
  const t = String(type || "entry").toLowerCase();

  const map = {
    sale: "bg-teal-600/10 text-teal-900 ring-teal-700/10",
    remittance: "bg-slate-100 text-slate-800 ring-slate-200",
    adjustment: "bg-amber-600/10 text-amber-900 ring-amber-700/10",
    expense: "bg-rose-600/10 text-rose-900 ring-rose-700/10",
    entry: "bg-white text-slate-700 ring-slate-200",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        map[t] || map.entry
      )}
    >
      {t.toUpperCase()}
    </span>
  );
}

const fallbackAccountOptions = [
  { value: "1010", label: "1010 Cash on Hand" },
  { value: "1020", label: "1020 Cash in Bank" },
  { value: "2010", label: "2010 Turnover Receivable" },
  { value: "4010", label: "4010 Sales Revenue" },
];

function CompactDateInput({ ariaLabel, value, onChange }) {
  return (
    <input
      aria-label={ariaLabel}
      type="date"
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      className={cx(
        "h-9 min-w-[140px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800",
        "outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
      )}
    />
  );
}

function DateRangeFilterMinimal({ from, to, onFromChange, onToChange }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-xs font-extrabold text-slate-500">From</div>
      <CompactDateInput ariaLabel="From date" value={from} onChange={onFromChange} />
      <div className="text-xs font-extrabold text-slate-500">To</div>
      <CompactDateInput ariaLabel="To date" value={to} onChange={onToChange} />
    </div>
  );
}

function SummaryStat({ label, value, tone = "white" }) {
  const toneClass =
    tone === "teal"
      ? "bg-teal-50 ring-teal-100 text-teal-900"
      : tone === "rose"
      ? "bg-rose-50 ring-rose-100 text-rose-900"
      : "bg-white ring-slate-200 text-slate-900";

  return (
    <div className={`rounded-2xl px-4 py-3 ring-1 ${toneClass}`}>
      <div className="text-[11px] font-extrabold text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-extrabold tabular-nums">{value}</div>
    </div>
  );
}

const SOURCE_ROUTES = {
  sale: (refId) => `/dashboard/cashier/sales/${encodeURIComponent(refId)}`,
  remittance: (refId) => `/dashboard/accountant/remittances/${encodeURIComponent(refId)}`,
  adjustment: (refId) => `/dashboard/accountant/adjustments/${encodeURIComponent(refId)}`,
  expense: (refId) => `/dashboard/accountant/expenses/${encodeURIComponent(refId)}`,
};

function resolveSourceHref(type, referenceId) {
  if (!referenceId) return null;
  const key = String(type || "entry").toLowerCase();
  const resolver = SOURCE_ROUTES[key];
  return typeof resolver === "function" ? resolver(referenceId) : null;
}

export default function Ledger() {
  const page = usePage();

  const ledger = page.props?.ledger || { data: [], meta: null };
  const rows = ledger?.data || [];
  const meta = ledger?.meta || null;
  const vatSettings = page.props?.vat_settings || {};
  const vatActive = Boolean(vatSettings.vat_active);

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const typeInitial = query?.type || "all";
  const accountInitial = query?.account || "all";
  const dateFromInitial = query?.from || "";
  const dateToInitial = query?.to || "";
  const sortInitial = query?.sort || "posted_at_desc";
  const clearedInitial = query?.cleared || "all";
  const bankRefInitial = query?.bank_ref || "";
  const accountsFromBackend = page.props?.accounts;
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [type, setType] = useState(typeInitial);
  const [account, setAccount] = useState(accountInitial);
  const [dateFrom, setDateFrom] = useState(dateFromInitial);
  const [dateTo, setDateTo] = useState(dateToInitial);
  const [sort, setSort] = useState(sortInitial);
  const [cleared, setCleared] = useState(clearedInitial);
  const [bankRef, setBankRef] = useState(bankRefInitial);

  const [referenceModalOpen, setReferenceModalOpen] = useState(false);
  const [referenceLines, setReferenceLines] = useState([]);
  const [referenceTotals, setReferenceTotals] = useState(null);
  const [referenceMeta, setReferenceMeta] = useState({
    referenceId: "",
    referenceType: "",
    postedAt: "",
    balanced: true,
  });
  const [referenceLoading, setReferenceLoading] = useState(false);
  const [referenceError, setReferenceError] = useState("");

  const [glOpen, setGlOpen] = useState(false);

  const typeOptions = [
    { value: "all", label: "All entries" },
    { value: "sale", label: "Sales" },
    { value: "remittance", label: "Turnover" },
    { value: "adjustment", label: "Adjustments" },
    { value: "expense", label: "Expenses" },
  ];

  const sortOptions = [
    { value: "posted_at_desc", label: "Posted (newest)" },
    { value: "posted_at_asc", label: "Posted (oldest)" },
    { value: "created_at_desc", label: "Recorded (newest)" },
    { value: "created_at_asc", label: "Recorded (oldest)" },
  ];

  const accountOptions = useMemo(() => {
    const base = [{ value: "all", label: "All accounts" }];
    const provided = Array.isArray(accountsFromBackend) ? accountsFromBackend : [];
    if (provided.length) return [...base, ...provided];
    return [...base, ...fallbackAccountOptions];
  }, [accountsFromBackend]);

  const clearedOptions = [
    { value: "all", label: "All" },
    { value: "cleared", label: "Cleared" },
    { value: "uncleared", label: "Uncleared" },
  ];

  const pushQuery = useCallback(
    (patch) => {
      router.get(
        "/dashboard/accountant/ledger",
        {
          q,
          type,
          account,
          from: dateFrom || undefined,
          to: dateTo || undefined,
          sort,
          cleared,
          bank_ref: bankRef || undefined,
          per: perInitial,
          ...patch,
        },
        { preserveScroll: true, preserveState: true, replace: true }
      );
    },
    [q, type, account, dateFrom, dateTo, sort, cleared, bankRef, perInitial]
  );

  const handleType = (value) => {
    setType(value);
    pushQuery({ type: value, page: 1 });
  };

  const handleAccount = (value) => {
    setAccount(value);
    pushQuery({ account: value, page: 1 });
  };

  const handleDateFrom = (value) => {
    setDateFrom(value);
    pushQuery({ from: value || undefined, page: 1 });
  };

  const handleDateTo = (value) => {
    setDateTo(value);
    pushQuery({ to: value || undefined, page: 1 });
  };

  const handleSort = (value) => {
    setSort(value);
    pushQuery({ sort: value, page: 1 });
  };

  const handleCleared = (value) => {
    setCleared(value);
    pushQuery({ cleared: value, page: 1 });
  };

  const handleBankRef = (value) => {
    setBankRef(value);
    pushQuery({ bank_ref: value || undefined, page: 1 });
  };

  const handlePerPage = (n) => pushQuery({ per: n, page: 1 });
  const handlePrev = () => meta && meta.current_page > 1 && pushQuery({ page: meta.current_page - 1 });
  const handleNext = () => meta && meta.current_page < meta.last_page && pushQuery({ page: meta.current_page + 1 });

  const showReconciliationControls = account === "1020";
  const showBalanceColumn = account !== "all";
  const showClearedColumns = showReconciliationControls;

  const buildExportParams = () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type && type !== "all") params.set("type", type);
    if (account && account !== "all") params.set("account", account);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    if (sort) params.set("sort", sort);
    if (showReconciliationControls || cleared !== "all") params.set("cleared", cleared);
    if ((showReconciliationControls || bankRef) && bankRef) params.set("bank_ref", bankRef);
    return params.toString();
  };

  const handleExport = (format) => {
    const queryString = buildExportParams();
    const url = `/dashboard/accountant/ledger/export/${format}${queryString ? `?${queryString}` : ""}`;
    window.location.assign(url);
  };

  const loading = Boolean(page.props?.loading);
  const ledgerTotals = page.props?.ledgerTotals ?? { debit: 0, credit: 0, net: 0 };
  const netTone = ledgerTotals.net >= 0 ? "teal" : "rose";

  useEffect(() => setQ(qInitial), [qInitial]);
  useEffect(() => setType(typeInitial), [typeInitial]);
  useEffect(() => setAccount(accountInitial), [accountInitial]);
  useEffect(() => setDateFrom(dateFromInitial), [dateFromInitial]);
  useEffect(() => setDateTo(dateToInitial), [dateToInitial]);
  useEffect(() => setSort(sortInitial), [sortInitial]);
  useEffect(() => setCleared(clearedInitial), [clearedInitial]);
  useEffect(() => setBankRef(bankRefInitial), [bankRefInitial]);

  const handleOpenReferenceModal = useCallback(async (refId) => {
    if (!refId) return;

    setReferenceModalOpen(true);
    setReferenceLoading(true);
    setReferenceLines([]);
    setReferenceTotals(null);
    setReferenceError("");
    setReferenceMeta({ referenceId: refId, referenceType: "", postedAt: "", balanced: true });

    try {
      const encodedId = encodeURIComponent(refId);
      const { data } = await axios.get(`/dashboard/accountant/ledger/reference/${encodedId}`);
      setReferenceLines(Array.isArray(data?.lines) ? data.lines : []);
      setReferenceTotals(data?.totals ?? null);
      setReferenceMeta({
        referenceId: data?.reference_id || refId,
        referenceType: data?.reference_type,
        postedAt: data?.posted_at,
        balanced: Boolean(data?.balanced),
      });
    } catch (err) {
      const message = err?.response?.data?.message || "Unable to load transaction lines.";
      setReferenceError(message);
    } finally {
      setReferenceLoading(false);
    }
  }, []);

  const handleCloseReferenceModal = useCallback(() => {
    setReferenceModalOpen(false);
    setReferenceLines([]);
    setReferenceTotals(null);
    setReferenceMeta({ referenceId: "", referenceType: "", postedAt: "", balanced: true });
    setReferenceError("");
    setReferenceLoading(false);
  }, []);

  const sampleRows = useMemo(
    () => [
      {
        id: 1,
        posted_at: "2026-01-19",
        reference_type: "sale",
        reference_id: "S-20260119-0018",
        account_code: "1010",
        account_name: "Cash on Hand",
        description: "Walk in LPG refill sales cash",
        debit: 5200,
        credit: 0,
        balance: 5200,
        posted_by: "System",
        created_at: "2026-01-19T09:12:00",
        cleared: true,
        bank_ref: "CHK-20260119-001",
      },
    ],
    []
  );

  const effectiveRows = rows?.length ? rows : sampleRows;

  const fillerRows = useMemo(
    () =>
      Array.from({ length: perInitial }).map((_, i) => ({
        id: `__filler__${i}`,
        __filler: true,
      })),
    [perInitial]
  );

  const tableRows = loading ? fillerRows : effectiveRows;

  const columns = useMemo(() => {
    const common = [
      {
        key: "posted_at",
        label: "Posted",
        render: (r) =>
          r?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-24" />
              <SkeletonLine w="w-20" />
            </div>
          ) : (
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-slate-900">{formatDate(r?.posted_at)}</div>
              <div className="mt-1 text-xs text-slate-500">{r?.posted_by || "System"}</div>
            </div>
          ),
      },
      {
        key: "recorded_at",
        label: "Recorded",
        render: (r) =>
          r?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-28" />
              <SkeletonLine w="w-24" />
            </div>
          ) : (
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-slate-900">{formatDateTime(r?.created_at)}</div>
            </div>
          ),
      },
      {
        key: "reference",
        label: "Reference",
        render: (r) =>
          r?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-32" />
              <SkeletonPill w="w-20" />
            </div>
          ) : (
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => handleOpenReferenceModal(r.reference_id)}
                className="text-left text-sm font-extrabold text-slate-900 hover:text-teal-700 focus:text-teal-700 focus:outline-none"
              >
                {r?.reference_id || "N/A"}
              </button>
              <div className="mt-2">
                <RefPill type={r?.reference_type} />
              </div>
            </div>
          ),
      },
      {
        key: "account",
        label: "Account",
        render: (r) =>
          r?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-40" />
              <SkeletonPill w="w-16" />
            </div>
          ) : (
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-slate-900">{r?.account_name || "Account"}</div>
              <div className="mt-2">
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
                  {String(r?.account_code || "N/A")}
                </span>
              </div>
            </div>
          ),
      },
      {
        key: "description",
        label: "Description",
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-56" />
          ) : (
            <div className="min-w-0">
              <div className="text-sm text-slate-700 max-w-[520px] line-clamp-2 leading-relaxed">
                {r?.description || "N/A"}
              </div>
            </div>
          ),
      },
    ];

    if (vatActive) {
      const netColumn = {
        key: "sale_net_amount",
        label: "Net",
        render: (r) =>
          r?.__filler ? (
            <div className="flex justify-end">
              <SkeletonLine w="w-20" />
            </div>
          ) : (
            <div className="text-right tabular-nums">
              <div className="text-sm font-semibold text-slate-800">{moneyOrNA(r?.sale_net_amount)}</div>
            </div>
          ),
      };

      const vatColumn = {
        key: "sale_vat_amount",
        label: "VAT",
        render: (r) =>
          r?.__filler ? (
            <div className="flex justify-end">
              <SkeletonLine w="w-20" />
            </div>
          ) : (
            <div className="text-right tabular-nums">
              <div className="text-sm font-semibold text-slate-800">{moneyOrNA(r?.sale_vat_amount)}</div>
            </div>
          ),
      };

      common.splice(5, 0, netColumn, vatColumn);
    }

    common.push(
      {
        key: "debit",
        label: "Debit",
        render: (r) =>
          r?.__filler ? (
            <div className="flex justify-end">
              <SkeletonLine w="w-20" />
            </div>
          ) : (
            <div className="text-right tabular-nums">
              <div className="text-sm font-semibold text-slate-800">{moneyOrNA(r?.debit)}</div>
            </div>
          ),
      },
      {
        key: "credit",
        label: "Credit",
        render: (r) =>
          r?.__filler ? (
            <div className="flex justify-end">
              <SkeletonLine w="w-20" />
            </div>
          ) : (
            <div className="text-right tabular-nums">
              <div className="text-sm font-semibold text-slate-800">{moneyOrNA(r?.credit)}</div>
            </div>
          ),
      }
    );

    if (showBalanceColumn) {
      common.push({
        key: "balance",
        label: "Account running balance",
        render: (r) =>
          r?.__filler ? (
            <div className="flex justify-end">
              <SkeletonLine w="w-24" />
            </div>
          ) : (
            <div className="text-right tabular-nums">
              <div className="text-sm font-extrabold text-slate-900">{money(r?.balance ?? 0)}</div>
            </div>
          ),
      });
    }

    if (showClearedColumns) {
      common.push({
        key: "cleared",
        label: "Cleared",
        render: (r) =>
          r?.__filler ? (
            <div className="flex justify-end">
              <SkeletonPill w="w-14" />
            </div>
          ) : (
            <div className="flex justify-end">
              <span
                className={cx(
                  "inline-flex items-center rounded-2xl px-3 py-1 text-[11px] font-extrabold ring-1",
                  r?.cleared
                    ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
                    : "bg-rose-600/10 text-rose-900 ring-rose-700/10"
                )}
              >
                {r?.cleared ? "Cleared" : "Uncleared"}
              </span>
            </div>
          ),
      });

      common.push({
        key: "bank_ref",
        label: "Bank ref",
        render: (r) =>
          r?.__filler ? <SkeletonLine w="w-28" /> : <div className="text-sm font-semibold text-slate-700">{r?.bank_ref || "N/A"}</div>,
      });
    }

    common.push({
      key: "source",
      label: "Source",
      render: (r) => {
        if (r?.__filler) {
          return (
            <div className="flex items-center justify-end">
              <SkeletonButton w="w-20" />
            </div>
          );
        }
        const href = resolveSourceHref(r?.reference_type, r?.reference_id);
        return (
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => href && router.get(href)}
              disabled={!href}
              className={cx(
                "inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs font-extrabold ring-1 transition focus:outline-none focus:ring-4",
                !href
                  ? "bg-slate-50 text-slate-400 ring-slate-200 cursor-not-allowed"
                  : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50 focus:ring-teal-500/10"
              )}
            >
              Source
            </button>
          </div>
        );
      },
    });

    return common;
  }, [showBalanceColumn, showClearedColumns, handleOpenReferenceModal, vatActive]);

  const filterRightSlot = (
    <div className="flex flex-wrap items-center gap-3">
      <DateRangeFilterMinimal from={dateFrom} to={dateTo} onFromChange={handleDateFrom} onToChange={handleDateTo} />
      {showReconciliationControls ? (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={cleared}
            onChange={(e) => handleCleared(e.target.value)}
            className="h-9 rounded-xl bg-white px-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 focus:ring-4 focus:ring-teal-500/10"
          >
            {clearedOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            value={bankRef}
            onChange={(e) => handleBankRef(e.target.value)}
            placeholder="Bank ref"
            className="h-9 rounded-xl bg-white px-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/10"
          />
        </div>
      ) : null}
    </div>
  );

  return (
    <Layout title="Ledger">
      <div className="grid gap-6">
        <div className="rounded-3xl bg-teal-600/5 ring-1 ring-teal-200 shadow-sm">
          <div className="p-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-lg font-extrabold text-slate-900">Ledger</div>
              <div className="mt-1 text-sm text-slate-600">
                Formal accounting record. Entries are append only. Corrections should be done via adjustment entries.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleExport("csv")}
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white ring-1 ring-teal-500 hover:bg-teal-700 transition focus:ring-4 focus:ring-teal-500/25"
              >
                <FileText className="h-4 w-4 text-white" />
                Export CSV
              </button>

              <button
                type="button"
                onClick={() => setGlOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-teal-700 ring-1 ring-teal-200 hover:bg-teal-50 transition focus:ring-4 focus:ring-teal-500/15"
                title="View GL codes"
              >
                <Info className="h-4 w-4 text-teal-700" />
                GL codes
              </button>
            </div>
          </div>
        </div>

        <DataTableFilters
          q={q}
          onQ={setQ}
          onQDebounced={(value) => pushQuery({ q: value, page: 1 })}
          placeholder="Search reference, account, description..."
          filters={[
            { key: "type", value: type, onChange: handleType, options: typeOptions },
            { key: "account", value: account, onChange: handleAccount, options: accountOptions },
            { key: "sort", value: sort, onChange: handleSort, options: sortOptions },
          ]}
          rightSlot={filterRightSlot}
        />

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold text-slate-900">Totals</div>
              <div className="text-xs text-slate-500">Current filters only</div>
            </div>
            <div className="text-xs font-semibold text-slate-500">Debit vs credit</div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SummaryStat label="Total debit" value={money(ledgerTotals.debit)} tone="teal" />
            <SummaryStat label="Total credit" value={money(ledgerTotals.credit)} />
            <SummaryStat label="Net (debit - credit)" value={money(ledgerTotals.net)} tone={netTone} />
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          searchQuery={q}
          emptyTitle="No ledger entries found"
          emptyHint="Ledger entries appear after sales, turnover, or adjustments are posted."
          renderActions={(r) =>
            r?.__filler ? (
              <div className="flex items-center justify-end gap-2">
                <SkeletonButton w="w-24" />
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <TableActionButton
                  icon={FileText}
                  title="View transaction lines"
                  onClick={() => handleOpenReferenceModal(r.reference_id)}
                  tone="primary"
                >
                  Lines
                </TableActionButton>
              </div>
            )
          }
        />

        <DataTablePagination
          meta={meta}
          perPage={perInitial}
          onPerPage={handlePerPage}
          onPrev={handlePrev}
          onNext={handleNext}
          disablePrev={!meta || meta.current_page <= 1}
          disableNext={!meta || meta.current_page >= meta.last_page}
        />
      </div>

      <LedgerReferenceModal
        open={referenceModalOpen}
        onClose={handleCloseReferenceModal}
        loading={referenceLoading}
        error={referenceError}
        referenceId={referenceMeta.referenceId}
        referenceType={referenceMeta.referenceType}
        postedAt={referenceMeta.postedAt}
        lines={referenceLines}
        totals={referenceTotals}
        balanced={referenceMeta.balanced}
      />

      <LedgerCodeReminderModal open={glOpen} onClose={() => setGlOpen(false)} />
    </Layout>
  );
}
