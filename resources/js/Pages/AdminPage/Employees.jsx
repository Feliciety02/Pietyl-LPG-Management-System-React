import React, { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";

import { UserPlus, Pencil } from "lucide-react";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

import { TableActionButton } from "@/components/Table/ActionTableButton";

import CreateEmployeeModal from "@/components/modals/EmployeeModals/CreateEmployeeModal";
import EditEmployeeModal from "@/components/modals/EmployeeModals/EditEmployeeModal";

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

export default function Employees() {
  const page = usePage();

  const SAMPLE_EMPLOYEES = {
    data: [
      {
        id: 1,
        employee_no: "EMP-0001",
        position: "Owner / Admin",
        status: "active",
        user: { id: 1, name: "Admin User", email: "admin@pietylpg.com" },
      },
      {
        id: 2,
        employee_no: "EMP-0003",
        position: "Cashier",
        status: "active",
        user: { id: 2, name: "Cashier One", email: "cashier1@pietylpg.com" },
      },
    ],
    meta: { current_page: 1, last_page: 1, total: 2, from: 1, to: 2 },
  };

  const SAMPLE_ELIGIBLE_USERS = [
    { id: 10, name: "New User", email: "new@pietylpg.com" },
    { id: 11, name: "Another User", email: "another@pietylpg.com" },
  ];

  const rawEmployees =
    page.props?.employees ??
    (import.meta.env.DEV ? SAMPLE_EMPLOYEES : { data: [], meta: null });

  const eligibleUsers =
    page.props?.eligible_users ?? (import.meta.env.DEV ? SAMPLE_ELIGIBLE_USERS : []);

  const { data: rows, meta } = normalizePaginator(rawEmployees);

  const nextEmployeeNo = page.props?.next_employee_no || "";

  const filters = page.props?.filters || {};
  const qInitial = filters?.q || "";
  const statusInitial = filters?.status || "all";
  const perInitial = Number(filters?.per || 10) || 10;

  const [q, setQ] = useState(qInitial);
  const [status, setStatus] = useState(statusInitial);

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "resigned", label: "Resigned" },
    { value: "terminated", label: "Terminated" },
  ];

  const loading = Boolean(page.props?.loading);

  const pushQuery = (patch = {}) => {
    router.get(
      "/dashboard/admin/employees",
      { q, status, per: perInitial, ...patch },
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

  const fillerRows = useMemo(() => {
    return Array.from({ length: perInitial }).map((_, i) => ({
      id: `__filler__${i}`,
      __filler: true,
    }));
  }, [perInitial]);

  const tableRows = loading ? fillerRows : rows;

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeEmployee, setActiveEmployee] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  const createEmployee = (payload) => {
    if (submitting) return;
    setSubmitting(true);

    router.post("/dashboard/admin/employees", payload, {
      preserveScroll: true,
      onFinish: () => setSubmitting(false),
      onSuccess: () => {
        setCreateOpen(false);
        setActiveEmployee(null);
      },
    });
  };

  const updateEmployee = (id, payload) => {
    if (!id || submitting) return Promise.resolve(false);
    setSubmitting(true);

    return new Promise((resolve) => {
      router.put(`/dashboard/admin/employees/${id}`, payload, {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          setEditOpen(false);
          setActiveEmployee(null);
          resolve(true);
        },
        onError: () => resolve(false),
        onFinish: () => setSubmitting(false),
      });
    });
  };

  const openEdit = (e) => {
    if (!e || e.__filler) return;
    setActiveEmployee(e);
    setEditOpen(true);
  };

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
                {e.user?.name || "Unassigned"}
              </div>
              <div className="text-xs text-slate-500">{e.employee_no}</div>
            </div>
          ),
      },
      {
        key: "position",
        label: "Position",
        render: (e) =>
          e?.__filler ? (
            <SkeletonLine w="w-28" />
          ) : (
            <span className="text-sm text-slate-700">{e.position || "—"}</span>
          ),
      },
      {
        key: "status",
        label: "Status",
        render: (e) =>
          e?.__filler ? <SkeletonPill w="w-20" /> : <StatusPill status={e.status} />,
      },
      {
        key: "account",
        label: "Account Email",
        render: (e) =>
          e?.__filler ? (
            <SkeletonLine w="w-40" />
          ) : e.user?.email ? (
            <span className="text-sm text-slate-700">{e.user.email}</span>
          ) : (
            <span className="text-xs text-slate-400">No account</span>
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
          subtitle="Assign users to employee records and manage roles through employee workflows."
          right={
            <button
              type="button"
              onClick={() => {
                setActiveEmployee(null);
                setCreateOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:ring-4 focus:ring-teal-500/25"
            >
              <UserPlus className="h-4 w-4" />
              Add Employee
            </button>
          }
        />

        <DataTableFilters
          q={q}
          onQ={setQ}
          onQDebounced={(v) => pushQuery({ q: v, page: 1 })}
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
          searchQuery={q}
          emptyTitle="No employees found"
          emptyHint="Add employees or adjust filters."
          renderActions={(e) =>
            e?.__filler ? (
              <div className="flex items-center justify-end gap-2">
                <SkeletonButton w="w-20" />
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <TableActionButton icon={Pencil} onClick={() => openEdit(e)} title="Edit employee">
                  Edit
                </TableActionButton>
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
      </div>

      <CreateEmployeeModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setActiveEmployee(null);
        }}
        onSubmit={createEmployee}
        loading={submitting}
        nextEmployeeNo={nextEmployeeNo}
        eligibleUsers={eligibleUsers}
      />

      <EditEmployeeModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setActiveEmployee(null);
        }}
        employee={activeEmployee}
        onSubmit={(payload) => updateEmployee(activeEmployee?.id, payload)}
        loading={submitting}
      />
    </Layout>
  );
}
