import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { MoreVertical, PackagePlus, Building2 } from "lucide-react";
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

function StatusPill({ active }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        active
          ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
          : "bg-slate-100 text-slate-700 ring-slate-200"
      )}
    >
      {active ? "ACTIVE" : "ARCHIVED"}
    </span>
  );
}

function TypePill({ value }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
      {titleCase(value || "type").toUpperCase()}
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

function ProductThumb({ src, name }) {
  return (
    <div className="h-11 w-11 rounded-2xl bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center overflow-hidden">
      {src ? (
        <img src={src} alt={name || "Product"} className="h-full w-full object-cover" />
      ) : (
        <div className="h-6 w-6 rounded-xl bg-teal-600/20" />
      )}
    </div>
  );
}

export default function Products() {
  const page = usePage();

  /*
    Expected Inertia props from backend:
    products: {
      data: [{
        id,
        sku,
        name,
        brand,
        type,              string (ex: "lpg", "accessory")
        size_label,        string (ex: "11kg", "22kg")
        default_price,     number|string
        is_active,         boolean
        image_url,         string|null
        supplier: { id, name } | null
      }],
      meta,
      links
    }
    suppliers: [{ id, name }] (optional for filter dropdown)
    filters: { q, status, supplier_id, type, page, per }
    loading: boolean (optional)
  */

  const products = page.props?.products || { data: [], meta: null };
  const rows = products?.data || [];
  const meta = products?.meta || null;

  const suppliers = page.props?.suppliers || [];

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const statusInitial = query?.status || "all";
  const supplierInitial = String(query?.supplier_id || "all");
  const typeInitial = query?.type || "all";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [status, setStatus] = useState(statusInitial);
  const [supplierId, setSupplierId] = useState(supplierInitial);
  const [type, setType] = useState(typeInitial);

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "active", label: "Active" },
    { value: "archived", label: "Archived" },
  ];

  const supplierOptions = useMemo(() => {
    return [
      { value: "all", label: "All suppliers" },
      ...suppliers.map((s) => ({ value: String(s.id), label: s.name })),
    ];
  }, [suppliers]);

  const typeOptions = useMemo(() => {
    const set = new Set();
    rows.forEach((p) => {
      if (p?.type) set.add(String(p.type));
    });
    const types = Array.from(set).sort();
    return [
      { value: "all", label: "All types" },
      ...types.map((t) => ({ value: t, label: titleCase(t) })),
    ];
  }, [rows]);

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/admin/products",
      { q, status, supplier_id: supplierId, type, per: perInitial, ...patch },
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

  const handleSupplier = (value) => {
    setSupplierId(value);
    pushQuery({ supplier_id: value, page: 1 });
  };

  const handleType = (value) => {
    setType(value);
    pushQuery({ type: value, page: 1 });
  };

  const handlePerPage = (n) => pushQuery({ per: n, page: 1 });
  const handlePrev = () => meta && meta.current_page > 1 && pushQuery({ page: meta.current_page - 1 });
  const handleNext = () => meta && meta.current_page < meta.last_page && pushQuery({ page: meta.current_page + 1 });

  const loading = Boolean(page.props?.loading);
  const fillerRows = useMemo(
    () => Array.from({ length: perInitial }).map((_, i) => ({ id: `__filler__${i}`, __filler: true })),
    [perInitial]
  );

  const tableRows = loading ? fillerRows : rows;

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Product",
        render: (p) =>
          p?.__filler ? (
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-slate-200/70 animate-pulse" />
              <div className="space-y-2">
                <SkeletonLine w="w-40" />
                <SkeletonLine w="w-28" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <ProductThumb src={p?.image_url} name={p?.name} />
              <div className="min-w-0">
                <div className="font-extrabold text-slate-900 truncate">
                  {p?.name || "Product"}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {(p?.brand ? `${p.brand} • ` : "") + (p?.sku || "No SKU")}
                </div>
              </div>
            </div>
          ),
      },
      {
        key: "type",
        label: "Type",
        render: (p) => (p?.__filler ? <SkeletonPill w="w-20" /> : <TypePill value={p?.type} />),
      },
      {
        key: "size",
        label: "Size",
        render: (p) =>
          p?.__filler ? (
            <SkeletonLine w="w-16" />
          ) : (
            <span className="text-sm font-semibold text-slate-800">
              {p?.size_label || "-"}
            </span>
          ),
      },
      {
        key: "supplier",
        label: "Supplier",
        render: (p) =>
          p?.__filler ? (
            <SkeletonLine w="w-28" />
          ) : (
            <span className="text-sm text-slate-700">
              {p?.supplier?.name || "Not set"}
            </span>
          ),
      },
      {
        key: "default_price",
        label: "Default price",
        render: (p) =>
          p?.__filler ? (
            <SkeletonLine w="w-20" />
          ) : (
            <span className="text-sm font-semibold text-slate-800">
              {p?.default_price ?? "—"}
            </span>
          ),
      },
      {
        key: "status",
        label: "Status",
        render: (p) =>
          p?.__filler ? <SkeletonPill w="w-20" /> : <StatusPill active={Boolean(p?.is_active)} />,
      },
    ],
    []
  );

  return (
    <Layout title="Products">
      {/* Admin Products
         Purpose
         Maintain the official product catalog
         Scope lock
         No stock adjustments and no sales entry here
      */}
      <div className="grid gap-6">
        <TopCard
          title="Product Catalog"
          subtitle="Add and maintain LPG products, variants, pricing defaults, and suppliers."
          right={
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/admin/products/create"
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25"
              >
                <PackagePlus className="h-4 w-4" />
                New Product
              </Link>

              <Link
                href="/dashboard/admin/suppliers"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:outline-none focus:ring-4 focus:ring-teal-500/15"
              >
                <Building2 className="h-4 w-4 text-teal-700" />
                Suppliers
              </Link>
            </div>
          }
        />

        <DataTableFilters
          q={q}
          onQ={handleSearch}
          placeholder="Search product name, brand, sku..."
          filters={[
            {
              key: "status",
              value: status,
              onChange: handleStatus,
              options: statusOptions,
            },
            {
              key: "supplier",
              value: supplierId,
              onChange: handleSupplier,
              options: supplierOptions,
            },
            {
              key: "type",
              value: type,
              onChange: handleType,
              options: typeOptions,
            },
          ]}
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          emptyTitle="No products found"
          emptyHint="Create a new product or adjust filters."
          renderActions={(p) =>
            p?.__filler ? (
              <div className="flex items-center justify-end gap-2">
                <SkeletonButton w="w-20" />
                <div className="h-9 w-9 rounded-2xl bg-slate-200/80 animate-pulse" />
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/dashboard/admin/products/${p.id}/edit`}
                  className="rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                >
                  Edit
                </Link>

                <button
                  type="button"
                  className="rounded-2xl bg-white p-2 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:outline-none focus:ring-4 focus:ring-teal-500/15"
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
