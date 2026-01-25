import React, { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";

import NewPurchaseModal from "@/components/modals/InventoryModals/NewPurchaseModal";
import ConfirmDeliveryModal from "@/components/modals/InventoryModals/ConfirmDeliveryModal";
import PurchaseViewModal from "@/components/modals/InventoryModals/PurchaseViewModal";

import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  AlertTriangle,
} from "lucide-react";

import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function normalizeStatus(status) {
  return String(status || "").toLowerCase().replace(/\s+/g, "_");
}

function StatusPill({ status }) {
  const s = normalizeStatus(status);

  const tone =
    s === "approved"
      ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
      : s === "pending"
      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
      : s === "rejected"
      ? "bg-rose-600/10 text-rose-900 ring-rose-700/10"
      : s === "delivered" || s === "awaiting_confirmation"
      ? "bg-sky-600/10 text-sky-900 ring-sky-700/10"
      : s === "completed"
      ? "bg-emerald-600/10 text-emerald-900 ring-emerald-700/10"
      : s === "discrepancy_reported"
      ? "bg-orange-600/10 text-orange-900 ring-orange-700/10"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  const label =
    s === "awaiting_confirmation"
      ? "AWAITING CONFIRMATION"
      : s === "discrepancy_reported"
      ? "DISCREPANCY"
      : String(status || "pending").toUpperCase();

  return (
    <span className={cx("inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1", tone)}>
      {label}
    </span>
  );
}

export default function Purchases() {
  const page = usePage();
  const roleKey = page.props?.auth?.user?.role || "";

  /* ================= SAMPLE DATA (KEPT) ================= */
  const SAMPLE_PURCHASES = {
    data: [
      {
        id: 1,
        reference_no: "P-000051",
        supplier_name: "Petron LPG Supply",
        product_name: "LPG Cylinder",
        variant: "11kg",
        qty: 12,
        total_cost: 11760,
        status: "pending",
        created_at: "Today 09:12 AM",
      },
      {
        id: 2,
        reference_no: "P-000050",
        supplier_name: "Shellane Distributors",
        product_name: "LPG Cylinder",
        variant: "22kg",
        qty: 6,
        total_cost: 11100,
        status: "approved",
        created_at: "Yesterday 04:40 PM",
      },
      {
        id: 3,
        reference_no: "P-000049",
        supplier_name: "Regasco Trading",
        product_name: "LPG Cylinder",
        variant: "50kg",
        qty: 2,
        total_cost: 8400,
        status: "awaiting_confirmation",
        created_at: "Jan 17 01:15 PM",
      },
    ],
    meta: { current_page: 1, last_page: 1, from: 1, to: 3, total: 3 },
  };

  const purchases =
    page.props?.purchases ??
    (import.meta.env.DEV ? SAMPLE_PURCHASES : { data: [], meta: null });

  const rows = purchases.data;
  const meta = purchases.meta;

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const [newOpen, setNewOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState("confirm");
  const [activeRow, setActiveRow] = useState(null);

  const isInventoryManager = roleKey === "inventory_manager";
  const canConfirmDelivery = (x) =>
    isInventoryManager &&
    ["delivered", "awaiting_confirmation"].includes(normalizeStatus(x.status));

  const columns = useMemo(
    () => [
      { key: "ref", label: "Reference", render: (x) => <b>{x.reference_no}</b> },
      { key: "supplier", label: "Supplier", render: (x) => x.supplier_name },
      {
        key: "item",
        label: "Item",
        render: (x) => `${x.product_name} (${x.variant})`,
      },
      { key: "qty", label: "Qty", render: (x) => x.qty },
      {
        key: "cost",
        label: "Total",
        render: (x) => `₱${Number(x.total_cost).toLocaleString()}`,
      },
      {
        key: "status",
        label: "Status",
        render: (x) => <StatusPill status={x.status} />,
      },
      { key: "date", label: "Created", render: (x) => x.created_at },
    ],
    []
  );

  return (
    <Layout title="Purchases">
      <div className="grid gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-extrabold">Purchases</h2>
          <button
            onClick={() => setNewOpen(true)}
            className="inline-flex gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white"
          >
            <PlusCircle className="h-4 w-4" /> New purchase
          </button>
        </div>

        <DataTableFilters
          q={q}
          onQ={setQ}
          filters={[
            {
              key: "status",
              value: status,
              onChange: setStatus,
              options: [
                { value: "all", label: "All" },
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "awaiting_confirmation", label: "Awaiting confirmation" },
              ],
            },
          ]}
        />

        <DataTable
          columns={columns}
          rows={rows}
          renderActions={(x) => (
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setViewItem(x)}
                className="rounded-2xl px-3 py-2 text-xs ring-1 ring-slate-200"
              >
                <FileText className="h-4 w-4" /> View
              </button>

              {canConfirmDelivery(x) && (
                <>
                  <button
                    onClick={() => {
                      setActiveRow(x);
                      setConfirmMode("confirm");
                      setConfirmOpen(true);
                    }}
                    className="rounded-2xl bg-teal-600 px-3 py-2 text-xs text-white"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Confirm
                  </button>

                  <button
                    onClick={() => {
                      setActiveRow(x);
                      setConfirmMode("report");
                      setConfirmOpen(true);
                    }}
                    className="rounded-2xl px-3 py-2 text-xs ring-1 ring-slate-200"
                  >
                    <AlertTriangle className="h-4 w-4" /> Report
                  </button>
                </>
              )}

              {normalizeStatus(x.status) === "rejected" && (
                <span className="text-xs text-rose-700 font-bold">
                  <XCircle className="inline h-4 w-4" /> Rejected
                </span>
              )}
            </div>
          )}
        />

        <DataTablePagination meta={meta} />
      </div>

      {/* MODALS */}
      <NewPurchaseModal open={newOpen} onClose={() => setNewOpen(false)} />

      <PurchaseViewModal
        open={Boolean(viewItem)}
        item={viewItem}
        onClose={() => setViewItem(null)}
      />

      <ConfirmDeliveryModal
        open={confirmOpen}
        mode={confirmMode}
        purchase={activeRow}
        onClose={() => setConfirmOpen(false)}
        onSubmit={(payload) => {
          const url =
            confirmMode === "report"
              ? `/dashboard/inventory/purchases/${activeRow.id}/discrepancy`
              : `/dashboard/inventory/purchases/${activeRow.id}/confirm`;

          router.post(url, payload, {
            preserveScroll: true,
            onSuccess: () => setConfirmOpen(false),
          });
        }}
      />
    </Layout>
  );
}
  