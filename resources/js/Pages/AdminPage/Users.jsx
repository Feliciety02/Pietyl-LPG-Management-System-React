import React, { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { UserPlus } from "lucide-react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { SkeletonLine, SkeletonPill } from "@/components/ui/Skeleton";
import CreateUserModal from "@/components/modals/AdminModals/CreateUserModal";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function StatusPill({ active }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        active ? "bg-teal-600/10 text-teal-900 ring-teal-700/10" : "bg-slate-100 text-slate-700 ring-slate-200"
      )}
    >
      {active ? "Active" : "Inactive"}
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

export default function Users() {
  const page = usePage();

  const SAMPLE_USERS = {
    data: [
      { id: 1, name: "Admin User", email: "admin@pietylpg.com", role: "admin", is_active: true },
      { id: 2, name: "Cashier One", email: "cashier1@pietylpg.com", role: "cashier", is_active: true },
    ],
    meta: { current_page: 1, last_page: 1, total: 2 },
  };

  const users =
    page.props?.users ??
    (import.meta.env.DEV ? SAMPLE_USERS : { data: [], meta: null });

  const roles = page.props?.roles ?? [];
  const rows = users.data || [];
  const meta = users.meta || null;

  const query = page.props?.filters || {};
  const per = Number(query?.per || 10);

  const [q, setQ] = useState(query?.q || "");
  const [role, setRole] = useState(query?.role || "all");
  const [status, setStatus] = useState(query?.status || "all");

  const roleOptions = [
    { value: "all", label: "All roles" },
    ...roles.map((r) => ({ value: r.name, label: r.name })),
  ];

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/admin/users",
      { q, role, status, per, ...patch },
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

  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  const createUser = (payload) => {
    if (submitting) return;
    setSubmitting(true);
    setCreateError("");

    router.post("/dashboard/admin/users", payload, {
      preserveScroll: true,
      onFinish: () => setSubmitting(false),
      onSuccess: () => {
        setCreateOpen(false);
        setCreateError("");
        router.reload({ only: ["users"] });
      },
      onError: (errors) => {
        setCreateError(errors?.email || errors?.name || errors?.password || errors?.role || "Failed to create user.");
      },
    });
  };


  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "User",
        render: (u) =>
          u?.__filler ? (
            <SkeletonLine w="w-40" />
          ) : (
            <div>
              <div className="font-extrabold text-slate-900">{u.name}</div>
              <div className="text-xs text-slate-500">{u.email}</div>
            </div>
          ),
      },
      {
        key: "role",
        label: "Role",
        render: (u) =>
          u?.__filler ? (
            <SkeletonLine w="w-24" />
          ) : (
            <span className="text-sm text-slate-700">{u.role || "None"}</span>
          ),
      },
      {
        key: "status",
        label: "Status",
        render: (u) => (u?.__filler ? <SkeletonPill w="w-20" /> : <StatusPill active={u.is_active} />),
      },
      {
        key: "employee",
        label: "Employee",
        render: (u) =>
          u?.__filler ? (
            <SkeletonLine w="w-32" />
          ) : u.employee ? (
            <span className="text-sm text-slate-700">{u.employee.name}</span>
          ) : (
            <span className="text-xs text-slate-400">Not linked</span>
          ),
      },
    ],
    []
  );

  return (
    <Layout title="Users">
      <div className="grid gap-6">
        <TopCard
          title="User Accounts"
          subtitle="Create and manage login access."
          right={
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:ring-4 focus:ring-teal-500/25"
            >
              <UserPlus className="h-4 w-4" />
              Add User
            </button>
          }
        />

        <DataTableFilters
          q={q}
          onQ={(v) => {
            setQ(v);
            pushQuery({ q: v, page: 1 });
          }}
          placeholder="Search name or email..."
          filters={[
            {
              key: "role",
              value: role,
              onChange: (v) => {
                setRole(v);
                pushQuery({ role: v, page: 1 });
              },
              options: roleOptions,
            },
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
          emptyTitle="No users found"
          emptyHint="Add a user or adjust filters."
        />

        <DataTablePagination
          meta={meta}
          perPage={per}
          onPerPage={(n) => pushQuery({ per: n, page: 1 })}
          onPrev={() => meta?.current_page > 1 && pushQuery({ page: meta.current_page - 1 })}
          onNext={() => meta?.current_page < meta?.last_page && pushQuery({ page: meta.current_page + 1 })}
          disablePrev={!meta || meta.current_page <= 1}
          disableNext={!meta || meta.current_page >= meta.last_page}
        />
      </div>

      <CreateUserModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateError("");
        }}
        onSubmit={createUser}
        loading={submitting}
        roles={roles}
        serverError={createError}
      />
    </Layout>
  );
}
