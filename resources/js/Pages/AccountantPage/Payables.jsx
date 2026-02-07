import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";

import { Eye, CreditCard, Wallet, AlertTriangle, ArrowLeft } from "lucide-react";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

import { TableActionButton } from "@/components/Table/ActionTableButton";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Tabs({ tabs, value, onChange }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-slate-50 p-1 ring-1 ring-slate-200">
      {tabs.map((t) => {
        const active = t.value === value;

        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={cx(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition",
              active
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "text-slate-600 hover:text-slate-800"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function normalizePaginator(p) {
  const x = p || {};
  const data = Array.isArray(x.data) ? x.data : [];
  const meta =
    x.meta && typeof x.meta === "object"
      ? x.meta
      : x.current_page != null || x.last_page != null
      ? x
      : null;

  return { data, meta };
}

const PESO_FORMATTER = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function parseNumericValue(value) {
  if (value == null || value === "") return null;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

function formatPesoDisplay(value) {
  const numeric = parseNumericValue(value);
  if (numeric == null) return "—";
  return PESO_FORMATTER.format(numeric);
}

function normalizeStatus(status) {
  return String(status || "").toLowerCase().replace(/\s+/g, "_");
}

function StatusPill({ status }) {
  const s = normalizeStatus(status);

  const tone =
    s === "unpaid"
      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
      : s === "paid"
      ? "bg-emerald-600/10 text-emerald-900 ring-emerald-700/10"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  const labelMap = {
    unpaid: "UNPAID",
    paid: "PAID",
  };

  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1", tone)}>
      {labelMap[s] || (status ? String(status).toUpperCase() : "UNKNOWN")}
    </span>
  );
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

function KpiCard({ icon: Icon, label, value, hint, tone = "teal" }) {
  const toneBox =
    tone === "amber"
      ? "bg-amber-600/10 ring-amber-700/10"
      : tone === "emerald"
      ? "bg-emerald-600/10 ring-emerald-700/10"
      : "bg-teal-600/10 ring-teal-700/10";

  const toneIcon =
    tone === "amber" ? "text-amber-800" : tone === "emerald" ? "text-emerald-800" : "text-teal-700";

  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900 tabular-nums">{value}</div>
          {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
        </div>
        <div className={cx("h-11 w-11 rounded-2xl ring-1 flex items-center justify-center", toneBox)}>
          <Icon className={cx("h-5 w-5", toneIcon)} />
        </div>
      </div>
    </div>
  );
}

export default function Payables() {
  const page = usePage();

  const rawPayables = page.props?.payables ?? { data: [], meta: null };
  const { data: rows, meta } = normalizePaginator(rawPayables);

  const filters = page.props?.filters ?? { status: "all", q: "" };
  const summary = page.props?.summary ?? { total_unpaid_amount: 0, count_unpaid: 0 };

  const qInitial = filters?.q || "";
  const statusInitial = filters?.status || "all";
  const perInitial = Number(filters?.per || meta?.per_page || 10) || 10;

  const [q, setQ] = useState(qInitial);
  const [status, setStatus] = useState(statusInitial);

  const loading = Boolean(page.props?.loading);

  const buildQueryPayload = (patch = {}) => {
    const finalStatus = patch.status ?? status;

    return {
      q,
      status: finalStatus,
      per: patch.per ?? perInitial,
      ...patch,
    };
  };

  const pushQuery = (patch = {}) => {
    router.get("/dashboard/accountant/payables", buildQueryPayload(patch), {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    });
  };

  const statusTabs = [
    { value: "all", label: "All" },
    { value: "unpaid", label: "Unpaid" },
    { value: "paid", label: "Paid" },
  ];

  const activeStatusTab = statusTabs.some((t) => t.value === status) ? status : "all";

  const handlePrev = () => {
    if (!meta) return;
    if ((meta.current_page || 1) <= 1) return;
    pushQuery({ page: (meta.current_page || 1) - 1 });
  };

  const handleNext = () => {
    if (!meta) return;
    if ((meta.current_page || 1) >= (meta.last_page || 1)) return;
    pushQuery({ page: (meta.current_page || 1) + 1 });
  };

  const fillerRows = useMemo(() => {
    return Array.from({ length: perInitial }).map((_, i) => ({
      id: `__filler__${i}`,
      __filler: true,
    }));
  }, [perInitial]);

  const tableRows = loading ? fillerRows : rows;

  const unpaidCount = Number(summary.count_unpaid || 0);
  const unpaidAmount = Number(summary.total_unpaid_amount || 0);

  const countTone = unpaidCount > 0 ? "amber" : "teal";
  const amountTone = unpaidAmount > 0 ? "amber" : "teal";

  const columns = useMemo(
    () => [
      {
        key: "supplier",
        label: "Supplier",
        render: (row) =>
          row?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-40" />
              <SkeletonLine w="w-28" />
            </div>
          ) : (
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-slate-900 truncate">
                {row.supplier_name || "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500 truncate">{row.source_ref || "—"}</div>
            </div>
          ),
      },
      {
        key: "amount",
        label: "Amount",
        render: (row) =>
          row?.__filler ? (
            <SkeletonLine w="w-24" />
          ) : (
            <div className="text-sm font-extrabold text-slate-900 tabular-nums">
              {formatPesoDisplay(row.amount)}
            </div>
          ),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => (row?.__filler ? <SkeletonPill w="w-20" /> : <StatusPill status={row.status} />),
      },
      {
        key: "created_at",
        label: "Created",
        render: (row) => (row?.__filler ? <SkeletonLine w="w-28" /> : <div className="text-sm text-slate-600">{row.created_at || "—"}</div>),
      },
    ],
    []
  );

  return (
    <Layout title="Supplier payables">
      <div className="grid gap-6">
        <TopCard
          title="Supplier payables"
          subtitle="Review unpaid supplier balances and open the payable to record payment."
          right={
            <div className="flex items-center gap-2">
          

            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2">
          <KpiCard
            icon={AlertTriangle}
            label="Unpaid count"
            value={String(unpaidCount)}
            hint="Payables still open"
            tone={countTone}
          />
          <KpiCard
            icon={Wallet}
            label="Unpaid amount"
            value={PESO_FORMATTER.format(unpaidAmount)}
            hint="Total outstanding balance"
            tone={amountTone}
          />
        </div>

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-4 justify-between">
          <Tabs
            tabs={statusTabs}
            value={activeStatusTab}
            onChange={(v) => {
              setStatus(v);
              pushQuery({ status: v, page: 1 });
            }}
          />

          <DataTableFilters
            variant="inline"
            containerClass="w-full md:w-auto"
            q={q}
            onQ={setQ}
            onQDebounced={(v) => pushQuery({ q: v, page: 1 })}
            placeholder="Search supplier or reference..."
            filters={[]}
          />
        </div>

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          searchQuery={q}
          emptyTitle="No payables found"
          emptyHint="Payables appear after approved requests are received and posted."
          renderActions={(row) =>
            row?.__filler ? (
              <div className="flex items-center justify-end gap-2">
                <SkeletonButton w="w-28" />
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <TableActionButton
                  icon={Eye}
                  onClick={() => router.get(`/dashboard/accountant/payables/${row.id}`, {}, { preserveState: true })}
                  title="View payable"
                >
                  View
                </TableActionButton>

                {normalizeStatus(row.status) === "unpaid" ? (
                  <TableActionButton
                    icon={CreditCard}
                    tone="primary"
                    onClick={() => router.get(`/dashboard/accountant/payables/${row.id}`, {}, { preserveState: true })}
                    title="Pay payable"
                  >
                    Pay
                  </TableActionButton>
                ) : null}
              </div>
            )
          }
          rowKey={(row) => {
            if (row?.__filler) return row.id;
            return `payable_${row.id}`;
          }}
        />

        <DataTablePagination
          meta={meta}
          perPage={perInitial}
          onPerPage={(n) => pushQuery({ per: n, page: 1 })}
          onPrev={handlePrev}
          onNext={handleNext}
          disablePrev={!meta || (meta.current_page || 1) <= 1}
          disableNext={!meta || (meta.current_page || 1) >= (meta.last_page || 1)}
        />
      </div>
    </Layout>
  );
}
