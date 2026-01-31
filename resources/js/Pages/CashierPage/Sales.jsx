import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";

import { posIcons } from "@/components/ui/Icons";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

import { TableActionButton } from "@/components/Table/ActionTableButton";

import SaleDetailsModal from "@/components/modals/CashierModals/SaleDetailsModal";
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
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        tone
      )}
    >
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

function safeText(v) {
  return String(v ?? "").trim();
}

function SaleAvatar({ ref }) {
  const t = safeText(ref);
  const seed = t.replace(/\s+/g, "").slice(-2).toUpperCase() || "TX";
  return (
    <div className="h-9 w-9 rounded-2xl bg-teal-600/10 ring-1 ring-teal-700/10 flex items-center justify-center">
      <span className="text-[11px] font-extrabold text-teal-900">{seed}</span>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
      <span className="text-[11px] font-extrabold text-slate-600">{label}</span>
      <span className="text-[11px] font-extrabold text-slate-900">{value}</span>
    </div>
  );
}

function LineSummary({ lines }) {
  const list = Array.isArray(lines) ? lines : [];
  const count = list.reduce((sum, it) => sum + Number(it?.qty || 0), 0);
  if (!list.length) return <span className="text-xs text-slate-400">No items</span>;

  const first = list[0];
  const name = safeText(first?.name) || "Item";
  const variant = safeText(first?.variant);
  const more = list.length - 1;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-extrabold text-slate-700 truncate max-w-[240px]">
        {name}
        {variant ? <span className="text-slate-500"> · {variant}</span> : null}
      </span>

      {more > 0 ? (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
          +{more} more
        </span>
      ) : null}

      <span className="text-[11px] font-extrabold text-slate-500">Qty {count}</span>
    </div>
  );
}

export default function Sales() {
  const page = usePage();

  const role = page.props?.auth?.user?.role || "cashier";
  const isAdmin = role === "admin";
  const isCashier = role === "cashier";

  const query = page.props?.filters || {};
  const per = Number(query?.per || 10);
  const currentPage = Number(query?.page || 1);

  const [q, setQ] = useState(query?.q || "");
  const [status, setStatus] = useState(query?.status || "all");

  const [activeSale, setActiveSale] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [reprintOpen, setReprintOpen] = useState(false);
  const sales = page.props?.sales ?? { data: [], meta: null };

  const rows = sales?.data ?? [];
  const meta = sales?.meta ?? null;

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "paid", label: "Paid" },
    { value: "failed", label: "Failed" },
    { value: "pending", label: "Pending" },
  ];

  const pushQuery = (patch) => {
    const newPage = patch.page !== undefined ? patch.page : currentPage;
    
    router.get(
      "/dashboard/cashier/sales",
      { q, status, per, page: newPage, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const loading = Boolean(page.props?.loading);

  const fillerRows = useMemo(
    () =>
      Array.from({ length: per }).map((_, i) => ({
        id: `__filler__${i}`,
        __filler: true,
      })),
    [per]
  );

  const tableRows = loading ? fillerRows : rows;

  const openView = (row) => {
    setActiveSale(row);
    setViewOpen(true);
  };

  const openReprint = (row) => {
    setActiveSale(row);
    setReprintOpen(true);
  };

  const ReceiptIcon = posIcons.receipt;
  const ViewIcon = posIcons.search;

  const columns = useMemo(
    () => [
      {
        key: "sale",
        label: "Sale",
        render: (x) =>
          x?.__filler ? (
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-2xl bg-slate-100 ring-1 ring-slate-200" />
              <div className="space-y-2">
                <SkeletonLine w="w-32" />
                <SkeletonLine w="w-48" />
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <SaleAvatar ref={x.ref} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-extrabold text-slate-900">{x.ref}</div>
                  <StatusPill status={x.status} />
                  <MethodPill method={x.method} />
                </div>

                <div className="mt-1 flex flex-col gap-1">
                  <div className="text-xs text-slate-500">
                    <span className="font-extrabold text-slate-700">
                      {x.customer || "Walk in"}
                    </span>
                    <span className="mx-2 text-slate-300">•</span>
                    <span className="text-slate-600">{x.created_at || "Not available"}</span>
                  </div>

                  <LineSummary lines={x.lines} />
                </div>
              </div>
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
            <div className="flex justify-start">
              <MiniStat label="Total" value={money(x.total)} />
            </div>
          ),
      },
    ],
    []
  );

  const readOnly = !(isAdmin || isCashier);

  return (
    <Layout title="Sales">
      <div className="grid gap-6">
        <TopCard
          title="Sales history"
          subtitle="View sales records and reprint receipts."
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
          onQ={setQ}
          onQDebounced={(v) => pushQuery({ q: v, page: 1 })}
          placeholder="Search reference or customer..."
          filters={[
            {
              key: "status",
              value: status,
              onChange: (v) => {
                setStatus(v);
                pushQuery({ status: v, page: 1 });
              },
              options: statusOptions,
            },
          ]}
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          searchQuery={q}
          emptyTitle="No sales yet"
          emptyHint="Completed sales will appear here."
          renderActions={(row) =>
            row?.__filler ? (
              <div className="flex items-center justify-end gap-2">
                <SkeletonButton w="w-24" />
                <SkeletonButton w="w-20" />
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <TableActionButton
                  icon={ReceiptIcon}
                  onClick={() => openReprint(row)}
                  title="Reprint receipt"
                >
                  Reprint
                </TableActionButton>

                <TableActionButton
                  icon={ViewIcon}
                  onClick={() => openView(row)}
                  title="View sale details"
                >
                  View
                </TableActionButton>
              </div>
            )
          }
        />

        <DataTablePagination
          meta={meta}
          perPage={per}
          onPerPage={(n) => pushQuery({ per: n, page: 1 })}
          onPrev={() => meta?.current_page > 1 && pushQuery({ page: meta.current_page - 1 })}
          onNext={() =>
            meta?.current_page < meta?.last_page && pushQuery({ page: meta.current_page + 1 })
          }
          disablePrev={!meta || meta.current_page <= 1}
          disableNext={!meta || meta.current_page >= meta.last_page}
        />
      </div>

      <SaleDetailsModal open={viewOpen} onClose={() => setViewOpen(false)} sale={activeSale} />

      <ReprintReceiptModal
        open={reprintOpen}
        onClose={() => setReprintOpen(false)}
        sale={activeSale}
      />
    </Layout>
  );
}
