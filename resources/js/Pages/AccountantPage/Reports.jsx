
import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { ShieldCheck } from "lucide-react";
import { SkeletonLine, SkeletonPill } from "@/components/ui/Skeleton";
import ExportRegistrar from "@/components/Table/ExportRegistrar";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function money(v) {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });
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

function TypePill({ type }) {
  const t = String(type || "sales").toLowerCase();
  const map = {
    sales: "bg-teal-600/10 text-teal-900 ring-teal-700/10",
    remittances: "bg-slate-100 text-slate-800 ring-slate-200",
    discrepancies: "bg-amber-600/10 text-amber-900 ring-amber-700/10",
  };

  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1", map[t] || map.sales)}>
      {t.toUpperCase()}
    </span>
  );
}

export default function Reports() {
  const page = usePage();
  const vatSettings = page.props?.vat_settings || {};
  const vatActive = Boolean(vatSettings.vat_active);

  /*
    Expected Inertia props from backend:
    reports: {
      data: [{
        id,
        report_type,        string (sales|remittances|discrepancies)
        date_from,          string (YYYY-MM-DD)
        date_to,            string (YYYY-MM-DD)
        total_sales,        number|null
        total_cash,         number|null
        total_non_cash,     number|null
        total_remitted,     number|null
        variance_total,     number|null
        generated_at,       string|null
        generated_by,       string|null
      }],
      meta,
      links
    }
    filters: { q, type, from, to, page, per }
    loading: boolean (optional)
    transactions: array (per type range)

    Export endpoints idea:
    - GET /dashboard/accountant/reports/export?type=sales&from=YYYY-MM-DD&to=YYYY-MM-DD&format=pdf
    - GET /dashboard/accountant/reports/export?type=sales&from=YYYY-MM-DD&to=YYYY-MM-DD&format=xlsx
  */

  const reports = page.props?.reports || { data: [], meta: null };
  const rows = reports?.data || [];
  const meta = reports?.meta || null;
  const transactions = Array.isArray(page.props?.transactions) ? page.props.transactions : [];

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const typeInitial = query?.type || "sales";
  const fromInitial = query?.from || "2026-01-01";
  const toInitial = query?.to || "2026-01-19";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [type, setType] = useState(typeInitial);
  const [from, setFrom] = useState(fromInitial);
  const [to, setTo] = useState(toInitial);

  const typeOptions = [
    { value: "sales", label: "Sales report" },
    { value: "remittances", label: "Remittances report" },
    { value: "discrepancies", label: "Discrepancies report" },
  ];

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/accountant/reports",
      { q, type, from, to, per: perInitial, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const handleType = (value) => {
    setType(value);
    pushQuery({ type: value, page: 1 });
  };

  const handleFrom = (value) => {
    setFrom(value);
    pushQuery({ from: value, page: 1 });
  };

  const handleTo = (value) => {
    setTo(value);
    pushQuery({ to: value, page: 1 });
  };

  const handlePerPage = (n) => pushQuery({ per: n, page: 1 });
  const handlePrev = () => meta && meta.current_page > 1 && pushQuery({ page: meta.current_page - 1 });
  const handleNext = () => meta && meta.current_page < meta.last_page && pushQuery({ page: meta.current_page + 1 });

  const loading = Boolean(page.props?.loading);

  const sampleRows = useMemo(
    () => [
      {
        id: 1,
        report_type: "sales",
        date_from: "2026-01-19",
        date_to: "2026-01-19",
        total_sales: 7850,
        total_cash: 5200,
        total_non_cash: 2650,
        total_remitted: null,
        variance_total: null,
        generated_at: "2026-01-19 20:10:00",
        generated_by: "Accountant",
      },
      {
        id: 2,
        report_type: "remittances",
        date_from: "2026-01-19",
        date_to: "2026-01-19",
        total_sales: null,
        total_cash: null,
        total_non_cash: null,
        total_remitted: 7000,
        variance_total: -200,
        generated_at: "2026-01-19 20:12:00",
        generated_by: "Accountant",
      },
      {
        id: 3,
        report_type: "discrepancies",
        date_from: "2026-01-01",
        date_to: "2026-01-19",
        total_sales: null,
        total_cash: null,
        total_non_cash: null,
        total_remitted: null,
        variance_total: -200,
        generated_at: "2026-01-19 20:15:00",
        generated_by: "Accountant",
      },
    ],
    []
  );

  const effectiveRows = rows?.length ? rows : sampleRows;

  const fillerRows = useMemo(
    () => Array.from({ length: perInitial }).map((_, i) => ({ id: `__filler__${i}`, __filler: true })),
    [perInitial]
  );

  const tableRows = loading ? fillerRows : effectiveRows;

  const transactionFiller = useMemo(
    () => Array.from({ length: Math.min(perInitial, 10) }).map((_, i) => ({ id: `__txn_filler__${i}`, __filler: true })),
    [perInitial]
  );

  const transactionRows = loading ? transactionFiller : transactions;

  const transactionColumns = useMemo(() => {
    if (type === "sales") {
      const base = [
        {
          key: "sale_datetime",
          label: "Date/Time",
          render: (r) =>
            r?.__filler ? (
              <SkeletonLine w="w-28" />
            ) : (
              <div className="text-sm text-slate-700">{r?.sale_datetime || "â€”"}</div>
            ),
        },
        {
          key: "reference",
          label: "Sale #",
          render: (r) =>
            r?.__filler ? (
              <SkeletonLine w="w-20" />
            ) : (
              <div className="text-sm font-extrabold text-slate-900">{r?.reference || "â€”"}</div>
            ),
        },
        {
          key: "customer",
          label: "Customer",
          render: (r) =>
            r?.__filler ? <SkeletonLine w="w-24" /> : <div className="text-sm text-slate-700">{r?.customer || "Walk in"}</div>,
        },
        {
          key: "cashier",
          label: "Cashier",
          render: (r) =>
            r?.__filler ? <SkeletonLine w="w-24" /> : <div className="text-sm text-slate-700">{r?.cashier || "System"}</div>,
        },
        {
          key: "items",
          label: "Items",
          render: (r) =>
            r?.__filler ? (
              <SkeletonLine w="w-12" />
            ) : (
              <div className="text-sm text-slate-700">
                <span className="font-semibold text-slate-900">{r?.items_count ?? 0}</span>
                <span className="text-slate-500"> / {r?.items_qty ?? 0} qty</span>
              </div>
            ),
        },
        {
          key: "payments",
          label: "Payments",
          render: (r) =>
            r?.__filler ? (
              <SkeletonLine w="w-24" />
            ) : (
              <div className="text-sm text-slate-700 space-y-1">
                <div>
                  <span className="font-semibold text-slate-900">{money(r?.cash_amount || 0)}</span>
                  <span className="text-slate-500"> cash</span>
                </div>
                <div className="text-xs text-slate-500">
                  {money(r?.non_cash_amount || 0)} non-cash
                </div>
              </div>
            ),
        },
      ];

      const amountColumns = [
        {
          key: "net_amount",
          label: "Net",
          render: (r) =>
            r?.__filler ? (
              <SkeletonLine w="w-20" />
            ) : (
              <div className="text-sm font-semibold text-slate-800">{money(r?.net_amount || 0)}</div>
            ),
        },
        {
          key: "vat_amount",
          label: "VAT",
          render: (r) =>
            r?.__filler ? (
              <SkeletonLine w="w-20" />
            ) : (
              <div className="text-sm font-semibold text-slate-800">{money(r?.vat_amount || 0)}</div>
            ),
        },
        {
          key: "gross_amount",
          label: "Gross",
          render: (r) =>
            r?.__filler ? (
              <SkeletonLine w="w-20" />
            ) : (
              <div className="text-sm font-semibold text-slate-900">{money(r?.gross_amount || 0)}</div>
            ),
        },
      ];

      if (vatActive) {
        return [...base, ...amountColumns];
      }

      return [
        ...base,
        {
          key: "gross_amount",
          label: "Total",
          render: (r) =>
            r?.__filler ? <SkeletonLine w="w-20" /> : <div className="text-sm font-semibold text-slate-900">{money(r?.gross_amount || 0)}</div>,
        },
      ];
    }

    return [
      {
        key: "business_date",
        label: "Business date",
        render: (r) =>
          r?.__filler ? <SkeletonLine w="w-24" /> : <div className="text-sm text-slate-700">{r?.business_date || "â€”"}</div>,
      },
      {
        key: "cashier",
        label: "Cashier",
        render: (r) =>
          r?.__filler ? <SkeletonLine w="w-24" /> : <div className="text-sm text-slate-700">{r?.cashier || "System"}</div>,
      },
      {
        key: "expected",
        label: "Expected",
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-24" />
          ) : (
            <div className="text-sm text-slate-700 space-y-1">
              <div>
                <span className="font-semibold text-slate-900">{money(r?.expected_amount || 0)}</span>
                <span className="text-slate-500"> total</span>
              </div>
              <div className="text-xs text-slate-500">
                {money(r?.expected_cash || 0)} cash / {money(r?.expected_noncash_total || 0)} non-cash
              </div>
            </div>
          ),
      },
      {
        key: "remitted",
        label: "Remitted",
        render: (r) =>
          r?.__filler ? <SkeletonLine w="w-20" /> : <div className="text-sm font-semibold text-slate-900">{money(r?.remitted_amount || 0)}</div>,
      },
      {
        key: "variance",
        label: "Variance",
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-20" />
          ) : (
            <div className={cx("text-sm font-extrabold", Number(r?.variance_amount || 0) === 0 ? "text-teal-700" : "text-amber-800")}>
              {money(r?.variance_amount || 0)}
            </div>
          ),
      },
      {
        key: "status",
        label: "Status",
        render: (r) =>
          r?.__filler ? <SkeletonPill w="w-20" /> : <div className="text-xs font-extrabold text-slate-700">{String(r?.status || "pending").toUpperCase()}</div>,
      },
      {
        key: "recorded_at",
        label: "Recorded",
        render: (r) =>
          r?.__filler ? <SkeletonLine w="w-24" /> : <div className="text-sm text-slate-700">{r?.recorded_at || "â€”"}</div>,
      },
      {
        key: "accountant",
        label: "Accountant",
        render: (r) =>
          r?.__filler ? <SkeletonLine w="w-24" /> : <div className="text-sm text-slate-700">{r?.accountant || "System"}</div>,
      },
    ];
  }, [type, vatActive]);

  const columns = useMemo(
    () => [
      {
        key: "report_type",
        label: "Type",
        render: (r) => (r?.__filler ? <SkeletonPill w="w-28" /> : <TypePill type={r?.report_type} />),
      },
      {
        key: "range",
        label: "Date range",
        render: (r) =>
          r?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-24" />
              <SkeletonLine w="w-32" />
            </div>
          ) : (
            <div>
              <div className="text-sm font-extrabold text-slate-900">
                {r?.date_from} to {r?.date_to}
              </div>
              <div className="mt-1 text-xs text-slate-600">Generated report snapshot</div>
            </div>
          ),
      },
      {
        key: "highlights",
        label: "Highlights",
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-56" />
          ) : r?.report_type === "sales" ? (
            <div className="text-sm text-slate-700 space-y-1">
              <div>
                <span className="font-semibold text-slate-900">{money(r?.total_sales || 0)}</span>
                <span className="text-slate-500"> total</span>
                <span className="mx-2 text-slate-300">•</span>
                <span className="font-semibold text-slate-900">{money(r?.total_cash || 0)}</span>
                <span className="text-slate-500"> cash</span>
              </div>
              {vatActive ? (
                <div className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-900">{money(r?.total_net_sales || 0)}</span>
                  <span className="text-slate-500"> net</span>
                  <span className="mx-2 text-slate-300">&middot;</span>
                  <span className="font-semibold text-slate-900">{money(r?.total_vat || 0)}</span>
                  <span className="text-slate-500"> VAT</span>
                </div>
              ) : (
                <div className="text-xs text-slate-500">VAT is disabled for this report range.</div>
              )}

            </div>
          ) : r?.report_type === "remittances" ? (
            <div className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">{money(r?.total_remitted || 0)}</span>
              <span className="text-slate-500"> remitted</span>
              <span className="mx-2 text-slate-300">•</span>
              <span className={cx("font-extrabold", Number(r?.variance_total || 0) === 0 ? "text-teal-700" : "text-amber-800")}>
                {money(r?.variance_total || 0)}
              </span>
              <span className="text-slate-500"> variance</span>
            </div>
          ) : (
            <div className="text-sm text-slate-700">
              <span className={cx("font-extrabold", Number(r?.variance_total || 0) === 0 ? "text-teal-700" : "text-amber-800")}>
                {money(r?.variance_total || 0)}
              </span>
              <span className="text-slate-500"> total variance</span>
            </div>
          ),
      },
      {
        key: "generated",
        label: "Generated",
        render: (r) => (r?.__filler ? <SkeletonLine w="w-28" /> : <span className="text-sm text-slate-700">{r?.generated_at || "—"}</span>),
      },
    ],
    [vatActive]
  );

  const exportBase = "/dashboard/accountant/reports/export";

  const exportConfig = useMemo(
    () => ({
      label: "Export",
      title: "Export report",
      subtitle: "Pick a range and report type, then download.",
      endpoint: exportBase,
      formats: ["csv", "pdf", "xlsx"],
      defaultFormat: "csv",
      dateRange: {
        enabled: true,
        allowFuture: false,
        defaultFrom: from,
        defaultTo: to,
      },
      selects: [
        {
          key: "type",
          label: "Report type",
          options: typeOptions,
          defaultValue: type,
        },
      ],
      buildParams: (state) => ({
        type: state.selects.type,
        from: state.from,
        to: state.to,
        format: state.format,
      }),
      fileName: (state) => `Report_${state.selects.type}_${state.from}_to_${state.to}.${state.format}`,
    }),
    [exportBase, from, to, type, typeOptions]
  );

  return (
    <Layout title="Reports">
      <div className="grid gap-6">
        <ExportRegistrar config={exportConfig} />
        <TopCard
          title="Reports"
          subtitle="Generate financial reports for owner review and record keeping. Exports are read-only snapshots."
          right={
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard/accountant/audit"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:ring-4 focus:ring-teal-500/15"
              >
                <ShieldCheck className="h-4 w-4 text-teal-700" />
                Audit logs
              </Link>
            </div>
          }
        />

        <DataTableFilters
          q={q}
          onQ={setQ}
          onQDebounced={(value) => pushQuery({ q: value, page: 1 })}
          placeholder="Search generated reports..."
          filters={[
            { key: "type", value: type, onChange: handleType, options: typeOptions },
            {
              key: "from",
              value: from,
              onChange: handleFrom,
              options: [
                { value: from, label: "From date" },
              ],
              custom: (
                <input
                  type="date"
                  value={from}
                  onChange={(e) => handleFrom(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-teal-500/15"
                />
              ),
            },
            {
              key: "to",
              value: to,
              onChange: handleTo,
              options: [
                { value: to, label: "To date" },
              ],
              custom: (
                <input
                  type="date"
                  value={to}
                  onChange={(e) => handleTo(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-teal-500/15"
                />
              ),
            },
          ]}
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          searchQuery={q}
          emptyTitle="No reports yet"
          emptyHint="Generate a report by choosing a type and date range, then export."
        />

        <DataTablePagination
          meta={meta}
          perPage={perInitial}
          onPerPage={(n) => pushQuery({ per: n, page: 1 })}
          onPrev={() => meta && meta.current_page > 1 && pushQuery({ page: meta.current_page - 1 })}
          onNext={() => meta && meta.current_page < meta.last_page && pushQuery({ page: meta.current_page + 1 })}
          disablePrev={!meta || meta.current_page <= 1}
          disableNext={!meta || meta.current_page >= meta.last_page}
        />

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold text-slate-900">Transactions in range</div>
              <div className="text-xs text-slate-500">
                {transactions.length} transaction{transactions.length === 1 ? "" : "s"} for {type}
              </div>
            </div>
          </div>

          <DataTable
            columns={transactionColumns}
            rows={transactionRows}
            loading={loading}
            searchQuery={q}
            emptyTitle="No transactions found"
            emptyHint="Try changing the date range or report type."
          />
        </div>
      </div>
    </Layout>
  );
}
