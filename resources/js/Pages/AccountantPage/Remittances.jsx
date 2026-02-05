import React, { useMemo, useState, useEffect } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";

import { ShieldCheck, Pencil, FileText } from "lucide-react";

import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";
import { TableActionButton } from "@/components/Table/ActionTableButton";

import RecordTurnoverModal from "@/components/modals/AccountantModals/RecordTurnoverModal";
import NonCashVerificationModal from "@/components/modals/AccountantModals/NonCashVerificationModal";

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

function Tabs({ tabs, value, onChange }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-slate-50 p-1 ring-1 ring-slate-200">
      {tabs.map((t) => {
        const active = t.value === value;

        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={cx(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition",
              active
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "text-slate-600 hover:text-slate-800"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

const TAB_DEFS = [
  { value: "cash", label: "Cash Turnover" },
  { value: "noncash", label: "Non Cash Verification" },
];

export default function Remittances() {
  const page = usePage();

  const remittances = page.props?.remittances?.data || [];
  const meta = page.props?.remittances?.meta || null;
  const methods = page.props?.methods || [];
  const nonCashMethods = useMemo(
    () =>
      methods.filter(
        (method) =>
          String(method.method_key).toLowerCase() !== "cash" && method.is_cashless
      ),
    [methods]
  );

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const statusInitial = query?.status || "all";
  const dateInitial = query?.date || "";
  const tabInitial = query?.tab || "cash";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [status, setStatus] = useState(statusInitial);
  const [date, setDate] = useState(dateInitial);
  const [tab, setTab] = useState(tabInitial);

  const [recordOpen, setRecordOpen] = useState(false);
  const [activeCashRow, setActiveCashRow] = useState(null);
  const [loadingCash, setLoadingCash] = useState(false);

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [activeNonCashRow, setActiveNonCashRow] = useState(null);
  const [loadingVerify, setLoadingVerify] = useState(false);

  useEffect(() => {
    setTab(tabInitial || "cash");
  }, [tabInitial]);

  const loading = Boolean(page.props?.loading);

  const buildQueryPayload = (patch = {}) => {
    const finalTab = patch.tab ?? tab;
    const finalStatus = patch.status ?? status;
    const finalDate = patch.date ?? date;

    return {
      q,
      status: finalStatus,
      date: finalDate,
      tab: finalTab,
      per: patch.per ?? perInitial,
      ...patch,
    };
  };

  const pushQuery = (patch = {}) => {
    router.get("/dashboard/accountant/remittances", buildQueryPayload(patch), {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    });
  };

  const handleStatus = (value) => {
    setStatus(value);
    pushQuery({ status: value, page: 1 });
  };

  const handleDateChange = (value) => {
    setDate(value);
    pushQuery({ date: value, page: 1 });
  };

  const fillerRows = useMemo(
    () =>
      Array.from({ length: perInitial }).map((_, i) => ({
        id: `__filler__${i}`,
        __filler: true,
      })),
    [perInitial]
  );

  const tableRows = loading ? fillerRows : remittances;

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "pending", label: "Pending" },
    { value: "verified", label: "Verified" },
    { value: "flagged", label: "Flagged" },
  ];

  const cashColumns = useMemo(
    () => [
      {
        key: "business_date",
        label: "Date",
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-24" />
          ) : (
            <div className="text-sm font-semibold text-slate-900">
              {r?.business_date || "—"}
            </div>
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
              <div className="text-sm font-extrabold text-slate-900">
                {r?.cashier_name || "—"}
              </div>
              <div className="mt-1 text-xs text-slate-600">Cashier turnover</div>
            </div>
          ),
      },
      {
        key: "expected_cash",
        label: "Expected Cash",
        render: (r) => (r?.__filler ? <SkeletonLine w="w-20" /> : money(r?.expected_cash)),
      },
      {
        key: "remitted_cash_amount",
        label: "Cash Turned Over",
        render: (r) =>
          r?.__filler ? <SkeletonLine w="w-20" /> : money(r?.remitted_cash_amount),
      },
      {
        key: "cash_variance",
        label: "Variance",
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-20" />
          ) : (
            <span
              className={cx(
                "text-sm font-extrabold",
                Number(r?.cash_variance || 0) === 0
                  ? "text-slate-700"
                  : Number(r?.cash_variance || 0) < 0
                  ? "text-rose-700"
                  : "text-amber-800"
              )}
            >
              {money(r?.cash_variance ?? 0)}
            </span>
          ),
      },
      {
        key: "status",
        label: "Cash Status",
        render: (r) =>
          r?.__filler ? (
            <SkeletonPill w="w-24" />
          ) : (
            <StatusPill status={r?.cash_status || r?.status} />
          ),
      },
      {
        key: "updated",
        label: "Updated",
        render: (r) => (r?.__filler ? <SkeletonLine w="w-20" /> : r?.recorded_at || "—"),
      },
    ],
    []
  );

  const nonCashColumns = useMemo(() => {
    const dynamic = nonCashMethods.map((method) => ({
      key: method.method_key,
      label: method.name,
      render: (r) => {
        const value = r?.expected_by_method?.[method.method_key];
        return r?.__filler ? <SkeletonLine w="w-20" /> : money(value);
      },
    }));

    return [
      {
        key: "business_date",
        label: "Date",
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-24" />
          ) : (
            <div className="text-sm font-semibold text-slate-900">
              {r?.business_date || "—"}
            </div>
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
              <div className="text-sm font-extrabold text-slate-900">
                {r?.cashier_name || "—"}
              </div>
              <div className="mt-1 text-xs text-slate-600">Non cash totals</div>
            </div>
          ),
      },
      ...dynamic,
      {
        key: "status",
        label: "Non Cash",
        render: (r) =>
          r?.__filler ? (
            <SkeletonPill w="w-24" />
          ) : (
            <span
              className={cx(
                "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold ring-1",
                r?.noncash_status === "verified"
                  ? "bg-teal-50 text-teal-700 ring-teal-200"
                  : "bg-amber-50 text-amber-800 ring-amber-200"
              )}
            >
              {titleCase(r?.noncash_status || "unverified")}
            </span>
          ),
      },
      {
        key: "verified_at",
        label: "Verified At",
        render: (r) =>
          r?.__filler ? <SkeletonLine w="w-20" /> : r?.noncash_verified_at || "—",
      },
    ];
  }, [nonCashMethods]);

  const columns = tab === "noncash" ? nonCashColumns : cashColumns;

  const openCashModal = (row) => {
    setActiveCashRow(row);
    setRecordOpen(true);
  };

  const closeCashModal = () => {
    setRecordOpen(false);
    setActiveCashRow(null);
  };

  const submitTurnover = (payload) => {
    if (!activeCashRow || loadingCash) return;
    setLoadingCash(true);

    router.post(
      "/dashboard/accountant/remittances/record-cash",
      {
        business_date: activeCashRow.business_date,
        cashier_user_id: activeCashRow.cashier_user_id,
        cash_counted: payload?.cash_counted ?? payload?.remitted_amount,
        note: payload?.note || null,
      },
      {
        preserveScroll: true,
        onFinish: () => setLoadingCash(false),
        onSuccess: () => {
          closeCashModal();
        },
      }
    );
  };

  const openVerifyModal = (row) => {
    setActiveNonCashRow(row);
    setVerifyOpen(true);
  };

  const closeVerifyModal = () => {
    setVerifyOpen(false);
    setActiveNonCashRow(null);
  };

  const submitNonCash = (payload) => {
    if (!activeNonCashRow || loadingVerify) return;
    setLoadingVerify(true);

    router.post(
      "/dashboard/accountant/remittances/verify-noncash",
      {
        business_date: activeNonCashRow.business_date,
        cashier_user_id: activeNonCashRow.cashier_user_id,
        verification: payload.verification,
      },
      {
        preserveScroll: true,
        onFinish: () => setLoadingVerify(false),
        onSuccess: () => {
          closeVerifyModal();
        },
      }
    );
  };

  return (
    <Layout title="Turnover">
      <div className="grid gap-6">
        <TopCard
          title="Cashier Turnover"
          subtitle="Daily system-expected cash and non cash totals per cashier."
          right={
            <Link
              href="/dashboard/accountant/audit"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:outline-none focus:ring-4 focus:ring-teal-500/15"
            >
              <ShieldCheck className="h-4 w-4 text-teal-700" />
              View audit logs
            </Link>
          }
        />

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-4 justify-between">
          <Tabs
            tabs={TAB_DEFS}
            value={tab}
            onChange={(next) => {
              setTab(next);
              pushQuery({ tab: next, page: 1 });
            }}
          />

          <DataTableFilters
            variant="inline"
            containerClass="w-full md:w-auto"
            q={q}
            onQ={setQ}
            onQDebounced={(value) => pushQuery({ q: value, page: 1 })}
            placeholder="Search cashier name..."
            filters={[
              {
                key: "date",
                value: date,
                custom: (
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => handleDateChange(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-teal-500/15"
                  />
                ),
              },
              {
                key: "status",
                value: status,
                onChange: handleStatus,
                options: statusOptions,
              },
            ]}
          />
        </div>

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          searchQuery={q}
          emptyTitle="No turnover found"
          emptyHint="Turnover appears here per business date per cashier."
          renderActions={(r) =>
            r?.__filler ? (
              <div className="flex items-center justify-end gap-2">
                <SkeletonButton w="w-20" />
                <SkeletonButton w="w-20" />
              </div>
            ) : tab === "noncash" ? (
              <div className="flex items-center justify-end gap-2">
                <TableActionButton
                  icon={FileText}
                  onClick={() => openVerifyModal(r)}
                  title="Verify non cash"
                >
                  Verify
                </TableActionButton>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <TableActionButton
                  icon={Pencil}
                  onClick={() => openCashModal(r)}
                  title="Edit cash turnover"
                >
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
          onNext={() =>
            meta?.current_page < meta?.last_page && pushQuery({ page: meta.current_page + 1 })
          }
          disablePrev={!meta || meta.current_page <= 1}
          disableNext={!meta || meta.current_page >= meta.last_page}
        />
      </div>

      <RecordTurnoverModal
        open={recordOpen}
        onClose={closeCashModal}
        row={activeCashRow}
        loading={loadingCash}
        methods={nonCashMethods}
        onSubmit={({ cash_counted, note }) =>
          submitTurnover({
            cash_counted,
            note,
          })
        }
      />

      <NonCashVerificationModal
        open={verifyOpen}
        onClose={closeVerifyModal}
        row={activeNonCashRow}
        loading={loadingVerify}
        methods={nonCashMethods}
        onSubmit={(payload) => submitNonCash(payload)}
      />
    </Layout>
  );
}
