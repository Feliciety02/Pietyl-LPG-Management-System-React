import React, { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";

import { TableActionButton } from "@/components/Table/ActionTableButton";

import { UserPlus, Package, Eye, Pencil, Archive } from "lucide-react";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

import AddSupplierModal from "@/components/modals/SupplierModals/AddSupplierModal";
import EditSupplierModal from "@/components/modals/SupplierModals/EditSupplierModal";
import SupplierDetailsModal from "@/components/modals/SupplierModals/SupplierDetailsModal";
import ConfirmArchiveSupplierModal from "@/components/modals/SupplierModals/ConfirmArchiveSupplierModal";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
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
      {active ? "ACTIVE" : "INACTIVE"}
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

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function Suppliers() {
  const page = usePage();

  const role = page.props?.auth?.user?.role || "guest";
  const isAdmin = role === "admin";
  const readOnly = !isAdmin;

  const basePath = isAdmin
    ? "/dashboard/admin/suppliers"
    : "/dashboard/inventory/suppliers";

  /* ----------------------- DEV SAMPLE DATA -------------------------------- */

  const SAMPLE_SUPPLIERS = {
    data: [
      {
        id: 1,
        name: "Petron LPG Supply",
        contact_name: "Ramon Cruz",
        phone: "09171234567",
        email: "petron.lpg@petron.com",
        address: "Davao City",
        is_active: true,
        products_count: 3,
      },
      {
        id: 2,
        name: "Shellane Distributors",
        contact_name: "Grace Lim",
        phone: "09223334444",
        email: "shellane@distributors.ph",
        address: "Tagum City",
        is_active: true,
        products_count: 2,
      },
      {
        id: 3,
        name: "Regasco Trading",
        contact_name: "Jose Ramirez",
        phone: "09335556677",
        email: "sales@regasco.ph",
        address: "Panabo City",
        is_active: false,
        products_count: 1,
      },
    ],
    meta: { current_page: 1, last_page: 1, total: 3 },
  };

  const suppliers =
    page.props?.suppliers ??
    (import.meta.env.DEV ? SAMPLE_SUPPLIERS : { data: [], meta: null });

  const rows = suppliers?.data || [];
  const meta = suppliers?.meta || null;

  const filters = page.props?.filters || {};
  const per = Number(filters.per || 10);

  const [q, setQ] = useState(filters.q || "");
  const [status, setStatus] = useState(filters.status || "all");

  const [activeSupplier, setActiveSupplier] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const loading = Boolean(page.props?.loading);

  const statusTabs = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Archived" },
    { value: "all", label: "All" },
  ];

  const activeStatusTab = statusTabs.some((t) => t.value === status)
    ? status
    : "all";

  /* ----------------------- Query helpers ---------------------------------- */

  const pushQuery = (patch) => {
    router.get(
      basePath,
      { q, status, per, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  /* ----------------------- Table data ------------------------------------- */

  const fillerRows = useMemo(
    () =>
      Array.from({ length: per }).map((_, i) => ({
        id: `__filler__${i}`,
        __filler: true,
      })),
    [per]
  );

  const tableRows = loading ? fillerRows : rows;

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Supplier",
        render: (s) =>
          s?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-48" />
              <SkeletonLine w="w-32" />
            </div>
          ) : (
            <div>
              <div className="font-extrabold text-slate-900">{s.name}</div>
              <div className="text-xs text-slate-500">
                {s.contact_name || "No contact"} • {s.phone || "—"}
              </div>
            </div>
          ),
      },
      {
        key: "email",
        label: "Email",
        render: (s) =>
          s?.__filler ? (
            <SkeletonLine w="w-40" />
          ) : (
            <span className="text-sm text-slate-700">{s.email || "—"}</span>
          ),
      },
      {
        key: "products",
        label: "Products",
        render: (s) =>
          s?.__filler ? (
            <SkeletonLine w="w-16" />
          ) : (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-800">
              <Package className="h-4 w-4 text-slate-500" />
              {s.products_count ?? 0}
            </span>
          ),
      },
      {
        key: "status",
        label: "Status",
        render: (s) =>
          s?.__filler ? (
            <SkeletonPill w="w-20" />
          ) : (
            <StatusPill active={Boolean(s.is_active)} />
          ),
      },
    ],
    []
  );

  /* ----------------------- Submit handlers -------------------------------- */

  const createSupplier = (payload) => {
    if (submitting) return;
    setSubmitting(true);

    router.post(basePath, payload, {
      preserveScroll: true,
      onFinish: () => setSubmitting(false),
      onSuccess: () => {
        setAddOpen(false);
        router.reload({ only: ["suppliers"] });
      },
    });
  };

  const updateSupplier = (payload) => {
    if (!activeSupplier?.id || submitting) return;
    setSubmitting(true);

    router.put(`${basePath}/${activeSupplier.id}`, payload, {
      preserveScroll: true,
      onFinish: () => setSubmitting(false),
      onSuccess: () => {
        setEditOpen(false);
        router.reload({ only: ["suppliers"] });
      },
    });
  };

  const archiveSupplier = () => {
    if (!activeSupplier?.id || submitting) return;
    setSubmitting(true);

    router.post(
      `${basePath}/${activeSupplier.id}/archive`,
      {},
      {
        preserveScroll: true,
        onFinish: () => setSubmitting(false),
        onSuccess: () => {
          setArchiveOpen(false);
          router.reload({ only: ["suppliers"] });
        },
      }
    );
  };

  /* ----------------------- Render ----------------------------------------- */

  return (
    <Layout title="Suppliers">
      <div className="grid gap-6">
        <TopCard
          title="Suppliers"
          subtitle={
            readOnly
              ? "Reference list for purchasing"
              : "Manage supplier information and products"
          }
          right={
            readOnly ? null : (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 focus:ring-4 focus:ring-teal-500/25"
              >
                <UserPlus className="h-4 w-4" />
                Add Supplier
              </button>
            )
          }
        />

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-4 justify-between">
          <Tabs
            tabs={statusTabs}
            value={activeStatusTab}
            onChange={(v) => {
              setStatus(v);
              pushQuery({ status: v, page: 1 });
            }}
          />

          <DataTableFilters
            variant="inline"
            containerClass="w-full md:w-auto"
            q={q}
            onQ={(v) => {
              setQ(v);
              pushQuery({ q: v, page: 1 });
            }}
            placeholder="Search supplier name or contact..."
            filters={[
              {
                key: "status",
                value: status,
                onChange: (v) => {
                  setStatus(v);
                  pushQuery({ status: v, page: 1 });
                },
                options: [
                  { value: "all", label: "All status" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ],
              },
            ]}
          />
        </div>

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          emptyTitle="No suppliers found"
          emptyHint={readOnly ? "Ask admin to add suppliers" : "Add suppliers or adjust filters"}
          renderActions={(s) =>
              s?.__filler ? (
                <SkeletonButton w="w-20" />
              ) : (
                <div className="flex items-center justify-end gap-2">
                  <TableActionButton
                    icon={Package}
                    onClick={() => {
                      setActiveSupplier(s);
                      setDetailsOpen(true);
                    }}
                    title="View supplier"
                  >
                    View
                  </TableActionButton>

                  {!readOnly ? (
                    <>
                      <TableActionButton
                        icon={Pencil}
                        onClick={() => {
                          setActiveSupplier(s);
                          setEditOpen(true);
                        }}
                        title="Edit supplier"
                      >
                        Edit
                      </TableActionButton>

                      <TableActionButton
                        tone="danger"
                        icon={Archive}
                        onClick={() => {
                          setActiveSupplier(s);
                          setArchiveOpen(true);
                        }}
                        title="Archive supplier"
                      >
                        Archive
                      </TableActionButton>
                    </>
                  ) : null}
                </div>
              )
            }
        />

        <DataTablePagination
          meta={meta}
          perPage={per}
          onPerPage={(n) => pushQuery({ per: n, page: 1 })}
          onPrev={() => meta?.current_page > 1 && pushQuery({ page: meta.current_page - 1 })}
          onNext={() =>
            meta?.current_page < meta?.last_page &&
            pushQuery({ page: meta.current_page + 1 })
          }
          disablePrev={!meta || meta.current_page <= 1}
          disableNext={!meta || meta.current_page >= meta.last_page}
        />
      </div>

      {/* Modals */}
      <AddSupplierModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={createSupplier}
        loading={submitting}
      />

      <SupplierDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        supplier={activeSupplier}
      />

      <EditSupplierModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        supplier={activeSupplier}
        onSubmit={updateSupplier}
        loading={submitting}
      />

      <ConfirmArchiveSupplierModal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        supplier={activeSupplier}
        onConfirm={archiveSupplier}
        loading={submitting}
      />
    </Layout>
  );
}
