// resources/js/pages/.../Customers.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";

import { UserPlus, History, Eye, Pencil, ShoppingCart } from "lucide-react";
import { SkeletonLine, SkeletonButton } from "@/components/ui/Skeleton";

import {
  TableActionButton,
} from "@/components/Table/ActionTableButton";

import AddCustomerModal from "@/components/modals/CustomerModals/AddCustomerModal";
import CustomerDetailsModal from "@/components/modals/CustomerModals/CustomerDetailsModal";
import EditCustomerModal from "@/components/modals/CustomerModals/EditCustomerModal";

/* -------------------------------------------------------------------------- */
/* Layout                                                                      */
/* -------------------------------------------------------------------------- */

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
/* Role helpers                                                                */
/* -------------------------------------------------------------------------- */

function getRoleKey(user) {
  return String(user?.role || "cashier");
}

function buildRoleRoutes(roleKey) {
  const isAdmin = roleKey === "admin";
  const isCashier = roleKey === "cashier";

  const base = isAdmin ? "/dashboard/admin" : "/dashboard/cashier";

  return {
    isAdmin,
    isCashier,
    listHref: `${base}/customers`,
    postTo: `${base}/customers`,
    updateBase: `${base}/customers`,
    posHref: "/dashboard/cashier/new-sale",
  };
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function Customers() {
  const page = usePage();
  const user = page.props?.auth?.user;

  const roleKey = getRoleKey(user);
  const { isAdmin, isCashier, listHref, postTo, updateBase, posHref } =
    buildRoleRoutes(roleKey);

  /* DEV SAMPLE DATA */
  const SAMPLE_CUSTOMERS = {
    data: [
      {
        id: 101,
        name: "Ana Santos",
        phone: "09171234567",
        address: "Davao City",
        purchases: 12,
        last_purchase_at: "2026-01-27 09:20",
        total_spent: 8950,
        notes: "prefers morning delivery",
      },
      {
        id: 102,
        name: "Mark Dela Cruz",
        phone: "09222228899",
        address: "Panabo City",
        purchases: 6,
        last_purchase_at: "2026-01-26 14:10",
        total_spent: 4210,
        notes: "",
      },
      {
        id: 103,
        name: "Walk in profile",
        phone: "",
        address: "",
        purchases: 0,
        last_purchase_at: "",
        total_spent: 0,
        notes: "",
      },
    ],
    meta: { current_page: 1, last_page: 1, total: 3 },
  };

  const customers =
    page.props?.customers ??
    (import.meta.env.DEV ? SAMPLE_CUSTOMERS : { data: [], meta: null });

  const rows = customers.data || [];
  const meta = customers.meta || null;

  const filters = page.props?.filters || {};
  const per = Number(filters.per || 10);

  const [q, setQ] = useState(filters.q || "");
  const [openAdd, setOpenAdd] = useState(false);

  const [activeCustomer, setActiveCustomer] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const loading = Boolean(page.props?.loading);

  const pushQuery = useCallback(
    (patch) => {
      router.get(listHref, { q, per, ...patch }, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
      });
    },
    [listHref, q, per]
  );

  const handleCustomerCreated = useCallback(() => {
    setOpenAdd(false);
    pushQuery({ page: 1 });
  }, [pushQuery]);

  const fillerRows = useMemo(
    () =>
      Array.from({ length: per }).map((_, i) => ({
        id: `__filler__${i}`,
        __filler: true,
      })),
    [per]
  );

  const tableRows = loading ? fillerRows : rows;

  useEffect(() => {
    if (
      !loading &&
      meta &&
      meta.total > 0 &&
      meta.last_page &&
      meta.current_page > meta.last_page
    ) {
      pushQuery({ page: meta.last_page });
    }
  }, [loading, meta?.current_page, meta?.last_page, meta?.total, pushQuery]);

  /* -------------------------------------------------------------------------- */
  /* Actions                                                                    */
  /* -------------------------------------------------------------------------- */

  const openDetails = (c) => {
    if (!c || c.__filler) return;
    setActiveCustomer(c);
    setDetailsOpen(true);
  };

  const openEdit = (c) => {
    if (!c || c.__filler) return;
    setActiveCustomer(c);
    setEditOpen(true);
  };

  const saveEdit = (payload) => {
    if (!activeCustomer?.id) return Promise.resolve();

    return new Promise((resolve) => {
      router.put(`${updateBase}/${activeCustomer.id}`, payload, {
        preserveScroll: true,
        onSuccess: () => {
          setEditOpen(false);
        },
        onFinish: () => resolve(),
      });
    });
  };

  /* -------------------------------------------------------------------------- */
  /* Columns                                                                    */
  /* -------------------------------------------------------------------------- */

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Customer",
        render: (c) =>
          c?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-40" />
              <SkeletonLine w="w-28" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openDetails(c)}
              className="text-left group"
            >
              <div className="font-extrabold text-slate-900 group-hover:text-teal-700 transition">
                {c.name}
              </div>
              <div className="text-xs text-slate-500">
                {c.phone || "No phone"} • {c.address || "No address"}
              </div>
            </button>
          ),
      },
      {
        key: "purchases",
        label: "Purchases",
        render: (c) =>
          c?.__filler ? (
            <SkeletonLine w="w-14" />
          ) : (
            <span className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <History className="h-4 w-4 text-slate-500" />
              {c.purchases ?? 0}
            </span>
          ),
      },
    ],
    []
  );

  return (
    <Layout title="Customers">
      <div className="grid gap-6">
        <TopCard
          title="Customers"
          subtitle={
            isAdmin
              ? "View customers and purchase activity for oversight and reporting."
              : "Lookup customers and link them to a sale."
          }
          right={
            <button
              type="button"
              onClick={() => setOpenAdd(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 focus:ring-4 focus:ring-teal-500/25"
            >
              <UserPlus className="h-4 w-4" />
              Add customer
            </button>
          }
        />

        <DataTableFilters
          q={q}
          onQ={setQ}
          onQDebounced={(v) => pushQuery({ q: v, page: 1 })}
          placeholder="Search customer name or phone..."
          filters={[]}
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          searchQuery={q}
          emptyTitle="No customers found"
          emptyHint="Add a customer or adjust search."
          renderActions={(c) =>
            c?.__filler ? (
              <SkeletonButton w="w-24" />
            ) : (
              <div className="flex items-center justify-end gap-2">
                {isCashier && (
                  <TableActionButton
                    as="link"
                    href={`${posHref}?customer_id=${c.id}`}
                    icon={ShoppingCart}
                    title="Use in POS"
                  >
                    POS
                  </TableActionButton>
                )}

                <TableActionButton
                  icon={Eye}
                  onClick={() => openDetails(c)}
                  title="View customer"
                >
                  View
                </TableActionButton>

                <TableActionButton
                  icon={Pencil}
                  onClick={() => openEdit(c)}
                  title="Edit customer"
                >
                  Edit
                </TableActionButton>
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
      <AddCustomerModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        postTo={postTo}
        onCreated={handleCustomerCreated}
      />

      <CustomerDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        customer={activeCustomer}
        isAdmin={isAdmin}
        posHref={posHref}
      />

      <EditCustomerModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        customer={activeCustomer}
        onSave={saveEdit}
      />
    </Layout>
  );
}
