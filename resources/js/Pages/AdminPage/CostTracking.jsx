// resources/js/Pages/AdminPage/CostTracking.jsx
import React, { useEffect, useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTablePagination from "@/components/Table/DataTablePagination";
import DataTableFilters from "@/components/Table/DataTableFilters";

import { CalendarDays, Wallet, Boxes, Banknote } from "lucide-react";
import { SkeletonLine, SkeletonPill } from "@/components/ui/Skeleton";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

/* -------------------------------------------------------------------------- */
/* Layout bits (match Products / Roles)                                        */
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

function Card({ children, className = "" }) {
  return <div className={cx("rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm", className)}>{children}</div>;
}

function normalizeChartValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatPesoLabel(value) {
  const numeric = Number.isFinite(Number(value)) ? Number(value) : 0;
  return PESO_FORMATTER.format(numeric);
}

function TrendChartCard({
  title,
  hint,
  data = [],
  valueKey,
  formatter = (value) => value.toLocaleString(),
  strokeColor = "#0f766e",
}) {
  const sanitized = Array.isArray(data) ? data : [];
  if (!sanitized.length) {
    return (
      <Card className="p-5 text-[11px] text-slate-500">
        <div className="font-extrabold text-slate-900">{title}</div>
        <div className="mt-1 text-xs">No data available for the selected range.</div>
      </Card>
    );
  }

  const numericValues = sanitized.map((row) => normalizeChartValue(row[valueKey] ?? 0));
  const maxValue = numericValues.length ? Math.max(...numericValues) : 0;
  const minValue = numericValues.length ? Math.min(...numericValues) : 0;
  const range = Math.max(maxValue - minValue, 1);
  const chartWidth = 220;
  const chartHeight = 56;

  const points = numericValues.map((value, index) => {
    const x =
      numericValues.length === 1 ? chartWidth / 2 : (index / Math.max(numericValues.length - 1, 1)) * chartWidth;
    const normalized = (value - minValue) / range;
    const y = chartHeight - normalized * chartHeight;
    return `${x},${Math.max(0, Math.min(chartHeight, y))}`;
  });

  const lastValue = numericValues[numericValues.length - 1] ?? 0;
  const lastRow = sanitized[sanitized.length - 1] || {};
  const latestLabel = lastRow?.label ? `${lastRow.label}` : "";
  const latestDate = lastRow?.date ? ` (${lastRow.date})` : "";
  const latestText = latestLabel ? `${latestLabel}${latestDate}` : latestDate || "—";

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-slate-500">{title}</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900 tabular-nums">{formatter(lastValue)}</div>
        </div>
        <div className="text-[11px] font-semibold text-slate-500">{latestText}</div>
      </div>
      {hint ? <div className="text-[11px] text-slate-500">{hint}</div> : null}
      <svg
        className="h-16 w-full"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <div className="text-[11px] text-slate-400">Showing {sanitized.length} days</div>
    </Card>
  );
}

function StatCard({ Icon, label, value, hint }) {
  return (
    <Card>
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900">{value}</div>
          <div className="mt-1 text-xs text-slate-500">{hint}</div>
        </div>
        <div className="h-11 w-11 rounded-2xl bg-teal-600/10 ring-1 ring-teal-700/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-teal-700" />
        </div>
      </div>
    </Card>
  );
}

function safe(value, fallback = "—") {
  return value === null || value === undefined || value === "" ? fallback : value;
}

function formatMoney(value) {
  if (value === null || value === undefined) return "₱0.00";
  return `₱${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value) {
  if (value === null || value === undefined) return "0";
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
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

function titleCase(s = "") {
  return String(s || "")
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function TypePill({ value }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
      {titleCase(value || "type").toUpperCase()}
    </span>
  );
}

function SortPill({ active, dir }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold ring-1",
        active ? "bg-teal-600/10 text-teal-900 ring-teal-700/10" : "bg-slate-100 text-slate-600 ring-slate-200"
      )}
    >
      {active ? (dir === "asc" ? "ASC" : "DESC") : "SORT"}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function CostTracking() {
  const page = usePage();

  const summary = page.props?.summary || {};
  const rows = page.props?.rows || [];
  const meta = page.props?.meta || null;

  const filters = page.props?.filters || {};
  const basePath = page.props?.path || "/dashboard/accountant/cost-tracking";

  const sortState = page.props?.sort || {};
  const sortKeyInitial = filters?.sort_by || "on_hand";
  const sortDirInitial = filters?.sort_dir || "desc";

  const presetInitial = filters?.preset || "this_month";
  const fromInitial = filters?.from || "";
  const toInitial = filters?.to || "";
  const perInitial = Number(filters?.per || 15) || 15;

  const loading = Boolean(page.props?.loading);

  const [preset, setPreset] = useState(presetInitial);
  const [from, setFrom] = useState(fromInitial);
  const [to, setTo] = useState(toInitial);
  const [q, setQ] = useState(filters?.q || "");
  const [per, setPer] = useState(perInitial);

  const [sortKey, setSortKey] = useState(sortState.key ?? sortKeyInitial);
  const [sortDir, setSortDir] = useState(sortState.dir ?? sortDirInitial);

  useEffect(() => setPer(perInitial), [perInitial]);
  useEffect(() => setSortKey(sortState.key ?? sortKeyInitial), [sortState.key, sortKeyInitial]);
  useEffect(() => setSortDir(sortState.dir ?? sortDirInitial), [sortState.dir, sortDirInitial]);

  const presetOptions = [
    { value: "last_7", label: "Last 7 days" },
    { value: "last_30", label: "Last 30 days" },
    { value: "this_month", label: "This month" },
    { value: "custom", label: "Custom range" },
    ];

  const trends = page.props?.trends || {};
  const trendSeries = Array.isArray(trends.series) ? trends.series : [];
  const trendRangeLabel =
    trends?.range?.start && trends?.range?.end ? `${trends.range.start} – ${trends.range.end}` : "Selected range";

  const presetTabs = [
    { value: "last_7", label: "Last 7" },
    { value: "last_30", label: "Last 30" },
    { value: "this_month", label: "This month" },
    { value: "custom", label: "Custom" },
  ];

  const activePresetTab = presetTabs.some((t) => t.value === preset) ? preset : "this_month";

  const pushQuery = (patch = {}) => {
    if (!basePath) return;

    const nextPreset = patch.preset ?? preset;
    const nextFrom = patch.from ?? from;
    const nextTo = patch.to ?? to;
    const nextPer = patch.per ?? per;
    const nextQ = patch.q ?? q;

    const nextSortKey = patch.sort_by ?? sortKey;
    const nextSortDir = patch.sort_dir ?? sortDir;

    const nextPage = patch.page ?? (meta?.current_page ?? 1);

    router.get(
      basePath,
      {
        preset: nextPreset,
        from: nextFrom,
        to: nextTo,
        q: nextQ,
        per: nextPer,
        page: nextPage,
        sort_by: nextSortKey,
        sort_dir: nextSortDir,
      },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const handlePreset = (value) => {
    setPreset(value);

    if (value !== "custom") {
      setFrom("");
      setTo("");
      pushQuery({ preset: value, from: "", to: "", page: 1 });
      return;
    }

    pushQuery({ preset: value, page: 1 });
  };

  const handleFrom = (value) => {
    setFrom(value);
    setPreset("custom");
    pushQuery({ preset: "custom", from: value, to, page: 1 });
  };

  const handleTo = (value) => {
    setTo(value);
    setPreset("custom");
    pushQuery({ preset: "custom", from, to: value, page: 1 });
  };

  const handlePerPage = (n) => {
    setPer(n);
    pushQuery({ per: n, page: 1 });
  };

  const handlePrev = () => {
    if (!meta) return;
    const current = meta?.current_page ?? 1;
    if (current <= 1) return;
    pushQuery({ page: current - 1 });
  };

  const handleNext = () => {
    if (!meta) return;
    const current = meta?.current_page ?? 1;
    const last = meta?.last_page ?? 1;
    if (current >= last) return;
    pushQuery({ page: current + 1 });
  };

  const handleSort = (key) => {
    const nextDir = sortKey === key ? (sortDir === "asc" ? "desc" : "asc") : "desc";
    setSortKey(key);
    setSortDir(nextDir);
    pushQuery({ sort_by: key, sort_dir: nextDir, page: 1 });
  };

  const statCards = [
    {
      label: "Cost of goods sold",
      value: summary.cogs != null ? formatMoney(summary.cogs) : "₱0.00",
      hint: "Based on supplier costs configured per variant",
      Icon: Wallet,
    },
    {
      label: "Inventory value",
      value: summary.inventory_value != null ? formatMoney(summary.inventory_value) : "₱0.00",
      hint: "On hand stock valued at supplier cost",
      Icon: Boxes,
    },
    {
      label: "Gross profit",
      value: summary.gross_profit != null ? formatMoney(summary.gross_profit) : "₱0.00",
      hint: "Revenue minus COGS",
      Icon: Banknote,
    },
  ];

  const fillerRows = useMemo(() => {
    return Array.from({ length: per }).map((_, i) => ({
      id: `__filler__${i}`,
      __filler: true,
    }));
  }, [per]);

  const tableRows = loading ? fillerRows : rows;

  const columns = useMemo(
    () => [
      {
        key: "product",
        label: "Product",
        sortable: true,
        render: (row) =>
          row?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-40" />
              <SkeletonLine w="w-28" />
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-sm font-extrabold text-slate-900">{safe(row.product_name)}</div>
              <div className="text-[11px] text-slate-500 flex flex-wrap gap-2">
                {row.variant_name ? <span>{row.variant_name}</span> : null}
                {row.sku ? <span className="text-slate-300">|</span> : null}
                <span>{safe(row.sku)}</span>
              </div>
            </div>
          ),
      },
      {
        key: "type",
        label: "Type",
        sortable: true,
        render: (row) => (row?.__filler ? <SkeletonPill w="w-20" /> : <TypePill value={row.type} />),
      },
      {
        key: "variant",
        label: "Size",
        sortable: false,
        render: (row) =>
          row?.__filler ? (
            <SkeletonLine w="w-16" />
          ) : (
            <span className="text-sm font-semibold text-slate-800">{row.variant_name || "—"}</span>
          ),
      },
      {
        key: "supplier",
        label: "Supplier",
        sortable: true,
        render: (row) =>
          row?.__filler ? (
            <SkeletonLine w="w-28" />
          ) : (
            <span className="text-sm text-slate-700">{row.supplier_name || "Not set"}</span>
          ),
      },
      {
        key: "price",
        label: "Price",
        sortable: true,
        render: (row) =>
          row?.__filler ? (
            <SkeletonLine w="w-20" />
          ) : (
            <div className="text-sm font-semibold text-slate-800 tabular-nums">{formatPesoDisplay(row.price)}</div>
          ),
      },
      {
        key: "supplier_cost",
        label: "Supplier cost",
        sortable: true,
        render: (row) =>
          row?.__filler ? (
            <SkeletonLine w="w-20" />
          ) : (
            <div className="text-sm font-semibold text-slate-900 tabular-nums">{formatPesoDisplay(row.supplier_cost)}</div>
          ),
      },
      {
        key: "on_hand",
        label: "On hand",
        sortable: true,
        render: (row) =>
          row?.__filler ? (
            <SkeletonLine w="w-10" />
          ) : (
            <div className="text-sm font-extrabold text-slate-900 tabular-nums">{formatNumber(row.on_hand)}</div>
          ),
      },
      {
        key: "value",
        label: "Inventory value",
        sortable: true,
        render: (row) =>
          row?.__filler ? (
            <SkeletonLine w="w-24" />
          ) : (
            <div className="text-sm font-semibold text-slate-900 tabular-nums">{formatPesoDisplay(row.value)}</div>
          ),
      },
      {
        key: "last_counted_at",
        label: (
          <div className="inline-flex items-center gap-2">
            <span>Last counted</span>
            <SortPill active={sortKey === "last_counted_at"} dir={sortDir} />
          </div>
        ),
        sortable: true,
        render: (row) =>
          row?.__filler ? (
            <SkeletonLine w="w-24" />
          ) : (
            <div className="text-sm text-slate-600">{row.last_counted_at || "—"}</div>
          ),
      },
    ],
    [per, loading, sortKey, sortDir]
  );

  return (
    <Layout title="Cost Tracking">
      <div className="grid gap-6">
        <TopCard
          title="Cost Tracking"
          subtitle="Monitor weighted average costs and inventory value."
          right={
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CalendarDays className="h-4 w-4" />
              As of {filters?.to || "today"}
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          {statCards.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-extrabold text-slate-900">Purchase trends</div>
            <div className="text-[11px] text-slate-500">{trendRangeLabel}</div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TrendChartCard
              title="Request volume"
              hint="Count of purchase requests created per day."
              data={trendSeries}
              valueKey="requests"
              formatter={(value) => Math.round(value).toLocaleString()}
              strokeColor="#0f766e"
            />
            <TrendChartCard
              title="Estimated cost"
              hint="Sum of estimated supplier costs for the selected period."
              data={trendSeries}
              valueKey="cost"
              formatter={formatPesoLabel}
              strokeColor="#0284c7"
            />
          </div>
        </div>

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-4 justify-between">
          <Tabs
            tabs={presetTabs}
            value={activePresetTab}
            onChange={(v) => handlePreset(v)}
          />

          <div className="flex flex-wrap items-center gap-3">
            <div className={cx("flex items-center gap-2", preset !== "custom" && "opacity-40 pointer-events-none")}>
              <input
                value={from}
                onChange={(e) => handleFrom(e.target.value)}
                type="date"
                className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
              />
              <span className="text-sm text-slate-500">to</span>
              <input
                value={to}
                onChange={(e) => handleTo(e.target.value)}
                type="date"
                className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
              />
            </div>

            <select
              value={preset}
              onChange={(e) => handlePreset(e.target.value)}
              className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
            >
              {presetOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-6">
          <div className="space-y-4">
            <DataTableFilters
              variant="inline"
              containerClass="w-full"
              q={q}
              onQ={setQ}
              onQDebounced={(v) => pushQuery({ q: v, page: 1 })}
              placeholder="Search by product, variant, or SKU..."
              rightSlot={
                <div className="text-[11px] font-semibold text-slate-500">
                  Data updates when supplier costs are linked and purchases are received.
                </div>
              }
            />

            <DataTable
              columns={columns}
              rows={tableRows}
              loading={loading}
              sort={{ key: sortKey, dir: sortDir }}
              onSort={handleSort}
              searchQuery={q}
              emptyTitle="No Inventory Tracked"
              emptyHint="Add variants, count stock, and link supplier costs."
            />

            <DataTablePagination
              meta={meta}
              perPage={per}
              onPerPage={handlePerPage}
              onPrev={handlePrev}
              onNext={handleNext}
              disablePrev={!meta || (meta.current_page || 1) <= 1}
              disableNext={!meta || (meta.current_page || 1) >= (meta.last_page || 1)}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
