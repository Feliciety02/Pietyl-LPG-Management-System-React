import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { ShieldCheck, Plus, MoreVertical } from "lucide-react";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function titleCase(s = "") {
  return String(s || "")
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function RolePill({ roleKey }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
      {titleCase(roleKey || "role").toUpperCase()}
    </span>
  );
}

function DefaultPill({ isDefault }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        isDefault
          ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
          : "bg-slate-100 text-slate-700 ring-slate-200"
      )}
    >
      {isDefault ? "DEFAULT" : "CUSTOM"}
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

export default function Roles() {
  const page = usePage();

  /*
    Expected Inertia props from backend:
    roles: {
      data: [{
        id,
        key,               string (admin, cashier, accountant, rider, inventory_manager)
        name,              string (Admin, Cashier, ...)
        is_default,        boolean
        permissions_count, number
        updated_at,        string|null
      }],
      meta,
      links
    }
    filters: { q, type, page, per }
    loading: boolean (optional)
  */

  const roles = page.props?.roles || { data: [], meta: null };
  const rows = roles?.data || [];
  const meta = roles?.meta || null;

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const typeInitial = query?.type || "all";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [type, setType] = useState(typeInitial);

  const typeOptions = [
    { value: "all", label: "All roles" },
    { value: "default", label: "Default" },
    { value: "custom", label: "Custom" },
  ];

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/admin/roles",
      { q, type, per: perInitial, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const handleSearch = (value) => {
    setQ(value);
    pushQuery({ q: value, page: 1 });
  };

  const handleType = (value) => {
    setType(value);
    pushQuery({ type: value, page: 1 });
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

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Role",
        render: (r) =>
          r?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-40" />
              <SkeletonLine w="w-28" />
            </div>
          ) : (
            <div>
              <div className="font-extrabold text-slate-900">
                {r?.name || titleCase(r?.key) || "Role"}
              </div>
              <div className="mt-1">
                <RolePill roleKey={r?.key} />
              </div>
            </div>
          ),
      },
      {
        key: "type",
        label: "Type",
        render: (r) =>
          r?.__filler ? <SkeletonPill w="w-20" /> : <DefaultPill isDefault={Boolean(r?.is_default)} />,
      },
      {
        key: "permissions_count",
        label: "Permissions",
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-16" />
          ) : (
            <span className="text-sm font-semibold text-slate-800">
              {r?.permissions_count ?? 0}
            </span>
          ),
      },
      {
        key: "updated_at",
        label: "Updated",
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-20" />
          ) : (
            <span className="text-sm text-slate-700">{r?.updated_at || "—"}</span>
          ),
      },
    ],
    []
  );

  return (
    <Layout title="Roles">
      {/* Admin Roles and Permissions
         Purpose
         Define what each role can access inside the system
         Scope lock
         Role changes are careful and audited, not daily workflow
      */}
      <div className="grid gap-6">
        <TopCard
          title="Roles and Permissions"
          subtitle="Control what each role can access. Keep changes minimal and audited."
          right={
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/admin/roles/create"
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:ring-4 focus:ring-teal-500/25"
              >
                <Plus className="h-4 w-4" />
                New Role
              </Link>

              <Link
                href="/dashboard/admin/audit"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:ring-4 focus:ring-teal-500/15"
              >
                <ShieldCheck className="h-4 w-4 text-teal-700" />
                Audit changes
              </Link>
            </div>
          }
        />

        <DataTableFilters
          q={q}
          onQ={handleSearch}
          placeholder="Search role name..."
          filters={[
            {
              key: "type",
              value: type,
              onChange: handleType,
              options: typeOptions,
            },
          ]}
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          emptyTitle="No roles found"
          emptyHint="Default roles should exist. Create a custom role if needed."
          renderActions={(r) =>
            r?.__filler ? (
              <div className="flex items-center justify-end gap-2">
                <SkeletonButton w="w-24" />
                <div className="h-9 w-9 rounded-2xl bg-slate-200/80 animate-pulse" />
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/dashboard/admin/roles/${r.id}`}
                  className="rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:ring-4 focus:ring-teal-500/15"
                >
                  View
                </Link>

                <button
                  type="button"
                  className="rounded-2xl bg-white p-2 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:ring-4 focus:ring-teal-500/15"
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
