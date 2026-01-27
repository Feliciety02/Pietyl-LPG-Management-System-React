// resources/js/Pages/AdminPage/Tabs/Roles.jsx
import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";

import { Plus, Users } from "lucide-react";
import { SkeletonLine, SkeletonButton } from "@/components/ui/Skeleton";

import {
  TableActionButton,
  TableActionMenu,
} from "@/components/Table/ActionTableButton";

import RoleUsersModal from "@/components/modals/AdminModals/RoleUsersModal";
import DuplicateRoleModal from "@/components/modals/AdminModals/DuplicateRoleModal";
import ConfirmRoleArchiveModal from "@/components/modals/AdminModals/ConfirmRoleArchiveModal";
import RoleActionsModal from "@/components/modals/AdminModals/RoleActionsModal";

function titleCase(s = "") {
  return String(s || "")
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* -------------------------------------------------------------------------- */
/* DEV SAMPLE DATA                                                             */
/* -------------------------------------------------------------------------- */

const SAMPLE_ROLES = {
  data: [
    {
      id: 1,
      name: "admin",
      label: "Administrator",
      users_count: 1,
      permissions_count: 42,
      is_system: true,
      updated_at: "2026-01-10 09:12",
      users: [{ id: 1, name: "Owner", email: "owner@pietyl.test" }],
    },
    {
      id: 2,
      name: "inventory_manager",
      label: "Inventory Manager",
      users_count: 2,
      permissions_count: 20,
      is_system: true,
      updated_at: "2026-01-12 16:30",
      users: [],
    },
    {
      id: 3,
      name: "cashier",
      label: "Cashier",
      users_count: 3,
      permissions_count: 18,
      is_system: true,
      updated_at: "2026-01-08 14:30",
      users: [],
    },
    {
      id: 4,
      name: "warehouse_staff",
      label: "Warehouse Staff",
      users_count: 0,
      permissions_count: 8,
      is_system: false,
      updated_at: "2026-01-15 10:18",
      users: [],
    },
  ],
  meta: { current_page: 1, last_page: 1, total: 4 },
};

/* -------------------------------------------------------------------------- */
/* Pills                                                                       */
/* -------------------------------------------------------------------------- */

function RolePill({ name }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 bg-slate-100 text-slate-800 ring-slate-200">
      {String(name || "").toUpperCase()}
    </span>
  );
}

function SystemPill() {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 bg-teal-600/10 text-teal-900 ring-teal-700/10">
      SYSTEM
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Layout bits                                                                 */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function Roles() {
  const page = usePage();

  const roles =
    page.props?.roles ??
    (import.meta.env.DEV ? SAMPLE_ROLES : { data: [], meta: null });

  const rows = roles.data || [];
  const meta = roles.meta || null;

  const query = page.props?.filters || {};
  const per = Number(query?.per || 10);

  const [q, setQ] = useState(query?.q || "");
  const [scope, setScope] = useState(query?.scope || "all");

  const [activeRole, setActiveRole] = useState(null);
  const [modal, setModal] = useState(null); // users | actions | duplicate | archive

  const loading = Boolean(page.props?.loading);

  const scopeOptions = [
    { value: "all", label: "All roles" },
    { value: "system", label: "System roles" },
    { value: "custom", label: "Custom roles" },
  ];

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/admin/roles",
      { q, scope, per, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const closeModals = () => setModal(null);

  const fillerRows = useMemo(
    () =>
      Array.from({ length: per }).map((_, i) => ({
        id: `__filler__${i}`,
        __filler: true,
      })),
    [per]
  );

  const tableRows = loading ? fillerRows : rows;

  const columns = useMemo(
    () => [
      {
        key: "role",
        label: "Role",
        render: (r) =>
          r?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-32" />
              <SkeletonLine w="w-40" />
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <RolePill name={r.name} />
                {r.is_system ? <SystemPill /> : null}
              </div>
              <div className="text-xs text-slate-500">
                {r.label || titleCase(r.name)}
              </div>
            </div>
          ),
      },
      {
        key: "users_count",
        label: "Users",
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-10" />
          ) : (
            <span className="text-sm font-extrabold text-slate-900">
              {r.users_count ?? 0}
            </span>
          ),
      },
      {
        key: "permissions_count",
        label: "Permissions",
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-10" />
          ) : (
            <span className="text-sm font-extrabold text-slate-900">
              {r.permissions_count ?? 0}
            </span>
          ),
      },
      {
        key: "updated_at",
        label: "Updated",
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-24" />
          ) : (
            <span className="text-sm text-slate-600">{r.updated_at || "—"}</span>
          ),
      },
    ],
    []
  );

  return (
    <Layout title="Roles">
      <div className="grid gap-6">
        <TopCard
          title="Roles and Access"
          subtitle="Control permissions per role. System roles are protected."
          right={
            <Link
              href="/dashboard/admin/roles/create"
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:ring-4 focus:ring-teal-500/25"
            >
              <Plus className="h-4 w-4" />
              New Role
            </Link>
          }
        />

        <DataTableFilters
          q={q}
          onQ={(v) => {
            setQ(v);
            pushQuery({ q: v, page: 1 });
          }}
          placeholder="Search role name or label..."
          filters={[
            {
              key: "scope",
              value: scope,
              onChange: (v) => {
                setScope(v);
                pushQuery({ scope: v, page: 1 });
              },
              options: scopeOptions,
            },
          ]}
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          emptyTitle="No roles found"
          emptyHint="Create a new role or adjust your filters."
          renderActions={(r) =>
            r?.__filler ? (
              <SkeletonButton w="w-24" />
            ) : (
              <div className="flex items-center justify-end gap-2">
                <TableActionButton
                  icon={Users}
                  onClick={() => {
                    setActiveRole(r);
                    setModal("users");
                  }}
                  title="View role users"
                >
                  View
                </TableActionButton>

                <TableActionMenu
                  onClick={() => {
                    setActiveRole(r);
                    setModal("actions");
                  }}
                  title="More actions"
                />
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

        {/* MODALS */}
        <RoleUsersModal open={modal === "users"} role={activeRole} onClose={closeModals} />

        <RoleActionsModal
          open={modal === "actions"}
          role={activeRole}
          onClose={closeModals}
          onDuplicate={() => setModal("duplicate")}
          onArchive={() => setModal("archive")}
        />

        <DuplicateRoleModal open={modal === "duplicate"} role={activeRole} onClose={closeModals} />

        <ConfirmRoleArchiveModal open={modal === "archive"} role={activeRole} onClose={closeModals} />
      </div>
    </Layout>
  );
}
