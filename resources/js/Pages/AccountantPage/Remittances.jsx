import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";

import { ShieldCheck, Pencil, FileText } from "lucide-react";

import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";
import { TableActionButton } from "@/components/Table/ActionTableButton";

import RecordTurnoverModal from "@/components/modals/AccountantModals/RecordTurnoverModal";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function money(v) {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });
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
  const s = String(status || "pending").toLowerCase();

  const map = {
    pending: "bg-amber-600/10 text-amber-900 ring-amber-700/10",
    verified: "bg-teal-600/10 text-teal-900 ring-teal-700/10",
    flagged: "bg-rose-600/10 text-rose-900 ring-rose-700/10",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        map[s] || map.pending
      )}
    >
      {titleCase(s)}
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

export default function Remittances() {
  const page = usePage();

  const sampleRows = useMemo(
    () => [
      {
        id: 1,
        remitter_role: "cashier",
        cashier_name: "Maria Santos",
        business_date: "2026-01-19",
        expected_amount: 5200,
        remitted_amount: 5200,
        variance_amount: 0,
        status: "verified",
        note: null,
        updated_at: "2026-01-19 18:45",
      },
      {
        id: 2,
        remitter_role: "cashier",
        cashier_name: "Maria Santos",
        business_date: "2026-01-20",
        expected_amount: 4100,
        remitted_amount: 3900,
        variance_amount: -200,
        status: "flagged",
        note: "Short by ₱200, recount needed",
        updated_at: "2026-01-20 18:52",
      },
      {
        id: 3,
        remitter_role: "cashier",
        cashier_name: "Juan Dela Cruz",
        business_date: "2026-01-20",
        expected_amount: 2800,
        remitted_amount: null,
        variance_amount: null,
        status: "pending",
        note: null,
        updated_at: "—",
      },
    ],
    []
  );

  const remittances = page.props?.remittances || { data: [], meta: null };
  const rows = remittances?.data || [];
  const meta = remittances?.meta || null;

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const statusInitial = query?.status || "all";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [status, setStatus] = useState(statusInitial);

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "pending", label: "Pending" },
    { value: "verified", label: "Verified" },
    { value: "flagged", label: "Flagged" },
  ];

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/accountant/remittances",
      { q, status, per: perInitial, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const loading = Boolean(page.props?.loading);

  const fillerRows = useMemo(
    () =>
      Array.from({ length: perInitial }).map((_, i) => ({
        id: `__filler__${i}`,
        __filler: true,
      })),
    [perInitial]
  );

  const effectiveRows = rows.length ? rows : sampleRows;
  const tableRows = loading ? fillerRows : effectiveRows;

  const [recordOpen, setRecordOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const openRecord = (r) => {
    setActiveRow(r);
    setRecordOpen(true);
  };

  const closeRecord = () => {
    setRecordOpen(false);
    setActiveRow(null);
  };

  const submitTurnover = (payload) => {
    if (!activeRow?.id || submitting) return;
    setSubmitting(true);

    router.post(`/dashboard/accountant/remittances/${activeRow.id}/record`, payload, {
      preserveScroll: true,
      onFinish: () => setSubmitting(false),
      onSuccess: () => {
        closeRecord();
        router.reload({ only: ["remittances"] });
      },
    });
  };

  const columns = useMemo(
    () => [
      {
        key: "business_date",
        label: "Date",
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-24" />
          ) : (
            <div className="text-sm font-semibold text-slate-900">{r?.business_date || "—"}</div>
          ),
      },
      {
        key: "cashier",
        label: "Cashier",
        render: (r) =>
          r?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-40" />
              <SkeletonLine w="w-24" />
            </div>
          ) : (
            <div>
              <div className="text-sm font-extrabold text-slate-900">{r?.cashier_name || "—"}</div>
              <div className="mt-1 text-xs text-slate-600">Cashier turnover</div>
            </div>
          ),
      },
      {
        key: "expected_amount",
        label: "Expected",
        render: (r) => (r?.__filler ? <SkeletonLine w="w-20" /> : money(r?.expected_amount)),
      },
      {
        key: "remitted_amount",
        label: "Turned over",
        render: (r) => (r?.__filler ? <SkeletonLine w="w-20" /> : money(r?.remitted_amount)),
      },
      {
        key: "variance_amount",
        label: "Variance",
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-20" />
          ) : (
            <span
              className={cx(
                "text-sm font-extrabold",
                Number(r?.variance_amount || 0) === 0
                  ? "text-slate-700"
                  : Number(r?.variance_amount || 0) < 0
                  ? "text-rose-700"
                  : "text-amber-800"
              )}
            >
              {money(r?.variance_amount || 0)}
            </span>
          ),
      },
      {
        key: "status",
        label: "Status",
        render: (r) => (r?.__filler ? <SkeletonPill w="w-24" /> : <StatusPill status={r?.status} />),
      },
      {
        key: "updated_at",
        label: "Updated",
        render: (r) => (r?.__filler ? <SkeletonLine w="w-20" /> : r?.updated_at || "—"),
      },
    ],
    []
  );

  const hasAnyRecord = (r) => {
    if (!r) return false;
    return !(r.remitted_amount === null || r.remitted_amount === undefined || r.remitted_amount === "");
  };

  const hasNote = (r) => String(r?.note || "").trim().length > 0;

  return (
    <Layout title="Turnover">
      <div className="grid gap-6">
        <TopCard
          title="Cashier Turnover"
          subtitle="Record the cash turned over by cashiers and verify against expected."
          right={
            <Link
              href="/dashboard/admin/audit"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:ring-4 focus:ring-teal-500/15"
            >
              <ShieldCheck className="h-4 w-4 text-teal-700" />
              View audit logs
            </Link>
          }
        />

        <DataTableFilters
          q={q}
          onQ={(value) => {
            setQ(value);
            pushQuery({ q: value, page: 1 });
          }}
          placeholder="Search cashier name..."
          filters={[
            {
              key: "status",
              value: status,
              onChange: (value) => {
                setStatus(value);
                pushQuery({ status: value, page: 1 });
              },
              options: statusOptions,
            },
          ]}
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          emptyTitle="No turnover found"
          emptyHint="Turnover appears here per business date per cashier."
          renderActions={(r) =>
            r?.__filler ? (
              <div className="flex items-center justify-end gap-2">
                <SkeletonButton w="w-20" />
                <SkeletonButton w="w-20" />
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <TableActionButton icon={Pencil} onClick={() => openRecord(r)} title="Edit turnover">
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
          onPrev={() => meta?.current_page > 1 && pushQuery({ page: meta.current_page - 1 })}
          onNext={() => meta?.current_page < meta?.last_page && pushQuery({ page: meta.current_page + 1 })}
          disablePrev={!meta || meta.current_page <= 1}
          disableNext={!meta || meta.current_page >= meta.last_page}
        />
      </div>

      <RecordTurnoverModal
        open={recordOpen}
        onClose={closeRecord}
        row={activeRow}
        loading={submitting}
        onSubmit={submitTurnover}
      />
    </Layout>
  );
}
