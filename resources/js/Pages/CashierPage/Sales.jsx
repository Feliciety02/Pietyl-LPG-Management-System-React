import React, { useEffect, useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import axios from "axios";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";

import { posIcons } from "@/components/ui/Icons";
import { CalendarDays } from "lucide-react";
import { SkeletonLine, SkeletonButton } from "@/components/ui/Skeleton";
import { TableActionButton } from "@/components/Table/ActionTableButton";
import ExportRegistrar from "@/components/Table/ExportRegistrar";
import KpiCard from "@/components/ui/KpiCard";

import SaleDetailsModal from "@/components/modals/CashierModals/SaleDetailsModal";
import ReprintReceiptModal from "@/components/modals/CashierModals/ReprintReceiptModal";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

function money(n) {
  const v = Number(n || 0);
  return currencyFormatter.format(v);
}

function safeText(v) {
  return String(v ?? "").trim();
}

/* -------------------------------------------------------------------------- */
/* Small UI blocks                                                            */
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

function Pill({ tone = "slate", children }) {
  const map = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    teal: "bg-teal-600/10 text-teal-900 ring-teal-700/10",
    amber: "bg-amber-600/10 text-amber-900 ring-amber-700/10",
    rose: "bg-rose-600/10 text-rose-900 ring-rose-700/10",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold ring-1",
        map[tone] || map.slate
      )}
    >
      {children}
    </span>
  );
}

function SummaryDateInput({ value, onChange }) {
  return (
    <div className="relative">
      <input
        type="date"
        value={value}
        onChange={onChange}
        className={cx(
          "summary-date-input rounded-2xl border border-slate-200 bg-white px-3 py-2 pr-10 text-sm font-semibold text-slate-700",
          "outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40"
        )}
      />
      <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <style>{`
        input.summary-date-input::-webkit-calendar-picker-indicator {
          opacity: 0;
        }
        input.summary-date-input::-webkit-inner-spin-button {
          display: none;
        }
      `}</style>
    </div>
  );
}

function MethodPill({ method }) {
  const m = String(method || "cash").toLowerCase();
  const tone =
    m === "gcash"
      ? "teal"
      : m === "card"
      ? "slate"
      : "amber";

  return <Pill tone={tone}>{m.toUpperCase()}</Pill>;
}

function StatusPill({ status }) {
  const s = String(status || "paid").toLowerCase();
  const tone =
    s === "paid"
      ? "teal"
      : s === "failed"
      ? "rose"
      : "amber";

  return <Pill tone={tone}>{s.toUpperCase()}</Pill>;
}

function SaleAvatar({ ref }) {
  const t = safeText(ref);
  const seed = t.replace(/\s+/g, "").slice(-2).toUpperCase() || "TX";

  return (
    <div className="h-9 w-9 rounded-2xl bg-teal-600/10 ring-1 ring-teal-700/10 flex items-center justify-center">
      <span className="text-[11px] font-extrabold text-teal-900">{seed}</span>
    </div>
  );
}


function LineSummary({ lines }) {
  const list = Array.isArray(lines) ? lines : [];
  const count = list.reduce((sum, it) => sum + Number(it?.qty || 0), 0);
  if (!list.length) return <span className="text-xs text-slate-400">No items</span>;

  const first = list[0];
  const name = safeText(first?.name) || "Item";
  const variant = safeText(first?.variant);
  const more = list.length - 1;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-extrabold text-slate-700 truncate max-w-[260px]">
        {name}
        {variant ? <span className="text-slate-500"> · {variant}</span> : null}
      </span>

      {more > 0 ? (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
          +{more} more
        </span>
      ) : null}

      <span className="text-[11px] font-extrabold text-slate-500">Qty {count}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Sales({
  basePath: basePathProp,
  defaultExportFormat = "xlsx",
  exportFormats,
}) {
  const page = usePage();
  const vatSettings = page.props?.vat_settings || {};
  const vatActive = Boolean(vatSettings.vat_active);

  const role = page.props?.auth?.user?.role || "cashier";
  const isAdmin = role === "admin";
  const isCashier = role === "cashier";
  const readOnly = !(isAdmin || isCashier);

  const salesBasePath = (basePathProp || page.props?.sales_base_path || "/dashboard/cashier/sales")
    .replace(/\/+$/, "");
  const buildSalesUrl = (suffix) => `${salesBasePath}${suffix}`;
  const allowedExportFormats = Array.isArray(exportFormats) && exportFormats.length
    ? exportFormats
    : ["xlsx", "csv"];

  const query = page.props?.filters || {};
  const per = Number(query?.per || 10);
  const currentPage = Number(query?.page || 1);

  const [q, setQ] = useState(query?.q || "");
  const [status, setStatus] = useState(query?.status || "all");

  const summaryDateFromProps =
    page.props?.filters?.summary_date || new Date().toISOString().slice(0, 10);

  const [summaryDate, setSummaryDate] = useState(summaryDateFromProps);
  const [dailySummary, setDailySummary] = useState(page.props?.daily_summary ?? null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [summaryMessage, setSummaryMessage] = useState("");
  const [finalizing, setFinalizing] = useState(false);
  const [reopening, setReopening] = useState(false);

  const [activeSale, setActiveSale] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [reprintOpen, setReprintOpen] = useState(false);

  const sales = page.props?.sales ?? { data: [], meta: null };
  const rows = sales?.data ?? [];
  const meta = sales?.meta ?? null;

  const loading = Boolean(page.props?.loading);

  const [liveSales, setLiveSales] = useState(rows);
  const [liveMeta, setLiveMeta] = useState(meta);

  useEffect(() => {
    setLiveSales(rows);
    setLiveMeta(meta);
  }, [rows, meta]);

  useEffect(() => {
    let active = true;
    const fetchLiveSales = async () => {
      try {
        const { data: live } = await axios.get(buildSalesUrl("/latest"), {
          params: { q, status, per, page: currentPage, summary_date: summaryDate },
        });

        if (!active) return;
        setLiveSales(live?.data ?? []);
        setLiveMeta(live?.meta ?? null);
      } catch {
        // ignore fetch errors, rely on manual refresh for now
      }
    };

    fetchLiveSales();
    const intervalId = setInterval(fetchLiveSales, 15000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [q, status, per, currentPage, salesBasePath, summaryDate]);

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "paid", label: "Paid" },
    { value: "failed", label: "Failed" },
    { value: "pending", label: "Pending" },
  ];

  const exportConfig = useMemo(() => {
    const formatOptions = allowedExportFormats.length ? allowedExportFormats : ["xlsx"];
    const defaultStatus = status === "all" ? "paid" : status;

    return {
      label: "Export",
      title: "Export sales",
      subtitle: "Pick a business date range, then download a report.",
      endpoint: `${salesBasePath}/export`,
      formats: formatOptions,
      defaultFormat: formatOptions.includes(defaultExportFormat)
        ? defaultExportFormat
        : formatOptions[0],
      dateRange: {
        enabled: true,
        allowFuture: false,
        defaultFrom: summaryDate,
        defaultTo: summaryDate,
      },
      selects: [
        {
          key: "status_scope",
          label: "Sales to include",
          hint: "Most cashiers export paid only.",
          options: [
            { value: "paid", label: "Paid only" },
            { value: "all", label: "All status" },
            { value: "pending", label: "Pending only" },
            { value: "failed", label: "Failed only" },
          ],
          defaultValue: defaultStatus,
        },
      ],
      includeItems: {
        enabled: true,
        default: true,
        label: "Include item breakdown",
        hint: "Adds a second sheet with items per sale.",
        formats: ["xlsx"],
      },
      buildParams: (state) => ({
        from_date: state.from,
        to_date: state.to,
        status_scope: state.selects.status_scope,
        format: state.format,
        include_items: state.includeItems ? 1 : 0,
      }),
      fileName: (state) => {
        const ext = state.format === "csv" ? "csv" : "xlsx";
        return `Sales_${state.from}_to_${state.to}.${ext}`;
      },
    };
  }, [allowedExportFormats, defaultExportFormat, status, summaryDate, salesBasePath]);

  const pushQuery = (patch) => {
    const newPage = patch.page !== undefined ? patch.page : currentPage;

    router.get(
      salesBasePath,
      { q, status, per, page: newPage, summary_date: summaryDate, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const fillerRows = useMemo(
    () =>
      Array.from({ length: per }).map((_, i) => ({
        id: `__filler__${i}`,
        __filler: true,
      })),
    [per]
  );

  const tableRows = loading ? fillerRows : liveSales;

  const extractSummaryError = (error) => {
    const response = error?.response;
    if (response?.data?.message) return response.data.message;

    const validation = response?.data?.errors;
    if (validation) {
      const first = Object.values(validation).flat().find((value) => Boolean(value));
      if (first) return first;
    }
    return "Unable to load summary. Try again.";
  };

  const loadSummary = async (targetDate) => {
    if (!targetDate) return;
    setSummaryLoading(true);
    setSummaryError("");
    setSummaryMessage("");

    try {
      const { data } = await axios.get(buildSalesUrl("/summary"), {
        params: { date: targetDate },
      });
      setDailySummary(data.summary);
    } catch (error) {
      setSummaryError(extractSummaryError(error));
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (!dailySummary && summaryDate) {
      loadSummary(summaryDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSummaryDateChange = (event) => {
    const nextDate = event.target.value;
    if (!nextDate) return;
    setSummaryDate(nextDate);
    pushQuery({ summary_date: nextDate, page: 1 });
    loadSummary(nextDate);
  };

  const finalizeBusinessDate = async () => {
    if (!dailySummary) return;
    setFinalizing(true);
    setSummaryError("");
    setSummaryMessage("");

    try {
      await axios.post(buildSalesUrl("/summary/finalize"), { date: summaryDate });
      await loadSummary(summaryDate);
      setSummaryMessage("Business date closed. New POS sales will be blocked until it is reopened.");
    } catch (error) {
      setSummaryError(extractSummaryError(error));
    } finally {
      setFinalizing(false);
    }
  };

  const reopenBusinessDate = async () => {
    if (!dailySummary) return;
    setReopening(true);
    setSummaryError("");
    setSummaryMessage("");

    try {
      await axios.post(buildSalesUrl("/summary/reopen"), { date: summaryDate });
      await loadSummary(summaryDate);
      setSummaryMessage("Business date reopened. POS transactions are now allowed again.");
    } catch (error) {
      setSummaryError(extractSummaryError(error));
    } finally {
      setReopening(false);
    }
  };

  const openView = (row) => {
    setActiveSale(row);
    setViewOpen(true);
  };

  const openReprint = (row) => {
    setActiveSale(row);
    setReprintOpen(true);
  };

  const ReceiptIcon = posIcons.receipt;
  const ViewIcon = posIcons.search;

  const summaryVariance = Number(dailySummary?.variance ?? 0);
  const isFinalized = dailySummary?.status === "finalized";
  const summaryVatHint = vatActive
    ? `Net ${money(dailySummary?.net_total ?? 0)} · VAT ${money(dailySummary?.vat_total ?? 0)}`
    : "VAT disabled";

  const canFinalizeDate =
    dailySummary &&
    Math.abs(summaryVariance) < 0.01 &&
    !isFinalized;

  const varianceTone =
    Math.abs(summaryVariance) < 0.01
      ? "teal"
      : summaryVariance < 0
      ? "rose"
      : "amber";

  const columns = useMemo(
    () => [
      {
        key: "sale",
        label: "Sale",
        render: (x) =>
          x?.__filler ? (
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-2xl bg-slate-100 ring-1 ring-slate-200" />
              <div className="space-y-2">
                <SkeletonLine w="w-32" />
                <SkeletonLine w="w-48" />
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <SaleAvatar ref={x.ref} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-extrabold text-slate-900">{x.ref}</div>
                  <StatusPill status={x.status} />
                  <MethodPill method={x.method} />
                </div>

                <div className="mt-1 flex flex-col gap-1">
                  <div className="text-xs text-slate-500">
                    <span className="font-extrabold text-slate-700">
                      {x.customer || "Walk in"}
                    </span>
                    <span className="mx-2 text-slate-300">•</span>
                    <span className="text-slate-600">{x.created_at || "Not available"}</span>
                  </div>

                  <LineSummary lines={x.lines} />
                </div>
              </div>
            </div>
          ),
      },
      {
        key: "total",
        label: "Total",
        render: (x) =>
          x?.__filler ? (
            <SkeletonLine w="w-20" />
          ) : (
            <div className="flex justify-start">
              <span className="inline-flex items-center rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                <span className="text-[11px] font-extrabold text-slate-600 mr-2">Total</span>
                <span className="text-[11px] font-extrabold text-slate-900">{money(x.total)}</span>
              </span>
            </div>
          ),
      },
    ],
    []
  );

  return (
    <Layout title="Sales">
      <div className="grid gap-6">
        <ExportRegistrar config={exportConfig} />
        <TopCard
          title="Sales history"
          subtitle="View sales records and reprint receipts."
          right={
            readOnly ? (
              <Pill tone="slate">READ ONLY</Pill>
            ) : (
              <Link
                href="/dashboard/cashier/POS"
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:ring-4 focus:ring-teal-500/25"
              >
                Go to POS
              </Link>
            )
          }
        />

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-slate-900">Daily summary</div>
                <div className="mt-1 text-xs text-slate-500">
                  Quick overview for the selected business date
                </div>
              </div>

            <div className="flex flex-wrap items-center gap-2">
                <SummaryDateInput value={summaryDate} onChange={handleSummaryDateChange} />

                <Pill tone={isFinalized ? "teal" : "amber"}>
                  {isFinalized ? "FINALIZED" : "OPEN"}
                </Pill>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <KpiCard
                label="Gross sales"
                value={summaryLoading ? "Loading..." : money(dailySummary?.sales_total ?? 0)}
                hint={summaryVatHint}
              />
              <KpiCard
                label="Cash expected"
                value={summaryLoading ? "Loading..." : money(dailySummary?.cash_expected ?? 0)}
                hint="Should be in drawer"
              />
              <KpiCard
                label="Cash turned over"
                value={summaryLoading ? "Loading..." : money(dailySummary?.cash_counted ?? 0)}
                hint="Counted and submitted"
              />
              <KpiCard
                label="Non cash total"
                value={summaryLoading ? "Loading..." : money(dailySummary?.non_cash_total ?? 0)}
                hint="GCash, bank, card"
              />
              <KpiCard
                label="Variance"
                value={summaryLoading ? "Loading..." : money(summaryVariance)}
                hint="Must be zero to close"
                tone={varianceTone}
              />
            </div>

            {(summaryMessage || summaryError) && (
              <div
                className={cx(
                  "mt-4 rounded-2xl px-4 py-3 ring-1 text-sm font-semibold",
                  summaryError
                    ? "bg-rose-600/10 text-rose-800 ring-rose-700/10"
                    : "bg-teal-600/10 text-teal-800 ring-teal-700/10"
                )}
              >
                {summaryError || summaryMessage}
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {isFinalized
                  ? `Finalized at ${dailySummary?.finalized_at || "—"}`
                  : Math.abs(summaryVariance) >= 0.01
                  ? "Variance must be zero before closing."
                  : "Ready to close when variance is zero."}
              </div>

              {!readOnly && (
                <div className="flex flex-wrap items-center gap-2">
                  {isFinalized ? (
                    <button
                      type="button"
                      onClick={reopenBusinessDate}
                      disabled={reopening || summaryLoading}
                      className={cx(
                        "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-extrabold ring-1 transition focus:outline-none",
                        reopening || summaryLoading
                          ? "bg-slate-200 text-slate-500 ring-slate-200 cursor-not-allowed"
                          : "bg-white text-slate-800 ring-slate-300 hover:bg-slate-50 focus:ring-4 focus:ring-teal-500/15"
                      )}
                    >
                      {reopening ? "Reopening..." : "Reopen business date"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={finalizeBusinessDate}
                      disabled={!canFinalizeDate || finalizing || summaryLoading}
                      className={cx(
                        "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-extrabold transition focus:outline-none focus:ring-4",
                        !canFinalizeDate || finalizing || summaryLoading
                          ? "bg-slate-200 text-slate-500 ring-slate-200 cursor-not-allowed"
                          : "bg-teal-600 text-white ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25"
                      )}
                    >
                      {finalizing ? "Closing..." : "Close business date"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <DataTableFilters
          q={q}
          onQ={setQ}
          onQDebounced={(v) => pushQuery({ q: v, page: 1 })}
          placeholder="Search reference or customer..."
          filters={[
            {
              key: "status",
              value: status,
              onChange: (v) => {
                setStatus(v);
                pushQuery({ status: v, page: 1 });
              },
              options: statusOptions,
            },
          ]}
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          searchQuery={q}
          emptyTitle="No sales yet"
          emptyHint="Completed sales will appear here."
          renderActions={(row) =>
            row?.__filler ? (
              <div className="flex items-center justify-end gap-2">
                <SkeletonButton w="w-24" />
                <SkeletonButton w="w-20" />
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                {!readOnly && (
                  <TableActionButton
                    icon={ReceiptIcon}
                    onClick={() => openReprint(row)}
                    title="Reprint receipt"
                  >
                    Reprint
                  </TableActionButton>
                )}

                <TableActionButton
                  icon={ViewIcon}
                  onClick={() => openView(row)}
                  title="View sale details"
                >
                  View
                </TableActionButton>
              </div>
            )
          }
        />

        <DataTablePagination
          meta={liveMeta}
          perPage={per}
          onPerPage={(n) => pushQuery({ per: n, page: 1 })}
          onPrev={() => meta?.current_page > 1 && pushQuery({ page: meta.current_page - 1 })}
          onNext={() =>
            meta?.current_page < meta?.last_page && pushQuery({ page: meta.current_page + 1 })
          }
          disablePrev={!meta || meta.current_page <= 1}
          disableNext={!meta || meta.current_page >= meta.last_page}
        />
      </div>

      <SaleDetailsModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        sale={activeSale}
      />

      <ReprintReceiptModal
        open={reprintOpen}
        onClose={() => setReprintOpen(false)}
        sale={activeSale}
        basePath={salesBasePath}
        onReprint={(payload) => {
          setActiveSale(payload);
          setViewOpen(true);
          setReprintOpen(false);
        }}
      />
    </Layout>
  );
}
