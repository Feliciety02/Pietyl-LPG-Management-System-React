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
    Updated assumption:
    No rider remittances because the system is pay first before release and delivery.

    Expected Inertia props from backend:

    summary: {
      business_date: "YYYY-MM-DD",
      sales: {
        total: number,
        cash: number,
        non_cash: number,
        transactions_count: number
      },
      cashier_turnover: {
        expected_cash: number,     // usually equals sales.cash
        remitted_cash: number,     // actual cash turned over by cashier
        variance_cash: number,     // remitted_cash - expected_cash
        pending_count: number,
        verified_count: number,
        flagged_count: number
      },
      status: "open" | "finalized",
      finalized_at: string|null,
      finalized_by: string|null
    }

    filters: { date }
    loading: boolean (optional)
  */

  const query = page.props?.filters || {};
  const dateInitial = query?.date || "";

  const [date, setDate] = useState(dateInitial);

  const sample = useMemo(
    () => ({
      business_date: "2026-01-19",
      sales: {
        total: 7850,
        cash: 5200,
        non_cash: 2650,
        transactions_count: 18,
      },
      cashier_turnover: {
        expected_cash: 5200,
        remitted_cash: 5000,
        variance_cash: -200,
        pending_count: 1,
        verified_count: 2,
        flagged_count: 0,
      },
      status: "open",
      finalized_at: null,
      finalized_by: null,
    }),
    []
  );

  const summary = page.props?.summary || sample;

  const expectedCash =
    Number(summary?.cashier_turnover?.expected_cash ?? summary?.sales?.cash ?? 0);

  const remittedCash = Number(summary?.cashier_turnover?.remitted_cash || 0);

  const variance = Number(
    summary?.cashier_turnover?.variance_cash ?? remittedCash - expectedCash
  );

  const ok = variance === 0;

  const handleDateChange = (e) => {
    const v = e.target.value;
    setDate(v);
    router.get("/dashboard/accountant/daily", { date: v }, { preserveScroll: true, preserveState: true, replace: true });
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
                  value={date || summary?.business_date || ""}
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
            value={money(summary?.sales?.total || 0)}
            hint={`${summary?.sales?.transactions_count || 0} transactions recorded`}
            tone="slate"
          />
          <Stat
            label="Cash Sales"
            value={money(summary?.sales?.cash || 0)}
            hint="Expected to be turned over as cash"
            tone="teal"
          />
          <Stat
            label="Non Cash Sales"
            value={money(summary?.sales?.non_cash || 0)}
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
                <Row label="Pending" value={summary?.cashier_turnover?.pending_count ?? 0} />
                <Row label="Verified" value={summary?.cashier_turnover?.verified_count ?? 0} />
                <Row label="Flagged" value={summary?.cashier_turnover?.flagged_count ?? 0} />
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
                        { date: summary?.business_date },
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
                    href="/dashboard/admin/audit"
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
      </div>
    </Layout>
  );
}