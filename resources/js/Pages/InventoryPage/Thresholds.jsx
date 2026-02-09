import React, { useEffect, useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import useTableQuery from "@/components/Table/useTableQuery";

import { Save, RotateCcw } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function diffCount(levels, initial) {
  let c = 0;
  for (const k in levels) {
    if (safeNum(levels[k]) !== safeNum(initial[k])) c += 1;
  }
  return c;
}

function normalizePaginator(raw) {
  if (Array.isArray(raw)) {
    return { data: raw, meta: null };
  }

  const rows = Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw?.data?.data)
    ? raw.data.data
    : [];

  const meta =
    raw?.meta ||
    raw?.data?.meta ||
    raw?.pagination ||
    raw?.page ||
    (raw && typeof raw === "object" ? raw : null);

  return { data: rows, meta };
}

function InitialBadge({ name = "" }) {
  const s = String(name || "").trim();
  const letter = s ? s[0].toUpperCase() : "P";
  return (
    <div className="h-10 w-10 rounded-2xl bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center">
      <div className="h-6 w-6 rounded-xl bg-teal-600/15 flex items-center justify-center">
        <span className="text-[11px] font-extrabold text-teal-800">{letter}</span>
      </div>
    </div>
  );
}

function RiskPill({ level }) {
  const v = String(level || "ok").toLowerCase();
  const tone =
    v === "critical"
      ? "bg-rose-600/10 text-rose-900 ring-rose-700/10"
      : v === "warning"
      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
      : v === "ok"
      ? "bg-emerald-600/10 text-emerald-900 ring-emerald-700/10"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  const label = v === "critical" ? "Critical" : v === "warning" ? "LOW" : "Stable";

  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1", tone)}>
      {label}
    </span>
  );
}

function StockMini({ current = 0, threshold = 0 }) {
  const safeThreshold = Math.max(Number(threshold || 0), 0);
  const safeCurrent = Math.max(Number(current || 0), 0);
  const ratio = safeThreshold <= 0 ? 1 : Math.min(safeCurrent / safeThreshold, 2);
  const pct = Math.round(Math.min(ratio, 1) * 100);

  const tone =
    safeThreshold <= 0
      ? "bg-slate-400"
      : ratio >= 1
      ? "bg-emerald-600"
      : ratio >= 0.6
      ? "bg-amber-500"
      : "bg-rose-600";

  return (
    <div className="min-w-[220px] max-w-[260px]">
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>
          <span className="font-semibold text-slate-700">{safeCurrent}</span> in stock
        </span>
        <span>
          restock at{" "}
          <span className="font-semibold text-slate-700">{safeThreshold > 0 ? safeThreshold : "Off"}</span>
        </span>
      </div>
      <div className="mt-1">
        <div className="h-2 w-full rounded-full bg-slate-100 ring-1 ring-slate-200 overflow-hidden">
          <div className={cx("h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="mt-1 text-[11px] text-slate-500">
        {safeThreshold > 0 ? (
          ratio < 0.6 ? (
            <span className="font-semibold text-rose-800">Critical</span>
          ) : ratio < 1 ? (
            <span className="font-semibold text-amber-800">Running low</span>
          ) : (
            <span className="font-semibold text-emerald-800">In good standing</span>
          )
        ) : (
          <span>Alerts off</span>
        )}
      </div>
    </div>
  );
}

export default function Thresholds() {
  const page = usePage();
  const thresholds =
    page.props?.thresholds ??
    page.props?.low_stock ??
    (page.props?.data?.low_stock ? page.props.data.low_stock : null);
  const loading = Boolean(page.props?.loading);

  const { data: rows, meta } = normalizePaginator(thresholds ?? {});
  const { query, set, setPer, prevPage, nextPage, canPrev, canNext } = useTableQuery({
    endpoint: "/dashboard/inventory/thresholds",
    meta,
    defaults: { q: "", risk: "all", per: 10, page: 1 },
  });

  const [localRows, setLocalRows] = useState(rows);
  const [levels, setLevels] = useState({});
  const [initial, setInitial] = useState({});
  const [changed, setChanged] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalRows(rows);
    const init = {};
    rows.forEach((row) => {
      init[row.id] = safeNum(row.reorder_level);
    });
    setLevels(init);
    setInitial(init);
    setChanged(diffCount(init, init));
  }, [rows]);

  useEffect(() => {
    setChanged(diffCount(levels, initial));
  }, [levels, initial]);

  const risk = query.risk;
  const q = query.q;

  const riskOptions = [
    { value: "all", label: "All levels" },
    { value: "critical", label: "Urgent" },
    { value: "warning", label: "Low" },
    { value: "ok", label: "Stable" },
  ];

  const setLevel = (rowId, value) => {
    // store raw input to allow typing (empty string while typing)
    setLevels((prev) => ({ ...prev, [rowId]: value }));
  };

  const resetAll = () => setLevels(initial);

  const save = () => {
    const updates = [];
    for (const id in levels) {
      if (safeNum(levels[id]) !== safeNum(initial[id])) {
        updates.push({ id: Number(id), reorder_level: safeNum(levels[id]) });
      }
    }
    if (!updates.length) return;
    setSaving(true);
    router.post(
      "/dashboard/inventory/admin/inventory/thresholds",
      { updates },
      {
        preserveScroll: true,
        onFinish: () => setSaving(false),
      }
    );
  };

  const columns = useMemo(() => {
    return [
      {
        key: "item",
        label: "Item",
        render: (row) =>
          loading ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-slate-200/70 animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-32 rounded bg-slate-200/70 animate-pulse" />
                <div className="h-3 w-24 rounded bg-slate-200/70 animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 min-w-0">
              <InitialBadge name={row.name} />
              <div className="min-w-0">
                <div className="font-extrabold text-slate-900 truncate">{row.name}</div>
                <div className="text-xs text-slate-500 truncate">
                  {row.variant ? `${row.variant} • ${row.sku || "—"}` : row.sku || "—"}
                </div>
              </div>
            </div>
          ),
      },
      {
        key: "risk",
        label: "Status",
        render: (row) => (loading ? <div className="h-4 w-16 rounded bg-slate-200 animate-pulse" /> : <RiskPill level={row.risk_level} />),
        className: "whitespace-nowrap",
      },
      {
        key: "stock",
        label: "Stock",
        render: (row) => (loading ? <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" /> : <StockMini current={row.current_qty} threshold={row.reorder_level} />),
      },
      {
        key: "threshold",
        label: "Alert level",
        render: (row) => (
          <input
            type="number"
            min="0"
            value={levels[row.id] ?? ""}
            onChange={(event) => setLevel(row.id, event.target.value)}
            className="w-24 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-extrabold focus:ring-4 focus:ring-teal-500/15"
          />
        ),
      },
      {
        key: "last",
        label: "Updated",
        render: (row) =>
          loading ? (
            <div className="h-4 w-28 rounded bg-slate-200 animate-pulse" />
          ) : (
            <span className="text-sm text-slate-700">{row.last_movement_at}</span>
          ),
        className: "text-sm text-slate-700 whitespace-nowrap",
      },
    ];
  }, [levels, loading]);

  return (
    <Layout title="Thresholds">
      <div className="space-y-6">
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-lg font-extrabold text-slate-900">Reorder thresholds</div>
            <div className="text-sm text-slate-600">
              Adjust the reorder level for every product so the system can highlight low stock situations.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-2xl bg-slate-50 px-4 py-2 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200">
              {changed} change{changed === 1 ? "" : "s"}
            </div>
            <button
              type="button"
              onClick={resetAll}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4 text-slate-600" />
              Reset
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className={cx(
                "inline-flex items-center gap-2 rounded-2xl px-5 py-2 text-sm font-extrabold text-white focus:outline-none focus:ring-4",
                saving
                  ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                  : "bg-teal-600 hover:bg-teal-700 ring-teal-600 focus:ring-teal-500/25"
              )}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-6 space-y-4">
          <DataTableFilters
            q={query.q}
            onQ={(value) => set("q", value, { resetPage: true })}
            onQDebounced={(value) => set("q", value, { resetPage: true })}
            placeholder="Search product, SKU, supplier..."
            filters={[
              { key: "risk", value: risk, onChange: (value) => set("risk", value, { resetPage: true }), options: riskOptions },
            ]}
          />

          <DataTable
            columns={columns}
            rows={localRows}
            loading={loading}
            searchQuery={query.q}
            rowKey={(row) => `threshold_${row.id}`}
            emptyTitle="No products found"
            emptyHint="Try changing the search or filters."
          />

          <DataTablePagination
            meta={meta}
            perPage={query.per}
            onPerPage={(value) => setPer(Number(value))}
            onPrev={prevPage}
            onNext={nextPage}
            disablePrev={!canPrev}
            disableNext={!canNext}
          />
        </div>
      </div>
    </Layout>
  );
}
