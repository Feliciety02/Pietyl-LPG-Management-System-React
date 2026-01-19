import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { ArrowRight, ArrowDownLeft, ArrowUpRight, Layers, ScanSearch } from "lucide-react";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function TypePill({ type }) {
  const t = String(type || "").toLowerCase();

  const tone =
    t === "purchase" || t === "refill"
      ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
      : t === "sale" || t === "delivery"
      ? "bg-slate-100 text-slate-700 ring-slate-200"
      : t === "swap"
      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        tone
      )}
    >
      {String(type || "movement").toUpperCase()}
    </span>
  );
}

function DirectionIcon({ dir }) {
  const d = String(dir || "").toLowerCase();

  const Icon =
    d === "in" ? ArrowDownLeft : d === "out" ? ArrowUpRight : Layers;

  const tone =
    d === "in"
      ? "bg-teal-600/10 ring-teal-700/10 text-teal-800"
      : d === "out"
      ? "bg-slate-100 ring-slate-200 text-slate-700"
      : "bg-slate-100 ring-slate-200 text-slate-700";

  return (
    <div className={cx("h-10 w-10 rounded-2xl ring-1 flex items-center justify-center", tone)}>
      <Icon className="h-5 w-5" />
    </div>
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

function EmptyHint() {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-10 text-center">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-teal-600/10 ring-1 ring-teal-700/10 flex items-center justify-center">
        <ScanSearch className="h-6 w-6 text-teal-700" />
      </div>
      <div className="mt-4 text-base font-extrabold text-slate-900">No movements yet</div>
      <div className="mt-1 text-sm text-slate-600">
        Once sales, deliveries, swaps, and purchases happen, they will show up here.
      </div>
    </div>
  );
}

export default function Movements() {
  const page = usePage();


  /*
    Expected Inertia props from backend:
    movements: {
      data: [{
        id,
        occurred_at,            // ISO datetime or formatted string
        direction,             // "in" | "out"
        type,                  // "sale" | "swap" | "delivery" | "purchase" | "refill"
        sku,
        product_name,
        variant,
        qty,                   // integer
        reference_type,        // "sale" | "delivery" | "purchase" | ...
        reference_id,          // string or number
        actor_name,            // who triggered the movement
      }],
      meta,
      links
    }
    filters: { q, type, dir, page, per }
  */

  // DEV ONLY – sample movements for UI development
  const SAMPLE_MOVEMENTS = {
    data: [
      {
        id: 101,
        occurred_at: "Today 09:12 AM",
        direction: "out",
        type: "sale",
        sku: "LPG-11KG",
        product_name: "LPG Cylinder",
        variant: "11kg",
        qty: 1,
        reference_type: "sale",
        reference_id: "S-000231",
        actor_name: "Cashier 1",
      },
      {
        id: 102,
        occurred_at: "Today 08:40 AM",
        direction: "in",
        type: "purchase",
        sku: "LPG-11KG",
        product_name: "LPG Cylinder",
        variant: "11kg",
        qty: 12,
        reference_type: "purchase",
        reference_id: "P-000051",
        actor_name: "Inventory Manager",
      },
      {
        id: 103,
        occurred_at: "Yesterday 06:20 PM",
        direction: "out",
        type: "delivery",
        sku: "LPG-22KG",
        product_name: "LPG Cylinder",
        variant: "22kg",
        qty: 2,
        reference_type: "delivery",
        reference_id: "D-000114",
        actor_name: "Rider 2",
      },
      {
        id: 104,
        occurred_at: "Yesterday 02:05 PM",
        direction: "in",
        type: "swap",
        sku: "LPG-11KG",
        product_name: "LPG Cylinder",
        variant: "11kg",
        qty: 1,
        reference_type: "sale",
        reference_id: "S-000219",
        actor_name: "Cashier 1",
      },
    ],
    meta: {
      current_page: 1,
      last_page: 1,
      from: 1,
      to: 4,
      total: 4,
    },
  };

  const movements =
    page.props?.movements ??
    (import.meta.env.DEV ? SAMPLE_MOVEMENTS : { data: [], meta: null });

  const rows = movements?.data || [];
  const meta = movements?.meta || null;

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const typeInitial = query?.type || "all";
  const dirInitial = query?.dir || "all";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [type, setType] = useState(typeInitial);
  const [dir, setDir] = useState(dirInitial);

  const typeOptions = [
    { value: "all", label: "All types" },
    { value: "sale", label: "Sale" },
    { value: "delivery", label: "Delivery" },
    { value: "swap", label: "Swap" },
    { value: "purchase", label: "Purchase" },
    { value: "refill", label: "Refill" },
  ];

  const dirOptions = [
    { value: "all", label: "All directions" },
    { value: "in", label: "Inbound" },
    { value: "out", label: "Outbound" },
  ];

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/inventory/movements",
      { q, type, dir, per: perInitial, ...patch },
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

  const handleDir = (value) => {
    setDir(value);
    pushQuery({ dir: value, page: 1 });
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

  const columns = useMemo(
    () => [
      {
        key: "when",
        label: "When",
        render: (x) =>
          x?.__filler ? (
            <SkeletonLine w="w-28" />
          ) : (
            <div className="text-sm font-semibold text-slate-800">{x.occurred_at || "—"}</div>
          ),
      },
      {
        key: "movement",
        label: "Movement",
        render: (x) =>
          x?.__filler ? (
            <div className="flex items-center gap-3">
              <SkeletonPill w="w-10" />
              <div className="space-y-2">
                <SkeletonLine w="w-44" />
                <SkeletonLine w="w-28" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <DirectionIcon dir={x.direction} />
              <div className="min-w-0">
                <div className="font-extrabold text-slate-900 truncate">
                  {x.product_name} <span className="text-slate-500 font-semibold">({x.variant})</span>
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {x.sku || "—"} • {x.actor_name || "System"}
                </div>
              </div>
            </div>
          ),
      },
      {
        key: "type",
        label: "Type",
        render: (x) =>
          x?.__filler ? <SkeletonPill w="w-24" /> : <TypePill type={x.type} />,
      },
      {
        key: "qty",
        label: "Qty",
        render: (x) =>
          x?.__filler ? (
            <SkeletonLine w="w-10" />
          ) : (
            <span className="text-sm font-extrabold text-slate-900">{x.qty ?? 0}</span>
          ),
      },
      {
        key: "ref",
        label: "Reference",
        render: (x) =>
          x?.__filler ? (
            <SkeletonLine w="w-24" />
          ) : (
            <span className="text-sm text-slate-700">
              {x.reference_type ? String(x.reference_type).toUpperCase() : "—"}{" "}
              {x.reference_id ? `• ${x.reference_id}` : ""}
            </span>
          ),
      },
    ],
    []
  );

  const totalCount = meta?.total ?? rows.length;

  return (
    <Layout title="Movements">
      <div className="grid gap-6">
        <TopCard
          title="Movements"
          subtitle="Read only log of inventory changes from sales, deliveries, swaps, purchases, and refills."
          right={
            <div className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200">
              {totalCount} records
            </div>
          }
        />

        <DataTableFilters
          q={q}
          onQ={handleSearch}
          placeholder="Search SKU, product, reference ID, user..."
          filters={[
            { key: "type", value: type, onChange: handleType, options: typeOptions },
            { key: "dir", value: dir, onChange: handleDir, options: dirOptions },
          ]}
        />

        {(!loading && rows.length === 0) ? (
          <EmptyHint />
        ) : (
          <DataTable
            columns={columns}
            rows={tableRows}
            loading={loading}
            emptyTitle="No movements found"
            emptyHint="Try adjusting filters."
            renderActions={(x) =>
              x?.__filler ? (
                <SkeletonButton w="w-20" />
              ) : (
                <div className="flex items-center justify-end">
                  <Link
                    href={`/dashboard/inventory/movements/${x.id}`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                    title="View movement details"
                  >
                    View
                    <ArrowRight className="h-4 w-4 text-slate-600" />
                  </Link>
                </div>
              )
            }
          />
        )}

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