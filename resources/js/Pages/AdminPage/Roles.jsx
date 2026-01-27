import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";

import { Plus, MoreVertical, Users } from "lucide-react";
import { SkeletonLine, SkeletonButton } from "@/components/ui/Skeleton";

import RoleUsersModal from "@/components/modals/AdminModals/RoleUsersModal";
import DuplicateRoleModal from "@/components/modals/AdminModals/DuplicateRoleModal";
import ConfirmRoleArchiveModal from "@/components/modals/AdminModals/ConfirmRoleArchiveModal";
import RoleActionsModal from "@/components/modals/AdminModals/RoleActionsModal";

/* -------------------------------------------------------------------------- */
/* SAMPLE DATA                                                                 */
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
  meta: { current_page: 1, last_page: 1, from: 1, to: 4, total: 4 },
};

/* -------------------------------------------------------------------------- */

function RolePill({ name }) {
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-800">
      {String(name).toUpperCase()}
    </span>
  );
}

function SystemPill() {
  return (
    <span className="inline-flex rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
      SYSTEM
    </span>
  );
}

export default function Roles() {
  const page = usePage();

  const roles =
    page.props?.roles ??
    (import.meta.env.DEV ? SAMPLE_ROLES : { data: [], meta: null });

  const rows = roles.data || [];
  const meta = roles.meta || null;
  const loading = Boolean(page.props?.loading);

  const [activeRole, setActiveRole] = useState(null);
  const [modal, setModal] = useState(null); // users | actions | duplicate | archive

  const closeModals = () => setModal(null);

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Role",
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-32" />
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <RolePill name={r.name} />
                {r.is_system && <SystemPill />}
              </div>
              <div className="text-xs text-slate-500">{r.label}</div>
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
            <span className="text-sm font-semibold text-slate-800">
              {r.users_count}
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
            <span className="text-sm font-semibold text-slate-800">
              {r.permissions_count}
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
            <span className="text-sm text-slate-600">{r.updated_at}</span>
          ),
      },
    ],
    []
  );

  return (
    <Layout title="Roles">
      <div className="grid gap-6">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <div className="text-lg font-semibold text-slate-900">
              Roles and access
            </div>
            <div className="text-sm text-slate-600">
              Control permissions per role. System roles are protected.
            </div>
          </div>

          <Link
            href="/dashboard/admin/roles/create"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            New role
          </Link>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          renderActions={(r) =>
            r?.__filler ? (
              <SkeletonButton w="w-16" />
            ) : (
              <div className="flex items-center justify-end gap-2">
                {/* VIEW USERS */}
                <button
                  onClick={() => {
                    setActiveRole(r);
                    setModal("users");
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <Users className="h-4 w-4 text-slate-500" />
                  View
                </button>

                {/* MORE */}
                <button
                  onClick={() => {
                    setActiveRole(r);
                    setModal("actions");
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
                >
                  <MoreVertical className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            )
          }
        />

        <DataTablePagination meta={meta} />

        {/* MODALS */}
        <RoleUsersModal
          open={modal === "users"}
          role={activeRole}
          onClose={closeModals}
        />

        <RoleActionsModal
          open={modal === "actions"}
          role={activeRole}
          onClose={closeModals}
          onDuplicate={() => setModal("duplicate")}
          onArchive={() => setModal("archive")}
        />

        <DuplicateRoleModal
          open={modal === "duplicate"}
          role={activeRole}
          onClose={closeModals}
        />

        <ConfirmRoleArchiveModal
          open={modal === "archive"}
          role={activeRole}
          onClose={closeModals}
        />
      </div>
    </Layout>
  );
}
