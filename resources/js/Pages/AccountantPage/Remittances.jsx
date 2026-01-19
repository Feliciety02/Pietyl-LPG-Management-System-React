
import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import {
  ShieldCheck,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  SkeletonLine,
  SkeletonPill,
  SkeletonButton,
} from "@/components/ui/Skeleton";

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
    pending: {
      label: "PENDING",
      cls: "bg-amber-600/10 text-amber-900 ring-amber-700/10",
      Icon: Clock,
    },
    verified: {
      label: "VERIFIED",
      cls: "bg-teal-600/10 text-teal-900 ring-teal-700/10",
      Icon: CheckCircle2,
    },
    flagged: {
      label: "FLAGGED",
      cls: "bg-rose-600/10 text-rose-900 ring-rose-700/10",
      Icon: AlertTriangle,
    },
  };

  const m = map[s] || map.pending;
  const Icon = m.Icon;

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        m.cls
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {m.label}
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

  /*
    Expected Inertia props from backend:
    remittances: {
      data: [{
        id,
        remitter_role,        string  (cashier|rider)
        remitter_name,        string
        business_date,        string  (YYYY-MM-DD)
        expected_amount,      number
        remitted_amount,      number
        variance_amount,      number
        status,               string  (pending|verified|flagged)
        note,                 string|null
        updated_at,           string|null
      }],
      meta,
      links
    }
    filters: { q, status, role, from, to, page, per }
    loading: boolean (optional)
  */

    const sampleRows = useMemo(
  () => [
    {
      id: 1,
      remitter_role: "cashier",
      remitter_name: "Maria Santos",
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
      remitter_role: "rider",
      remitter_name: "Juan Dela Cruz",
      business_date: "2026-01-19",
      expected_amount: 2000,
      remitted_amount: 1800,
      variance_amount: -200,
      status: "flagged",
      note: "Short by ₱200, customer delay",
      updated_at: "2026-01-19 19:10",
    },
    {
      id: 3,
      remitter_role: "cashier",
      remitter_name: "Maria Santos",
      business_date: "2026-01-18",
      expected_amount: 4300,
      remitted_amount: 4300,
      variance_amount: 0,
      status: "verified",
      note: null,
      updated_at: "2026-01-18 18:30",
    },
    {
      id: 4,
      remitter_role: "rider",
      remitter_name: "Pedro Reyes",
      business_date: "2026-01-18",
      expected_amount: 1500,
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
  const roleInitial = query?.role || "all";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [status, setStatus] = useState(statusInitial);
  const [role, setRole] = useState(roleInitial);

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "pending", label: "Pending" },
    { value: "verified", label: "Verified" },
    { value: "flagged", label: "Flagged" },
  ];

  const roleOptions = [
    { value: "all", label: "All remitters" },
    { value: "cashier", label: "Cashier" },
    { value: "rider", label: "Rider" },
  ];

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/accountant/remittances",
      { q, status, role, per: perInitial, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
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

  const handlePerPage = (n) => pushQuery({ per: n, page: 1 });
  const handlePrev = () =>
    meta && meta.current_page > 1 && pushQuery({ page: meta.current_page - 1 });
  const handleNext = () =>
    meta && meta.current_page < meta.last_page && pushQuery({ page: meta.current_page + 1 });

  const loading = Boolean(page.props?.loading);

  const fillerRows = useMemo(
    () => Array.from({ length: perInitial }).map((_, i) => ({ id: `__filler__${i}`, __filler: true })),
    [perInitial]
  );

const effectiveRows = rows.length ? rows : sampleRows;
const tableRows = loading ? fillerRows : effectiveRows;
  
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
        key: "remitter",
        label: "Remitter",
        render: (r) =>
          r?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-40" />
              <SkeletonLine w="w-24" />
            </div>
          ) : (
            <div>
              <div className="text-sm font-extrabold text-slate-900">
                {r?.remitter_name || "—"}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                {titleCase(r?.remitter_role || "role")}
              </div>
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
        label: "Remitted",
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

  return (
    <Layout title="Remittances">
      <div className="grid gap-6">
        <TopCard
          title="Remittances"
          subtitle="Verify cash turned over by cashiers and riders. Flag differences early."
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
          onQ={handleSearch}
          placeholder="Search remitter name..."
          filters={[
            { key: "status", value: status, onChange: handleStatus, options: statusOptions },
            { key: "role", value: role, onChange: handleRole, options: roleOptions },
          ]}
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          emptyTitle="No remittances found"
          emptyHint="Remittances appear here after cashiers or riders submit a turn over."
          renderActions={(r) =>
            r?.__filler ? (
              <div className="flex items-center justify-end gap-2">
                <SkeletonButton w="w-24" />
                <div className="h-9 w-9 rounded-2xl bg-slate-200/80 animate-pulse" />
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/dashboard/accountant/remittances/${r.id}`}
                  className="rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:ring-4 focus:ring-teal-500/15"
                >
                  Review
                </Link>

                <button
                  type="button"
                  className="rounded-2xl bg-white p-2 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:ring-4 focus:ring-teal-500/15"
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