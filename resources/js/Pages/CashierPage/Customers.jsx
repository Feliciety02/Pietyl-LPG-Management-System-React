// resources/js/pages/Dashboard/CashierPage/Customers.jsx
import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { UserPlus, MoreVertical, History, ArrowRight } from "lucide-react";
import { SkeletonLine, SkeletonButton } from "@/components/ui/Skeleton";
import AddCustomerModal from "@/components/modals/AddCustomerModal";

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

function getRoleKey(user) {
  return String(user?.role || "cashier");
}

function buildRoleRoutes(roleKey) {
  const isAdmin = roleKey === "admin";
  const isCashier = roleKey === "cashier";

  const listHref = isAdmin ? "/dashboard/admin/customers" : "/dashboard/cashier/customers";
  const postTo = isAdmin ? "/dashboard/admin/customers" : "/dashboard/cashier/customers";

  const posHref = "/dashboard/cashier/new-sale";

  return { isAdmin, isCashier, listHref, postTo, posHref };
}

export default function Customers() {
  const page = usePage();
  const user = page.props?.auth?.user;

  /*
    Customer Lookup (Shared)

    Purpose
    • Quick customer search for linking to sales
    • View purchase history summary

    Cashier can
    • Search customers
    • Create basic customer record
    • Link customer on POS

    Admin can
    • Search customers
    • View customer activity and history
    • Use for oversight and reporting

    Both should not
    • Delete customers (unless you explicitly allow it later)
  */

  const roleKey = getRoleKey(user);
  const { isAdmin, isCashier, listHref, postTo, posHref } = buildRoleRoutes(roleKey);

  const SAMPLE = {
    data: [
      { id: 101, name: "Ana Santos", phone: "0917 123 4567", address: "Davao City", purchases: 12 },
      { id: 102, name: "Mark Dela Cruz", phone: "0922 222 8899", address: "Panabo City", purchases: 6 },
      { id: 103, name: "Walk in profile", phone: "", address: "", purchases: 0 },
    ],
    meta: { current_page: 1, last_page: 1, from: 1, to: 3, total: 3 },
  };

  const customers =
    page.props?.customers ?? (import.meta.env.DEV ? SAMPLE : { data: [], meta: null });

  const rows = customers?.data || [];
  const meta = customers?.meta || null;

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [openAdd, setOpenAdd] = useState(false);

  const pushQuery = (patch) => {
    router.get(
      listHref,
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
            <div>
              <div className="font-extrabold text-slate-900">{c.name}</div>
              <div className="text-xs text-slate-500">
                {c.phone || "No phone"} • {c.address || "No address"}
              </div>
            </div>
          ),
      },
      {
        key: "purchases",
        label: "Purchases",
        render: (c) =>
          c?.__filler ? (
            <SkeletonLine w="w-14" />
          ) : (
            <span className="inline-flex items-center gap-1 text-sm font-extrabold text-slate-900">
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
              : "Lookup customers, view purchase history, and link them to a sale."
          }
          right={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setOpenAdd(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:ring-4 focus:ring-teal-500/25"
              >
                <UserPlus className="h-4 w-4" />
                Add customer
              </button>

            
            </div>
          }
        />

        <DataTableFilters
          q={q}
          onQ={handleSearch}
          placeholder="Search customer name or phone..."
          filters={[]}
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          emptyTitle="No customers found"
          emptyHint="Add a customer or adjust search."
          renderActions={(c) =>
            c?.__filler ? (
              <SkeletonButton w="w-20" />
            ) : (
              <div className="flex items-center justify-end gap-2">
                {isCashier ? (
                  <Link
                    href={`${posHref}?customer_id=${c.id}`}
                    className="rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    Use in POS
                  </Link>
                ) : (
                  <Link
                    href={`/dashboard/admin/customers/${c.id}`}
                    className="rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    View
                  </Link>
                )}

                <button
                  type="button"
                  className="rounded-2xl bg-white p-2 ring-1 ring-slate-200 hover:bg-slate-50"
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

      <AddCustomerModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        postTo={postTo}
        onCreated={() => {
          router.reload({ only: ["customers"] });
        }}
      />
    </Layout>
  );
}
