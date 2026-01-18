import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import {
  Download,
  CalendarDays,
  Wallet,
  Truck,
  AlertTriangle,
  ClipboardList,
  BarChart3,
} from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
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

function StatCard({ Icon, label, value, hint }) {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
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
    </div>
  );
}

function Panel({ title, right, children }) {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="text-sm font-extrabold text-slate-900">{title}</div>
        {right}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function MetricRow({ label, value, hint }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-extrabold text-slate-900">{label}</div>
        {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
      </div>
      <div className="text-sm font-extrabold text-slate-900 whitespace-nowrap">{value}</div>
    </div>
  );
}

export default function Reports() {
  const page = usePage();

  /*
    Expected Inertia props from backend later:
    report: {
      sales_total,
      sales_count,
      revenue_total,
      gross_profit,             optional
      deliveries_total,
      deliveries_completed,
      low_stock_count,
      remittance_total,
      top_products: [{ name, qty, amount }],
      top_customers: [{ name, amount }],
      rider_perf: [{ rider_name, completed, pending }],
      inventory_risk: [{ name, qty, threshold }]
    }
    filters: { preset, from, to }
  */

  const report = page.props?.report || null;
  const filters = page.props?.filters || {};

  const presetInitial = filters?.preset || "today";
  const fromInitial = filters?.from || "";
  const toInitial = filters?.to || "";

  const [preset, setPreset] = useState(presetInitial);
  const [from, setFrom] = useState(fromInitial);
  const [to, setTo] = useState(toInitial);

  const presetOptions = [
    { value: "today", label: "Today" },
    { value: "this_week", label: "This week" },
    { value: "this_month", label: "This month" },
    { value: "custom", label: "Custom range" },
  ];

  const pushQuery = (patch) => {
    const next = {
      preset,
      from,
      to,
      ...patch,
    };

    router.get("/dashboard/admin/reports", next, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    });
  };

  const handlePreset = (value) => {
    setPreset(value);
    if (value !== "custom") {
      setFrom("");
      setTo("");
      pushQuery({ preset: value, from: "", to: "" });
      return;
    }
    pushQuery({ preset: value });
  };

  const handleFrom = (value) => {
    setFrom(value);
    pushQuery({ from: value, preset: "custom" });
  };

  const handleTo = (value) => {
    setTo(value);
    pushQuery({ to: value, preset: "custom" });
  };

  const safe = (v, fallback = "—") => (v === null || v === undefined || v === "" ? fallback : v);

  const kpi = useMemo(() => {
    return {
      sales_total: safe(report?.sales_total, "₱0"),
      sales_count: safe(report?.sales_count, "0"),
      revenue_total: safe(report?.revenue_total, "₱0"),
      deliveries_total: safe(report?.deliveries_total, "0"),
      low_stock_count: safe(report?.low_stock_count, "0"),
      remittance_total: safe(report?.remittance_total, "₱0"),
      gross_profit: report?.gross_profit,
    };
  }, [report]);

  return (
    <Layout title="Reports">
      {/* Admin Reports
         Purpose
         Owner level visibility into business performance
         Scope lock
         Read only dashboards and exports, no accounting entries here
      */}
      <div className="grid gap-6">
        <TopCard
          title="Reports"
          subtitle="Owner level performance overview. Read only summaries and exports."
          right={
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/admin/reports/export"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:ring-4 focus:ring-teal-500/15"
              >
                <Download className="h-4 w-4 text-slate-600" />
                Export
              </Link>

              <Link
                href="/dashboard/admin/audit"
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:ring-4 focus:ring-teal-500/25"
              >
                <BarChart3 className="h-4 w-4" />
                View Audit
              </Link>
            </div>
          }
        />

        {/* Filters */}
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
          <div className="p-5 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-3 py-2">
              <CalendarDays className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-extrabold text-slate-800">Range</span>
            </div>

            <select
              value={preset}
              onChange={(e) => handlePreset(e.target.value)}
              className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
            >
              {presetOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

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

            <div className="ml-auto text-xs text-slate-500">
              Reports are read only. Accounting entries are handled by the accountant role.
            </div>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            Icon={Wallet}
            label="Sales total"
            value={kpi.sales_total}
            hint="Total sales amount in selected range"
          />
          <StatCard
            Icon={ClipboardList}
            label="Sales count"
            value={kpi.sales_count}
            hint="Number of transactions"
          />
          <StatCard
            Icon={Truck}
            label="Deliveries"
            value={kpi.deliveries_total}
            hint="Deliveries in selected range"
          />
          <StatCard
            Icon={AlertTriangle}
            label="Low stock risk"
            value={kpi.low_stock_count}
            hint="Items at or below threshold"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {/* Revenue + remittance */}
          <div className="xl:col-span-2 grid gap-6">
            <Panel
              title="Revenue overview"
              right={<span className="text-xs text-slate-500">Summary only</span>}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <MetricRow
                  label="Revenue"
                  value={kpi.revenue_total}
                  hint="Collected revenue in selected range"
                />
                <MetricRow
                  label="Remittances"
                  value={kpi.remittance_total}
                  hint="Cash turned over by cashier or rider (read only)"
                />
              </div>

              {kpi.gross_profit !== undefined && kpi.gross_profit !== null ? (
                <div className="mt-3">
                  <MetricRow
                    label="Gross profit"
                    value={safe(kpi.gross_profit, "₱0")}
                    hint="Optional, if costs are tracked"
                  />
                </div>
              ) : null}

              <div className="mt-4 text-xs text-slate-500">
                Profit metrics appear only if cost tracking is implemented.
              </div>
            </Panel>

            <Panel title="Deliveries summary">
              <div className="grid gap-3 md:grid-cols-2">
                <MetricRow
                  label="Total deliveries"
                  value={safe(report?.deliveries_total, "0")}
                  hint="All statuses"
                />
                <MetricRow
                  label="Completed deliveries"
                  value={safe(report?.deliveries_completed, "0")}
                  hint="Delivered and closed"
                />
              </div>

              <div className="mt-4">
                <Link
                  href="/dashboard/rider/deliveries"
                  className="inline-flex items-center rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:ring-4 focus:ring-teal-500/15"
                >
                  Open delivery module
                </Link>
              </div>
            </Panel>
          </div>

          {/* Inventory risk */}
          <Panel title="Inventory risk">
            <div className="space-y-3">
              {(report?.inventory_risk || []).length ? (
                report.inventory_risk.slice(0, 6).map((x) => (
                  <MetricRow
                    key={x.name}
                    label={x.name}
                    value={safe(x.qty, "0")}
                    hint={x.threshold ? `Threshold: ${x.threshold}` : "Below safe level"}
                  />
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
                  <div className="text-sm font-extrabold text-slate-900">No risk data yet</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Connect low stock thresholds and stock counts to populate this panel.
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <Link
                href="/dashboard/inventory/low-stock"
                className="inline-flex items-center rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:ring-4 focus:ring-teal-500/25"
              >
                Open low stock
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </Layout>
  );
}
