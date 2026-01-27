import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";

import { UserPlus, MoreVertical, Link2, Pencil } from "lucide-react";
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

/* ---------- Pills ---------- */

function StatusPill({ status }) {
  const map = {
    active: "bg-teal-600/10 text-teal-900 ring-teal-700/10",
    inactive: "bg-slate-100 text-slate-700 ring-slate-200",
    resigned: "bg-amber-500/10 text-amber-900 ring-amber-700/10",
    terminated: "bg-rose-500/10 text-rose-900 ring-rose-700/10",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        map[status] || map.inactive
      )}
    >
      {titleCase(status)}
    </span>
  );
}

/* ---------- Layout ---------- */

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

/* ---------- Page ---------- */

export default function Employees() {
  const page = usePage();

  /* DEV SAMPLE DATA */
  const SAMPLE_EMPLOYEES = {
    data: [
      {
        id: 1,
        employee_no: "EMP-0001",
        first_name: "Maria",
        last_name: "Santos",
        position: "Owner / Admin",
        status: "active",
        user: { email: "admin@pietylpg.com", role: "admin" },
      },
      {
        id: 2,
        employee_no: "EMP-0003",
        first_name: "Juan",
        last_name: "Dela Cruz",
        position: "Cashier",
        status: "active",
        user: { email: "cashier1@pietylpg.com", role: "cashier" },
      },
      {
        id: 3,
        employee_no: "EMP-0006",
        first_name: "Carlos",
        last_name: "Mendoza",
        position: "Cashier",
        status: "resigned",
        user: null,
      },
    ],
    meta: { current_page: 1, last_page: 1, total: 3 },
  };

  const employees =
    page.props?.employees ??
    (import.meta.env.DEV ? SAMPLE_EMPLOYEES : { data: [], meta: null });

  const rows = employees.data || [];
  const meta = employees.meta || null;

  const query = page.props?.filters || {};
  const per = Number(query?.per || 10);

  const [q, setQ] = useState(query?.q || "");
  const [status, setStatus] = useState(query?.status || "all");

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "resigned", label: "Resigned" },
    { value: "terminated", label: "Terminated" },
  ];

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/admin/employees",
      { q, status, per, ...patch },
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

  /* ---------- Columns ---------- */

  const columns = useMemo(
    () => [
      {
        key: "employee",
        label: "Employee",
        render: (e) =>
          e?.__filler ? (
            <SkeletonLine w="w-40" />
          ) : (
            <div>
              <div className="font-extrabold text-slate-900">
                {e.first_name} {e.last_name}
              </div>
              <div className="text-xs text-slate-500">{e.employee_no}</div>
            </div>
          ),
      },
      {
        key: "position",
        label: "Position",
        render: (e) =>
          e?.__filler ? <SkeletonLine w="w-28" /> : <span className="text-sm">{e.position}</span>,
      },
      {
        key: "status",
        label: "Status",
        render: (e) =>
          e?.__filler ? <SkeletonPill w="w-20" /> : <StatusPill status={e.status} />,
      },
      {
        key: "account",
        label: "Account",
        render: (e) =>
          e?.__filler ? (
            <SkeletonLine w="w-32" />
          ) : e.user ? (
            <span className="text-sm text-slate-700">{e.user.email}</span>
          ) : (
            <span className="text-xs text-slate-400">Not linked</span>
          ),
      },
    ],
    []
  );

  return (
    <Layout title="Employees">
      <div className="grid gap-6">
        <TopCard
          title="Employee Directory"
          subtitle="Maintain staff records and employment status."
          right={
            <Link
              href="/dashboard/admin/employees/create"
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:ring-4 focus:ring-teal-500/25"
            >
              <UserPlus className="h-4 w-4" />
              Add Employee
            </Link>
          }
        />

        <DataTableFilters
          q={q}
          onQ={(v) => {
            setQ(v);
            pushQuery({ q: v, page: 1 });
          }}
          placeholder="Search name or employee no..."
          filters={[
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
          emptyTitle="No employees found"
          emptyHint="Add employees or adjust filters."
          renderActions={(e) =>
            e?.__filler ? (
              <SkeletonButton w="w-20" />
            ) : (
              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/dashboard/admin/employees/${e.id}/edit`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 focus:ring-2 focus:ring-teal-500/20"
                >
                  <Pencil className="h-4 w-4 text-slate-600" />
                  Edit
                </Link>

                {!e.user && (
                  <Link
                    href={`/dashboard/admin/users/create?employee=${e.id}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200 hover:bg-slate-50 focus:ring-2 focus:ring-teal-500/20"
                    title="Link user account"
                  >
                    <Link2 className="h-4 w-4 text-slate-600" />
                  </Link>
                )}

                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200 hover:bg-slate-50 focus:ring-2 focus:ring-teal-500/20"
                >
                  <MoreVertical className="h-4 w-4 text-slate-600" />
                </button>
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
      </div>
    </Layout>
  );
}