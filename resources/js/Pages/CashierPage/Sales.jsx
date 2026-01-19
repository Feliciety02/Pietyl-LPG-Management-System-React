// resources/js/pages/Dashboard/CashierPage/Sales.jsx
import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import ModalShell from "@/components/modals/ModalShell";
import { sidebarIconMap } from "@/components/ui/Icons";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

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

function MethodPill({ method }) {
  const m = String(method || "cash").toLowerCase();

  const tone =
    m === "gcash"
      ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
      : m === "card"
      ? "bg-slate-100 text-slate-700 ring-slate-200"
      : "bg-amber-600/10 text-amber-900 ring-amber-700/10";

  const label = m.toUpperCase();

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
  const s = String(status || "paid").toLowerCase();

  const tone =
    s === "paid"
      ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
      : s === "failed"
      ? "bg-rose-600/10 text-rose-900 ring-rose-700/10"
      : "bg-amber-600/10 text-amber-900 ring-amber-700/10";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        tone
      )}
    >
      {s.toUpperCase()}
    </span>
  );
}

function money(n) {
  const v = Number(n || 0);
  return `₱${v.toLocaleString()}`;
}

function SummaryChip({ label, value, tone = "slate" }) {
  const theme =
    tone === "teal"
      ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
      : tone === "amber"
      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
      : "bg-white text-slate-900 ring-slate-200";

  return (
    <div className={cx("rounded-2xl px-4 py-2 ring-1", theme)}>
      <div className="text-[11px] font-extrabold text-slate-600/80">{label}</div>
      <div className="text-sm font-extrabold">{value}</div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="text-xs font-extrabold text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900 text-right">{value}</div>
    </div>
  );
}

function SaleDetailsModal({ open, onClose, sale }) {
  const Receipt = sidebarIconMap.posReceipt;
  const PosCart = sidebarIconMap.posCart;

  return (
    <ModalShell open={open} onClose={onClose} maxWidthClass="max-w-2xl">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-lg font-extrabold text-slate-900">Sale details</div>
            <div className="mt-1 text-sm text-slate-600">
              {sale?.ref || "—"} • {sale?.customer || "Walk in"}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
            <DetailRow label="Total" value={money(sale?.total)} />
            <div className="mt-2">
              <DetailRow label="Method" value={String(sale?.method || "—").toUpperCase()} />
            </div>
            <div className="mt-2">
              <DetailRow label="Status" value={String(sale?.status || "—").toUpperCase()} />
            </div>
            <div className="mt-2">
              <DetailRow label="Time" value={sale?.created_at || "—"} />
            </div>
          </div>

          <div className="md:col-span-2 rounded-3xl bg-white ring-1 ring-slate-200 p-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-2xl bg-teal-600/10 ring-1 ring-teal-700/10 flex items-center justify-center">
                <PosCart className="h-4 w-4 text-teal-700" />
              </div>
              <div className="text-sm font-extrabold text-slate-900">Items</div>
            </div>

            <div className="mt-4 grid gap-2">
              {(sale?.lines || []).length ? (
                sale.lines.map((ln, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-3 py-2">
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-slate-900 truncate">
                        {ln.name} <span className="text-slate-500 font-semibold">({ln.variant})</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {String(ln.mode || "refill").toUpperCase()} • {money(ln.unit_price)} each
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold text-slate-900">{ln.qty}x</div>
                      <div className="text-xs font-semibold text-slate-600">{money(Number(ln.qty || 0) * Number(ln.unit_price || 0))}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-600">No line items available.</div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                onClick={() => alert(`Reprint: ${sale?.ref || ""}`)}
              >
                <Receipt className="h-4 w-4 text-slate-600" />
                Reprint receipt
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 text-xs text-slate-500">
          Backend note: this modal should load details from a sales show endpoint, not from the list payload, once you connect real data.
        </div>
      </div>
    </ModalShell>
  );
}

export default function Sales() {
  const page = usePage();
  const user = page.props?.auth?.user;
  const roleKey = String(user?.role || "cashier");

  const isAdmin = roleKey === "admin";
  const isCashier = roleKey === "cashier";

  /*
    Sales Ledger (Merged Transactions + Payments)

    Purpose
    - One page to view sales history and payment state
    - Supports pending and failed payments (delivery, delayed payment, retry)
    - Supports receipt viewing and reprint

    Cashier can
    - View sales history
    - Reprint receipts
    - Mark pending payments as paid (configurable rule)
    - View sale details

    Cashier should not
    - Edit totals
    - Delete sales
    - Modify paid sales

    Admin (Owner) can
    - View everything
    - Mark pending payments as paid (override)
    - Export reports (future)
    - Void or refund approvals (future)

    Backend expectations (later)
    - GET /dashboard/cashier/sales : returns paginated list of sales
    - GET /dashboard/cashier/sales/{id} : returns sale details + lines
    - POST /dashboard/cashier/sales/{id}/mark-paid : marks payment as paid (audit logged)
    - POST /dashboard/cashier/sales/{id}/reprint : optional
  */

  // DEV SAMPLE combines: ref, customer, total, method, status, created_at
  // status: "paid" | "pending" | "failed"
  const SAMPLE = {
    data: [
      {
        id: 2001,
        ref: "TXN-10021",
        customer: "Ana Santos",
        total: 950,
        method: "gcash",
        status: "pending",
        created_at: "Today 9:20 AM",
        lines: [
          { name: "LPG Cylinder", variant: "11kg", mode: "refill", qty: 1, unit_price: 850 },
          { name: "Hose", variant: "1.5m", mode: "swap", qty: 1, unit_price: 100 },
        ],
      },
      {
        id: 2000,
        ref: "TXN-10020",
        customer: "Walk in",
        total: 1800,
        method: "cash",
        status: "paid",
        created_at: "Today 8:55 AM",
        lines: [{ name: "LPG Cylinder", variant: "22kg", mode: "swap", qty: 1, unit_price: 1800 }],
      },
      {
        id: 1999,
        ref: "TXN-10019",
        customer: "Mark Dela Cruz",
        total: 650,
        method: "card",
        status: "failed",
        created_at: "Yesterday 2:10 PM",
        lines: [{ name: "Regulator", variant: "Standard", mode: "swap", qty: 1, unit_price: 650 }],
      },
    ],
    meta: { current_page: 1, last_page: 1, from: 1, to: 3, total: 3 },
  };

  const sales = page.props?.sales ?? (import.meta.env.DEV ? SAMPLE : { data: [], meta: null });

  const rows = sales?.data || [];
  const meta = sales?.meta || null;

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const statusInitial = query?.status || "all";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [status, setStatus] = useState(statusInitial);

  const [openDetails, setOpenDetails] = useState(false);
  const [activeSale, setActiveSale] = useState(null);

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "paid", label: "Paid" },
    { value: "pending", label: "Pending" },
    { value: "failed", label: "Failed" },
  ];

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/cashier/sales",
      { q, status, per: perInitial, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const handleSearch = (value) => {
    setQ(value);
    pushQuery({ q: value, page: 1 });
  };

  const handleStatus = (value) => {
    setStatus(value);
    pushQuery({ status: value, page: 1 });
  };

  const handlePerPage = (n) => pushQuery({ per: n, page: 1 });
  const handlePrev = () => meta && meta.current_page > 1 && pushQuery({ page: meta.current_page - 1 });
  const handleNext = () => meta && meta.current_page < meta.last_page && pushQuery({ page: meta.current_page + 1 });

  const loading = Boolean(page.props?.loading);

  const fillerRows = useMemo(
    () => Array.from({ length: perInitial }).map((_, i) => ({ id: `__filler__${i}`, __filler: true })),
    [perInitial]
  );

  const tableRows = loading ? fillerRows : rows;

  const paidTotal = rows.filter((x) => x.status === "paid").reduce((s, x) => s + Number(x.total || 0), 0);
  const pendingCount = rows.filter((x) => x.status === "pending").length;
  const failedCount = rows.filter((x) => x.status === "failed").length;

  const canMarkPaid = (row) => {
    // You can tighten this rule later:
    // - allow only admin
    // - allow cashier only if delivery payments are allowed
    // For now: allow cashier + admin
    return (isAdmin || isCashier) && String(row?.status) === "pending";
  };

  const markPaid = (row) => {
    if (!canMarkPaid(row)) return;

    // Backend later:
    // router.post(`/dashboard/cashier/sales/${row.id}/mark-paid`, {}, { preserveScroll: true })
    alert(`Mark paid: ${row.ref}`);

    // DEV UI feedback (optimistic)
    // If you want local optimistic update:
    // (In real use, rely on reload or returned props)
  };

  const reprint = (row) => {
    // Backend later:
    // router.post(`/dashboard/cashier/sales/${row.id}/reprint`)
    alert(`Reprint: ${row.ref}`);
  };

  const openSale = (row) => {
    setActiveSale(row);
    setOpenDetails(true);

    // Backend best practice (later):
    // router.get(`/dashboard/cashier/sales/${row.id}`, {}, { preserveState: true, preserveScroll: true, only: ["sale"] })
  };

  const columns = useMemo(
    () => [
      {
        key: "ref",
        label: "Sale",
        render: (x) =>
          x?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-32" />
              <SkeletonLine w="w-44" />
            </div>
          ) : (
            <div>
              <div className="font-extrabold text-slate-900">{x.ref}</div>
              <div className="text-xs text-slate-500">{x.customer || "Walk in"}</div>
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
            <span className="text-sm font-extrabold text-slate-900">{money(x.total)}</span>
          ),
      },
      {
        key: "method",
        label: "Method",
        render: (x) => (x?.__filler ? <SkeletonPill w="w-20" /> : <MethodPill method={x.method} />),
      },
      {
        key: "status",
        label: "Status",
        render: (x) => (x?.__filler ? <SkeletonPill w="w-24" /> : <StatusPill status={x.status} />),
      },
      {
        key: "created",
        label: "Time",
        render: (x) => (x?.__filler ? <SkeletonLine w="w-28" /> : <span className="text-sm text-slate-700">{x.created_at || "—"}</span>),
      },
    ],
    []
  );

  const Receipt = sidebarIconMap.posReceipt;
  const Printer = sidebarIconMap.posReceipt; // fallback
  const PosNext = sidebarIconMap.posNext;

  return (
    <Layout title="Sales">
      <div className="grid gap-6">
        <TopCard
          title="Sales"
          subtitle="View sales history, track payment status, and reprint receipts."
        
        />

        <DataTableFilters
          q={q}
          onQ={handleSearch}
          placeholder="Search reference or customer..."
          filters={[
            { key: "status", value: status, onChange: handleStatus, options: statusOptions },
          ]}
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          emptyTitle="No sales yet"
          emptyHint="Completed sales will appear here."
          renderActions={(row) =>
            row?.__filler ? (
              <SkeletonButton w="w-24" />
            ) : (
              <div className="flex items-center justify-end gap-2">
                {canMarkPaid(row) ? (
                  <button
                    type="button"
                    onClick={() => markPaid(row)}
                    className="rounded-2xl bg-teal-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-teal-700 transition focus:ring-4 focus:ring-teal-500/25"
                    title="Mark payment as paid"
                  >
                    Mark paid
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => reprint(row)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  <Receipt className="h-4 w-4 text-slate-600" />
                  Reprint
                </button>

                <button
                  type="button"
                  onClick={() => openSale(row)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  View <Receipt className="h-4 w-4 text-slate-600" />
                </button>
              </div>
            )
          }
        />

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

      <SaleDetailsModal
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        sale={activeSale}
      />
    </Layout>
  );
}
