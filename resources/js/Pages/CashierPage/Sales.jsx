import React, { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { posIcons } from "@/components/ui/Icons";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

import SaleDetailsModal from "@/components/CashierModals/SaleDetailsModal";
import MarkPaidModal from "@/components/CashierModals/MarkPaidModal";
import ReprintReceiptModal from "@/components/CashierModals/ReprintReceiptModal";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
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
    <span className={cx("rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1", tone)}>
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
    <span className={cx("rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1", tone)}>
      {s.toUpperCase()}
    </span>
  );
}

function money(n) {
  return `₱${Number(n || 0).toLocaleString()}`;
}

export default function Sales() {
  const page = usePage();
  const role = page.props?.auth?.user?.role || "cashier";
  const isAdmin = role === "admin";
  const isCashier = role === "cashier";

  const SAMPLE = {
    data: [
      {
        id: 1,
        ref: "TXN-10021",
        customer: "Ana Santos",
        total: 950,
        method: "gcash",
        status: "pending",
        created_at: "Today 9:20 AM",
        lines: [
          { name: "LPG Cylinder", variant: "11kg", mode: "refill", qty: 1, unit_price: 850 },
        ],
      },
    ],
    meta: { current_page: 1, last_page: 1 },
  };

  const sales = page.props?.sales ?? (import.meta.env.DEV ? SAMPLE : { data: [], meta: null });
  const rows = sales.data || [];
  const meta = sales.meta;

  const [activeSale, setActiveSale] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [reprintOpen, setReprintOpen] = useState(false);

  const canMarkPaid = (row) => (isAdmin || isCashier) && row.status === "pending";

  const columns = useMemo(
    () => [
      {
        key: "ref",
        label: "Sale",
        render: (x) =>
          x.__filler ? (
            <SkeletonLine w="w-32" />
          ) : (
            <div>
              <div className="font-extrabold">{x.ref}</div>
              <div className="text-xs text-slate-500">{x.customer}</div>
            </div>
          ),
      },
      {
        key: "total",
        label: "Total",
        render: (x) => (x.__filler ? <SkeletonLine w="w-20" /> : money(x.total)),
      },
      {
        key: "method",
        label: "Method",
        render: (x) => <MethodPill method={x.method} />,
      },
      {
        key: "status",
        label: "Status",
        render: (x) => <StatusPill status={x.status} />,
      },
    ],
    []
  );

  const Cash = posIcons.cash;
  const Receipt = posIcons.receipt;
  const Search = posIcons.search;

  return (
    <Layout title="Sales">
      <DataTable
        columns={columns}
        rows={rows}
        renderActions={(row) => (
          <div className="flex justify-end gap-2">
            {canMarkPaid(row) && (
              <button
                onClick={() => {
                  setActiveSale(row);
                  setMarkPaidOpen(true);
                }}
                className="rounded-2xl bg-teal-600 px-3 py-2 text-xs font-extrabold text-white"
              >
                <Cash className="h-4 w-4" />
                Mark paid
              </button>
            )}

            <button
              onClick={() => {
                setActiveSale(row);
                setReprintOpen(true);
              }}
              className="rounded-2xl bg-white px-3 py-2 text-xs font-extrabold ring-1 ring-slate-200"
            >
              <Receipt className="h-4 w-4" />
              Reprint
            </button>

            <button
              onClick={() => {
                setActiveSale(row);
                setViewOpen(true);
              }}
              className="rounded-2xl bg-white px-3 py-2 text-xs font-extrabold ring-1 ring-slate-200"
            >
              <Search className="h-4 w-4" />
              View
            </button>
          </div>
        )}
      />

      <SaleDetailsModal open={viewOpen} onClose={() => setViewOpen(false)} sale={activeSale} />
      <MarkPaidModal open={markPaidOpen} onClose={() => setMarkPaidOpen(false)} sale={activeSale} />
      <ReprintReceiptModal open={reprintOpen} onClose={() => setReprintOpen(false)} sale={activeSale} />
    </Layout>
  );
}
