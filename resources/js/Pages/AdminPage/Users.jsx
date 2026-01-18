// Admin Users
// Purpose
// - Control who can access the system and what role they have
//
// Admin can
// - Create user accounts for existing employees
// - Assign a role to a user (cashier, accountant, rider, inventory manager, admin)
// - Activate or disable user access
// - Reset password or force password change
// - View last login and account status
//
// Admin should not
// - Edit employee personal records here (use Employees tab)
// - Record sales or operational tasks
//
// Notes
// - A user must be linked to an employee record
// - Disabled users must not be able to log in

import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { MoreVertical, UserPlus } from "lucide-react";

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
      {active ? "ACTIVE" : "DISABLED"}
    </span>
  );
}

function RolePill({ role }) {
  const text = titleCase(role || "role");
  return (
    <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
      {text.toUpperCase()}
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

  /*
    Expected Inertia props from backend:
    users: {
      data: [{ id, name, email, role, is_active, last_login_at, employee: { employee_no } }],
      meta: { current_page, last_page, from, to, total },
      links: [...]
    }
  */
  const users = page.props?.users || { data: [], meta: null };
  const rows = users?.data || [];
  const meta = users?.meta || null;

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const statusInitial = query?.status || "all";
  const roleInitial = query?.role || "all";
  const sortKeyInitial = query?.sort || "name";
  const sortDirInitial = query?.dir || "asc";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [status, setStatus] = useState(statusInitial);
  const [role, setRole] = useState(roleInitial);

  const sort = useMemo(() => ({ key: sortKeyInitial, dir: sortDirInitial }), [sortKeyInitial, sortDirInitial]);

  const roleOptions = useMemo(() => {
    const set = new Set();
    rows.forEach((u) => {
      if (u?.role) set.add(String(u.role));
    });

    const roleList = Array.from(set).sort();

    return [
      { value: "all", label: "All roles" },
      ...roleList.map((r) => ({ value: r, label: titleCase(r) })),
    ];
  }, [rows]);

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "active", label: "Active" },
    { value: "disabled", label: "Disabled" },
  ];

  const pushQuery = (patch) => {
    const next = {
      q,
      status,
      role,
      sort: sort.key,
      dir: sort.dir,
      per: perInitial,
      ...patch,
    };

    router.get("/dashboard/admin/users", next, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    });
  };

  const handleSearch = (value) => {
    setQ(value);
    pushQuery({ q: value, page: 1 });
  };

  const handleStatus = (value) => {
    setStatus(value);
    pushQuery({ status: value, page: 1 });
  };

  const handleRole = (value) => {
    setRole(value);
    pushQuery({ role: value, page: 1 });
  };

  const handleSort = (key) => {
    const isSame = sort.key === key;
    const nextDir = isSame ? (sort.dir === "asc" ? "desc" : "asc") : "asc";
    pushQuery({ sort: key, dir: nextDir, page: 1 });
  };

  const handlePerPage = (n) => {
    pushQuery({ per: n, page: 1 });
  };

  const handlePrev = () => {
    if (!meta) return;
    if (meta.current_page <= 1) return;
    pushQuery({ page: meta.current_page - 1 });
  };

  const handleNext = () => {
    if (!meta) return;
    if (meta.current_page >= meta.last_page) return;
    pushQuery({ page: meta.current_page + 1 });
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "User",
        sortable: true,
        nowrap: true,
        render: (u) => (
          <div>
            <div className="font-extrabold text-slate-900">{u?.name || "User"}</div>
            <div className="text-xs text-slate-500">{u?.email || ""}</div>
          </div>
        ),
      },
      {
        key: "employee_no",
        label: "Employee",
        sortable: false,
        nowrap: true,
        render: (u) => (
          <div className="text-sm font-semibold text-slate-800">
            {u?.employee?.employee_no || "Not linked"}
          </div>
        ),
      },
      {
        key: "role",
        label: "Role",
        sortable: true,
        nowrap: true,
        render: (u) => <RolePill role={u?.role} />,
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        nowrap: true,
        render: (u) => <StatusPill active={Boolean(u?.is_active)} />,
      },
      {
        key: "last_login_at",
        label: "Last login",
        sortable: true,
        nowrap: true,
        render: (u) => <span className="text-sm text-slate-700">{u?.last_login_at || "Never"}</span>,
      },
    ],
    []
  );

  return (
    <Layout title="Users">
      {/* Admin Users
         Purpose
         - Control who can access the system and what role they have
         Scope lock
         - No employee record editing here, only access control
      */}
      <div className="grid gap-6">
        <TopCard
          title="User Management"
          subtitle="Create accounts, assign roles, and control access to the system."
          right={
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/admin/users/create"
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25"
              >
                <UserPlus className="h-4 w-4" />
                Create User
              </Link>
            </div>
          }
        />

        <DataTableFilters
          q={q}
          onQ={handleSearch}
          placeholder="Search name, email, employee no..."
          filters={[
            {
              key: "status",
              value: status,
              onChange: handleStatus,
              options: statusOptions,
            },
            {
              key: "role",
              value: role,
              onChange: handleRole,
              options: roleOptions,
            },
          ]}
          rightSlot={
            <Link
              href="/dashboard/admin/roles"
              className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:outline-none focus:ring-4 focus:ring-teal-500/15"
            >
              Manage Roles
            </Link>
          }
        />

        <DataTable
          columns={columns}
          rows={rows}
          loading={Boolean(page.props?.loading)}
          emptyTitle="No users found"
          emptyHint="Try adjusting search or filters."
          sort={sort}
          onSort={handleSort}
          renderActions={(u) => (
            <div className="flex items-center justify-end gap-2">
              <Link
                href={`/dashboard/admin/users/${u.id}/edit`}
                className="rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:outline-none focus:ring-4 focus:ring-teal-500/15"
              >
                Edit
              </Link>

              <button
                type="button"
                className="rounded-2xl bg-white p-2 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                title="More actions"
              >
                <MoreVertical className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          )}
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
