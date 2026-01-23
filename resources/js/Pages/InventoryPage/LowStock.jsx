// resources/js/pages/InventoryPage/LowStock.jsx
import React, { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";

import {
  SkeletonLine,
  SkeletonPill,
  SkeletonButton,
} from "@/components/ui/Skeleton";

import NotifyAdminModal from "@/components/modals/NotifyAdminModal";
import ThresholdsModal from "@/components/modals/ThresholdsModal";
import ConfirmActionModal from "@/components/modals/ConfirmActionModal";
import PurchaseRequestModal from "@/components/modals/PurchaseRequestModal";
import NewPurchaseModal from "@/components/modals/NewPurchaseModal";

import { inventoryActionIcons } from "@/components/ui/Icons";

const {
  warning: AlertTriangle,
  arrow: ArrowRight,
  newPurchase: PlusCircle,
  notify: Bell,
  approve: CheckCircle2,
  reject: XCircle,
  thresholds: SlidersHorizontal,
} = inventoryActionIcons;

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

/* friendly wording helpers */
function getRiskCopy(level) {
  const v = String(level || "ok").toLowerCase();
  if (v === "critical") return { label: "URGENT", hint: "Very low. Restock now." };
  if (v === "warning") return { label: "LOW", hint: "Getting low. Plan to restock." };
  return { label: "OK", hint: "Stock level is fine." };
}

function RiskPill({ level }) {
  const v = String(level || "ok").toLowerCase();
  const tone =
    v === "critical"
      ? "bg-rose-600/10 text-rose-900 ring-rose-700/10"
      : v === "warning"
      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  const { label, hint } = getRiskCopy(v);

  return (
    <span
      title={hint}
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        tone
      )}
    >
      {label}
    </span>
  );
}

function StatusPill({ status }) {
  const s = String(status || "none").toLowerCase();

  const tone =
    s === "pending"
      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
      : s === "approved"
      ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
      : s === "rejected"
      ? "bg-rose-600/10 text-rose-900 ring-rose-700/10"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  const label =
    s === "pending"
      ? "WAITING"
      : s === "approved"
      ? "APPROVED"
      : s === "rejected"
      ? "DECLINED"
      : "NONE";

  const hint =
    s === "pending"
      ? "Waiting for owner approval"
      : s === "approved"
      ? "Approved by owner"
      : s === "rejected"
      ? "Declined by owner"
      : "No request yet";

  return (
    <span
      title={hint}
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        tone
      )}
    >
      {label}
    </span>
  );
}

function QtyBar({ current = 0, threshold = 0 }) {
  const safeThreshold = Math.max(Number(threshold || 0), 0);
  const safeCurrent = Math.max(Number(current || 0), 0);

  const ratio = safeThreshold <= 0 ? 0 : Math.min(safeCurrent / safeThreshold, 1);
  const pct = Math.round(ratio * 100);

  const restockLabel = safeThreshold > 0 ? safeThreshold : "Off";
  const tip =
    safeThreshold > 0
      ? "Restock level is the number where you start ordering again."
      : "Restock alerts are turned off for this item.";

  return (
    <div className="w-full max-w-[200px]">
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span title="How many items you currently have">{safeCurrent} in stock</span>
        <span title={tip}>
          restock at {restockLabel}
        </span>
      </div>

      <div className="mt-1 h-2 w-full rounded-full bg-slate-100 ring-1 ring-slate-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-teal-600"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-1 text-[11px] text-slate-500">
        {safeThreshold > 0 ? (
          safeCurrent <= safeThreshold ? (
            <span className="font-semibold text-amber-800">
              Low now. Time to restock.
            </span>
          ) : (
            <span>OK</span>
          )
        ) : (
          <span>Alerts off</span>
        )}
      </div>
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
        <AlertTriangle className="h-6 w-6 text-teal-700" />
      </div>
      <div className="mt-4 text-base font-extrabold text-slate-900">
        Everything looks good
      </div>
      <div className="mt-1 text-sm text-slate-600">
        No items are currently low based on your restock levels.
      </div>
    </div>
  );
}

export default function LowStock() {
  const page = usePage();

  const roleKey = page.props?.auth?.user?.role || "inventory_manager";
  const isAdmin = roleKey === "admin";

  const [createPurchaseOpen, setCreatePurchaseOpen] = useState(false);

  // expected from backend
  // products: [{ id, sku, name, variant, default_supplier_id, supplier_ids: [] }]
  // suppliers: [{ id, name }]
  const products =
    page.props?.products ??
    (import.meta.env.DEV
      ? [
          {
            id: 11,
            sku: "LPG-11KG",
            name: "LPG Cylinder",
            variant: "11kg",
            default_supplier_id: 1,
          },
          {
            id: 12,
            sku: "LPG-22KG",
            name: "LPG Cylinder",
            variant: "22kg",
            default_supplier_id: 2,
          },
          {
            id: 31,
            sku: "REG-REFILL",
            name: "Refill Service",
            variant: "Standard",
            default_supplier_id: 3,
          },
        ]
      : []);

  const suppliers =
    page.props?.suppliers ??
    (import.meta.env.DEV
      ? [
          { id: 1, name: "Petron LPG Supply" },
          { id: 2, name: "Shellane Distributors" },
          { id: 3, name: "Regasco Trading" },
        ]
      : []);
  

  
  const SAMPLE_LOW_STOCK = {
    data: [
      {
        id: 11,
        sku: "LPG-11KG",
        name: "LPG Cylinder",
        variant: "11kg",
        supplier_name: "Petron LPG Supply",
        current_qty: 2,
        reorder_level: 10,
        est_days_left: 2,
        risk_level: "critical",
        last_movement_at: "Today 10:24 AM",
        purchase_request_id: 901,
        purchase_request_status: "pending",
        requested_by_name: "Inventory Manager",
        requested_at: "Today 9:11 AM",
      },
      {
        id: 12,
        sku: "LPG-22KG",
        name: "LPG Cylinder",
        variant: "22kg",
        supplier_name: "Shellane Distributors",
        current_qty: 6,
        reorder_level: 12,
        est_days_left: 4,
        risk_level: "warning",
        last_movement_at: "Yesterday 5:10 PM",
        purchase_request_id: null,
        purchase_request_status: "none",
        requested_by_name: null,
        requested_at: null,
      },
      {
        id: 31,
        sku: "REG-REFILL",
        name: "Refill Service",
        variant: "Standard",
        supplier_name: "Regasco Trading",
        current_qty: 8,
        reorder_level: 15,
        est_days_left: null,
        risk_level: "warning",
        last_movement_at: "Yesterday 3:02 PM",
        purchase_request_id: 905,
        purchase_request_status: "approved",
        requested_by_name: "Inventory Manager",
        requested_at: "Yesterday 9:02 AM",
      },
    ],
    meta: { current_page: 1, last_page: 1, from: 1, to: 3, total: 3 },
  };

  const lowStock = page.props?.low_stock ?? { data: [], meta: null };

  const rows = lowStock?.data || [];
  const meta = lowStock?.meta || null;

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const riskInitial = query?.risk || "all";
  const reqInitial = query?.req || "all";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [risk, setRisk] = useState(riskInitial);
  const [req, setReq] = useState(reqInitial);

  const [notifyOpen, setNotifyOpen] = useState(false);
  const [thresholdsOpen, setThresholdsOpen] = useState(false);

  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [purchaseItem, setPurchaseItem] = useState(null);

  const [confirm, setConfirm] = useState({
    open: false,
    tone: "teal",
    title: "",
    message: "",
    onConfirm: null,
  });

  const riskOptions = [
    { value: "all", label: "All levels" },
    { value: "critical", label: "Urgent" },
    { value: "warning", label: "Low" },
  ];

  const reqOptions = [
    { value: "all", label: "All" },
    { value: "none", label: "No request" },
    { value: "pending", label: "Waiting" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Declined" },
  ];

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/inventory/low-stock",
      { q, risk, req, per: perInitial, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const handleSearch = (value) => {
    setQ(value);
    pushQuery({ q: value, page: 1 });
  };

  const handleRisk = (value) => {
    setRisk(value);
    pushQuery({ risk: value, page: 1 });
  };

  const handleReq = (value) => {
    setReq(value);
    pushQuery({ req: value, page: 1 });
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
  const urgentCount = rows.filter((r) => String(r.risk_level) === "critical").length;

  const columns = useMemo(() => {
    const base = [
      {
        key: "item",
        label: "Product",
        render: (x) =>
          x?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-44" />
              <SkeletonLine w="w-28" />
            </div>
          ) : (
            <div>
              <div className="font-extrabold text-slate-900">
                {x.name}{" "}
                <span className="text-slate-500 font-semibold">({x.variant})</span>
              </div>
              <div className="text-xs text-slate-500">
                {x.sku || "—"} • {x.supplier_name || "No supplier"}
              </div>
            </div>
          ),
      },
      {
        key: "risk",
        label: "Level",
        render: (x) =>
          x?.__filler ? <SkeletonPill w="w-24" /> : <RiskPill level={x.risk_level} />,
      },
      {
        key: "qty",
        label: "Stock",
        render: (x) =>
          x?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-40" />
              <SkeletonLine w="w-28" />
            </div>
          ) : (
            <QtyBar current={x.current_qty} threshold={x.reorder_level} />
          ),
      },
      {
        key: "days",
        label: "Days left",
        render: (x) =>
          x?.__filler ? (
            <SkeletonLine w="w-16" />
          ) : (
            <span className="text-sm font-semibold text-slate-800">
              {x.est_days_left == null ? "—" : `${x.est_days_left}d`}
            </span>
          ),
      },
      {
        key: "last",
        label: "Last update",
        render: (x) =>
          x?.__filler ? (
            <SkeletonLine w="w-28" />
          ) : (
            <span className="text-sm text-slate-700">{x.last_movement_at || "—"}</span>
          ),
      },
    ];

    if (!isAdmin) return base;

    return [
      ...base,
      {
        key: "req_status",
        label: "Owner approval",
        render: (x) =>
          x?.__filler ? (
            <SkeletonPill w="w-24" />
          ) : (
            <div className="space-y-1">
              <StatusPill status={x.purchase_request_status || "none"} />
              <div className="text-[11px] text-slate-500">
                {x.purchase_request_status && x.purchase_request_status !== "none"
                  ? `requested by ${x.requested_by_name || "—"}`
                  : "no request yet"}
              </div>
            </div>
          ),
      },
    ];
  }, [isAdmin]);

  const notifyAdmin = () => setNotifyOpen(true);
  const openThresholds = () => setThresholdsOpen(true);

  const openPurchaseModal = (row) => {
    setPurchaseItem(row);
    setPurchaseOpen(true);
  };

  const approveRequest = (row) => {
    setConfirm({
      open: true,
      tone: "teal",
      title: "Approve request",
      message: `Approve restock request for ${row.name} (${row.variant})?`,
      onConfirm: () => {
        setConfirm((p) => ({ ...p, open: false }));
        router.post(
          `/dashboard/admin/purchase-requests/${row.purchase_request_id}/approve`,
          {},
          { preserveScroll: true }
        );
      },
    });
  };

  const rejectRequest = (row) => {
    setConfirm({
      open: true,
      tone: "rose",
      title: "Decline request",
      message: `Decline restock request for ${row.name} (${row.variant})?`,
      onConfirm: () => {
        setConfirm((p) => ({ ...p, open: false }));
        router.post(
          `/dashboard/admin/purchase-requests/${row.purchase_request_id}/reject`,
          {},
          { preserveScroll: true }
        );
      },
    });
  };

  const notifyDefaultMessage = useMemo(() => {
    const critical = rows.filter((x) => x.risk_level === "critical");
    const warning = rows.filter((x) => x.risk_level === "warning");

    const lines = ["Low stock update"];
    if (critical.length) lines.push(`Urgent: ${critical.length} item(s)`);
    if (warning.length) lines.push(`Low: ${warning.length} item(s)`);

    const sample = rows
      .slice(0, 4)
      .map((x) => `${x.name} (${x.variant}) qty ${x.current_qty}`);

    return [...lines, "", "Sample items:", ...sample].join("\n");
  }, [rows]);

  return (
    <Layout title="Low Stock">
      <div className="grid gap-6">
        <TopCard
          title="Low stock items"
          subtitle={
            isAdmin
              ? "Owner view. Approve requests and adjust restock levels so you don’t run out."
              : "These items are low based on your restock levels. You can request restock anytime."
          }
          right={
            <div className="flex flex-wrap items-center gap-2">
              <div
                title="Items that are very low"
                className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200"
              >
                {urgentCount} urgent
              </div>

              <button
                type="button"
                onClick={() => setCreatePurchaseOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:ring-4 focus:ring-teal-500/25"
                title="Create a purchase even if the item is not low"
              >
                <PlusCircle className="h-4 w-4" />
                Order stock
              </button>

              {isAdmin ? (
                <button
                  type="button"
                  onClick={openThresholds}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition"
                  title="Change restock levels"
                >
                  <SlidersHorizontal className="h-4 w-4 text-slate-600" />
                  Restock levels
                </button>
              ) : (
                <button
                  type="button"
                  onClick={notifyAdmin}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition"
                  title="Send a message to the owner/admin"
                >
                  <Bell className="h-4 w-4 text-slate-600" />
                  Message owner
                </button>
              )}
            </div>
          }
        />

        <DataTableFilters
          q={q}
          onQ={handleSearch}
          placeholder="Search product, SKU, supplier..."
          filters={[
            { key: "risk", value: risk, onChange: handleRisk, options: riskOptions },
            ...(isAdmin
              ? [{ key: "req", value: req, onChange: handleReq, options: reqOptions }]
              : []),
          ]}
        />

        {!loading && rows.length === 0 ? (
          <EmptyHint />
        ) : (
          <DataTable
            columns={columns}
            rows={tableRows}
            loading={loading}
            emptyTitle="No low stock items"
            emptyHint="Try changing the search or restock levels."
            renderActions={(row) =>
              row?.__filler ? (
                <SkeletonButton w="w-28" />
              ) : (
                <div className="flex items-center justify-end gap-2">
                  {!isAdmin ? (
                    <button
                      type="button"
                      onClick={() => openPurchaseModal(row)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                      title="Ask the owner to restock"
                    >
                      Request restock
                      <ArrowRight className="h-4 w-4 text-slate-600" />
                    </button>
                  ) : (
                    <>
                      {String(row.purchase_request_status || "none") === "pending" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => approveRequest(row)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-teal-700 transition focus:ring-4 focus:ring-teal-500/25"
                            title="Approve this request"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Approve
                          </button>

                          <button
                            type="button"
                            onClick={() => rejectRequest(row)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition"
                            title="Decline this request"
                          >
                            <XCircle className="h-4 w-4 text-slate-600" />
                            Decline
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openPurchaseModal(row)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                          title="Create a purchase for this item"
                        >
                          Order
                          <ArrowRight className="h-4 w-4 text-slate-600" />
                        </button>
                      )}
                    </>
                  )}
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

        <NotifyAdminModal
          open={notifyOpen}
          onClose={() => setNotifyOpen(false)}
          defaultMessage={notifyDefaultMessage}
          onSubmit={(payload) => {
            router.post("/dashboard/inventory/low-stock/notify-admin", payload, {
              preserveScroll: true,
              onSuccess: () => setNotifyOpen(false),
            });
          }}
        />

        <ThresholdsModal
          open={thresholdsOpen}
          onClose={() => setThresholdsOpen(false)}
          items={rows}
          onSave={(payload) => {
            router.post("/dashboard/admin/inventory/thresholds", payload, {
              preserveScroll: true,
              onSuccess: () => setThresholdsOpen(false),
            });
          }}
        />

        <PurchaseRequestModal
          open={purchaseOpen}
          onClose={() => {
            setPurchaseOpen(false);
            setPurchaseItem(null);
          }}
          item={purchaseItem}
          onSubmit={(payload) => {
            const endpoint = isAdmin
              ? "/dashboard/admin/purchase-requests"
              : "/dashboard/inventory/purchase-requests";

            router.post(endpoint, payload, {
              preserveScroll: true,
              onSuccess: () => {
                setPurchaseOpen(false);
                setPurchaseItem(null);
              },
            });
          }}
        />

        <NewPurchaseModal
          open={createPurchaseOpen}
          onClose={() => setCreatePurchaseOpen(false)}
          products={products}
          suppliers={suppliers}
          roleKey={roleKey}
          onSubmit={(payload) => {
            const endpoint = isAdmin
              ? "/dashboard/admin/purchases"
              : "/dashboard/inventory/purchase-requests";

            router.post(endpoint, payload, {
              preserveScroll: true,
              onSuccess: () => setCreatePurchaseOpen(false),
            });
          }}
        />

        <ConfirmActionModal
          open={confirm.open}
          onClose={() => setConfirm((p) => ({ ...p, open: false }))}
          title={confirm.title}
          message={confirm.message}
          tone={confirm.tone}
          confirmLabel={confirm.tone === "rose" ? "Decline" : "Approve"}
          onConfirm={confirm.onConfirm || (() => {})}
        />
      </div>
    </Layout>
  );
}
