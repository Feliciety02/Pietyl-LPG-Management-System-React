import React, { useEffect, useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { TableActionButton } from "@/components/Table/ActionTableButton";
import ConfirmActionModal from "@/components/modals/InventoryModals/ConfirmActionModal";

import { CheckCircle2, XCircle } from "lucide-react";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function normalizeStatus(status) {
  return String(status || "").toLowerCase().replace(/\s+/g, "_");
}

function StatusPill({ status }) {
  const s = normalizeStatus(status);

  const tone =
    s === "approved"
      ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
      : s === "pending"
      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
      : s === "rejected"
      ? "bg-rose-600/10 text-rose-900 ring-rose-700/10"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  const label = s ? s.toUpperCase() : "PENDING";

  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1", tone)}>
      {label}
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

export default function StockRequests() {
  const page = usePage();

  const requests = page.props?.stock_requests ?? { data: [], meta: null };
  const rows = requests?.data || [];
  const meta = requests?.meta || null;

  const [localRows, setLocalRows] = useState(rows);

  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const statusInitial = query?.status || "all";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [status, setStatus] = useState(statusInitial);

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/admin/stock-requests",
      { q, status, per: perInitial, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const handleStatus = (v) => {
    setStatus(v);
    pushQuery({ status: v, page: 1 });
  };

  const handlePerPage = (n) => pushQuery({ per: n, page: 1 });
  const handlePrev = () => meta && meta.current_page > 1 && pushQuery({ page: meta.current_page - 1 });
  const handleNext = () => meta && meta.current_page < meta.last_page && pushQuery({ page: meta.current_page + 1 });

  const loading = Boolean(page.props?.loading);

  const fillerRows = useMemo(() => {
    return Array.from({ length: perInitial }).map((_, i) => ({
      id: `__filler__${i}`,
      __filler: true,
    }));
  }, [perInitial]);

  const tableRows = loading ? fillerRows : localRows;

  const columns = useMemo(
    () => [
      {
        key: "request",
        label: "Request",
        render: (x) =>
          x?.__filler ? <SkeletonLine w="w-28" /> : <div className="font-extrabold text-slate-900">{x.request_number}</div>,
      },
      {
        key: "item",
        label: "Item",
        render: (x) =>
          x?.__filler ? (
            <SkeletonLine w="w-40" />
          ) : (
            <div className="text-sm text-slate-800">
              {x.primary_item?.product_name || "—"}{" "}
              <span className="text-slate-500">({x.primary_item?.variant || "—"})</span>
              {x.items_count > 1 ? (
                <span className="ml-2 text-xs font-semibold text-slate-500">+{x.items_count - 1} more</span>
              ) : null}
            </div>
          ),
      },
      {
        key: "qty",
        label: "Requested",
        render: (x) =>
          x?.__filler ? (
            <SkeletonLine w="w-12" />
          ) : (
            <span className="text-sm font-extrabold text-slate-900">
              {x.primary_item?.requested_qty ?? "—"}
            </span>
          ),
      },
      {
        key: "by",
        label: "Requested by",
        render: (x) =>
          x?.__filler ? <SkeletonLine w="w-28" /> : <span className="text-sm text-slate-700">{x.requested_by_name}</span>,
      },
      {
        key: "status",
        label: "Status",
        render: (x) => (x?.__filler ? <SkeletonPill w="w-24" /> : <StatusPill status={x.status} />),
      },
      {
        key: "date",
        label: "Date",
        render: (x) => (x?.__filler ? <SkeletonLine w="w-28" /> : <span className="text-sm text-slate-700">{x.created_at}</span>),
      },
    ],
    []
  );

  const [confirm, setConfirm] = useState({
    open: false,
    tone: "teal",
    title: "",
    message: "",
    showNote: false,
    onConfirm: null,
  });
  const [rejectNote, setRejectNote] = useState("");

  const approveRequest = (row) => {
    setConfirm({
      open: true,
      tone: "teal",
      title: "Approve request",
      message: `Approve stock request ${row.request_number}?`,
      showNote: false,
      note: "",
      onConfirm: () => {
        setConfirm((p) => ({ ...p, open: false }));
        router.post(`/dashboard/admin/purchase-requests/${row.id}/approve`, {}, {
          preserveScroll: true,
          onSuccess: () =>
            setLocalRows((prev) =>
              prev.map((r) => (r.id === row.id ? { ...r, status: "approved" } : r))
            ),
        });
      },
    });
  };

  const rejectRequest = (row) => {
    setRejectNote("");
    setConfirm({
      open: true,
      tone: "rose",
      title: "Reject request",
      message: `Reject stock request ${row.request_number}?`,
      showNote: true,
      onConfirm: () => {
        const reason = rejectNote.trim() || null;
        setConfirm((p) => ({ ...p, open: false }));
        router.post(
          `/dashboard/admin/purchase-requests/${row.id}/reject`,
          { reason },
          {
            preserveScroll: true,
            onSuccess: () =>
              setLocalRows((prev) =>
                prev.map((r) =>
                  r.id === row.id ? { ...r, status: "rejected", rejection_reason: reason } : r
                )
              ),
          }
        );
      },
    });
  };

  return (
    <Layout title="Stock Requests">
      <div className="grid gap-6">
        <TopCard
          title="Stock requests"
          subtitle="Review inventory manager requests and approve or reject."
        />

        <DataTableFilters
          q={q}
          onQ={setQ}
          onQDebounced={(v) => pushQuery({ q: v, page: 1 })}
          placeholder="Search request number, requester..."
          filters={[
            {
              key: "status",
              value: status,
              onChange: handleStatus,
              options: statusOptions,
            },
          ]}
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          searchQuery={q}
          emptyTitle="No stock requests"
          emptyHint="Requests will show here when inventory submits them."
          renderActions={(x) =>
            x?.__filler ? (
              <SkeletonButton w="w-28" />
            ) : normalizeStatus(x.status) === "pending" ? (
              <div className="flex items-center justify-end gap-2">
                <TableActionButton
                  tone="primary"
                  icon={CheckCircle2}
                  title="Approve request"
                  onClick={() => approveRequest(x)}
                >
                  Approve
                </TableActionButton>

                <TableActionButton
                  tone="danger"
                  icon={XCircle}
                  title="Reject request"
                  onClick={() => rejectRequest(x)}
                >
                  Reject
                </TableActionButton>
              </div>
            ) : null
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

        <ConfirmActionModal
          open={confirm.open}
          onClose={() => setConfirm((p) => ({ ...p, open: false }))}
          title={confirm.title}
          message={confirm.message}
          tone={confirm.tone}
          confirmLabel={confirm.tone === "rose" ? "Reject" : "Approve"}
          onConfirm={confirm.onConfirm || (() => {})}
          showNote={confirm.showNote}
          note={rejectNote}
          onNote={setRejectNote}
          notePlaceholder="Optional rejection reason..."
        />
      </div>
    </Layout>
  );
}
