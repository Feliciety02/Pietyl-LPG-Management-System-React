// resources/js/pages/InventoryPage/LowStock.jsx
import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import {
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Bell,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
} from "lucide-react";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function RiskPill({ level }) {
  const tone =
    level === "critical"
      ? "bg-rose-600/10 text-rose-900 ring-rose-700/10"
      : level === "warning"
      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  const label = level ? String(level).toUpperCase() : "OK";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        tone
      )}
    >
      {label}
    </span>
  );
}

function StatusPill({ status }) {
  const s = String(status || "none");

  const tone =
    s === "pending"
      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
      : s === "approved"
      ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
      : s === "rejected"
      ? "bg-rose-600/10 text-rose-900 ring-rose-700/10"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  const label =
    s === "pending"
      ? "PENDING"
      : s === "approved"
      ? "APPROVED"
      : s === "rejected"
      ? "REJECTED"
      : "NONE";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        tone
      )}
    >
      {label}
    </span>
  );
}

function QtyBar({ current = 0, threshold = 0 }) {
  const safeThreshold = Math.max(Number(threshold || 0), 0);
  const safeCurrent = Math.max(Number(current || 0), 0);

  const ratio = safeThreshold <= 0 ? 0 : Math.min(safeCurrent / safeThreshold, 1);
  const pct = Math.round(ratio * 100);

  return (
    <div className="w-full max-w-[180px]">
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>{safeCurrent} in stock</span>
        <span>reorder {safeThreshold}</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-slate-100 ring-1 ring-slate-200 overflow-hidden">
        <div className="h-full rounded-full bg-teal-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
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

function EmptyHint() {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-10 text-center">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-teal-600/10 ring-1 ring-teal-700/10 flex items-center justify-center">
        <AlertTriangle className="h-6 w-6 text-teal-700" />
      </div>
      <div className="mt-4 text-base font-extrabold text-slate-900">All good for now</div>
      <div className="mt-1 text-sm text-slate-600">
        No products are currently below the reorder threshold.
      </div>
    </div>
  );
}

export default function LowStock() {
  const page = usePage();

  const roleKey = page.props?.auth?.user?.role || "inventory_manager";
  const isAdmin = roleKey === "admin";

  /*
    Expected Inertia props from backend:
    low_stock: {
      data: [{
        id,
        sku,
        name,
        variant,
        supplier_name,
        current_qty,
        reorder_level,
        est_days_left,
        risk_level, // "critical" | "warning"
        last_movement_at,

        purchase_request_id, // nullable
        purchase_request_status, // "none" | "pending" | "approved" | "rejected"
        requested_by_name, // nullable
        requested_at, // nullable
      }],
      meta,
      links
    }
    filters: { q, risk, req, page, per }
  */

  const SAMPLE_LOW_STOCK = {
    data: [
      {
        id: 11,
        sku: "LPG-11KG",
        name: "LPG Cylinder",
        variant: "11kg",
        supplier_name: "Petron LPG Supply",
        current_qty: 2,
        reorder_level: 10,
        est_days_left: 2,
        risk_level: "critical",
        last_movement_at: "Today 10:24 AM",
        purchase_request_id: 901,
        purchase_request_status: "pending",
        requested_by_name: "Inventory Manager",
        requested_at: "Today 9:11 AM",
      },
      {
        id: 12,
        sku: "LPG-22KG",
        name: "LPG Cylinder",
        variant: "22kg",
        supplier_name: "Shellane Distributors",
        current_qty: 6,
        reorder_level: 12,
        est_days_left: 4,
        risk_level: "warning",
        last_movement_at: "Yesterday 5:10 PM",
        purchase_request_id: null,
        purchase_request_status: "none",
        requested_by_name: null,
        requested_at: null,
      },
      {
        id: 31,
        sku: "REG-REFILL",
        name: "Refill Service",
        variant: "Standard",
        supplier_name: "Regasco Trading",
        current_qty: 8,
        reorder_level: 15,
        est_days_left: null,
        risk_level: "warning",
        last_movement_at: "Yesterday 3:02 PM",
        purchase_request_id: 905,
        purchase_request_status: "approved",
        requested_by_name: "Inventory Manager",
        requested_at: "Yesterday 9:02 AM",
      },
    ],
    meta: {
      current_page: 1,
      last_page: 1,
      from: 1,
      to: 3,
      total: 3,
    },
  };

  const lowStock =
    page.props?.low_stock ?? (import.meta.env.DEV ? SAMPLE_LOW_STOCK : { data: [], meta: null });

  const rows = lowStock?.data || [];
  const meta = lowStock?.meta || null;

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const riskInitial = query?.risk || "all";
  const reqInitial = query?.req || "all";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [risk, setRisk] = useState(riskInitial);
  const [req, setReq] = useState(reqInitial);

  const riskOptions = [
    { value: "all", label: "All risk" },
    { value: "critical", label: "Critical" },
    { value: "warning", label: "Warning" },
  ];

  const reqOptions = [
    { value: "all", label: "All requests" },
    { value: "none", label: "No request" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/inventory/low-stock",
      { q, risk, req, per: perInitial, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const handleSearch = (value) => {
    setQ(value);
    pushQuery({ q: value, page: 1 });
  };

  const handleRisk = (value) => {
    setRisk(value);
    pushQuery({ risk: value, page: 1 });
  };

  const handleReq = (value) => {
    setReq(value);
    pushQuery({ req: value, page: 1 });
  };

  const handlePerPage = (n) => pushQuery({ per: n, page: 1 });
  const handlePrev = () => meta && meta.current_page > 1 && pushQuery({ page: meta.current_page - 1 });
  const handleNext = () =>
    meta && meta.current_page < meta.last_page && pushQuery({ page: meta.current_page + 1 });

  const loading = Boolean(page.props?.loading);

  const fillerRows = useMemo(
    () =>
      Array.from({ length: perInitial }).map((_, i) => ({
        id: `__filler__${i}`,
        __filler: true,
      })),
    [perInitial]
  );

  const tableRows = loading ? fillerRows : rows;

  const criticalCount = rows.filter((r) => r.risk_level === "critical").length;

  const columns = useMemo(
    () => {
      const base = [
        {
          key: "item",
          label: "Item",
          render: (x) =>
            x?.__filler ? (
              <div className="space-y-2">
                <SkeletonLine w="w-44" />
                <SkeletonLine w="w-28" />
              </div>
            ) : (
              <div>
                <div className="font-extrabold text-slate-900">
                  {x.name} <span className="text-slate-500 font-semibold">({x.variant})</span>
                </div>
                <div className="text-xs text-slate-500">
                  {x.sku || "—"} • {x.supplier_name || "No supplier"}
                </div>
              </div>
            ),
        },
        {
          key: "risk",
          label: "Risk",
          render: (x) => (x?.__filler ? <SkeletonPill w="w-24" /> : <RiskPill level={x.risk_level} />),
        },
        {
          key: "qty",
          label: "Stock",
          render: (x) =>
            x?.__filler ? (
              <div className="space-y-2">
                <SkeletonLine w="w-40" />
                <SkeletonLine w="w-28" />
              </div>
            ) : (
              <QtyBar current={x.current_qty} threshold={x.reorder_level} />
            ),
        },
        {
  key: "days",
  label: "Est. days",
  render: (x) =>
    x?.__filler ? (
      <SkeletonLine w="w-16" />
    ) : (
      <span className="text-sm font-semibold text-slate-800">
        {x.est_days_left == null ? "—" : `${x.est_days_left}d`}
      </span>
    ),
},

        {
          key: "last",
          label: "Last movement",
          render: (x) => (x?.__filler ? <SkeletonLine w="w-28" /> : <span className="text-sm text-slate-700">{x.last_movement_at || "—"}</span>),
        },
      ];

      if (!isAdmin) return base;

      return [
        ...base,
        {
          key: "req_status",
          label: "Request",
          render: (x) =>
            x?.__filler ? (
              <SkeletonPill w="w-24" />
            ) : (
              <div className="space-y-1">
                <StatusPill status={x.purchase_request_status || "none"} />
                <div className="text-[11px] text-slate-500">
                  {x.purchase_request_status && x.purchase_request_status !== "none"
                    ? `by ${x.requested_by_name || "—"}`
                    : "no request"}
                </div>
              </div>
            ),
        },
      ];
    },
    [isAdmin]
  );

  const notifyAdmin = () => {
    // placeholder: wire to backend notification later
    alert("Notify Admin queued (wire backend later)");
  };

  const approveRequest = (row) => {
    // placeholder: replace with real route
    router.post(
      `/dashboard/admin/purchase-requests/${row.purchase_request_id}/approve`,
      {},
      { preserveScroll: true }
    );
  };

  const rejectRequest = (row) => {
    // placeholder: replace with real route
    router.post(
      `/dashboard/admin/purchase-requests/${row.purchase_request_id}/reject`,
      {},
      { preserveScroll: true }
    );
  };

  const openThresholds = () => {
    // placeholder: ideally a dedicated admin page, or modal later
    router.get("/dashboard/admin/inventory/thresholds", {}, { preserveScroll: true });
  };

  return (
    <Layout title="Low Stock">
      <div className="grid gap-6">
        <TopCard
          title="Low Stock"
          subtitle={
            isAdmin
              ? "Owner view. Approve purchase requests and adjust thresholds to prevent outages."
              : "Monitor items below reorder thresholds and request restocks before shortages happen."
          }
          right={
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200">
                {criticalCount} critical
              </div>

              <Link
                href="/dashboard/inventory/purchases/create"
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:ring-4 focus:ring-teal-500/25"
              >
                <PlusCircle className="h-4 w-4" />
                New Purchase
              </Link>

              {isAdmin ? (
                <button
                  type="button"
                  onClick={openThresholds}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition"
                  title="Manage reorder thresholds"
                >
                  <SlidersHorizontal className="h-4 w-4 text-slate-600" />
                  Thresholds
                </button>
              ) : (
                <button
                  type="button"
                  onClick={notifyAdmin}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition"
                  title="Notify Admin"
                >
                  <Bell className="h-4 w-4 text-slate-600" />
                  Notify Admin
                </button>
              )}
            </div>
          }
        />

        <DataTableFilters
          q={q}
          onQ={handleSearch}
          placeholder="Search item, SKU, supplier..."
          filters={[
            {
              key: "risk",
              value: risk,
              onChange: handleRisk,
              options: riskOptions,
            },
            ...(isAdmin
              ? [
                  {
                    key: "req",
                    value: req,
                    onChange: handleReq,
                    options: reqOptions,
                  },
                ]
              : []),
          ]}
        />

        {!loading && rows.length === 0 ? (
          <EmptyHint />
        ) : (
          <DataTable
            columns={columns}
            rows={tableRows}
            loading={loading}
            emptyTitle="No low stock items"
            emptyHint="Adjust filters or check reorder thresholds."
            renderActions={(row) =>
              row?.__filler ? (
                <SkeletonButton w="w-28" />
              ) : (
                <div className="flex items-center justify-end gap-2">
                  {!isAdmin ? (
                    <Link
                      href={`/dashboard/inventory/purchases/create?item_id=${row.id}`}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                      title="Create purchase request"
                    >
                      Request
                      <ArrowRight className="h-4 w-4 text-slate-600" />
                    </Link>
                  ) : (
                    <>
                      {String(row.purchase_request_status || "none") === "pending" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => approveRequest(row)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-teal-700 transition focus:ring-4 focus:ring-teal-500/25"
                            title="Approve request"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Approve
                          </button>

                          <button
                            type="button"
                            onClick={() => rejectRequest(row)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition"
                            title="Reject request"
                          >
                            <XCircle className="h-4 w-4 text-slate-600" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <Link
                          href={`/dashboard/inventory/purchases/create?item_id=${row.id}`}
                          className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                          title="Create purchase"
                        >
                          Create
                          <ArrowRight className="h-4 w-4 text-slate-600" />
                        </Link>
                      )}
                    </>
                  )}
                </div>
              )
            }
          />
        )}

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
    </Layout>
  );
}
