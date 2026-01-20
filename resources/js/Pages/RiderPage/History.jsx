import React, { useMemo, useState } from "react";
import { usePage, router } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { Clock, ExternalLink, MapPin } from "lucide-react";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function titleCase(s = "") {
  return String(s)
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function mapsOpenUrl(address) {
  const q = encodeURIComponent(address || "");
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function StatusPill({ status }) {
  const s = String(status || "").toLowerCase();

  const map = {
    delivered: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    failed: "bg-rose-50 text-rose-800 ring-rose-200",
    on_the_way: "bg-teal-50 text-teal-800 ring-teal-200",
    pending: "bg-slate-100 text-slate-700 ring-slate-200",
    cancelled: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        map[s] || "bg-slate-100 text-slate-700 ring-slate-200"
      )}
    >
      {titleCase(s || "pending")}
    </span>
  );
}

function PayPill({ payment_status }) {
  const p = String(payment_status || "").toLowerCase();

  const map = {
    prepaid: "bg-teal-600/10 text-teal-900 ring-teal-700/10",
    paid: "bg-teal-600/10 text-teal-900 ring-teal-700/10",
    unpaid: "bg-amber-500/10 text-amber-900 ring-amber-700/10",
    refunded: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  const label =
    p === "paid" ? "Prepaid" : p ? titleCase(p) : "Prepaid";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        map[p] || map.prepaid
      )}
    >
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

export default function History() {
  const page = usePage();

  /*
    Expected Inertia props:
    deliveries: {
      data: [{
        id,
        code,
        delivered_at,
        customer_name,
        address,
        items_count,
        status,
        payment_status
      }],
      meta
    }
    filters: { q, status, payment, date_from, date_to, page, per }
  */

  const SAMPLE = {
    data: [
      {
        id: 701,
        code: "DLV-000701",
        delivered_at: "2026-01-18 14:22",
        customer_name: "Juan Dela Cruz",
        address: "Matina, Davao City",
        items_count: 1,
        status: "delivered",
        payment_status: "prepaid",
      },
      {
        id: 702,
        code: "DLV-000702",
        delivered_at: "2026-01-17 10:11",
        customer_name: "Maria Santos",
        address: "Bajada, Davao City",
        items_count: 2,
        status: "failed",
        payment_status: "prepaid",
      },
    ],
    meta: {
      current_page: 1,
      last_page: 1,
      from: 1,
      to: 2,
      total: 2,
    },
  };

  const deliveries =
    page.props?.deliveries ??
    (import.meta.env.DEV ? SAMPLE : { data: [], meta: null });

  const rows = deliveries?.data || [];
  const meta = deliveries?.meta || null;

  const filters = page.props?.filters || {};
  const perInitial = Number(filters?.per || 10);

  const [q, setQ] = useState(filters?.q || "");
  const [status, setStatus] = useState(filters?.status || "all");
  const [payment, setPayment] = useState(filters?.payment || "all");
  const [dateFrom, setDateFrom] = useState(filters?.date_from || "");
  const [dateTo, setDateTo] = useState(filters?.date_to || "");

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "delivered", label: "Delivered" },
    { value: "failed", label: "Failed" },
    { value: "on_the_way", label: "On the way" },
    { value: "pending", label: "Pending" },
  ];

  const paymentOptions = [
    { value: "all", label: "All payments" },
    { value: "prepaid", label: "Prepaid" },
    { value: "unpaid", label: "Unpaid" },
    { value: "refunded", label: "Refunded" },
  ];

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/rider/history",
      {
        q,
        status,
        payment,
        date_from: dateFrom,
        date_to: dateTo,
        per: perInitial,
        ...patch,
      },
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

  const tableRows = loading ? fillerRows : rows;

  const summary = useMemo(() => {
    const total = rows.length;
    const delivered = rows.filter((r) => String(r.status).toLowerCase() === "delivered").length;
    const failed = rows.filter((r) => String(r.status).toLowerCase() === "failed").length;
    return { total, delivered, failed };
  }, [rows]);

  const columns = useMemo(
    () => [
      {
        key: "when",
        label: "When",
        render: (d) =>
          d?.__filler ? (
            <SkeletonLine w="w-28" />
          ) : (
            <div className="text-sm font-semibold text-slate-900">
              {d.delivered_at || ""}
            </div>
          ),
      },
      {
        key: "code",
        label: "Code",
        render: (d) =>
          d?.__filler ? (
            <SkeletonLine w="w-24" />
          ) : (
            <div className="text-sm font-extrabold text-slate-900">
              {d.code || `DLV-${d.id}`}
            </div>
          ),
      },
      {
        key: "customer",
        label: "Customer",
        render: (d) =>
          d?.__filler ? (
            <SkeletonLine w="w-36" />
          ) : (
            <div className="text-sm font-extrabold text-slate-900">
              {d.customer_name || "Customer"}
            </div>
          ),
      },
      {
        key: "address",
        label: "Address",
        render: (d) =>
          d?.__filler ? (
            <SkeletonLine w="w-48" />
          ) : (
            <div className="max-w-[420px] truncate text-sm text-slate-700">
              {d.address || ""}
            </div>
          ),
      },
      {
        key: "items",
        label: "Items",
        render: (d) =>
          d?.__filler ? (
            <SkeletonLine w="w-10" />
          ) : (
            <div className="text-sm font-semibold text-slate-700">
              {Number(d.items_count || 0)}
            </div>
          ),
      },
      {
        key: "payment",
        label: "Payment",
        render: (d) =>
          d?.__filler ? (
            <SkeletonPill w="w-20" />
          ) : (
            <PayPill payment_status={d.payment_status || "prepaid"} />
          ),
      },
      {
        key: "status",
        label: "Status",
        render: (d) =>
          d?.__filler ? (
            <SkeletonPill w="w-20" />
          ) : (
            <StatusPill status={d.status} />
          ),
      },
    ],
    []
  );

  function setLastDays(days) {
    const now = new Date();
    const from = new Date(now);
    from.setDate(now.getDate() - days);

    const fmt = (x) => {
      const y = x.getFullYear();
      const m = String(x.getMonth() + 1).padStart(2, "0");
      const d = String(x.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    const nextFrom = fmt(from);
    const nextTo = fmt(now);

    setDateFrom(nextFrom);
    setDateTo(nextTo);
    pushQuery({ date_from: nextFrom, date_to: nextTo, page: 1 });
  }

  return (
    <Layout title="History">
      <div className="grid gap-6">
        <TopCard
          title="Delivery History"
          subtitle="Read only record of your deliveries. Filters apply to your account only."
          right={
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 ring-1 ring-slate-200">
                <Clock className="h-4 w-4 text-slate-500" />
                <div className="text-xs font-extrabold text-slate-700">Read only</div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 ring-1 ring-slate-200">
                <div className="text-xs font-extrabold text-slate-900">{summary.total}</div>
                <div className="text-xs text-slate-600">records</div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200">
                <div className="text-xs font-extrabold text-emerald-900">{summary.delivered}</div>
                <div className="text-xs text-emerald-800">delivered</div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-3 py-2 ring-1 ring-rose-200">
                <div className="text-xs font-extrabold text-rose-900">{summary.failed}</div>
                <div className="text-xs text-rose-800">failed</div>
              </div>
            </div>
          }
        />

        <DataTableFilters
          q={q}
          onQ={(v) => {
            setQ(v);
            pushQuery({ q: v, page: 1 });
          }}
          placeholder="Search code, customer, or address..."
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
            {
              key: "payment",
              value: payment,
              onChange: (v) => {
                setPayment(v);
                pushQuery({ payment: v, page: 1 });
              },
              options: paymentOptions,
            },
          ]}
        />

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-extrabold text-slate-900">Date range</div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setLastDays(7)}
                className="rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Last 7 days
              </button>

              <button
                type="button"
                onClick={() => setLastDays(30)}
                className="rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Last 30 days
              </button>

              <div className="h-6 w-px bg-slate-200" />

              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  const v = e.target.value;
                  setDateFrom(v);
                  pushQuery({ date_from: v, page: 1 });
                }}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-800 outline-none focus:ring-4 focus:ring-teal-500/15"
              />

              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  const v = e.target.value;
                  setDateTo(v);
                  pushQuery({ date_to: v, page: 1 });
                }}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-800 outline-none focus:ring-4 focus:ring-teal-500/15"
              />
            </div>
          </div>

          <div className="p-4">
            <DataTable
              columns={columns}
              rows={tableRows}
              loading={loading}
              emptyTitle="No delivery history"
              emptyHint="Completed deliveries will appear here."
              renderActions={(d) =>
                d?.__filler ? (
                  <SkeletonButton w="w-24" />
                ) : (
                  <div className="flex items-center justify-end gap-2">
                    {d.address ? (
                      <a
                        href={mapsOpenUrl(d.address)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                        title="Open address in Google Maps"
                      >
                        <MapPin className="h-4 w-4" />
                        Map
                      </a>
                    ) : null}

                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                      title="Details modal later"
                      onClick={() => {
                        // Optional later: open a read-only modal showing full delivery payload
                        // Keep Rider History read-only
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Details
                    </button>
                  </div>
                )
              }
            />
          </div>
        </div>

        <DataTablePagination
          meta={meta}
          perPage={perInitial}
          onPerPage={(n) => pushQuery({ per: n, page: 1 })}
          onPrev={() =>
            meta && meta.current_page > 1 && pushQuery({ page: meta.current_page - 1 })
          }
          onNext={() =>
            meta && meta.current_page < meta.last_page && pushQuery({ page: meta.current_page + 1 })
          }
          disablePrev={!meta || meta.current_page <= 1}
          disableNext={!meta || meta.current_page >= meta.last_page}
        />
      </div>
    </Layout>
  );
}
