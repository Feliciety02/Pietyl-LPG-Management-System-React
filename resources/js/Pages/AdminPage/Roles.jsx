import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { ShieldCheck, Plus, Eye, MoreVertical } from "lucide-react";
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

function RolePill({ name }) {
  return (
    <span className="inline-flex items-center rounded-full bg-teal-600/10 text-teal-900 ring-1 ring-teal-700/10 px-2.5 py-1 text-[11px] font-extrabold">
      {String(name || "ROLE").toUpperCase()}
    </span>
  );
}

export default function Roles() {
  const page = usePage();

  /*
    Expected Inertia props from backend:
    roles: {
      data: [{
        id,
        name,            // e.g. "admin", "cashier"
        label,           // optional: "Admin"
        users_count,     // optional
        permissions_count, // optional
        is_system,       // optional: true for default roles
        updated_at,      // optional
      }],
      meta,
      links
    }
    filters: { q, page, per }
    loading: boolean (optional)
  */

    // DEV ONLY – sample roles for UI development
const SAMPLE_ROLES = {
  data: [
    {
      id: 1,
      name: "admin",
      label: "Admin",
      users_count: 1,
      permissions_count: 42,
      is_system: true,
      updated_at: "2026-01-10 09:12",
    },
    {
      id: 2,
      name: "cashier",
      label: "Cashier",
      users_count: 2,
      permissions_count: 18,
      is_system: true,
      updated_at: "2026-01-08 14:30",
    },
    {
      id: 3,
      name: "accountant",
      label: "Accountant",
      users_count: 1,
      permissions_count: 16,
      is_system: true,
      updated_at: "2026-01-07 16:45",
    },
    {
      id: 4,
      name: "rider",
      label: "Rider",
      users_count: 1,
      permissions_count: 10,
      is_system: true,
      updated_at: "2026-01-06 11:05",
    },
    {
      id: 5,
      name: "inventory_manager",
      label: "Inventory Manager",
      users_count: 1,
      permissions_count: 20,
      is_system: true,
      updated_at: "2026-01-06 15:20",
    },
    {
      id: 6,
      name: "warehouse_staff",
      label: "Warehouse Staff",
      users_count: 0,
      permissions_count: 8,
      is_system: false,
      updated_at: "2026-01-15 10:18",
    },
  ],
  meta: {
    current_page: 1,
    last_page: 1,
    from: 1,
    to: 6,
    total: 6,
  },
};

//const roles = page.props?.roles || { data: [], meta: null };

const roles =
  page.props?.roles ??
  (import.meta.env.DEV ? SAMPLE_ROLES : { data: [], meta: null });
  const rows = roles?.data || [];
  const meta = roles?.meta || null;

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/admin/roles",
      { q, per: perInitial, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const handleSearch = (value) => {
    setQ(value);
    pushQuery({ q: value, page: 1 });
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
        sortable: false,
        nowrap: true,
        render: (r) =>
          r?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-28" />
              <SkeletonLine w="w-40" />
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <RolePill name={r?.name || r?.label} />
                {r?.is_system ? (
                  <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200 px-2.5 py-1 text-[11px] font-extrabold">
                    SYSTEM
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-slate-500">
                {r?.label ? r.label : titleCase(r?.name)}
              </div>
            </div>
          ),
      },
      {
        key: "users_count",
        label: "Users",
        sortable: false,
        nowrap: true,
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-10" />
          ) : (
            <span className="text-sm font-semibold text-slate-800">
              {typeof r?.users_count === "number" ? r.users_count : "-"}
            </span>
          ),
      },
      {
        key: "permissions_count",
        label: "Permissions",
        sortable: false,
        nowrap: true,
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-10" />
          ) : (
            <span className="text-sm font-semibold text-slate-800">
              {typeof r?.permissions_count === "number" ? r.permissions_count : "-"}
            </span>
          ),
      },
      {
        key: "updated_at",
        label: "Updated",
        sortable: false,
        nowrap: true,
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-20" />
          ) : (
            <span className="text-sm text-slate-700">{r?.updated_at || "-"}</span>
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
         Roles are changed rarely. Changes should be audited.
      */}
      <div className="grid gap-6">
        <TopCard
          title="Roles and Permissions"
          subtitle="Control what each role can access. Keep changes minimal and auditable."
          right={
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/admin/roles/create"
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25"
              >
                <Plus className="h-4 w-4" />
                New Role
              </Link>
            </div>
          }
        />

        <DataTableFilters
          q={q}
          onQ={handleSearch}
          placeholder="Search role name..."
          rightSlot={
            <Link
              href="/dashboard/admin/users"
              className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:outline-none focus:ring-4 focus:ring-teal-500/15"
            >
              Back to Users
            </Link>
          }
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          emptyTitle="No roles found"
          emptyHint="Create a role or adjust search."
          renderActions={(r) =>
            r?.__filler ? (
              <div className="flex items-center justify-end gap-2">
                <SkeletonButton w="w-20" />
                <div className="h-9 w-9 rounded-2xl bg-slate-200/80 animate-pulse" />
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/dashboard/admin/roles/${r.id}`}
                  className="rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:outline-none focus:ring-4 focus:ring-teal-500/15 inline-flex items-center gap-2"
                  title="View role"
                >
                  <Eye className="h-4 w-4 text-slate-600" />
                  View
                </Link>

                <button
                  type="button"
                  className="rounded-2xl bg-white p-2 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:outline-none focus:ring-4 focus:ring-teal-500/15"
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

        <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-teal-600/10 ring-1 ring-teal-700/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-teal-700" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900">Owner note</div>
              <div className="mt-1 text-sm text-slate-600">
                Keep default roles stable. If you need new workflows, add a new role instead of modifying
                admin or cashier frequently. All permission changes should be logged in audit trails.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
