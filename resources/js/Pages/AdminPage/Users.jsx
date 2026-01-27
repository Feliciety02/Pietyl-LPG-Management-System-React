// resources/js/Pages/AdminPage/Tabs/Users.jsx
import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";

import { MoreVertical, UserPlus, Eye, Pencil, Ban, CheckCircle2 } from "lucide-react";
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

function ActionButton({ icon: Icon, children, href, onClick, title }) {
  const cls =
    "inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:outline-none focus:ring-2 focus:ring-teal-500/20";

  if (href) {
    return (
      <Link href={href} className={cls} title={title}>
        {Icon ? <Icon className="h-4 w-4 text-slate-600" /> : null}
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cls} title={title}>
      {Icon ? <Icon className="h-4 w-4 text-slate-600" /> : null}
      {children}
    </button>
  );
}

function MoreMenu({ open, onToggle, onClose, items = [] }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200 hover:bg-slate-50 transition focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        title="More actions"
      >
        <MoreVertical className="h-4 w-4 text-slate-600" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 cursor-default"
            onClick={onClose}
            aria-label="Close"
          />
          <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white ring-1 ring-slate-200 shadow-lg overflow-hidden z-20">
            {items.map((it, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onClose();
                  it.onClick?.();
                }}
                className={cx(
                  "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 transition",
                  it.tone === "danger" ? "text-rose-700" : "text-slate-800"
                )}
              >
                {it.icon ? <it.icon className="h-4 w-4" /> : null}
                <span className="font-semibold">{it.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
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

export default function Users() {
  const page = usePage();

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
    meta: { current_page: 1, last_page: 1, from: 1, to: 7, total: 7 },
  };

  const rawUsers =
    page.props?.users ?? (import.meta.env.DEV ? SAMPLE_USERS : { data: [], meta: null });

  const { data: rows, meta } = normalizePaginator(rawUsers);

  const filters = page.props?.filters || {};
  const [q, setQ] = useState(filters.q ?? "");
  const [status, setStatus] = useState(filters.status ?? "all");
  const [role, setRole] = useState(filters.role ?? "all");

  const [sortKey, setSortKey] = useState(filters.sort ?? "name");
  const [sortDir, setSortDir] = useState(filters.dir ?? "asc");

  const [per, setPer] = useState(Number(filters.per ?? 10) || 10);

  const loading = Boolean(page.props?.loading);

  const roleOptions = useMemo(() => {
    const set = new Set();
    rows.forEach((u) => {
      if (u?.role) set.add(String(u.role));
    });

    const list = Array.from(set).sort();
    return [{ value: "all", label: "All roles" }, ...list.map((r) => ({ value: r, label: titleCase(r) }))];
  }, [rows]);

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "All status" },
      { value: "active", label: "Active" },
      { value: "disabled", label: "Disabled" },
    ],
    []
  );

  const sort = useMemo(() => ({ key: sortKey, dir: sortDir }), [sortKey, sortDir]);

  const pushQuery = (patch = {}) => {
    const next = {
      q,
      status,
      role,
      sort: sortKey,
      dir: sortDir,
      per,
      page: filters.page ?? 1,
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
    const isSame = sortKey === key;
    const nextDir = isSame ? (sortDir === "asc" ? "desc" : "asc") : "asc";
    setSortKey(key);
    setSortDir(nextDir);
    pushQuery({ sort: key, dir: nextDir, page: 1 });
  };

  const handlePerPage = (n) => {
    const next = Number(n) || per;
    setPer(next);
    pushQuery({ per: next, page: 1 });
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

  const fillerRows = useMemo(() => {
    return Array.from({ length: per || 10 }).map((_, i) => ({
      id: `__filler__${i}`,
      __filler: true,
    }));
  }, [per]);

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
            <div className="text-sm font-semibold text-slate-800">{u?.employee?.employee_no || "Not linked"}</div>
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
        render: (u) =>
          u?.__filler ? <SkeletonPill w="w-24" /> : <StatusPill active={Boolean(u?.is_active)} />,
      },
      {
        key: "last_login_at",
        label: "Last login",
        sortable: true,
        nowrap: true,
        render: (u) =>
          u?.__filler ? <SkeletonLine w="w-20" /> : <span className="text-sm text-slate-700">{u?.last_login_at || "Never"}</span>,
      },
    ],
    []
  );

  const [menuUserId, setMenuUserId] = useState(null);
  const openMenu = (id) => setMenuUserId(id);
  const closeMenu = () => setMenuUserId(null);

  const toggleActive = (u) => {
    if (!u?.id) return;

    if (u?.is_active) {
      router.post(`/dashboard/admin/users/${u.id}/disable`, {}, { preserveScroll: true });
      return;
    }

    router.post(`/dashboard/admin/users/${u.id}/enable`, {}, { preserveScroll: true });
  };

  return (
    <Layout title="Users">
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
            { key: "status", value: status, onChange: handleStatus, options: statusOptions },
            { key: "role", value: role, onChange: handleRole, options: roleOptions },
          ]}
          rightSlot={
            <Link
              href="/dashboard/admin/roles"
              className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
                <div className="h-9 w-9 rounded-xl bg-slate-200/80 animate-pulse" />
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <ActionButton
                  icon={Eye}
                  href={`/dashboard/admin/users/${u.id}`}
                  title="View user"
                >
                  View
                </ActionButton>

                <ActionButton
                  icon={Pencil}
                  href={`/dashboard/admin/users/${u.id}/edit`}
                  title="Edit user"
                >
                  Edit
                </ActionButton>

                <MoreMenu
                  open={menuUserId === u.id}
                  onToggle={() => (menuUserId === u.id ? closeMenu() : openMenu(u.id))}
                  onClose={closeMenu}
                  items={[
                    {
                      label: u?.is_active ? "Disable user" : "Enable user",
                      icon: u?.is_active ? Ban : CheckCircle2,
                      tone: u?.is_active ? "danger" : "neutral",
                      onClick: () => toggleActive(u),
                    },
                  ]}
                />
              </div>
            )
          }
        />

        <DataTablePagination
          meta={meta}
          perPage={per}
          onPerPage={handlePerPage}
          onPrev={handlePrev}
          onNext={handleNext}
          disablePrev={!meta || (meta.current_page || 1) <= 1}
          disableNext={!meta || (meta.current_page || 1) >= (meta.last_page || 1)}
        />
      </div>
    </Layout>
  );
}
