import React, { useEffect, useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import useTableQuery from "@/components/Table/useTableQuery";

import { TableActionButton } from "@/components/Table/ActionTableButton";

import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

import ThresholdsModal from "@/components/modals/InventoryModals/ThresholdsModal";
import ConfirmActionModal from "@/components/modals/InventoryModals/ConfirmActionModal";
import PurchaseRequestModal from "@/components/modals/InventoryModals/PurchaseRequestModal";
import NewPurchaseModal from "@/components/modals/InventoryModals/OrderStockModal";

import {
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  Eye,
} from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function niceText(v, fallback = "—") {
  if (v == null) return fallback;
  const s = String(v).trim();
  return s ? s : fallback;
}

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

function ProgressBar({ pct = 0 }) {
  const safe = Number.isFinite(Number(pct)) ? Math.max(0, Math.min(100, Number(pct))) : 0;

  const tone =
    safe <= 35 ? "bg-rose-600" : safe <= 70 ? "bg-amber-600" : "bg-teal-600";

  return (
    <div className="w-full">
      <div className="h-2 w-full rounded-full bg-slate-100 ring-1 ring-slate-200 overflow-hidden">
        <div className={cx("h-full rounded-full", tone)} style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}

function StockMini({ current = 0, threshold = 0 }) {
  const safeThreshold = Math.max(Number(threshold || 0), 0);
  const safeCurrent = Math.max(Number(current || 0), 0);

  const pct = safeThreshold <= 0 ? 0 : Math.round(Math.min(safeCurrent / safeThreshold, 1) * 100);

  return (
    <div className="min-w-[220px] max-w-[260px]">
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>
          <span className="font-semibold text-slate-700">{safeCurrent}</span> in stock
        </span>
        <span>
          restock at{" "}
          <span className="font-semibold text-slate-700">
            {safeThreshold > 0 ? safeThreshold : "Off"}
          </span>
        </span>
      </div>
      <div className="mt-1">
        <ProgressBar pct={pct} />
      </div>
      <div className="mt-1 text-[11px] text-slate-500">
        {safeThreshold > 0 ? (
          safeCurrent <= safeThreshold ? (
            <span className="font-semibold text-amber-800">Low now</span>
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

function InitialBadge({ name = "" }) {
  const s = String(name || "").trim();
  const letter = s ? s[0].toUpperCase() : "P";
  return (
    <div className="h-10 w-10 rounded-2xl bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center">
      <div className="h-6 w-6 rounded-xl bg-teal-600/15 flex items-center justify-center">
        <span className="text-[11px] font-extrabold text-teal-800">{letter}</span>
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
      <div className="mt-4 text-base font-extrabold text-slate-900">Everything looks good</div>
      <div className="mt-1 text-sm text-slate-600">
        No items are currently low based on your restock levels.
      </div>
    </div>
  );
}

function normalizePaginator(p) {
  const x = p || {};
  const data = Array.isArray(x.data) ? x.data : Array.isArray(x?.data?.data) ? x.data.data : [];
  const meta =
    x.meta && typeof x.meta === "object"
      ? x.meta
      : x.current_page != null || x.last_page != null
      ? x
      : null;

  return { data, meta };
}

export default function LowStock() {
  const page = usePage();

  const roleKey = page.props?.auth?.user?.role || "inventory_manager";
  const isAdmin = roleKey === "admin";

  const loading = Boolean(page.props?.loading);

  const products = page.props?.products ?? [];
  const suppliers = page.props?.suppliersByProduct ?? {};
  const productHash = page.props?.product_hash ?? [];

  const { data: rows, meta } = normalizePaginator(page.props?.low_stock);

  const { query, set, setPer, prevPage, nextPage, canPrev, canNext } = useTableQuery({
    endpoint: "/dashboard/inventory/low-stock",
    meta,
    defaults: { q: "", risk: "all", req: "all", per: 10, page: 1 },
  });

  const [q, setQ] = useState(query.q);
  const risk = query.risk;
  const req = query.req;
  const per = query.per;

  useEffect(() => {
    setQ(query.q);
  }, [query.q]);

  const [thresholdsOpen, setThresholdsOpen] = useState(false);

  const [purchaseReqOpen, setPurchaseReqOpen] = useState(false);
  const [purchaseReqItem, setPurchaseReqItem] = useState(null);

  const [newPurchaseOpen, setNewPurchaseOpen] = useState(false);
  const [newPurchaseItem, setNewPurchaseItem] = useState(null);

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

  const urgentCount = useMemo(
    () => rows.filter((r) => String(r.risk_level) === "critical").length,
    [rows]
  );

  const openRequestModal = (row) => {
    setPurchaseReqItem(row || null);
    setPurchaseReqOpen(true);
  };

  const openNewPurchaseModal = (row) => {
    setNewPurchaseItem(row || null);
    setNewPurchaseOpen(true);
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

  const columns = useMemo(() => {
    const base = [
      {
        key: "item",
        label: "Item",
        render: (x) =>
          loading ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-slate-200/70 animate-pulse" />
              <div className="space-y-2">
                <SkeletonLine w="w-44" />
                <SkeletonLine w="w-32" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 min-w-0">
              <InitialBadge name={x.name} />
              <div className="min-w-0">
                <div className="font-extrabold text-slate-900 truncate">
                  {niceText(x.name, "Product")}
                  <span className="text-slate-500 font-semibold">
                    {" "}
                    {niceText(x.variant, "—")}
                  </span>
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {niceText(x.sku)} • {niceText(x.supplier_name, "No supplier")}
                </div>
              </div>
            </div>
          ),
      },
      {
        key: "level",
        label: "Level",
        render: (x) => (loading ? <SkeletonPill w="w-24" /> : <RiskPill level={x.risk_level} />),
      },
      {
        key: "stock",
        label: "Stock",
        render: (x) =>
          loading ? (
            <div className="space-y-2">
              <SkeletonLine w="w-40" />
              <SkeletonLine w="w-28" />
            </div>
          ) : (
            <StockMini current={x.current_qty} threshold={x.reorder_level} />
          ),
      },
      {
        key: "last",
        label: "Updated",
        render: (x) =>
          loading ? <SkeletonLine w="w-28" /> : <span className="text-sm text-slate-700">{niceText(x.last_movement_at)}</span>,
      },
    ];

    if (!isAdmin) return base;

    return [
      ...base,
      {
        key: "req_status",
        label: "Approval",
        render: (x) =>
          loading ? (
            <SkeletonPill w="w-24" />
          ) : (
            <div className="space-y-1">
              <StatusPill status={x.purchase_request_status || "none"} />
              <div className="text-[11px] text-slate-500">
                {x.purchase_request_status && x.purchase_request_status !== "none"
                  ? `by ${niceText(x.requested_by_name)}`
                  : "no request"}
              </div>
            </div>
          ),
      },
    ];
  }, [isAdmin, loading]);

  const viewItem = (row) => {
    router.get(`/dashboard/inventory/products/${row.id}`, {}, { preserveScroll: true });
  };

  return (
    <Layout title="Low Stock">
      <div className="grid gap-6">
        <TopCard
          title="Low stock items"
          subtitle={
            isAdmin
              ? "Owner view. Approve requests, set restock levels, and create purchases."
              : "Request restock for items that are low based on your restock levels."
          }
          right={
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200">
                {urgentCount} urgent
              </div>

              {isAdmin ? (
                <>
                  <button
                    type="button"
                    onClick={() => openNewPurchaseModal(null)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:ring-4 focus:ring-teal-500/25"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Order stock
                  </button>

                  <button
                    type="button"
                    onClick={() => setThresholdsOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:ring-4 focus:ring-teal-500/15"
                  >
                    <SlidersHorizontal className="h-4 w-4 text-slate-600" />
                    Restock levels
                  </button>
                </>
              ) : null}
            </div>
          }
        />

        <DataTableFilters
          q={q}
          onQ={setQ}
          onQDebounced={(v) => set("q", v, { resetPage: true })}
          placeholder="Search product, SKU, supplier..."
          filters={[
            { key: "risk", value: risk, onChange: (v) => set("risk", v, { resetPage: true }), options: riskOptions },
            ...(isAdmin
              ? [{ key: "req", value: req, onChange: (v) => set("req", v, { resetPage: true }), options: reqOptions }]
              : []),
          ]}
        />

        {!loading && rows.length === 0 ? (
          <EmptyHint />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            loading={loading}
            searchQuery={q}
            emptyTitle="No low stock items"
            emptyHint="Try changing the search or restock levels."
            renderActions={(row) =>
              loading ? (
                <SkeletonButton w="w-28" />
              ) : (
                <div className="flex items-center justify-end gap-2">
                  <TableActionButton icon={Eye} title="Quick view" onClick={() => viewItem(row)}>
                    View
                  </TableActionButton>

                  {!isAdmin ? (
                    <TableActionButton icon={ArrowRight} title="Request restock" onClick={() => openRequestModal(row)}>
                      Request
                    </TableActionButton>
                  ) : String(row.purchase_request_status || "none") === "pending" ? (
                    <>
                      <TableActionButton tone="primary" icon={CheckCircle2} title="Approve request" onClick={() => approveRequest(row)}>
                        Approve
                      </TableActionButton>

                      <TableActionButton icon={XCircle} title="Decline request" onClick={() => rejectRequest(row)}>
                        Decline
                      </TableActionButton>
                    </>
                  ) : (
                    <>
                      <TableActionButton icon={PlusCircle} title="Create purchase" onClick={() => openNewPurchaseModal(row)}>
                        Order
                      </TableActionButton>
                    </>
                  )}
                </div>
              )
            }
          />
        )}

        <DataTablePagination
          meta={meta}
          perPage={per}
          onPerPage={setPer}
          onPrev={prevPage}
          onNext={nextPage}
          disablePrev={!canPrev}
          disableNext={!canNext}
        />

        <PurchaseRequestModal
          open={purchaseReqOpen}
          onClose={() => {
            setPurchaseReqOpen(false);
            setPurchaseReqItem(null);
          }}
          item={purchaseReqItem}
          products={productHash}
          onSubmit={(payload) => {
            router.post("/dashboard/inventory/purchase-requests", payload, {
              preserveScroll: true,
              onSuccess: () => {
                setPurchaseReqOpen(false);
                setPurchaseReqItem(null);
              },
            });
          }}
        />

        <NewPurchaseModal
          open={newPurchaseOpen}
          onClose={() => {
            setNewPurchaseOpen(false);
            setNewPurchaseItem(null);
          }}
          item={newPurchaseItem}
          products={products}
          suppliers={suppliers}
          onSubmit={(payload) => {
            router.post("/dashboard/inventory/purchases", payload, {
              preserveScroll: true,
              onSuccess: () => {
                setNewPurchaseOpen(false);
                setNewPurchaseItem(null);
              },
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
