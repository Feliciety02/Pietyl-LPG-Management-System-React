import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { MoreVertical, UserPlus } from "lucide-react";
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
    filters: { q, status, role, sort, dir, per, page }
    loading: boolean (optional)
  */

const SAMPLE_USERS = {
  data: [
    {
      id: 1,
      name: "Maria Santos",
      email: "admin@pietylpg.com",
      role: "admin",
      is_active: true,
      last_login_at: "2026-01-17 08:42",
      employee: { employee_no: "EMP-0001" },
    },
    {
      id: 2,
      name: "Juan Dela Cruz",
      email: "cashier1@pietylpg.com",
      role: "cashier",
      is_active: true,
      last_login_at: "2026-01-17 09:10",
      employee: { employee_no: "EMP-0003" },
    },
    {
      id: 3,
      name: "Ana Reyes",
      email: "accounting@pietylpg.com",
      role: "accountant",
      is_active: true,
      last_login_at: "2026-01-16 17:45",
      employee: { employee_no: "EMP-0005" },
    },
    {
      id: 4,
      name: "Mark Villanueva",
      email: "rider1@pietylpg.com",
      role: "rider",
      is_active: true,
      last_login_at: "2026-01-17 07:58",
      employee: { employee_no: "EMP-0010" },
    },
    {
      id: 5,
      name: "Liza Gomez",
      email: "inventory@pietylpg.com",
      role: "inventory_manager",
      is_active: true,
      last_login_at: "2026-01-15 14:22",
      employee: { employee_no: "EMP-0008" },
    },
    {
      id: 6,
      name: "Carlos Mendoza",
      email: "former.staff@pietylpg.com",
      role: "cashier",
      is_active: false,
      last_login_at: "2025-12-20 11:05",
      employee: { employee_no: "EMP-0006" },
    },
    {
      id: 7,
      name: "Unlinked User",
      email: "temp@pietylpg.com",
      role: "cashier",
      is_active: true,
      last_login_at: null,
      employee: null,
    },
  ],
  meta: {
    current_page: 1,
    last_page: 1,
    from: 1,
    to: 7,
    total: 7,
  },
};

//const users = page.props?.users || { data: [], meta: null };

const users =
  page.props?.users ??
  (import.meta.env.DEV ? SAMPLE_USERS : { data: [], meta: null });
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

  const sort = useMemo(
    () => ({ key: sortKeyInitial, dir: sortDirInitial }),
    [sortKeyInitial, sortDirInitial]
  );

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

  const loading = Boolean(page.props?.loading);

  const fillerCount = perInitial || 10;

  const fillerRows = useMemo(() => {
    return Array.from({ length: fillerCount }).map((_, i) => ({
      id: `__filler__${i}`,
      __filler: true,
    }));
  }, [fillerCount]);

  const tableRows = loading ? fillerRows : rows;

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "User",
        sortable: true,
        nowrap: true,
        render: (u) =>
          u?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-40" />
              <SkeletonLine w="w-56" />
            </div>
          ) : (
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
        render: (u) =>
          u?.__filler ? (
            <SkeletonLine w="w-24" />
          ) : (
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
        render: (u) => (u?.__filler ? <SkeletonPill w="w-24" /> : <RolePill role={u?.role} />),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        nowrap: true,
        render: (u) => (u?.__filler ? <SkeletonPill w="w-24" /> : <StatusPill active={Boolean(u?.is_active)} />),
      },
      {
        key: "last_login_at",
        label: "Last login",
        sortable: true,
        nowrap: true,
        render: (u) =>
          u?.__filler ? (
            <SkeletonLine w="w-20" />
          ) : (
            <span className="text-sm text-slate-700">{u?.last_login_at || "Never"}</span>
          ),
      },
    ],
    []
  );

  return (
    <Layout title="Users">
      {/* Admin Users
         Purpose
         Create accounts, assign roles, and control access to the system
         Scope lock
         No employee record editing here, only access control
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
          rows={tableRows}
          loading={loading}
          emptyTitle="No users found"
          emptyHint="Try adjusting search or filters."
          sort={sort}
          onSort={handleSort}
          renderActions={(u) =>
            u?.__filler ? (
              <div className="flex items-center justify-end gap-2">
                <SkeletonButton w="w-20" />
                <div className="h-9 w-9 rounded-2xl bg-slate-200/80 animate-pulse" />
              </div>
            ) : (
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
