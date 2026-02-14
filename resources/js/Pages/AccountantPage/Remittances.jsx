import React, { useMemo, useState } from "react";
import axios from "axios";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";

import { ShieldCheck, FileText } from "lucide-react";
import KpiCard from "@/components/ui/KpiCard";

import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";
import { TableActionButton } from "@/components/Table/ActionTableButton";
import CashlessVerificationModal from "@/components/modals/AccountantModals/CashlessVerificationModal";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function money(v) {
  if (v === null || v === undefined || v === "") return "--";
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });
}

function number(v) {
  if (v === null || v === undefined || v === "") return "--";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString("en-PH");
}

function titleCase(s = "") {
  return String(s || "")
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}


function StatusPill({ status, label }) {
  const s = String(status || "pending").toLowerCase();

  const map = {
    draft: "bg-slate-100 text-slate-700 ring-slate-200",
    cash_recorded: "bg-teal-50 text-teal-700 ring-teal-200",
    cashless_verified: "bg-amber-50 text-amber-800 ring-amber-200",
    ready_to_finalize: "bg-teal-600/10 text-teal-900 ring-teal-700/10",
    finalized: "bg-slate-900/10 text-slate-900 ring-slate-900/20",
    finalized_attention: "bg-amber-600/10 text-amber-900 ring-amber-700/10",
    pending: "bg-amber-600/10 text-amber-900 ring-amber-700/10",
    verified: "bg-teal-600/10 text-teal-900 ring-teal-700/10",
    flagged: "bg-rose-600/10 text-rose-900 ring-rose-700/10",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        map[s] || map.pending
      )}
    >
      {label || titleCase(s)}
    </span>
  );
}

function deriveRemittanceStatus(row) {
  if (!row) return "draft";
  const cashRecorded =
    row.remitted_cash_amount !== null &&
    row.remitted_cash_amount !== undefined &&
    row.remitted_cash_amount !== "";
  const cashlessVerified = Boolean(row.noncash_verified_at);
  if (cashRecorded && cashlessVerified) {
    return row.status === "finalized" ? "finalized" : "ready_to_finalize";
  }
  if (cashlessVerified) return "cashless_verified";
  if (cashRecorded) return "cash_recorded";
  return "draft";
}

function TopCard({ title, subtitle, right }) {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
      <div className="p-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-lg font-extrabold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
        </div>
        {right}
      </div>
    </div>
  );
}

export default function Remittances() {
  const page = usePage();

  const remittances = page.props?.remittances?.data || [];
  const meta = page.props?.remittances?.meta || null;

  const remittanceKpis = page.props?.remittance_kpis || {};
  const projectedIncome = remittanceKpis.projected_income ?? null;
  const expectedCash = remittanceKpis.expected_cash ?? null;
  const expectedNonCash = remittanceKpis.expected_non_cash ?? null;
  const cashRecorded = remittanceKpis.cash_recorded ?? null;
  const cashlessVerified = remittanceKpis.cashless_verified_total ?? null;
  const verifiedTxnCount = remittanceKpis.cashless_verified_count ?? 0;
  const varianceTotal = remittanceKpis.cash_variance ?? null;
  const finalizedCount = remittanceKpis.finalized_count ?? 0;
  const varianceTone =
    varianceTotal === null || varianceTotal === 0
      ? "slate"
      : varianceTotal < 0
      ? "rose"
      : "teal";
  const finalizedHelper = finalizedCount
    ? `${number(finalizedCount)} finalized closures`
    : "Based on current rows";
  const kpiCards = [
    {
      label: "Projected income",
      value: money(projectedIncome),
      helper: `Cash ${money(expectedCash)} | Cashless ${money(expectedNonCash)}`,
    },
    {
      label: "Cash recorded",
      value: money(cashRecorded),
      helper: "Recorded cash remittances",
    },
    {
      label: "Cashless verified",
      value: money(cashlessVerified),
      helper: `${number(verifiedTxnCount)} verified transactions`,
    },
    {
      label: "Cash variance",
      value: money(varianceTotal),
      helper: finalizedHelper,
      tone: varianceTone,
    },
  ];

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const statusInitial = query?.status || "all";
  const dateInitial = query?.date || "";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [status, setStatus] = useState(statusInitial);
  const [date, setDate] = useState(dateInitial);
  const [cashlessModalOpen, setCashlessModalOpen] = useState(false);
  const [cashlessRow, setCashlessRow] = useState(null);

  const loading = Boolean(page.props?.loading);

  const buildQueryPayload = (patch = {}) => {
    const finalStatus = patch.status ?? status;
    const finalDate = patch.date ?? date;

    return {
      q,
      status: finalStatus,
      date: finalDate,
      per: patch.per ?? perInitial,
      ...patch,
    };
  };

  const pushQuery = (patch = {}) => {
    router.get("/dashboard/accountant/remittances", buildQueryPayload(patch), {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    });
  };

  const handleStatus = (value) => {
    setStatus(value);
    pushQuery({ status: value, page: 1 });
  };

  const handleDateChange = (value) => {
    setDate(value);
    pushQuery({ date: value, page: 1 });
  };

  const issueFlagsForRow = (row) => {
    const expectedCash = Number(row?.expected_cash ?? 0);
    const cashRecorded =
      row?.remitted_cash_amount !== null &&
      row?.remitted_cash_amount !== undefined &&
      row?.remitted_cash_amount !== "";
    const varianceValue = Number.isFinite(Number(row?.cash_variance))
      ? Number(row?.cash_variance)
      : cashRecorded && Number.isFinite(Number(row?.remitted_cash_amount))
      ? Number(row?.remitted_cash_amount) - expectedCash
      : null;
    const hasCashIssue =
      (expectedCash > 0 && !cashRecorded) ||
      (Number.isFinite(varianceValue) && Math.abs(varianceValue) >= 0.01);

    const expectedNonCash = Number(row?.expected_noncash_total ?? 0);
    const verifiedNonCash = Number(
      row?.noncash_verified_total ?? row?.noncash_verification?.amount ?? 0
    );
    const pendingNonCash = expectedNonCash - verifiedNonCash;
    const hasCashlessIssue = Math.abs(pendingNonCash) >= 0.01;

    return { hasCashIssue, hasCashlessIssue };
  };

  const openCashlessModal = (row) => {
    setCashlessRow(row);
    setCashlessModalOpen(true);
  };

  const closeCashlessModal = () => {
    setCashlessModalOpen(false);
    setCashlessRow(null);
  };

  const handleCashlessVerified = () => {
    router.reload({ only: ["remittances", "remittance_kpis"], preserveState: true });
  };

  const goToTurnoverReview = (row) => {
    const returnUrl =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "/dashboard/accountant/remittances";

    router.get(
      "/dashboard/accountant/remittances/review",
      {
        business_date: row.business_date,
        cashier_user_id: row.cashier_user_id,
        return_url: returnUrl,
      },
      { preserveState: true }
    );
  };

  const handleReopenBusinessDate = async (row) => {
    if (!row?.business_date) return;
    if (
      !window.confirm(
        `Reopen business date ${row.business_date}? This will unfinalize the day for all cashiers.`
      )
    ) {
      return;
    }

    try {
      await axios.post("/dashboard/accountant/remittances/reopen", {
        business_date: row.business_date,
      });
      router.reload({ only: ["remittances", "remittance_kpis"], preserveState: true });
    } catch (err) {
      const msg = err?.response?.data?.message || "Unable to reopen the business date.";
      window.alert(msg);
    }
  };

  const fillerRows = useMemo(
    () =>
      Array.from({ length: perInitial }).map((_, i) => ({
        id: `__filler__${i}`,
        __filler: true,
      })),
    [perInitial]
  );

  const tableRows = loading ? fillerRows : remittances;

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "draft", label: "Draft" },
    { value: "cash_recorded", label: "Cash recorded" },
    { value: "cashless_verified", label: "Cashless verified" },
    { value: "ready_to_finalize", label: "Ready to finalize" },
    { value: "finalized", label: "Finalized" },
  ];

  const turnoverColumns = [
    {
      key: "business_date",
      label: "Date",
      render: (r) =>
        r?.__filler ? (
          <SkeletonLine w="w-24" />
        ) : (
          <div className="text-sm font-semibold text-slate-900">{r?.business_date || "--"}</div>
        ),
    },
    {
      key: "cashier",
      label: "Cashier",
      render: (r) =>
        r?.__filler ? (
          <div className="space-y-2">
            <SkeletonLine w="w-40" />
            <SkeletonLine w="w-24" />
          </div>
        ) : (
          <div>
            <div className="text-sm font-extrabold text-slate-900">{r?.cashier_name || "--"}</div>
            <div className="mt-1 text-xs text-slate-600">Cashier turnover</div>
          </div>
        ),
    },
    {
      key: "cash_step",
      label: "Cash",
      render: (r) => {
        if (r?.__filler) {
          return (
            <div className="space-y-1">
              <SkeletonLine w="w-32" />
              <SkeletonLine w="w-28" />
            </div>
          );
        }

        const expected = Number.isFinite(Number(r?.expected_cash)) ? Number(r?.expected_cash) : null;
        const counted = Number.isFinite(Number(r?.remitted_cash_amount))
          ? Number(r?.remitted_cash_amount)
          : null;
        const varianceValue = Number.isFinite(Number(r?.cash_variance))
          ? Number(r?.cash_variance)
          : Number.isFinite(counted) && Number.isFinite(expected)
          ? counted - expected
          : null;
        const varianceTone =
          varianceValue === null
            ? "text-slate-400"
            : varianceValue === 0
            ? "text-teal-700"
            : varianceValue < 0
            ? "text-rose-700"
            : "text-amber-800";
        const varianceLabel =
          varianceValue === null
            ? "Variance"
            : varianceValue === 0
            ? "Balanced"
            : varianceValue < 0
            ? "Short by"
            : "Over by";

        return (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-500">Expected {money(expected)}</div>
            <div className="text-xs font-semibold text-slate-500">Counted {money(counted)}</div>
            <div className="text-xs font-semibold">
              {varianceLabel}{" "}
              <span className={varianceTone}>
                {varianceValue === null ? "--" : money(Math.abs(varianceValue))}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "cashless_step",
      label: "Cashless",
      render: (r) => {
        if (r?.__filler) {
          return (
            <div className="space-y-1">
              <SkeletonLine w="w-32" />
              <SkeletonLine w="w-28" />
            </div>
          );
        }

        const cashlessExpected = r?.expected_noncash_total ?? 0;
        const verification = r?.noncash_verification || {};
        const verifiedAmount = Number.isFinite(Number(verification.amount))
          ? Number(verification.amount)
          : 0;
        const verifiedCount = Array.isArray(verification.transaction_ids)
          ? verification.transaction_ids.length
          : 0;
        const cashlessVerified = Boolean(r?.noncash_verified_at);
        const pendingValue = Number.isFinite(Number(cashlessExpected))
          ? Number(cashlessExpected) - Number(verifiedAmount)
          : null;
        const pendingTone =
          pendingValue === null
            ? "text-slate-400"
            : pendingValue === 0
            ? "text-teal-700"
            : pendingValue < 0
            ? "text-rose-700"
            : "text-amber-800";
        const pendingLabel =
          pendingValue === null
            ? "Pending"
            : pendingValue === 0
            ? "Balanced"
            : pendingValue < 0
            ? "Over by"
            : "Pending";

        return (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-500">
              Expected {money(cashlessExpected)}
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Verified {money(verifiedAmount)} | {verifiedCount} txn
            </div>
            <div className="text-xs font-semibold">
              {pendingLabel}{" "}
              <span className={pendingTone}>
                {pendingValue === null ? "--" : money(Math.abs(pendingValue))}
              </span>
            </div>
            {cashlessVerified ? (
              <div className="text-[11px] text-slate-500">
                Verified on {r?.noncash_verified_at || "--"}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openCashlessModal(r)}
                className="text-[11px] font-extrabold text-teal-700 hover:text-teal-900 transition"
              >
                Verify cashless
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (r) => {
        if (r?.__filler) {
          return <SkeletonPill w="w-24" />;
        }

        const status = deriveRemittanceStatus(r);
        const { hasCashIssue, hasCashlessIssue } = issueFlagsForRow(r);
        const hasIssues = status === "finalized" && (hasCashIssue || hasCashlessIssue);

        return (
          <StatusPill
            status={hasIssues ? "finalized_attention" : status}
            label={hasIssues ? "Finalized - Pending" : undefined}
          />
        );
      },
    },
  ];

  const columns = turnoverColumns;

  return (
    <Layout title="Turnover">
      <div className="grid gap-6">
        <TopCard
          title="Cashier Turnover"
          subtitle="Daily system-expected cash and non cash totals per cashier."
          right={
            <Link
              href="/dashboard/accountant/audit"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:outline-none focus:ring-4 focus:ring-teal-500/15"
            >
              <ShieldCheck className="h-4 w-4 text-teal-700" />
              View audit logs
            </Link>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((card) => (
            <KpiCard
              key={card.label}
              label={card.label}
              value={card.value}
              hint={card.helper}
              tone={card.tone || "slate"}
            />
          ))}
        </div>

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-extrabold text-slate-900">Daily closure</div>
          </div>

          <div className="rounded-2xl bg-slate-50/70 p-3 ring-1 ring-slate-200/60">
            <DataTableFilters
              variant="inline"
              containerClass="w-full"
              q={q}
              onQ={setQ}
              onQDebounced={(value) => pushQuery({ q: value, page: 1 })}
              placeholder="Search cashier name..."
              filters={[
                {
                  key: "date",
                  value: date,
                  custom: (
                    <input
                      type="date"
                      value={date}
                      onChange={(event) => handleDateChange(event.target.value)}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-teal-500/15"
                    />
                  ),
                },
                {
                  key: "status",
                  value: status,
                  onChange: handleStatus,
                  options: statusOptions,
                },
              ]}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          searchQuery={q}
          rowKey={(r) =>
            r?.__filler
              ? r.id
              : `${r?.business_date ?? "unknown"}__${r?.cashier_user_id ?? "0"}`
          }
          emptyTitle="No turnover found"
          emptyHint="Turnover appears here per business date per cashier."
          renderActions={(r) =>
            r?.__filler ? (
              <div className="flex items-center justify-end gap-2">
                <SkeletonButton w="w-20" />
                <SkeletonButton w="w-20" />
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <TableActionButton
                  icon={FileText}
                  onClick={() => goToTurnoverReview(r)}
                  title="Review cash and cashless"
                >
                  Review
                </TableActionButton>
                {(() => {
                  const status = deriveRemittanceStatus(r);
                  const { hasCashIssue, hasCashlessIssue } = issueFlagsForRow(r);
                  const hasIssues = status === "finalized" && (hasCashIssue || hasCashlessIssue);

                  if (status === "finalized") {
                    return (
                      <>
                        <TableActionButton
                          icon={ShieldCheck}
                          onClick={() => goToTurnoverReview(r)}
                          title="View final closure"
                        >
                          View
                        </TableActionButton>
                        {hasIssues ? (
                          <TableActionButton
                            tone="danger"
                            onClick={() => handleReopenBusinessDate(r)}
                            title="Reopen this business date to resolve pending items"
                          >
                            Reopen
                          </TableActionButton>
                        ) : null}
                      </>
                    );
                  }

                  return null;
                })()}
              </div>
            )
          }
        />

        <DataTablePagination
          meta={meta}
          perPage={perInitial}
          onPerPage={(n) => pushQuery({ per: n, page: 1 })}
          onPrev={() => meta?.current_page > 1 && pushQuery({ page: meta.current_page - 1 })}
          onNext={() =>
            meta?.current_page < meta?.last_page && pushQuery({ page: meta.current_page + 1 })
          }
          disablePrev={!meta || meta.current_page <= 1}
          disableNext={!meta || meta.current_page >= meta.last_page}
        />
      </div>

      <CashlessVerificationModal
        open={cashlessModalOpen}
        onClose={closeCashlessModal}
        row={cashlessRow}
        onVerified={handleCashlessVerified}
      />
    </Layout>
  );
}
