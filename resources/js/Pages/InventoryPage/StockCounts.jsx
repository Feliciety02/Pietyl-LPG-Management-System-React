import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { Boxes, PencilLine, ShieldAlert, CheckCircle2, X } from "lucide-react";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
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

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 px-4 py-2">
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      <div className="text-sm font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

function CountPill({ label, value, tone = "slate" }) {
  const cls =
    tone === "teal"
      ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
      : tone === "amber"
      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1", cls)}>
      {label} {value}
    </span>
  );
}

function ModalShell({ open, title, subtitle, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-3xl bg-white ring-1 ring-slate-200 shadow-xl">
          <div className="p-6 border-b border-slate-200 flex items-start justify-between gap-4">
            <div>
              <div className="text-base font-extrabold text-slate-900">{title}</div>
              <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
            </div>
            <button
              type="button"
              className="rounded-2xl bg-white p-2 ring-1 ring-slate-200 hover:bg-slate-50"
              onClick={onClose}
              title="Close"
            >
              <X className="h-4 w-4 text-slate-600" />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function StockCounts() {
  const page = usePage();

 
  /*
    Expected Inertia props from backend:
    stock_counts: {
      data: [{
        id,
        sku,
        product_name,
        variant,
        filled_qty,
        empty_qty,
        total_qty,
        last_counted_at,
        updated_by
      }],
      meta,
      links
    }
    filters: { q, page, per }
  */

  // DEV ONLY – sample stock counts for UI development
  const SAMPLE_STOCK = {
    data: [
      {
        id: 1,
        sku: "LPG-11KG",
        product_name: "LPG Cylinder",
        variant: "11kg",
        filled_qty: 24,
        empty_qty: 18,
        total_qty: 42,
        last_counted_at: "Today 09:45 AM",
        updated_by: "Inventory Manager",
      },
      {
        id: 2,
        sku: "LPG-22KG",
        product_name: "LPG Cylinder",
        variant: "22kg",
        filled_qty: 9,
        empty_qty: 7,
        total_qty: 16,
        last_counted_at: "Yesterday 04:10 PM",
        updated_by: "Inventory Manager",
      },
      {
        id: 3,
        sku: "LPG-50KG",
        product_name: "LPG Cylinder",
        variant: "50kg",
        filled_qty: 3,
        empty_qty: 2,
        total_qty: 5,
        last_counted_at: "Jan 17 11:02 AM",
        updated_by: "Inventory Manager",
      },
    ],
    meta: {
      current_page: 1,
      last_page: 1,
      from: 1,
      to: 3,
      total: 3,
    },
  };

  const stock =
    page.props?.stock_counts ??
    (import.meta.env.DEV ? SAMPLE_STOCK : { data: [], meta: null });

  const rows = stock?.data || [];
  const meta = stock?.meta || null;

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/inventory/counts",
      { q, per: perInitial, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const handleSearch = (value) => {
    setQ(value);
    pushQuery({ q: value, page: 1 });
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

  const tableRows = loading ? fillerRows : rows;

  const totals = useMemo(() => {
    if (loading) return { filled: "—", empty: "—", total: "—" };
    const filled = rows.reduce((a, r) => a + Number(r.filled_qty || 0), 0);
    const empty = rows.reduce((a, r) => a + Number(r.empty_qty || 0), 0);
    const total = rows.reduce((a, r) => a + Number(r.total_qty || 0), 0);
    return { filled, empty, total };
  }, [loading, rows]);

  const [open, setOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);

  const [filledEdit, setFilledEdit] = useState("");
  const [emptyEdit, setEmptyEdit] = useState("");
  const [reason, setReason] = useState("");

  const openAdjust = (row) => {
    setActiveRow(row);
    setFilledEdit(String(row?.filled_qty ?? ""));
    setEmptyEdit(String(row?.empty_qty ?? ""));
    setReason("");
    setOpen(true);
  };

  const closeAdjust = () => {
    setOpen(false);
    setActiveRow(null);
  };

  const submitAdjust = (e) => {
    e.preventDefault();
    if (!activeRow) return;

    const payload = {
      filled_qty: Number(filledEdit || 0),
      empty_qty: Number(emptyEdit || 0),
      reason: reason.trim(),
    };

    if (!payload.reason) return;

    router.post(`/dashboard/inventory/counts/${activeRow.id}/adjust`, payload, {
      preserveScroll: true,
      onSuccess: () => closeAdjust(),
    });
  };

  const columns = useMemo(
    () => [
      {
        key: "item",
        label: "Item",
        render: (x) =>
          x?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-44" />
              <SkeletonLine w="w-28" />
            </div>
          ) : (
            <div>
              <div className="font-extrabold text-slate-900">
                {x.product_name} <span className="text-slate-500 font-semibold">({x.variant})</span>
              </div>
              <div className="text-xs text-slate-500">{x.sku || "—"}</div>
            </div>
          ),
      },
      {
        key: "counts",
        label: "Counts",
        render: (x) =>
          x?.__filler ? (
            <div className="flex items-center gap-2">
              <SkeletonPill w="w-20" />
              <SkeletonPill w="w-20" />
              <SkeletonPill w="w-20" />
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <CountPill label="FILLED" value={x.filled_qty ?? 0} tone="teal" />
              <CountPill label="EMPTY" value={x.empty_qty ?? 0} tone="slate" />
              <CountPill label="TOTAL" value={x.total_qty ?? 0} tone="amber" />
            </div>
          ),
      },
      {
        key: "last",
        label: "Last updated",
        render: (x) =>
          x?.__filler ? (
            <SkeletonLine w="w-28" />
          ) : (
            <div className="text-sm text-slate-700">
              <div className="font-semibold text-slate-800">{x.last_counted_at || "—"}</div>
              <div className="text-xs text-slate-500">{x.updated_by ? `by ${x.updated_by}` : ""}</div>
            </div>
          ),
      },
    ],
    []
  );

  return (
    <Layout title="Stock Counts">
      <div className="grid gap-6">
        <TopCard
          title="Stock Counts"
          subtitle="Update physical counts with a reason. Every change is logged for audit."
          right={
            <div className="flex flex-wrap items-center gap-2">
              <MiniStat label="Total filled" value={totals.filled} />
              <MiniStat label="Total empty" value={totals.empty} />
              <MiniStat label="Grand total" value={totals.total} />
            </div>
          }
        />

        <DataTableFilters
          q={q}
          onQ={handleSearch}
          placeholder="Search product name or SKU..."
          filters={[]}
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          emptyTitle="No stock items found"
          emptyHint="If this is new, add products in Admin then come back here."
          renderActions={(x) =>
            x?.__filler ? (
              <SkeletonButton w="w-24" />
            ) : (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openAdjust(x)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                  title="Adjust counts"
                >
                  <PencilLine className="h-4 w-4 text-slate-600" />
                  Adjust
                </button>

                <Link
                  href={`/dashboard/inventory/movements?q=${encodeURIComponent(x.sku || "")}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                  title="View related movements"
                >
                  <Boxes className="h-4 w-4 text-slate-600" />
                  Movements
                </Link>
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

        <ModalShell
          open={open}
          title="Adjust stock counts"
          subtitle="Provide accurate counts and a clear reason. This creates an audit entry."
          onClose={closeAdjust}
        >
          <form onSubmit={submitAdjust} className="grid gap-4">
            <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
              <div className="text-sm font-extrabold text-slate-900">
                {activeRow?.product_name}{" "}
                <span className="text-slate-500 font-semibold">({activeRow?.variant})</span>
              </div>
              <div className="mt-1 text-xs text-slate-600">{activeRow?.sku}</div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold text-slate-600">Filled count</div>
                <input
                  value={filledEdit}
                  onChange={(e) => setFilledEdit(e.target.value)}
                  inputMode="numeric"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-teal-500/20"
                  placeholder="0"
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600">Empty count</div>
                <input
                  value={emptyEdit}
                  onChange={(e) => setEmptyEdit(e.target.value)}
                  inputMode="numeric"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-teal-500/20"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-600">Reason (required)</div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="mt-1 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-teal-500/20"
                placeholder="Example: physical recount after delivery return, corrected discrepancy"
              />
              <div className="mt-2 flex items-start gap-2 text-xs text-slate-600">
                <ShieldAlert className="h-4 w-4 text-slate-500 mt-0.5" />
                <div>
                  This action is audited. Avoid frequent adjustments. Always recount first.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeAdjust}
                className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!reason.trim()}
                className={cx(
                  "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold text-white transition focus:ring-4 focus:ring-teal-500/25",
                  reason.trim()
                    ? "bg-teal-600 hover:bg-teal-700"
                    : "bg-slate-300 cursor-not-allowed"
                )}
              >
                <CheckCircle2 className="h-4 w-4" />
                Save adjustment
              </button>
            </div>
          </form>
        </ModalShell>
      </div>
    </Layout>
  );
}