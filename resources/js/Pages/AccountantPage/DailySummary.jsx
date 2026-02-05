import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import { CheckCircle2, AlertTriangle, CalendarDays } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function money(v) {
  const n = Number(v || 0);
  return n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });
}

function titleCase(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function Card({ children }) {
  return <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">{children}</div>;
}

function Stat({ label, value, hint, tone = "slate" }) {
  const toneMap = {
    slate: "bg-slate-600/10 text-slate-900 ring-slate-200",
    teal: "bg-teal-600/10 text-teal-900 ring-teal-700/10",
    amber: "bg-amber-600/10 text-amber-900 ring-amber-700/10",
    rose: "bg-rose-600/10 text-rose-900 ring-rose-700/10",
  };

  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-5">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-extrabold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
      <div className={cx("mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1", toneMap[tone])}>
        DAILY
      </div>
    </div>
  );
}

function StatusBanner({ ok, variance }) {
  return (
    <div
      className={cx(
        "rounded-3xl p-5 ring-1",
        ok ? "bg-teal-600/10 ring-teal-700/10" : "bg-amber-600/10 ring-amber-700/10"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-2xl bg-white ring-1 ring-white/60 flex items-center justify-center">
          {ok ? <CheckCircle2 className="h-5 w-5 text-teal-700" /> : <AlertTriangle className="h-5 w-5 text-amber-800" />}
        </div>
        <div className="min-w-0">
          <div className={cx("text-sm font-extrabold", ok ? "text-teal-900" : "text-amber-900")}>
            {ok ? "Balanced day" : "Variance detected"}
          </div>
          <div className={cx("mt-1 text-xs", ok ? "text-teal-900/80" : "text-amber-900/80")}>
            {ok
              ? "Cash remitted matches expected cash sales for the selected day."
              : `Cash remitted does not match expected cash sales by ${money(variance)}. Review cashier turnover before finalizing.`}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="text-sm text-slate-600">{label}</div>
      <div className={cx("text-sm", strong ? "font-extrabold text-slate-900" : "font-semibold text-slate-800")}>
        {value}
      </div>
    </div>
  );
}

export default function DailySummary() {
  const page = usePage();

  /*
    Expected Inertia props from backend:

    summary: {
      date: "YYYY-MM-DD",
      sales_total: number,
      sales_count: number,
      cash_expected: number,
      non_cash_total: number,
      cash_counted: number,
      variance: number,
      status: "open" | "finalized",
      finalized_at: string|null,
      finalized_by: string|null
    }

    cashier_turnover: [
      {
        id,
        cashier_name,
        shift,
        cash_expected,
        cash_counted,
        variance,
        status,
        recorded_at
      }
    ]

    filters: { date }
    loading: boolean (optional)
  */

  const query = page.props?.filters || {};
  const dateInitial = query?.date || "";
  const [date, setDate] = useState(dateInitial);

  const sampleSummary = useMemo(
    () => ({
      date: "2026-01-19",
      sales_total: 7850,
      sales_count: 18,
      cash_expected: 5200,
      non_cash_total: 2650,
      cash_counted: 5000,
      variance: -200,
      status: "open",
      finalized_at: null,
      finalized_by: null,
    }),
    []
  );

  const sampleTurnover = useMemo(
    () => [
      {
        id: 1,
        cashier_name: "Maria Santos",
        shift: "Morning",
        cash_expected: 2500,
        cash_counted: 2500,
        variance: 0,
        status: "verified",
        recorded_at: "2026-01-19 18:12",
      },
      {
        id: 2,
        cashier_name: "Juan Dela Cruz",
        shift: "Afternoon",
        cash_expected: 2700,
        cash_counted: 2600,
        variance: -100,
        status: "flagged",
        recorded_at: "2026-01-19 19:03",
      },
    ],
    []
  );

  const summary = page.props?.summary || sampleSummary;
  const turnoverRows = page.props?.cashier_turnover || sampleTurnover;

  const expectedCash = Number(summary?.cash_expected || 0);
  const remittedCash = Number(summary?.cash_counted || 0);
  const variance = Number(summary?.variance ?? remittedCash - expectedCash);
  const ok = Math.abs(variance) < 0.01;

  const turnoverCounts = useMemo(() => {
    const counts = { pending: 0, verified: 0, flagged: 0 };
    turnoverRows.forEach((row) => {
      const status = String(row?.status || "pending").toLowerCase();
      counts[status] = (counts[status] ?? 0) + 1;
    });
    return counts;
  }, [turnoverRows]);

  const salesTotal = Number(summary?.sales_total || 0);
  const salesCount = Number(summary?.sales_count || 0);
  const nonCashSales = Number(
    summary?.non_cash_total ?? Math.max(0, salesTotal - expectedCash)
  );

  const handleDateChange = (e) => {
    const v = e.target.value;
    setDate(v);
    router.get(
      "/dashboard/accountant/daily",
      { date: v },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  return (
    <Layout title="Daily Summary">
      <div className="grid gap-6">
        <Card>
          <div className="p-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-lg font-extrabold text-slate-900">Daily Summary</div>
              <div className="mt-1 text-sm text-slate-600">
                End of day totals for sales and cashier turnover. Review variance before finalizing.
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <CalendarDays className="h-4 w-4 text-slate-500" />
                <input
                  type="date"
                  value={date || summary?.date || ""}
                  onChange={handleDateChange}
                  className="bg-transparent text-sm outline-none text-slate-800"
                />
              </div>

              <Link
                href="/dashboard/accountant/reports"
                className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:ring-4 focus:ring-teal-500/15"
              >
                Reports
              </Link>
            </div>
          </div>
        </Card>

        <StatusBanner ok={ok} variance={variance} />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Total Sales"
            value={money(salesTotal)}
            hint={`${salesCount} transactions recorded`}
            tone="slate"
          />
          <Stat
            label="Cash Sales"
            value={money(expectedCash)}
            hint="Expected to be turned over as cash"
            tone="teal"
          />
          <Stat
            label="Non Cash Sales"
            value={money(nonCashSales)}
            hint="GCash, bank transfer, card"
            tone="slate"
          />
          <Stat
            label="Cash Turned Over"
            value={money(remittedCash)}
            hint="Actual cash submitted by cashier"
            tone={ok ? "teal" : "amber"}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card>
            <div className="p-6">
              <div className="text-sm font-extrabold text-slate-900">Cash reconciliation</div>
              <div className="mt-1 text-xs text-slate-500">
                Expected cash is computed from cash sales only.
              </div>

              <div className="mt-4 divide-y divide-slate-200">
                <Row label="Expected cash" value={money(expectedCash)} strong />
                <Row label="Cash turned over" value={money(remittedCash)} strong />
                <Row
                  label="Variance"
                  value={
                    <span className={cx("font-extrabold", ok ? "text-teal-700" : "text-amber-800")}>
                      {money(variance)}
                    </span>
                  }
                  strong
                />
              </div>

              <div className="mt-4 text-xs text-slate-600">
                Tip: if variance is not zero, review cashier turnover records and notes before finalizing.
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="text-sm font-extrabold text-slate-900">Turnover status</div>
              <div className="mt-1 text-xs text-slate-500">Counts for the selected day</div>

              <div className="mt-4 divide-y divide-slate-200">
                <Row label="Pending" value={turnoverCounts.pending} />
                <Row label="Verified" value={turnoverCounts.verified} />
                <Row label="Flagged" value={turnoverCounts.flagged} />
              </div>

              <div className="mt-4">
                <Link
                  href="/dashboard/accountant/remittances"
                  className="inline-flex items-center rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:ring-4 focus:ring-teal-500/15"
                >
                  Review turnover
                </Link>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="text-sm font-extrabold text-slate-900">Finalize day</div>
              <div className="mt-1 text-xs text-slate-500">
                Lock the daily accounting status after checks. This should be audited.
              </div>

              <div className="mt-4">
                <div
                  className={cx(
                    "rounded-2xl p-4 ring-1",
                    summary?.status === "finalized" ? "bg-teal-600/10 ring-teal-700/10" : "bg-slate-50 ring-slate-200"
                  )}
                >
                  <div className="text-sm font-extrabold text-slate-900">
                    Status: {String(summary?.status || "open").toUpperCase()}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {summary?.status === "finalized"
                      ? `Finalized by ${summary?.finalized_by || "—"} at ${summary?.finalized_at || "—"}`
                      : "Not finalized yet. Confirm turnover and resolve variance first."}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!ok || summary?.status === "finalized"}
                    onClick={() => {
                      router.post(
                        "/dashboard/accountant/daily/finalize",
                        { date: summary?.date },
                        { preserveScroll: true }
                      );
                    }}
                    className={cx(
                      "rounded-2xl px-4 py-2 text-sm font-extrabold transition focus:ring-4",
                      !ok || summary?.status === "finalized"
                        ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                        : "bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500/25"
                    )}
                    title={!ok ? "Resolve variance before finalizing" : "Finalize daily summary"}
                  >
                    Finalize
                  </button>

                  <Link
                    href="/dashboard/accountant/audit"
                    className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:ring-4 focus:ring-teal-500/15"
                  >
                    Audit logs
                  </Link>
                </div>

                {!ok ? (
                  <div className="mt-3 text-xs text-amber-800">
                    Finalize is disabled because variance is not zero. Review turnover first.
                  </div>
                ) : null}
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-extrabold text-slate-900">Cashier remittances</div>
                <div className="mt-1 text-xs text-slate-500">
                  Expected versus counted cash per cashier for {summary?.date}.
                </div>
              </div>
              <div className="text-xs font-extrabold text-slate-900">{money(salesTotal)} total sales</div>
            </div>

            <div className="space-y-3">
              {turnoverRows.length ? (
                turnoverRows.map((row) => {
                  const varianceValue = Number(row?.variance || 0);
                  const varianceTone =
                    Math.abs(varianceValue) < 0.01
                      ? "text-teal-700"
                      : varianceValue < 0
                      ? "text-rose-700"
                      : "text-amber-800";
                  const status = String(row?.status || "pending").toLowerCase();
                  const statusThemes = {
                    pending: ["bg-slate-100", "text-slate-700", "ring-slate-200"],
                    verified: ["bg-teal-50", "text-teal-700", "ring-teal-200"],
                    flagged: ["bg-amber-50", "text-amber-800", "ring-amber-200"],
                  };
                  const [statusBg, statusText, statusRing] = statusThemes[status] || statusThemes.pending;

                  return (
                    <div
                      key={`${row?.cashier_name}-${row?.id ?? row?.recorded_at}`}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-extrabold text-slate-900">{row?.cashier_name || "Cashier"}</div>
                          <div className="text-xs text-slate-500">
                            {row?.shift || "Shift unknown"} · {row?.recorded_at || "Not recorded yet"}
                          </div>
                        </div>
                        <span
                          className={cx(
                            "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold ring-1",
                            statusBg,
                            statusText,
                            statusRing
                          )}
                        >
                          {titleCase(status)}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-500">Expected</div>
                          <div className="text-sm font-extrabold text-slate-900">{money(row?.cash_expected)}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-500">Counted</div>
                          <div className="text-sm font-extrabold text-slate-900">{money(row?.cash_counted)}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-500">Variance</div>
                          <div className={cx("text-sm font-extrabold", varianceTone)}>{money(varianceValue)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-slate-500">No turnover records yet for this date.</div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
