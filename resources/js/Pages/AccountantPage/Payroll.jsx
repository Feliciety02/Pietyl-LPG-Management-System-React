import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { MoreVertical, Download, CheckCircle2, Flag, Lock, Unlock } from "lucide-react";
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

function formatPeso(v) {
  const n = Number(v || 0);
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalize(u = "") {
  return String(u).split("?")[0];
}

function StatusPill({ status }) {
  const map = {
    draft: "bg-slate-100 text-slate-700 ring-slate-200",
    verified: "bg-teal-600/10 text-teal-900 ring-teal-700/10",
    flagged: "bg-amber-500/10 text-amber-900 ring-amber-700/10",
    approved: "bg-indigo-600/10 text-indigo-900 ring-indigo-700/10",
    released: "bg-slate-900 text-white ring-slate-900",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        map[status] || map.draft
      )}
    >
      {titleCase(status)}
    </span>
  );
}

function ExceptionPill({ count }) {
  if (!count) {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 bg-slate-50 text-slate-500 ring-slate-200">
        None
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 bg-amber-500/10 text-amber-900 ring-amber-700/10">
      {count} issue{count > 1 ? "s" : ""}
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

function computeExceptions(row, prevPeriodRow) {
  const issues = [];

  if (Number(row.net || 0) < 0) issues.push("Negative net pay");
  if (Number(row.gross || 0) === 0) issues.push("Zero gross pay");
  if (Number(row.deductions_total || 0) > Number(row.gross || 0)) issues.push("Deductions exceed gross");

  const ot = Number(row.overtime_pay || 0);
  if (ot > 0 && Number(row.overtime_hours || 0) === 0) issues.push("Overtime pay without hours");

  if (Number(row.absent_days || 0) > 0 && Number(row.absence_deduction || 0) === 0) issues.push("Absences without deduction");

  if (prevPeriodRow) {
    const prevNet = Number(prevPeriodRow.net || 0);
    const currNet = Number(row.net || 0);
    if (prevNet > 0) {
      const change = (currNet - prevNet) / prevNet;
      if (Math.abs(change) >= 0.3) issues.push("Net variance above 30 percent vs previous period");
    }
  }

  return issues;
}

function toCSV(rows) {
  const header = [
    "employee_no",
    "employee_name",
    "position",
    "period",
    "basic_pay",
    "overtime_hours",
    "overtime_pay",
    "allowances",
    "gross",
    "sss",
    "philhealth",
    "pagibig",
    "withholding_tax",
    "loans",
    "cash_advance",
    "absence_deduction",
    "deductions_total",
    "net",
    "status",
  ];

  const lines = [header.join(",")];

  rows.forEach((r) => {
    const vals = [
      r.employee_no,
      `"${String(r.employee_name || "").replaceAll('"', '""')}"`,
      `"${String(r.position || "").replaceAll('"', '""')}"`,
      r.period,
      r.basic_pay,
      r.overtime_hours,
      r.overtime_pay,
      r.allowances,
      r.gross,
      r.sss,
      r.philhealth,
      r.pagibig,
      r.withholding_tax,
      r.loans,
      r.cash_advance,
      r.absence_deduction,
      r.deductions_total,
      r.net,
      r.status,
    ];
    lines.push(vals.join(","));
  });

  return lines.join("\n");
}

export default function Payroll() {
  const page = usePage();

  /*
    Expected Inertia props from backend:
    payroll: {
      data: [{
        id,
        employee_no,
        employee_name,
        position,
        period,
        basic_pay,
        overtime_hours,
        overtime_pay,
        allowances,
        gross,
        sss,
        philhealth,
        pagibig,
        withholding_tax,
        loans,
        cash_advance,
        absence_deduction,
        deductions_total,
        net,
        status, // draft, verified, flagged, approved, released
        updated_at
      }],
      meta,
      links
    }
    payroll_period: {
      key,
      label,
      state // open, locked, approved, released
    }
    filters: { q, status, period, page, per }
  */

  const auth = page.props?.auth;
  const userRole = auth?.user?.role || "admin";
  const isAdmin = userRole === "admin";
  const isAccountant = userRole === "accountant";

  const SAMPLE_PAYROLL = {
    data: [
      {
        id: 1,
        employee_no: "EMP-0003",
        employee_name: "Juan Dela Cruz",
        position: "Cashier",
        period: "2026-01-16 to 2026-01-31",
        basic_pay: 9000,
        overtime_hours: 6,
        overtime_pay: 750,
        allowances: 300,
        gross: 10050,
        sss: 450,
        philhealth: 250,
        pagibig: 100,
        withholding_tax: 0,
        loans: 0,
        cash_advance: 500,
        absence_deduction: 0,
        deductions_total: 1300,
        net: 8750,
        status: "verified",
        updated_at: "2026-01-20 09:21",
      },
      {
        id: 2,
        employee_no: "EMP-0010",
        employee_name: "Mark Villanueva",
        position: "Delivery Rider",
        period: "2026-01-16 to 2026-01-31",
        basic_pay: 8000,
        overtime_hours: 0,
        overtime_pay: 300,
        allowances: 200,
        gross: 8500,
        sss: 400,
        philhealth: 250,
        pagibig: 100,
        withholding_tax: 0,
        loans: 0,
        cash_advance: 0,
        absence_deduction: 0,
        deductions_total: 750,
        net: 7750,
        status: "draft",
        updated_at: "2026-01-20 08:10",
      },
      {
        id: 3,
        employee_no: "EMP-0008",
        employee_name: "Liza Gomez",
        position: "Inventory Manager",
        period: "2026-01-16 to 2026-01-31",
        basic_pay: 11000,
        overtime_hours: 0,
        overtime_pay: 0,
        allowances: 300,
        gross: 11300,
        sss: 500,
        philhealth: 250,
        pagibig: 100,
        withholding_tax: 200,
        loans: 0,
        cash_advance: 0,
        absence_deduction: 0,
        deductions_total: 1050,
        net: 10250,
        status: "flagged",
        updated_at: "2026-01-19 17:55",
      },
      {
        id: 4,
        employee_no: "EMP-0005",
        employee_name: "Ana Reyes",
        position: "Accountant",
        period: "2026-01-16 to 2026-01-31",
        basic_pay: 14000,
        overtime_hours: 2,
        overtime_pay: 350,
        allowances: 500,
        gross: 14850,
        sss: 600,
        philhealth: 250,
        pagibig: 100,
        withholding_tax: 600,
        loans: 0,
        cash_advance: 0,
        absence_deduction: 0,
        deductions_total: 1550,
        net: 13300,
        status: "approved",
        updated_at: "2026-01-19 18:02",
      },
      {
        id: 5,
        employee_no: "EMP-0012",
        employee_name: "Jenny Lopez",
        position: "Warehouse Staff",
        period: "2026-01-01 to 2026-01-15",
        basic_pay: 6500,
        overtime_hours: 0,
        overtime_pay: 0,
        allowances: 0,
        gross: 6500,
        sss: 300,
        philhealth: 250,
        pagibig: 100,
        withholding_tax: 0,
        loans: 0,
        cash_advance: 0,
        absence_deduction: 0,
        deductions_total: 650,
        net: 5850,
        status: "released",
        updated_at: "2026-01-15 18:30",
      },
    ],
    meta: {
      current_page: 1,
      last_page: 1,
      from: 1,
      to: 5,
      total: 5,
    },
  };

  const payroll =
    page.props?.payroll ??
    (import.meta.env.DEV ? SAMPLE_PAYROLL : { data: [], meta: null });

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const statusInitial = query?.status || "all";
  const periodInitial = query?.period || "current";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [status, setStatus] = useState(statusInitial);
  const [period, setPeriod] = useState(periodInitial);

  const [localRows, setLocalRows] = useState(payroll?.data || []);
  const meta = payroll?.meta || null;

  const baseUrl = normalize(page?.url || "/dashboard/payroll");

  const periodState = page.props?.payroll_period || {
    key: period,
    label: period === "current" ? "Jan 16 to Jan 31, 2026" : "Jan 1 to Jan 15, 2026",
    state: period === "previous" ? "released" : "open",
  };

  const periodOptions = [
    { value: "current", label: "Current period" },
    { value: "previous", label: "Previous period" },
  ];

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "draft", label: "Draft" },
    { value: "verified", label: "Verified" },
    { value: "flagged", label: "Flagged" },
    { value: "approved", label: "Approved" },
    { value: "released", label: "Released" },
  ];

  const pushQuery = (patch) => {
    router.get(
      baseUrl,
      { q, status, period, per: perInitial, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const handleStatus = (value) => {
    setStatus(value);
    pushQuery({ status: value, page: 1 });
  };

  const handlePeriod = (value) => {
    setPeriod(value);
    pushQuery({ period: value, page: 1 });
  };

  const handlePerPage = (n) => pushQuery({ per: n, page: 1 });
  const handlePrev = () =>
    meta && meta.current_page > 1 && pushQuery({ page: meta.current_page - 1 });
  const handleNext = () =>
    meta && meta.current_page < meta.last_page && pushQuery({ page: meta.current_page + 1 });

  const loading = Boolean(page.props?.loading);

  const fillerRows = useMemo(
    () =>
      Array.from({ length: perInitial }).map((_, i) => ({
        id: `__filler__${i}`,
        __filler: true,
      })),
    [perInitial]
  );

  const rows = loading ? fillerRows : localRows;

  const byEmployeePeriod = useMemo(() => {
    const map = new Map();
    localRows.forEach((r) => {
      const key = `${r.employee_no}::${r.period}`;
      map.set(key, r);
    });
    return map;
  }, [localRows]);

  const previousLookup = useMemo(() => {
    const map = new Map();
    localRows.forEach((r) => {
      if (String(r.period).includes("2026-01-01")) {
        map.set(r.employee_no, r);
      }
    });
    return map;
  }, [localRows]);

  const enriched = useMemo(() => {
    if (loading) return rows;

    return rows.map((r) => {
      const prev = previousLookup.get(r.employee_no);
      const issues = computeExceptions(r, prev);
      return { ...r, __issues: issues };
    });
  }, [rows, loading, previousLookup]);

  const totals = useMemo(() => {
    if (loading) return { gross: 0, deductions: 0, net: 0, issues: 0 };

    let gross = 0;
    let deductions = 0;
    let net = 0;
    let issues = 0;

    enriched.forEach((r) => {
      gross += Number(r.gross || 0);
      deductions += Number(r.deductions_total || 0);
      net += Number(r.net || 0);
      issues += (r.__issues || []).length;
    });

    return { gross, deductions, net, issues };
  }, [enriched, loading]);

  const setRowStatus = (id, next) => {
    setLocalRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: next, updated_at: new Date().toISOString().slice(0, 16).replace("T", " ") } : r))
    );
  };

  const exportVisibleCSV = () => {
    const csv = toCSV(localRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const periodActions = {
    lock: () => {
      if (!isAdmin) return;
      // router.post(`${baseUrl}/lock`)
      // For DEV UI:
      // no server mutation, just placeholder
    },
    unlock: () => {
      if (!isAdmin) return;
    },
  };

  const columns = useMemo(
    () => [
      {
        key: "employee",
        label: "Employee",
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-44" />
          ) : (
            <div>
              <div className="font-extrabold text-slate-900">{r.employee_name}</div>
              <div className="text-xs text-slate-500">
                {r.employee_no} • {r.position || "-"}
              </div>
            </div>
          ),
      },
      {
        key: "period",
        label: "Period",
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-28" />
          ) : (
            <span className="text-sm text-slate-700">{r.period}</span>
          ),
      },
      {
        key: "gross",
        label: "Gross",
        render: (r) => (r?.__filler ? <SkeletonLine w="w-20" /> : <span className="text-sm">{formatPeso(r.gross)}</span>),
      },
      {
        key: "deductions",
        label: "Deductions",
        render: (r) =>
          r?.__filler ? <SkeletonLine w="w-20" /> : <span className="text-sm">{formatPeso(r.deductions_total)}</span>,
      },
      {
        key: "net",
        label: "Net Pay",
        render: (r) =>
          r?.__filler ? (
            <SkeletonLine w="w-20" />
          ) : (
            <span className="text-sm font-extrabold text-slate-900">{formatPeso(r.net)}</span>
          ),
      },
      {
        key: "issues",
        label: "Checks",
        render: (r) => (r?.__filler ? <SkeletonPill w="w-20" /> : <ExceptionPill count={(r.__issues || []).length} />),
      },
      {
        key: "status",
        label: "Status",
        render: (r) => (r?.__filler ? <SkeletonPill w="w-20" /> : <StatusPill status={r.status} />),
      },
    ],
    []
  );

  return (
    <Layout title="Payroll">
      {/* Payroll
         Purpose
         Run payroll calculations, review exceptions, approve, release
         Scope lock
         Inventory stock edits do not belong here
         Product catalog changes do not belong here
         Attendance capture is separate, payroll only consumes approved attendance
      */}
      <div className="grid gap-6">
        <TopCard
          title="Payroll"
          subtitle="Accountant verifies and flags inconsistencies. Admin approves and releases."
          right={
            <div className="flex flex-wrap items-center gap-2">
              {(isAdmin || isAccountant) && (
                <button
                  type="button"
                  onClick={exportVisibleCSV}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => periodActions.lock()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800"
                  title="Lock the payroll period before final approval"
                >
                  <Lock className="h-4 w-4" />
                  Lock Period
                </button>
              )}
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500">Gross total</div>
            <div className="mt-1 text-2xl font-extrabold text-slate-900">{formatPeso(totals.gross)}</div>
            <div className="mt-1 text-xs text-slate-500">Based on salary, OT, allowances</div>
          </div>

          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500">Deductions total</div>
            <div className="mt-1 text-2xl font-extrabold text-slate-900">{formatPeso(totals.deductions)}</div>
            <div className="mt-1 text-xs text-slate-500">Gov and company deductions</div>
          </div>

          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500">Net total</div>
            <div className="mt-1 text-2xl font-extrabold text-slate-900">{formatPeso(totals.net)}</div>
            <div className="mt-1 text-xs text-slate-500">Expected payout</div>
          </div>

          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500">Issues found</div>
            <div className="mt-1 text-2xl font-extrabold text-slate-900">{totals.issues}</div>
            <div className="mt-1 text-xs text-slate-500">Variance and rule checks</div>
          </div>
        </div>

        <DataTableFilters
          q={q}
          onQ={setQ}
          onQDebounced={(value) => pushQuery({ q: value, page: 1 })}
          placeholder="Search employee no or name..."
          filters={[
            {
              key: "period",
              value: period,
              onChange: handlePeriod,
              options: periodOptions,
            },
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
          rows={enriched}
          loading={loading}
          searchQuery={q}
          emptyTitle="No payroll entries found"
          emptyHint="Adjust filters or generate payroll for this period."
          renderActions={(r) =>
            r?.__filler ? (
              <SkeletonButton w="w-28" />
            ) : (
              <div className="flex items-center gap-2 justify-end">
                {isAccountant && r.status !== "released" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setRowStatus(r.id, "verified")}
                      className="rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 inline-flex items-center gap-2"
                      title="Mark as verified after checking payroll components"
                    >
                      <CheckCircle2 className="h-4 w-4 text-teal-700" />
                      Verify
                    </button>

                    <button
                      type="button"
                      onClick={() => setRowStatus(r.id, "flagged")}
                      className="rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 inline-flex items-center gap-2"
                      title="Flag for investigation and correction"
                    >
                      <Flag className="h-4 w-4 text-amber-700" />
                      Flag
                    </button>
                  </>
                )}

                {isAdmin && r.status !== "released" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setRowStatus(r.id, "approved")}
                      className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-extrabold text-white hover:bg-slate-800"
                      title="Approve after accountant verification"
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      onClick={() => setRowStatus(r.id, "released")}
                      className="rounded-2xl bg-teal-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-teal-700"
                      title="Release payroll after approval"
                    >
                      Release
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="rounded-2xl bg-white p-2 ring-1 ring-slate-200 hover:bg-slate-50"
                  title="More"
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

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
          <div className="p-6">
            <div className="text-sm font-extrabold text-slate-900">What the accountant does here</div>
            <div className="mt-2 text-sm text-slate-600">
              Payroll work usually follows: confirm time and attendance, compute gross pay, apply deductions, then reconcile totals and review exception checks before approval and payout. :contentReference[oaicite:1]{index=1}
            </div>
            <div className="mt-2 text-sm text-slate-600">
              In the Philippines, payroll commonly includes employer withholding responsibilities and statutory contributions such as SSS, PhilHealth, and Pag IBIG. :contentReference[oaicite:2]{index=2}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
