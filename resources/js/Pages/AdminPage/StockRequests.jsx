import React, { useEffect, useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { TableActionButton } from "@/components/Table/ActionTableButton";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

import { ClipboardList, CheckCircle2, Truck, Wallet, TrendingUp } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function normalizeStatus(status) {
  return String(status || "").toLowerCase().replace(/\s+/g, "_");
}

function moneyPHP(v) {
  const n = Number(v || 0);
  return `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* -------------------------------------------------------------------------- */
/* Design building blocks (match your Reports page style)                      */
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

function StatCard({ Icon, label, value, hint }) {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900 tabular-nums">{value}</div>
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

function StatusPill({ status }) {
  const s = normalizeStatus(status);

  const tone =
    s === "approved"
      ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
      : s === "submitted" || s === "draft"
      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
      : s === "receiving"
      ? "bg-sky-600/10 text-sky-900 ring-sky-700/10"
      : s === "received"
      ? "bg-emerald-600/10 text-emerald-900 ring-emerald-700/10"
      : s === "payable_open"
      ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
      : s === "paid" || s === "closed"
      ? "bg-emerald-600/10 text-emerald-900 ring-emerald-700/10"
      : s === "rejected"
      ? "bg-rose-600/10 text-rose-900 ring-rose-700/10"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  const labelMap = {
    submitted: "SUBMITTED",
    draft: "DRAFT",
    approved: "APPROVED",
    receiving: "RECEIVING",
    received: "RECEIVED",
    payable_open: "PAYABLE OPEN",
    paid: "PAID",
    closed: "CLOSED",
    rejected: "REJECTED",
  };

  const label = labelMap[s] || status?.toUpperCase?.() || "UNKNOWN";

  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1", tone)}>
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function StockRequests() {
  const page = usePage();
  const authUser = page.props?.auth?.user;
  const isInventoryManager = authUser?.role === "inventory_manager";

  const requests = page.props?.stock_requests ?? { data: [], meta: null };
  const rows = requests?.data || [];
  const meta = requests?.meta || null;

  const summary = page.props?.summary ?? {
    counts: {},
    total_approved_cost: 0,
  };

  const totalRequestsFromSummary = Object.values(summary.counts || {}).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0
  );

  const totalRequests = Math.max(totalRequestsFromSummary, rows.length);
  const awaitingApproval = Number(summary.counts?.submitted || 0);
  const approvedTotalCost = Number(summary.total_approved_cost || 0);
  const totalIncome = Number(summary.total_received_cost || 0);
  const totalCostOnPage = rows.reduce((sum, row) => sum + (Number(row.total_cost) || 0), 0);

  const [q, setQ] = useState(page.props?.filters?.q || "");
  const [status, setStatus] = useState(page.props?.filters?.status || "all");
  const [per, setPer] = useState(Number(page.props?.filters?.per || 10));

  const statusOptions = [
    { value: "all", label: "All statuses" },
    { value: "submitted", label: "Awaiting approval" },
    { value: "approved", label: "Approved" },
    { value: "receiving", label: "Receiving" },
    { value: "received", label: "Received" },
    { value: "payable_open", label: "Payable open" },
    { value: "paid", label: "Paid" },
    { value: "closed", label: "Closed" },
    { value: "rejected", label: "Rejected" },
  ];

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/admin/stock-requests",
      { q, status, per, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  useEffect(() => {
    setPer(Number(page.props?.filters?.per || 10));
  }, [page.props?.filters?.per]);

  const handlePerPage = (next) => {
    setPer(next);
    pushQuery({ per: next, page: 1 });
  };

  const handleStatus = (value) => {
    setStatus(value);
    pushQuery({ status: value, page: 1 });
  };

  const handlePrev = () => meta && meta.current_page > 1 && pushQuery({ page: meta.current_page - 1 });
  const handleNext = () => meta && meta.current_page < meta.last_page && pushQuery({ page: meta.current_page + 1 });

  const loading = Boolean(page.props?.loading);

  const fillerRows = useMemo(
    () => Array.from({ length: per }).map((_, index) => ({ id: `__filler__${index}`, __filler: true })),
    [per]
  );

  const displayRows = loading ? fillerRows : rows;

  const columns = useMemo(
    () => [
      {
        key: "request",
        label: "Request",
        render: (row) =>
          row?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-28" />
              <SkeletonLine w="w-40" />
            </div>
          ) : (
            <div className="space-y-1">
              <div className="font-extrabold text-slate-900">{row.request_number}</div>
              <div className="text-xs text-slate-500">{row.created_at || "—"}</div>
            </div>
          ),
      },
      {
        key: "supplier",
        label: "Supplier",
        render: (row) =>
          row?.__filler ? <SkeletonLine w="w-28" /> : <div className="text-sm font-semibold text-slate-700">{row.supplier_name || "—"}</div>,
      },
      {
        key: "items",
        label: "Items",
        render: (row) =>
          row?.__filler ? (
            <SkeletonLine w="w-20" />
          ) : (
            <div className="text-sm text-slate-700">
              <span className="font-extrabold text-slate-900 tabular-nums">{Number(row.items_count || 0)}</span>{" "}
              item{Number(row.items_count || 0) === 1 ? "" : "s"}
            </div>
          ),
      },
      {
        key: "total",
        label: "Total cost",
        render: (row) =>
          row?.__filler ? (
            <SkeletonLine w="w-24" />
          ) : (
            <span className="text-sm font-extrabold text-slate-900 tabular-nums">
              {moneyPHP(row.total_cost)}
            </span>
          ),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => (row?.__filler ? <SkeletonPill w="w-24" /> : <StatusPill status={row.status} />),
      },
    ],
    [per]
  );

  const tableActions = (row) => {
    if (row?.__filler) return <SkeletonButton w="w-28" />;

    const s = normalizeStatus(row.status);
    const canApprove = ["draft", "submitted"].includes(s);
    const canReceive = isInventoryManager && ["approved", "receiving"].includes(s);

    return (
      <div className="flex items-center justify-end gap-2">
        {canApprove ? (
          <TableActionButton
            icon={CheckCircle2}
            tone="primary"
            title="Approve request"
            onClick={() => router.get(`/dashboard/admin/stock-requests/${row.id}/approve`, {}, { preserveState: true })}
          >
            Approve
          </TableActionButton>
        ) : null}

        {!isInventoryManager ? (
          <span className="text-xs text-slate-500">
            Inventory manager handles receiving.
          </span>
        ) : (
          <TableActionButton
            icon={Truck}
            title="Receive stock"
            tone="secondary"
            onClick={() => router.get(`/dashboard/inventory/stock-requests/${row.id}/receive`, {}, { preserveState: true })}
            disabled={!canReceive}
          >
            Receive
          </TableActionButton>
        )}
      </div>
    );
  };

  return (
    <Layout title="Stock Requests">
      <div className="grid gap-6">
        <TopCard
          title="Stock requests"
          subtitle="Track purchase requests from submission to receiving."
          right={
            <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/inventory/order-stocks"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:ring-4 focus:ring-teal-500/15"
              >
                Open low stock
              </Link>

              <Link
                href="/dashboard/inventory/stock-requests/create"
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:ring-4 focus:ring-teal-500/25"
              >
                Create request
              </Link>
            </div>
          }
        />

        {/* Reduced KPIs only */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            Icon={ClipboardList}
            label="Total requests"
            value={String(totalRequests || 0)}
            hint="All statuses"
          />
          <StatCard
            Icon={CheckCircle2}
            label="Awaiting approval"
            value={String(awaitingApproval || 0)}
            hint="Submitted requests"
          />
          <StatCard
            Icon={Truck}
            label="Total cost"
            value={moneyPHP(totalCostOnPage)}
            hint="Visible requests"
          />
          <StatCard
            Icon={Wallet}
            label="Predicted spend"
            value={moneyPHP(approvedTotalCost)}
            hint="Approved requests"
          />
          <StatCard
            Icon={TrendingUp}
            label="Total income"
            value={moneyPHP(totalIncome)}
            hint="Received stock"
          />
        </div>

        <Panel
          title="Requests"
          right={<span className="text-xs text-slate-500">Approve then receive to complete</span>}
        >
          <div className="space-y-4">
            <DataTableFilters
              q={q}
              onQ={setQ}
              onQDebounced={(value) => pushQuery({ q: value, page: 1 })}
              placeholder="Search request number, supplier..."
              filters={[
                {
                  key: "status",
                  value: status,
                  onChange: handleStatus,
                  options: statusOptions,
                },
              ]}
            />

            <DataTable
              columns={columns}
              rows={displayRows}
              loading={loading}
              renderActions={tableActions}
              rowKey={(row) => {
                if (row?.__filler) return row.id;
                const keyBase =
                  row?.id ??
                  row?.request_number ??
                  `${row?.business_date ?? "na"}_${row?.created_at ?? "na"}_${row?.supplier_id ?? "na"}`;
                return `stock_request_${String(keyBase)}`;
              }}
              searchQuery={q}
              emptyTitle="No stock requests yet"
              emptyHint="Create requests from the inventory page."
            />

            <DataTablePagination
              meta={meta}
              perPage={per}
              onPerPage={handlePerPage}
              onPrev={handlePrev}
              onNext={handleNext}
              disablePrev={!meta || meta.current_page <= 1}
              disableNext={!meta || meta.current_page >= meta.last_page}
            />
          </div>
        </Panel>
      </div>
    </Layout>
  );
}
