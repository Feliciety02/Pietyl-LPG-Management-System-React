// resources/js/Pages/AdminPage/Tabs/Roles.jsx
import React, { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";

import { Plus, Users, Pencil, RotateCcw } from "lucide-react";
import { SkeletonLine, SkeletonButton } from "@/components/ui/Skeleton";

import {
  TableActionButton,
  TableActionMenu,
} from "@/components/Table/ActionTableButton";

import CreateRoleModal from "@/components/modals/AdminModals/AddNewRoleModal";
import EditRoleModal from "@/components/modals/AdminModals/EditRoleModal";
import RoleUsersModal from "@/components/modals/AdminModals/RoleUsersModal";
import DuplicateRoleModal from "@/components/modals/AdminModals/DuplicateRoleModal";
import ConfirmRoleArchiveModal from "@/components/modals/AdminModals/ConfirmRoleArchiveModal";
import RoleActionsModal from "@/components/modals/AdminModals/RoleActionsModal";
import RolePermissionsModal from "@/components/modals/AdminModals/RolePermissionsModal";
import ConfirmRoleRestoreModal from "@/components/modals/AdminModals/ConfirmRoleRestoreModal";

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

function normalizePaginator(p) {
  const x = p || {};
  const data = Array.isArray(x.data) ? x.data : [];
  const meta =
    x.meta && typeof x.meta === "object"
      ? x.meta
      : x.current_page != null || x.last_page != null
      ? x
      : null;

  return { data, meta };
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
  meta: { current_page: 1, last_page: 1, total: 4, from: 1, to: 4 },
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

function ArchivedPill() {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 bg-rose-600/10 text-rose-900 ring-rose-700/10">
      ARCHIVED
    </span>
  );
}

function Tabs({ tabs, value, onChange }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-slate-50 p-1 ring-1 ring-slate-200">
      {tabs.map((t) => {
        const active = t.value === value;

        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={cx(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition",
              active
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "text-slate-600 hover:text-slate-800"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
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

  const rawRoles =
    page.props?.roles ??
    (import.meta.env.DEV ? SAMPLE_ROLES : { data: [], meta: null });

  const { data: rows, meta } = normalizePaginator(rawRoles);

  const permissions = page.props?.permissions || [];

  const filters = page.props?.filters || {};
  const qInitial = filters?.q || "";
  const scopeInitial = filters?.scope || "all";
  const perInitial = Number(filters?.per || 10) || 10;

  const [q, setQ] = useState(qInitial);
  const [scope, setScope] = useState(scopeInitial);

  const [activeRole, setActiveRole] = useState(null);
  const [modal, setModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loading = Boolean(page.props?.loading);

  const scopeOptions = [
    { value: "all", label: "All roles" },
    { value: "system", label: "System roles" },
    { value: "custom", label: "Custom roles" },
    { value: "all_with_archived", label: "All (including archived)" },
    { value: "archived", label: "Archived roles" },
  ];

  const scopeTabs = [
    { value: "all", label: "Active" },
    { value: "archived", label: "Archived" },
    { value: "all_with_archived", label: "All" },
  ];

  const activeScopeTab = scopeTabs.some((t) => t.value === scope)
    ? scope
    : "all";

  const pushQuery = (patch = {}) => {
    router.get(
      "/dashboard/admin/roles",
      { q, scope, per: perInitial, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const handlePrev = () => {
    if (!meta) return;
    if ((meta.current_page || 1) <= 1) return;
    pushQuery({ page: (meta.current_page || 1) - 1 });
  };

  const handleNext = () => {
    if (!meta) return;
    if ((meta.current_page || 1) >= (meta.last_page || 1)) return;
    pushQuery({ page: (meta.current_page || 1) + 1 });
  };

  const closeModals = () => {
    setModal(null);
    setActiveRole(null);
  };

  const refreshList = (options = {}) => {
    const nextScope = options.scope ?? scope;
    setScope(nextScope);
    const patch = { ...options, scope: nextScope };
    if (!("page" in patch)) {
      patch.page = 1;
    }
    pushQuery(patch);
  };

  const handleActionSuccess = (options = {}) => {
    closeModals();
    refreshList(options);
  };

  const createRole = (payload) => {
    if (submitting) return;
    setSubmitting(true);

    router.post("/dashboard/admin/roles", payload, {
      preserveScroll: true,
      onFinish: () => setSubmitting(false),
      onSuccess: () => handleActionSuccess(),
    });
  };

  const updateRole = (payload) => {
    if (!activeRole?.id || submitting) return;
    setSubmitting(true);

    router.put(`/dashboard/admin/roles/${activeRole.id}`, payload, {
      preserveScroll: true,
      onFinish: () => setSubmitting(false),
      onSuccess: () => handleActionSuccess(),
    });
  };

  const duplicateRole = (payload) => {
    if (!activeRole?.id || submitting) return;
    setSubmitting(true);

    router.post(
      "/dashboard/admin/roles",
      { ...payload, source_role_id: activeRole.id },
      {
        preserveScroll: true,
        onFinish: () => setSubmitting(false),
        onSuccess: () => handleActionSuccess(),
      }
    );
  };

  const archiveRole = () => {
    if (!activeRole?.id || submitting) return;
    setSubmitting(true);

    router.post(`/dashboard/admin/roles/${activeRole.id}/archive`, {}, {
      preserveScroll: true,
      onFinish: () => setSubmitting(false),
      onSuccess: () => handleActionSuccess(),
    });
  };

  const restoreRole = () => {
    if (!activeRole?.id || submitting) return;
    setSubmitting(true);

    router.put(`/dashboard/admin/roles/${activeRole.id}/restore`, {}, {
      preserveScroll: true,
      onFinish: () => setSubmitting(false),
      onSuccess: () => handleActionSuccess({ scope: "all" }),
    });
  };

  const updateRolePermissions = (payload) => {
    if (!activeRole?.id || submitting) return;
    setSubmitting(true);

    router.put(`/dashboard/admin/roles/${activeRole.id}/permissions`, payload, {
      preserveScroll: true,
      onFinish: () => setSubmitting(false),
      onSuccess: () => handleActionSuccess(),
    });
  };

  const fillerRows = useMemo(() => {
    return Array.from({ length: perInitial }).map((_, i) => ({
      id: `__filler__${i}`,
      __filler: true,
    }));
  }, [perInitial]);

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
                {r.is_archived ? <ArchivedPill /> : null}
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
            <button
              type="button"
              onClick={() => {
                setActiveRole(null);
                setModal("create");
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:ring-4 focus:ring-teal-500/25"
            >
              <Plus className="h-4 w-4" />
              New Role
            </button>
          }
        />

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-4 justify-between">
          <Tabs
            tabs={scopeTabs}
            value={activeScopeTab}
            onChange={(v) => {
              setScope(v);
              pushQuery({ scope: v, page: 1 });
            }}
          />

          <DataTableFilters
            variant="inline"
            containerClass="w-full md:w-auto"
            q={q}
            onQ={setQ}
            onQDebounced={(v) => pushQuery({ q: v, page: 1 })}
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
        </div>

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          searchQuery={q}
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

                {r.is_archived ? (
                  <TableActionButton
                    icon={RotateCcw}
                    onClick={() => {
                      setActiveRole(r);
                      setModal("restore");
                    }}
                    title="Restore role"
                  >
                    Restore
                  </TableActionButton>
                ) : (
                  <TableActionButton
                    icon={Pencil}
                    onClick={() => {
                      setActiveRole(r);
                      setModal("edit");
                    }}
                    title={
                      r.name === "admin"
                        ? "Admin role is protected"
                        : r.is_system
                        ? "System roles cannot be edited"
                        : "Edit role"
                    }
                    disabled={r.is_system || r.name === "admin"}
                  >
                    Edit
                  </TableActionButton>
                )}

                {!r.is_archived && r.name !== "admin" ? (
                  <TableActionMenu
                    onClick={() => {
                      setActiveRole(r);
                      setModal("actions");
                    }}
                    title="More actions"
                  />
                ) : null}
              </div>
            )
          }
        />

        <DataTablePagination
          meta={meta}
          perPage={perInitial}
          onPerPage={(n) => pushQuery({ per: n, page: 1 })}
          onPrev={handlePrev}
          onNext={handleNext}
          disablePrev={!meta || (meta.current_page || 1) <= 1}
          disableNext={!meta || (meta.current_page || 1) >= (meta.last_page || 1)}
        />

        {/* MODALS */}
        <CreateRoleModal
          open={modal === "create"}
          onClose={closeModals}
          onSubmit={createRole}
          loading={submitting}
        />

        <EditRoleModal
          open={modal === "edit"}
          role={activeRole}
          onClose={closeModals}
          onSubmit={updateRole}
          loading={submitting}
        />

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
          onRestore={() => setModal("restore")}
          onPermissions={() => setModal("permissions")}
          loading={submitting}
        />

        <DuplicateRoleModal
          open={modal === "duplicate"}
          role={activeRole}
          onClose={closeModals}
          onSubmit={duplicateRole}
          loading={submitting}
        />

        <ConfirmRoleArchiveModal
          open={modal === "archive"}
          role={activeRole}
          onClose={closeModals}
          onConfirm={archiveRole}
          loading={submitting}
        />

        <ConfirmRoleRestoreModal
          open={modal === "restore"}
          role={activeRole}
          onClose={closeModals}
          onConfirm={restoreRole}
          loading={submitting}
        />

        <RolePermissionsModal
          open={modal === "permissions"}
          role={activeRole}
          permissions={permissions}
          onClose={closeModals}
          onSubmit={updateRolePermissions}
          loading={submitting}
        />
      </div>
    </Layout>
  );
}
