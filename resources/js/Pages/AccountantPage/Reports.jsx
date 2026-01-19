
import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { Download, FileSpreadsheet, FileText, ShieldCheck } from "lucide-react";
import { SkeletonLine, SkeletonButton, SkeletonPill } from "@/components/ui/Skeleton";

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

    Export endpoints idea:
    - GET /dashboard/accountant/reports/export?type=sales&from=YYYY-MM-DD&to=YYYY-MM-DD&format=pdf
    - GET /dashboard/accountant/reports/export?type=sales&from=YYYY-MM-DD&to=YYYY-MM-DD&format=xlsx
  */

  const reports = page.props?.reports || { data: [], meta: null };
  const rows = reports?.data || [];
  const meta = reports?.meta || null;

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

  const handleSearch = (value) => {
    setQ(value);
    pushQuery({ q: value, page: 1 });
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
            <div className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">{money(r?.total_sales || 0)}</span>
              <span className="text-slate-500"> total</span>
              <span className="mx-2 text-slate-300">•</span>
              <span className="font-semibold text-slate-900">{money(r?.total_cash || 0)}</span>
              <span className="text-slate-500"> cash</span>
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
    []
  );

  const exportBase = "/dashboard/accountant/reports/export";

  const exportHref = (format) => {
    const params = new URLSearchParams({
      type: type,
      from: from,
      to: to,
      format: format,
    });
    return `${exportBase}?${params.toString()}`;
  };

  return (
    <Layout title="Reports">
      <div className="grid gap-6">
        <TopCard
          title="Reports"
          subtitle="Generate financial reports for owner review and record keeping. Exports are read-only snapshots."
          right={
            <div className="flex items-center gap-2">
              <a
                href={exportHref("pdf")}
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:ring-4 focus:ring-teal-500/25"
              >
                <FileText className="h-4 w-4" />
                Export PDF
              </a>

              <a
                href={exportHref("xlsx")}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:ring-4 focus:ring-teal-500/15"
              >
                <FileSpreadsheet className="h-4 w-4 text-teal-700" />
                Export Excel
              </a>

              <Link
                href="/dashboard/admin/audit"
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
          onQ={handleSearch}
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
          emptyTitle="No reports yet"
          emptyHint="Generate a report by choosing a type and date range, then export."
          renderActions={(r) =>
            r?.__filler ? (
              <div className="flex items-center justify-end gap-2">
                <SkeletonButton w="w-24" />
                <div className="h-9 w-9 rounded-2xl bg-slate-200/80 animate-pulse" />
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <a
                  href={`${exportBase}?id=${encodeURIComponent(r.id)}&format=pdf`}
                  className="rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:ring-4 focus:ring-teal-500/15"
                  title="Export this report to PDF"
                >
                  PDF
                </a>
                <a
                  href={`${exportBase}?id=${encodeURIComponent(r.id)}&format=xlsx`}
                  className="rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:ring-4 focus:ring-teal-500/15"
                  title="Export this report to Excel"
                >
                  Excel
                </a>

                <button
                  type="button"
                  className="rounded-2xl bg-white p-2 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:ring-4 focus:ring-teal-500/15"
                  title="More actions"
                >
                  <Download className="h-4 w-4 text-slate-600" />
                </button>
              </div>
            )
          }
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
      </div>
    </Layout>
  );
}