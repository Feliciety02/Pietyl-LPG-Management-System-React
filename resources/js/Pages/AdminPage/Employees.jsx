import React, { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";

import { UserPlus, Pencil, Link2, Unlink } from "lucide-react";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

import { TableActionButton } from "@/components/Table/ActionTableButton";

import CreateEmployeeModal from "@/components/modals/EmployeeModals/CreateEmployeeModal";
import EditEmployeeModal from "@/components/modals/EmployeeModals/EditEmployeeModal";
import LinkEmployeeUserModal from "@/components/modals/EmployeeModals/LinkEmployeeUserModal";
import ConfirmActionModal from "@/components/modals/EmployeeModals/ConfirmActionModal";

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
  const nextEmployeeNo = page.props?.next_employee_no || "";

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

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkError, setLinkError] = useState("");

  const [confirm, setConfirm] = useState({
    open: false,
    employee: null,
  });

  const [activeEmployee, setActiveEmployee] = useState(null);

  const openEdit = (e) => {
    setActiveEmployee(e);
    setEditOpen(true);
  };

  const openLink = (e) => {
    setActiveEmployee(e);
    setLinkError("");
    setLinkOpen(true);
  };

  const openConfirmUnlink = (e) => {
    setConfirm({ open: true, employee: e });
  };

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
        router.reload({ only: ["employees"] });
      },
    });
  };

  const updateEmployee = (id, payload) => {
    if (!id || submitting) return;
    setSubmitting(true);

    router.put(`/dashboard/admin/employees/${id}`, payload, {
      preserveScroll: true,
      onFinish: () => setSubmitting(false),
      onSuccess: () => {
        setEditOpen(false);
        setActiveEmployee(null);
        router.reload({ only: ["employees"] });
      },
    });
  };

  const linkUser = (id, payload) => {
    if (!id || submitting) return;
    setSubmitting(true);
    setLinkError("");

    router.post(`/dashboard/admin/employees/${id}/link-user`, payload, {
      preserveScroll: true,
      onFinish: () => setSubmitting(false),
      onSuccess: () => {
        setLinkOpen(false);
        setActiveEmployee(null);
        setLinkError("");
        router.reload({ only: ["employees"] });
      },
      onError: (errors) => {
        setLinkError(errors?.email || errors?.role || "Failed to link user.");
      },
    });
  };

  const unlinkUser = (id) => {
    if (!id || submitting) return;
    setSubmitting(true);

    router.delete(`/dashboard/admin/employees/${id}/unlink-user`, {
      preserveScroll: true,
      onFinish: () => setSubmitting(false),
      onSuccess: () => {
        setConfirm({ open: false, employee: null });
        setActiveEmployee(null);
        router.reload({ only: ["employees"] });
      },
    });
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
          e?.__filler ? (
            <SkeletonLine w="w-28" />
          ) : (
            <span className="text-sm text-slate-700">{e.position}</span>
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
                <SkeletonButton w="w-24" />
                <SkeletonButton w="w-24" />
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <TableActionButton
                  icon={Pencil}
                  onClick={() => openEdit(e)}
                  title="Edit employee"
                >
                  Edit
                </TableActionButton>

                {!e.user ? (
                  <TableActionButton
                    icon={Link2}
                    onClick={() => openLink(e)}
                    title="Link account"
                  >
                    Link
                  </TableActionButton>
                ) : (
                  <TableActionButton
                    icon={Unlink}
                    onClick={() => openConfirmUnlink(e)}
                    title="Unlink account"
                  >
                    Unlink
                  </TableActionButton>
                )}
              </div>
            )
          }
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

      <CreateEmployeeModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setActiveEmployee(null);
        }}
        onSubmit={createEmployee}
        loading={submitting}
        nextEmployeeNo={nextEmployeeNo}
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

      <LinkEmployeeUserModal
        open={linkOpen}
        onClose={() => {
          setLinkOpen(false);
          setActiveEmployee(null);
        }}
        employee={activeEmployee}
        onSubmit={(payload) => linkUser(activeEmployee?.id, payload)}
        loading={submitting}
        serverError={linkError}
      />

      <ConfirmActionModal
        open={confirm.open}
        onClose={() => setConfirm({ open: false, employee: null })}
        title="Unlink account"
        message="This will detach the user account from this employee. The employee record will remain."
        confirmLabel="Unlink"
        tone="rose"
        loading={submitting}
        onConfirm={() => unlinkUser(confirm.employee?.id)}
      />
    </Layout>
  );
}
