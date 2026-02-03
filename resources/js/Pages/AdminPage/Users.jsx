import React, { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { UserPlus, RefreshCw } from "lucide-react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { SkeletonLine, SkeletonButton } from "@/components/ui/Skeleton";

import { TableActionButton } from "@/components/Table/ActionTableButton";

import CreateUserModal from "@/components/modals/AdminModals/CreateUserModal";
import ResetPasswordConfirmModal from "@/components/modals/AdminModals/ResetPasswordConfirmModal";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
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

function niceText(v) {
  if (v == null) return "—";
  const s = String(v).trim();
  return s ? s : "—";
}

function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return niceText(v);
  return d.toLocaleString();
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
      {
        id: 1,
        name: "Admin User",
        email: "admin@pietylpg.com",
        created_at: "2026-02-01T10:22:00Z",
      },
      {
        id: 2,
        name: "Cashier One",
        email: "cashier1@pietylpg.com",
        created_at: "2026-02-02T08:12:00Z",
      },
    ],
    meta: { current_page: 1, last_page: 1, total: 2, from: 1, to: 2 },
  };

  const rawUsers =
    page.props?.users ??
    (import.meta.env.DEV ? SAMPLE_USERS : { data: [], meta: null });

  const { data: rows, meta } = normalizePaginator(rawUsers);

  const filters = page.props?.filters || {};
  const qInitial = filters?.q || "";
  const perInitial = Number(filters?.per || 10) || 10;

  const [q, setQ] = useState(qInitial);

  const pushQuery = (patch = {}) => {
    router.get(
      "/dashboard/admin/users",
      { q, per: perInitial, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const handlePrev = () => {
    if (!meta || (meta.current_page || 1) <= 1) return;
    pushQuery({ page: (meta.current_page || 1) - 1 });
  };

  const handleNext = () => {
    if (!meta || (meta.current_page || 1) >= (meta.last_page || 1)) return;
    pushQuery({ page: (meta.current_page || 1) + 1 });
  };

  const loading = Boolean(page.props?.loading);

  const fillerRows = useMemo(() => {
    return Array.from({ length: perInitial }).map((_, i) => ({
      id: `__filler__${i}`,
      __filler: true,
    }));
  }, [perInitial]);

  const tableRows = loading ? fillerRows : rows;

  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  const [reset, setReset] = useState({ open: false, user: null });
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState("");

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
      },
      onError: (errors) => {
        setCreateError(errors?.email || errors?.name || "Failed to create user.");
      },
    });
  };

  const openReset = (user) => {
    if (!user || user.__filler) return;
    setReset({ open: true, user });
    setResetSuccess(false);
    setResetError("");
  };

  const doResetPassword = (userId) => {
    if (!userId || submitting) return;
    setSubmitting(true);
    setResetError("");
    setResetSuccess(false);

    router.post(`/dashboard/admin/users/${userId}/reset-password`, {}, {
      preserveScroll: true,
      onFinish: () => setSubmitting(false),
      onSuccess: () => {
        setResetSuccess(true);
      },
      onError: (errors) => {
        setResetError(errors?.message || "Failed to reset password.");
      },
    });
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        render: (u) =>
          u?.__filler ? (
            <SkeletonLine w="w-40" />
          ) : (
            <div className="font-extrabold text-slate-900">{niceText(u.name)}</div>
          ),
      },
      {
        key: "email",
        label: "Email",
        render: (u) =>
          u?.__filler ? (
            <SkeletonLine w="w-48" />
          ) : (
            <div className="text-sm text-slate-700">{niceText(u.email)}</div>
          ),
      },
      {
        key: "created_at",
        label: "Created",
        render: (u) =>
          u?.__filler ? (
            <SkeletonLine w="w-28" />
          ) : (
            <div className="text-sm text-slate-600">{formatDate(u.created_at)}</div>
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
          onQ={setQ}
          onQDebounced={(v) => pushQuery({ q: v, page: 1 })}
          placeholder="Search name or email..."
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          searchQuery={q}
          emptyTitle="No users found"
          emptyHint="Add a user or adjust filters."
          renderActions={(u) =>
            u?.__filler ? (
              <div className="flex items-center justify-end gap-2">
                <SkeletonButton w="w-28" />
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <TableActionButton
                  icon={RefreshCw}
                  onClick={() => openReset(u)}
                  title="Reset password"
                >
                  Reset Password
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

      <CreateUserModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateError("");
        }}
        onSubmit={createUser}
        loading={submitting}
        serverError={createError}
      />

      <ResetPasswordConfirmModal
        open={reset.open}
        user={reset.user}
        loading={submitting}
        success={resetSuccess}
        error={resetError}
        onClose={() => setReset({ open: false, user: null })}
        onConfirm={() => doResetPassword(reset.user?.id)}
      />
    </Layout>
  );
}
