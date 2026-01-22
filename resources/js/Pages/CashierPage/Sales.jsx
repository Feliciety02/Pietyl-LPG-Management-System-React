import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { posIcons } from "@/components/ui/Icons";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

import SaleDetailsModal from "@/components/modals/CashierModals/SaleDetailsModal";
import MarkPaidModal from "@/components/modals/CashierModals/MarkPaidModal";
import ReprintReceiptModal from "@/components/modals/CashierModals/ReprintReceiptModal";

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

  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1", tone)}>
      {m.toUpperCase()}
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
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1", tone)}>
      {s.toUpperCase()}
    </span>
  );
}

function money(n) {
  const v = Number(n || 0);
  return `₱${v.toLocaleString()}`;
}

export default function Sales() {
  const page = usePage();

  const role = page.props?.auth?.user?.role || "cashier";
  const isAdmin = role === "admin";
  const isCashier = role === "cashier";

  /*
    Expected backend props (later)
    sales: {
      data: [{
        id,
        ref,
        customer,
        total,
        method,   // cash|gcash|card
        status,   // paid|pending|failed|voided(optional)
        created_at,
        lines: [...]
      }],
      meta
    }
    filters: { q, status, page, per }
  */

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
        lines: [{ name: "LPG Cylinder", variant: "11kg", mode: "refill", qty: 1, unit_price: 850 }],
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
  const rows = sales?.data ?? [];
  const meta = sales?.meta ?? null;

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const statusInitial = query?.status || "all";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [status, setStatus] = useState(statusInitial);

  const [activeSale, setActiveSale] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [reprintOpen, setReprintOpen] = useState(false);

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
    () =>
      Array.from({ length: perInitial }).map((_, i) => ({
        id: `__filler__${i}`,
        __filler: true,
      })),
    [perInitial]
  );

  const tableRows = loading ? fillerRows : rows;

  const canMarkPaid = (row) => (isAdmin || isCashier) && String(row?.status) === "pending";

  const openView = (row) => {
    setActiveSale(row);
    setViewOpen(true);
  };

  const openMarkPaid = (row) => {
    setActiveSale(row);
    setMarkPaidOpen(true);
  };

  const openReprint = (row) => {
    setActiveSale(row);
    setReprintOpen(true);
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
        key: "created_at",
        label: "Time",
        render: (x) => (x?.__filler ? <SkeletonLine w="w-28" /> : <span className="text-sm text-slate-700">{x.created_at || "—"}</span>),
      },
    ],
    []
  );

  const ReceiptIcon = posIcons.receipt;
  const CashIcon = posIcons.cashAlt || posIcons.cash;
  const ViewIcon = posIcons.search;

  const readOnly = !(isAdmin || isCashier);

  return (
    <Layout title="Sales">
      <div className="grid gap-6">
        <TopCard
          title="Sales history"
          subtitle="View sales records, track payment status, and reprint receipts."
          right={
            readOnly ? (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
                READ ONLY
              </span>
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

        <DataTableFilters
          q={q}
          onQ={handleSearch}
          placeholder="Search reference or customer..."
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
                    onClick={() => openMarkPaid(row)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-teal-700 transition focus:ring-4 focus:ring-teal-500/25"
                    title="Mark payment as paid"
                  >
                    <CashIcon className="h-4 w-4" />
                    Mark paid
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => openReprint(row)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                  title="Reprint receipt"
                >
                  <ReceiptIcon className="h-4 w-4 text-slate-600" />
                  Reprint
                </button>

                <button
                  type="button"
                  onClick={() => openView(row)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                  title="View sale details"
                >
                  <ViewIcon className="h-4 w-4 text-slate-600" />
                  View
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

      <SaleDetailsModal open={viewOpen} onClose={() => setViewOpen(false)} sale={activeSale} />
      <MarkPaidModal open={markPaidOpen} onClose={() => setMarkPaidOpen(false)} sale={activeSale} />
      <ReprintReceiptModal open={reprintOpen} onClose={() => setReprintOpen(false)} sale={activeSale} />
    </Layout>
  );
}





