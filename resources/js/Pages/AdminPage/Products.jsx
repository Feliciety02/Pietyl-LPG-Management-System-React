// resources/js/Pages/AdminPage/Tabs/Products.jsx
import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";

import { PackagePlus, Building2, Pencil, Archive } from "lucide-react";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

import {
  TableActionButton,
  TableActionMenu,
} from "@/components/Table/ActionTableButton";

import AddProductModal from "@/components/modals/ProductModals/AddProductModal";
import EditProductModal from "@/components/modals/ProductModals/EditProductModal";
import ConfirmArchiveProductModal from "@/components/modals/ProductModals/ConfirmArchiveProductModal";


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

function normalizePaginator(p) {
  const x = p || {};
  const data = Array.isArray(x.data) ? x.data : [];
  const meta =
    x.meta && typeof x.meta === "object"
      ? x.meta
      : x.current_page != null || x.last_page != null
      ? x
      : null;

  return { data, meta };
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

  /* DEV ONLY */
  const SAMPLE_PRODUCTS = {
    data: [
      {
        id: 1,
        sku: "LPG-11KG-REG",
        name: "LPG Cylinder 11kg",
        brand: "Petron",
        type: "lpg",
        size_label: "11kg",
        default_price: "950.00",
        is_active: true,
        image_url: null,
        supplier: { id: 1, name: "Petron LPG Supply" },
      },
      {
        id: 2,
        sku: "LPG-22KG-REG",
        name: "LPG Cylinder 22kg",
        brand: "Petron",
        type: "lpg",
        size_label: "22kg",
        default_price: "1,850.00",
        is_active: true,
        image_url: null,
        supplier: { id: 1, name: "Petron LPG Supply" },
      },
      {
        id: 3,
        sku: "LPG-11KG-SHELL",
        name: "LPG Cylinder 11kg (Shell)",
        brand: "Shellane",
        type: "lpg",
        size_label: "11kg",
        default_price: "980.00",
        is_active: true,
        image_url: null,
        supplier: { id: 2, name: "Shellane Distributors" },
      },
      {
        id: 4,
        sku: "LPG-REFILL-11KG",
        name: "LPG Refill 11kg",
        brand: null,
        type: "refill",
        size_label: "11kg",
        default_price: "720.00",
        is_active: true,
        image_url: null,
        supplier: null,
      },
      {
        id: 5,
        sku: "LPG-REFILL-22KG",
        name: "LPG Refill 22kg",
        brand: null,
        type: "refill",
        size_label: "22kg",
        default_price: "1,420.00",
        is_active: true,
        image_url: null,
        supplier: null,
      },
      {
        id: 6,
        sku: "LPG-HOSE-STD",
        name: "LPG Hose (Standard)",
        brand: "Regasco",
        type: "accessory",
        size_label: null,
        default_price: "350.00",
        is_active: true,
        image_url: null,
        supplier: { id: 3, name: "Regasco Trading" },
      },
      {
        id: 7,
        sku: "LPG-REGULATOR",
        name: "LPG Regulator",
        brand: "Regasco",
        type: "accessory",
        size_label: null,
        default_price: "550.00",
        is_active: false,
        image_url: null,
        supplier: { id: 3, name: "Regasco Trading" },
      },
    ],
    meta: { current_page: 1, last_page: 1, from: 1, to: 7, total: 7 },
  };

  const SAMPLE_SUPPLIERS = [
    { id: 1, name: "Petron LPG Supply" },
    { id: 2, name: "Shellane Distributors" },
    { id: 3, name: "Regasco Trading" },
  ];

  const rawProducts =
    page.props?.products ??
    (import.meta.env.DEV ? SAMPLE_PRODUCTS : { data: [], meta: null });

  const rawSuppliers =
    page.props?.suppliers ?? (import.meta.env.DEV ? SAMPLE_SUPPLIERS : []);

  const { data: rows, meta } = normalizePaginator(rawProducts);
  const suppliers = Array.isArray(rawSuppliers) ? rawSuppliers : [];

  const filters = page.props?.filters || {};
  const qInitial = filters?.q || "";
  const statusInitial = filters?.status || "all";
  const supplierInitial = String(filters?.supplier_id || "all");
  const typeInitial = filters?.type || "all";
  const perInitial = Number(filters?.per || 10) || 10;

  const [q, setQ] = useState(qInitial);
  const [status, setStatus] = useState(statusInitial);
  const [supplierId, setSupplierId] = useState(supplierInitial);
  const [type, setType] = useState(typeInitial);

  const loading = Boolean(page.props?.loading);

  const pushQuery = (patch = {}) => {
    router.get(
      "/dashboard/admin/products",
      { q, status, supplier_id: supplierId, type, per: perInitial, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "All status" },
      { value: "active", label: "Active" },
      { value: "archived", label: "Archived" },
    ],
    []
  );

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

  const handlePrev = () => {
    if (!meta) return;
    if ((meta.current_page || 1) <= 1) return;
    pushQuery({ page: (meta.current_page || 1) - 1 });
  };

  const handleNext = () => {
    if (!meta) return;
    if ((meta.current_page || 1) >= (meta.last_page || 1)) return;
    pushQuery({ page: (meta.current_page || 1) + 1 });
  };

  const fillerRows = useMemo(() => {
    return Array.from({ length: perInitial }).map((_, i) => ({
      id: `__filler__${i}`,
      __filler: true,
    }));
  }, [perInitial]);

  const tableRows = loading ? fillerRows : rows;

  /* Modals */
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);

  const openEdit = (p) => {
    if (!p || p.__filler) return;
    setActiveProduct(p);
    setEditOpen(true);
  };

  const openArchive = (p) => {
    if (!p || p.__filler) return;
    setActiveProduct(p);
    setArchiveOpen(true);
  };

  const createProduct = (payload) => {
    router.post("/dashboard/admin/products", payload, {
      preserveScroll: true,
      onSuccess: () => {
        setAddOpen(false);
        router.reload({ only: ["products"] });
      },
    });
  };

  const saveEdit = (payload) => {
    if (!activeProduct?.id) return Promise.resolve();

    return new Promise((resolve) => {
      router.put(`/dashboard/admin/products/${activeProduct.id}`, payload, {
        preserveScroll: true,
        onSuccess: () => {
          setEditOpen(false);
          router.reload({ only: ["products"] });
        },
        onFinish: () => resolve(),
      });
    });
  };

  const confirmArchive = () => {
    if (!activeProduct?.id) return;

    router.post(`/dashboard/admin/products/${activeProduct.id}/archive`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        setArchiveOpen(false);
        router.reload({ only: ["products"] });
      },
    });
  };

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
                <div className="font-extrabold text-slate-900 truncate">{p?.name || "Product"}</div>
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
            <span className="text-sm font-semibold text-slate-800">{p?.size_label || "—"}</span>
          ),
      },
      {
        key: "supplier",
        label: "Supplier",
        render: (p) =>
          p?.__filler ? (
            <SkeletonLine w="w-28" />
          ) : (
            <span className="text-sm text-slate-700">{p?.supplier?.name || "Not set"}</span>
          ),
      },
      {
        key: "default_price",
        label: "Default price",
        render: (p) =>
          p?.__filler ? (
            <SkeletonLine w="w-20" />
          ) : (
            <span className="text-sm font-semibold text-slate-800">{p?.default_price ?? "—"}</span>
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
      <div className="grid gap-6">
        <TopCard
          title="Product Catalog"
          subtitle="Add and maintain LPG products, variants, pricing defaults, and suppliers."
          right={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25"
              >
                <PackagePlus className="h-4 w-4" />
                New Product
              </button>

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
          onQ={(v) => {
            setQ(v);
            pushQuery({ q: v, page: 1 });
          }}
          placeholder="Search product name, brand, sku..."
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
              key: "supplier",
              value: supplierId,
              onChange: (v) => {
                setSupplierId(v);
                pushQuery({ supplier_id: v, page: 1 });
              },
              options: supplierOptions,
            },
            {
              key: "type",
              value: type,
              onChange: (v) => {
                setType(v);
                pushQuery({ type: v, page: 1 });
              },
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
                <div className="h-9 w-9 rounded-xl bg-slate-200/80 animate-pulse" />
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <TableActionButton
                  icon={Pencil}
                  onClick={() => openEdit(p)}
                  title="Edit product"
                >
                  Edit
                </TableActionButton>

                <TableActionMenu
                  onClick={() => openArchive(p)}
                  title="More actions"
                />
              </div>
            )
          }
        />

        <DataTablePagination
          meta={meta}
          perPage={perInitial}
          onPerPage={(n) => pushQuery({ per: n, page: 1 })}
          onPrev={handlePrev}
          onNext={handleNext}
          disablePrev={!meta || (meta.current_page || 1) <= 1}
          disableNext={!meta || (meta.current_page || 1) >= (meta.last_page || 1)}
        />
      </div>

      {/* Modals */}
      <AddProductModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={createProduct}
      />

      <EditProductModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        product={activeProduct}
        onSave={saveEdit}
      />

      <ConfirmArchiveProductModal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        product={activeProduct}
        icon={Archive}
        onConfirm={confirmArchive}
      />
    </Layout>
  );
}
