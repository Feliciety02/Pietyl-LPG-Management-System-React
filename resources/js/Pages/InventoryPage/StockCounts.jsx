// resources/js/pages/Inventory/StockCounts.jsx
import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { Boxes, PencilLine } from "lucide-react";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";
import RecountStockModal from "@/components/modals/RecountStockModal";

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

function CountPill({ label, value, tone = "slate" }) {
  const cls =
    tone === "teal"
      ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
      : tone === "amber"
      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        cls
      )}
    >
      {label} {value}
    </span>
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

  
  const stock = page.props?.stock_counts ?? { data: [], meta: null };

  const rows = stock?.data || [];
  const meta = stock?.meta || null;

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);

  const [open, setOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);

  const [filledEdit, setFilledEdit] = useState("");
  const [emptyEdit, setEmptyEdit] = useState("");
  const [reason, setReason] = useState("");

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

  const doSubmitAdjust = () => {
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
                {x.product_name}{" "}
                <span className="text-slate-500 font-semibold">({x.variant})</span>
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
              <CountPill label="TOTAL" value={(x.filled_qty || 0) + (x.empty_qty || 0)} tone="amber" />
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
              <div className="text-xs text-slate-500">
                {x.updated_by ? `by ${x.updated_by}` : ""}
              </div>
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

        <RecountStockModal
          open={open}
          onClose={closeAdjust}
          onSubmit={doSubmitAdjust}
          item={activeRow}
          filled={filledEdit}
          empty={emptyEdit}
          reason={reason}
          setFilled={setFilledEdit}
          setEmpty={setEmptyEdit}
          setReason={setReason}
          submitting={false}
        />
      </div>
    </Layout>
  );
}
