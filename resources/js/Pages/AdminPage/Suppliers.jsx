import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { Building2, UserPlus, MoreVertical, Package } from "lucide-react";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function StatusPill({ active }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        active
          ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
          : "bg-slate-100 text-slate-700 ring-slate-200"
      )}
    >
      {active ? "ACTIVE" : "INACTIVE"}
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

export default function Suppliers() {
  const page = usePage();

  /*
    Expected Inertia props from backend:
    suppliers: {
      data: [{
        id,
        name,
        contact_name,
        phone,
        email,
        address,
        is_active,
        products_count
      }],
      meta,
      links
    }
    filters: { q, status, page, per }
  */

  const suppliers = page.props?.suppliers || { data: [], meta: null };
  const rows = suppliers?.data || [];
  const meta = suppliers?.meta || null;

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const statusInitial = query?.status || "all";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [status, setStatus] = useState(statusInitial);

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/admin/suppliers",
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
        key: "name",
        label: "Supplier",
        render: (s) =>
          s?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-48" />
              <SkeletonLine w="w-32" />
            </div>
          ) : (
            <div>
              <div className="font-extrabold text-slate-900">{s.name}</div>
              <div className="text-xs text-slate-500">
                {s.contact_name || "No contact"} • {s.phone || "—"}
              </div>
            </div>
          ),
      },
      {
        key: "email",
        label: "Email",
        render: (s) =>
          s?.__filler ? (
            <SkeletonLine w="w-40" />
          ) : (
            <span className="text-sm text-slate-700">{s.email || "—"}</span>
          ),
      },
      {
        key: "products",
        label: "Products",
        render: (s) =>
          s?.__filler ? (
            <SkeletonLine w="w-16" />
          ) : (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-800">
              <Package className="h-4 w-4 text-slate-500" />
              {s.products_count ?? 0}
            </span>
          ),
      },
      {
        key: "status",
        label: "Status",
        render: (s) =>
          s?.__filler ? <SkeletonPill w="w-20" /> : <StatusPill active={Boolean(s.is_active)} />,
      },
    ],
    []
  );

  return (
    <Layout title="Suppliers">
      {/* Admin Suppliers
         Purpose
         Maintain supplier directory and product relationships
         Scope lock
         No purchasing, receiving, or inventory transactions here
      */}
      <div className="grid gap-6">
        <TopCard
          title="Suppliers"
          subtitle="Manage supplier information and product relationships."
          right={
            <Link
              href="/dashboard/admin/suppliers/create"
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:ring-4 focus:ring-teal-500/25"
            >
              <UserPlus className="h-4 w-4" />
              Add Supplier
            </Link>
          }
        />

        <DataTableFilters
          q={q}
          onQ={handleSearch}
          placeholder="Search supplier name, contact, email..."
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
          emptyTitle="No suppliers found"
          emptyHint="Add suppliers or adjust filters."
          renderActions={(s) =>
            s?.__filler ? (
              <SkeletonButton w="w-20" />
            ) : (
              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/dashboard/admin/suppliers/${s.id}/edit`}
                  className="rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Edit
                </Link>

                <button
                  type="button"
                  className="rounded-2xl bg-white p-2 ring-1 ring-slate-200 hover:bg-slate-50"
                  title="More actions"
                >
                  <MoreVertical className="h-4 w-4 text-slate-600" />
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
    </Layout>
  );
}
