import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { BookOpen, ShieldCheck, MoreVertical } from "lucide-react";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

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

function RefPill({ type }) {
  const t = String(type || "entry").toLowerCase();

  const map = {
    sale: "bg-teal-600/10 text-teal-900 ring-teal-700/10",
    remittance: "bg-slate-100 text-slate-800 ring-slate-200",
    adjustment: "bg-amber-600/10 text-amber-900 ring-amber-700/10",
    expense: "bg-rose-600/10 text-rose-900 ring-rose-700/10",
    entry: "bg-white text-slate-700 ring-slate-200",
  };

  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1", map[t] || map.entry)}>
      {t.toUpperCase()}
    </span>
  );
}

export default function Ledger() {
  const page = usePage();

  /*
    Expected Inertia props from backend:
    ledger: {
      data: [{
        id,
        posted_at,            string (YYYY-MM-DD) or datetime
        reference_type,       string (sale|remittance|adjustment|expense)
        reference_id,         string|number|null
        account_code,         string (eg "1010")
        account_name,         string (eg "Cash on Hand")
        description,          string
        debit,                number
        credit,               number
        balance,              number  (running balance for the account or for the ledger view)
        posted_by,            string|null
      }],
      meta,
      links
    }
    filters: { q, type, account, from, to, page, per }
    loading: boolean (optional)

    Notes:
    - Ledger should be append-only and audited.
    - Source transactions must never be modified from this screen.
    - Any corrections should be done via "adjustment" entries, not edits.
  */

  const ledger = page.props?.ledger || { data: [], meta: null };
  const rows = ledger?.data || [];
  const meta = ledger?.meta || null;

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const typeInitial = query?.type || "all";
  const accountInitial = query?.account || "all";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [type, setType] = useState(typeInitial);
  const [account, setAccount] = useState(accountInitial);

  const typeOptions = [
    { value: "all", label: "All entries" },
    { value: "sale", label: "Sales" },
    { value: "remittance", label: "Remittances" },
    { value: "adjustment", label: "Adjustments" },
    { value: "expense", label: "Expenses" },
  ];

  const accountOptions = [
    { value: "all", label: "All accounts" },
    { value: "1010", label: "1010 Cash on Hand" },
    { value: "1020", label: "1020 Cash in Bank" },
    { value: "2010", label: "2010 Remittances Receivable" },
    { value: "4010", label: "4010 Sales Revenue" },
  ];

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/accountant/ledger",
      { q, type, account, per: perInitial, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const handleSearch = (value) => {
    setQ(value);
    pushQuery({ q: value, page: 1 });
  };

  const handleType = (value) => {
    setType(value);
    pushQuery({ type: value, page: 1 });
  };

  const handleAccount = (value) => {
    setAccount(value);
    pushQuery({ account: value, page: 1 });
  };

  const handlePerPage = (n) => pushQuery({ per: n, page: 1 });
  const handlePrev = () => meta && meta.current_page > 1 && pushQuery({ page: meta.current_page - 1 });
  const handleNext = () => meta && meta.current_page < meta.last_page && pushQuery({ page: meta.current_page + 1 });

  const loading = Boolean(page.props?.loading);

  const sampleRows = useMemo(
    () => [
      {
        id: 1,
        posted_at: "2026-01-19",
        reference_type: "sale",
        reference_id: "S-20260119-0018",
        account_code: "1010",
        account_name: "Cash on Hand",
        description: "Walk-in LPG refill sales (cash)",
        debit: 5200,
        credit: 0,
        balance: 5200,
        posted_by: "System",
      },
      {
        id: 2,
        posted_at: "2026-01-19",
        reference_type: "sale",
        reference_id: "S-20260119-0018",
        account_code: "4010",
        account_name: "Sales Revenue",
        description: "Recognize sales revenue for LPG refill",
        debit: 0,
        credit: 5200,
        balance: 5200,
        posted_by: "System",
      },
      {
        id: 3,
        posted_at: "2026-01-19",
        reference_type: "remittance",
        reference_id: "R-20260119-0003",
        account_code: "1010",
        account_name: "Cash on Hand",
        description: "Cashier remittance received (partial)",
        debit: 1800,
        credit: 0,
        balance: 7000,
        posted_by: "Accountant",
      },
      {
        id: 4,
        posted_at: "2026-01-19",
        reference_type: "adjustment",
        reference_id: "ADJ-20260119-0001",
        account_code: "2010",
        account_name: "Remittances Receivable",
        description: "Variance noted for missing cash remittance",
        debit: 200,
        credit: 0,
        balance: 200,
        posted_by: "Accountant",
      },
    ],
    []
  );

  const effectiveRows = rows?.length ? rows : sampleRows;

  const fillerRows = useMemo(
    () => Array.from({ length: perInitial }).map((_, i) => ({ id: `__filler__${i}`, __filler: true })),
    [perInitial]
  );

  const tableRows = loading ? fillerRows : effectiveRows;

  const columns = useMemo(
    () => [
      {
        key: "posted_at",
        label: "Posted",
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-24" />
          ) : (
            <div className="text-sm font-semibold text-slate-900">{r?.posted_at || "—"}</div>
          ),
      },
      {
        key: "reference",
        label: "Reference",
        render: (r) =>
          r?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-28" />
              <SkeletonPill w="w-20" />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-extrabold text-slate-900">{r?.reference_id || "—"}</div>
              <RefPill type={r?.reference_type} />
            </div>
          ),
      },
      {
        key: "account",
        label: "Account",
        render: (r) =>
          r?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-40" />
              <SkeletonLine w="w-28" />
            </div>
          ) : (
            <div>
              <div className="text-sm font-extrabold text-slate-900">
                {r?.account_name || "Account"}
              </div>
              <div className="mt-1 text-xs text-slate-600">{r?.account_code || "—"}</div>
            </div>
          ),
      },
      {
        key: "description",
        label: "Description",
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-56" />
          ) : (
            <div className="text-sm text-slate-700 max-w-[420px] truncate">
              {r?.description || "—"}
            </div>
          ),
      },
      {
        key: "debit",
        label: "Debit",
        render: (r) => (r?.__filler ? <SkeletonLine w="w-20" /> : <span className="text-sm font-semibold text-slate-800">{money(r?.debit || 0)}</span>),
      },
      {
        key: "credit",
        label: "Credit",
        render: (r) => (r?.__filler ? <SkeletonLine w="w-20" /> : <span className="text-sm font-semibold text-slate-800">{money(r?.credit || 0)}</span>),
      },
      {
        key: "balance",
        label: "Balance",
        render: (r) => (r?.__filler ? <SkeletonLine w="w-20" /> : <span className="text-sm font-extrabold text-slate-900">{money(r?.balance ?? 0)}</span>),
      },
    ],
    []
  );

  return (
    <Layout title="Ledger">
      <div className="grid gap-6">
        <TopCard
          title="Ledger"
          subtitle="Formal accounting record. Entries are append-only. Corrections should be made via adjustments, not edits."
          right={
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/accountant/reports"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:ring-4 focus:ring-teal-500/15"
              >
                <BookOpen className="h-4 w-4 text-slate-700" />
                Reports
              </Link>

              <Link
                href="/dashboard/admin/audit"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:ring-4 focus:ring-teal-500/15"
              >
                <ShieldCheck className="h-4 w-4 text-teal-700" />
                Audit logs
              </Link>
            </div>
          }
        />

        <DataTableFilters
          q={q}
          onQ={handleSearch}
          placeholder="Search reference, account, description..."
          filters={[
            { key: "type", value: type, onChange: handleType, options: typeOptions },
            { key: "account", value: account, onChange: handleAccount, options: accountOptions },
          ]}
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          emptyTitle="No ledger entries found"
          emptyHint="Ledger entries appear after sales, remittances, or adjustments are posted."
          renderActions={(r) =>
            r?.__filler ? (
              <div className="flex items-center justify-end gap-2">
                <SkeletonButton w="w-24" />
                <div className="h-9 w-9 rounded-2xl bg-slate-200/80 animate-pulse" />
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/dashboard/accountant/ledger/${r.id}`}
                  className="rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:ring-4 focus:ring-teal-500/15"
                >
                  View
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