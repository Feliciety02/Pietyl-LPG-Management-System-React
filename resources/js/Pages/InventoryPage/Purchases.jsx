import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Paperclip,
} from "lucide-react";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function StatusPill({ status }) {
  const s = String(status || "").toLowerCase();

  const tone =
    s === "approved"
      ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
      : s === "pending"
      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
      : s === "rejected"
      ? "bg-rose-600/10 text-rose-900 ring-rose-700/10"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        tone
      )}
    >
      {String(status || "pending").toUpperCase()}
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

export default function Purchases() {
  const page = usePage();

  /*
    Expected Inertia props:
    purchases: {
      data: [{
        id,
        reference_no,
        supplier_name,
        product_name,
        variant,
        qty,
        unit_cost,
        total_cost,
        status, // pending | approved | rejected
        created_at
      }],
      meta
    }
    filters: { q, status, page, per }
  */

  // DEV ONLY sample data
  const SAMPLE_PURCHASES = {
    data: [
      {
        id: 1,
        reference_no: "P-000051",
        supplier_name: "Petron LPG Supply",
        product_name: "LPG Cylinder",
        variant: "11kg",
        qty: 12,
        unit_cost: 980,
        total_cost: 11760,
        status: "pending",
        created_at: "Today 09:12 AM",
      },
      {
        id: 2,
        reference_no: "P-000050",
        supplier_name: "Shellane Distributors",
        product_name: "LPG Cylinder",
        variant: "22kg",
        qty: 6,
        unit_cost: 1850,
        total_cost: 11100,
        status: "approved",
        created_at: "Yesterday 04:40 PM",
      },
      {
        id: 3,
        reference_no: "P-000049",
        supplier_name: "Regasco Trading",
        product_name: "LPG Cylinder",
        variant: "50kg",
        qty: 2,
        unit_cost: 4200,
        total_cost: 8400,
        status: "rejected",
        created_at: "Jan 17 01:15 PM",
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

  const purchases =
    page.props?.purchases ??
    (import.meta.env.DEV ? SAMPLE_PURCHASES : { data: [], meta: null });

  const rows = purchases?.data || [];
  const meta = purchases?.meta || null;

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const statusInitial = query?.status || "all";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [status, setStatus] = useState(statusInitial);

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/inventory/purchases",
      { q, status, per: perInitial, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const handleSearch = (v) => {
    setQ(v);
    pushQuery({ q: v, page: 1 });
  };

  const handleStatus = (v) => {
    setStatus(v);
    pushQuery({ status: v, page: 1 });
  };

  const handlePerPage = (n) => pushQuery({ per: n, page: 1 });
  const handlePrev = () =>
    meta && meta.current_page > 1 && pushQuery({ page: meta.current_page - 1 });
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

  const columns = useMemo(
    () => [
      {
        key: "ref",
        label: "Reference",
        render: (x) =>
          x?.__filler ? (
            <SkeletonLine w="w-28" />
          ) : (
            <div className="font-extrabold text-slate-900">{x.reference_no}</div>
          ),
      },
      {
        key: "supplier",
        label: "Supplier",
        render: (x) =>
          x?.__filler ? (
            <SkeletonLine w="w-40" />
          ) : (
            <div className="text-sm text-slate-800">{x.supplier_name}</div>
          ),
      },
      {
        key: "item",
        label: "Item",
        render: (x) =>
          x?.__filler ? (
            <SkeletonLine w="w-36" />
          ) : (
            <div>
              <div className="font-semibold text-slate-900">
                {x.product_name} <span className="text-slate-500">({x.variant})</span>
              </div>
            </div>
          ),
      },
      {
        key: "qty",
        label: "Qty",
        render: (x) =>
          x?.__filler ? (
            <SkeletonLine w="w-10" />
          ) : (
            <span className="text-sm font-extrabold text-slate-900">{x.qty}</span>
          ),
      },
      {
        key: "cost",
        label: "Total cost",
        render: (x) =>
          x?.__filler ? (
            <SkeletonLine w="w-24" />
          ) : (
            <span className="text-sm font-semibold text-slate-800">
              ₱{Number(x.total_cost).toLocaleString()}
            </span>
          ),
      },
      {
        key: "status",
        label: "Status",
        render: (x) =>
          x?.__filler ? <SkeletonPill w="w-20" /> : <StatusPill status={x.status} />,
      },
      {
        key: "date",
        label: "Created",
        render: (x) =>
          x?.__filler ? (
            <SkeletonLine w="w-28" />
          ) : (
            <span className="text-sm text-slate-700">{x.created_at}</span>
          ),
      },
    ],
    []
  );

  return (
    <Layout title="Purchases">
      <div className="grid gap-6">
        <TopCard
          title="Purchases"
          subtitle="Create and track inventory purchase requests. Admin approval is required before stock updates."
          right={
            <Link
              href="/dashboard/inventory/purchases/create"
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 focus:ring-4 focus:ring-teal-500/25"
            >
              <PlusCircle className="h-4 w-4" />
              New purchase
            </Link>
          }
        />

        <DataTableFilters
          q={q}
          onQ={handleSearch}
          placeholder="Search reference, supplier, product..."
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
          emptyTitle="No purchase requests found"
          emptyHint="Create a purchase request when stock is low."
          renderActions={(x) =>
            x?.__filler ? (
              <SkeletonButton w="w-20" />
            ) : (
              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/dashboard/inventory/purchases/${x.id}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  <FileText className="h-4 w-4 text-slate-600" />
                  View
                </Link>

                {x.status === "pending" && (
                  <Link
                    href={`/dashboard/inventory/purchases/${x.id}/edit`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    <Clock className="h-4 w-4 text-slate-600" />
                    Edit
                  </Link>
                )}
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
    </Layout>
  );
}
