import React, { useEffect, useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import useTableQuery from "@/components/Table/useTableQuery";

import { TableActionButton } from "@/components/Table/ActionTableButton";

import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

import ConfirmActionModal from "@/components/modals/InventoryModals/ConfirmActionModal";
import RequestRestockModal from "@/components/modals/InventoryModals/RequestRestockModal";
import StockViewModal from "@/components/modals/InventoryModals/StockViewModal";

import {
  AlertTriangle,
  ArrowRight,
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
      : v === "ok"
      ? "bg-emerald-600/10 text-emerald-900 ring-emerald-700/10"
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

function ProgressBar({ pct = 0, tone = "bg-teal-600" }) {
  const safe = Number.isFinite(Number(pct)) ? Math.max(0, Math.min(100, Number(pct))) : 0;

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

  const ratio = safeThreshold <= 0 ? 1 : Math.min(safeCurrent / safeThreshold, 2);
  const pct = Math.round(Math.min(ratio, 1) * 100);
  const tone =
    safeThreshold <= 0
      ? "bg-slate-400"
      : ratio >= 1
      ? "bg-emerald-600"
      : ratio >= 0.6
      ? "bg-amber-500"
      : "bg-rose-600";

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
        <ProgressBar pct={pct} tone={tone} />
      </div>
      <div className="mt-1 text-[11px] text-slate-500">
        {safeThreshold > 0 ? (
          ratio < 0.6 ? (
            <span className="font-semibold text-rose-800">Critical</span>
          ) : ratio < 1 ? (
            <span className="font-semibold text-amber-800">Running low</span>
          ) : (
            <span className="font-semibold text-emerald-800">In good standing</span>
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

export default function Lowstock() {
  const page = usePage();

  const roleKey = page.props?.auth?.user?.role || "inventory_manager";
  const isAdmin = roleKey === "admin";

  const loading = Boolean(page.props?.loading);

  const products = page.props?.products ?? [];
  const suppliers = page.props?.suppliersByProduct ?? {};
  const productHash = page.props?.product_hash ?? [];

  const { data: rows, meta } = normalizePaginator(page.props?.low_stock);
  const [localRows, setLocalRows] = useState(rows);

  const { query, set, setPer, prevPage, nextPage, canPrev, canNext } = useTableQuery({
    endpoint: "/dashboard/inventory/order-stocks",
    meta,
    defaults: { q: "", risk: "all", req: "all", scope: "all", per: 10, page: 1 },
  });

  const [q, setQ] = useState(query.q);
  const risk = query.risk;
  const req = query.req;
  const scope = query.scope;
  const baseSubtitle = isAdmin
    ? "Owner view. Approve requests, set restock levels, and create purchases."
    : "Request restock for items that are low based on your restock levels.";
  const scopeSubtitle =
    scope === "all"
      ? "Displaying every product with its current stock and thresholds."
      : "Highlighted items are at or below their restock levels.";
  const emptyTitle = scope === "all" ? "No Products Found" : "No Low Stock Items";
  const emptyHint =
    scope === "all"
      ? "Try widening the search or add new products."
      : "Try changing the search or restock levels.";
  const per = query.per;

  useEffect(() => {
    setQ(query.q);
  }, [query.q]);

  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  const [orderModal, setOrderModal] = useState({
    open: false,
    mode: "purchase",
    item: null,
  });

  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  const [confirm, setConfirm] = useState({
    open: false,
    tone: "teal",
    title: "",
    message: "",
    onConfirm: null,
  });

  const scopeOptions = [
    { value: "low", label: "Low stock" },
    { value: "all", label: "All products" },
  ];

  const riskOptions = [
    { value: "all", label: "All levels" },
    { value: "critical", label: "Urgent" },
    { value: "warning", label: "Low" },
    { value: "ok", label: "Healthy" },
  ];

  const reqOptions = [
    { value: "all", label: "All" },
    { value: "none", label: "No request" },
    { value: "pending", label: "Waiting" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Declined" },
  ];

  const filteredRows = useMemo(() => {
    // Don't filter by purchase request status - show all low stock items
    return localRows;
  }, [localRows]);

  const urgentCount = useMemo(
    () => filteredRows.filter((r) => String(r.risk_level) === "critical").length,
    [filteredRows]
  );

  const closeOrderModal = () =>
    setOrderModal({
      open: false,
      mode: "purchase",
      item: null,
    });

  const openRequestModal = (row) => {
    setOrderModal({
      open: true,
      mode: "purchase",
      item: row || null,
    });
  };

  const approveRequest = (row) => {
    setConfirm({
      open: true,
      tone: "teal",
      title: "Approve Request",
      message: `Approve restock request for ${row.name} (${row.variant})?`,
      onConfirm: () => {
        setConfirm((p) => ({ ...p, open: false }));
        router.post(
          `/dashboard/admin/purchase-requests/${row.purchase_request_id}/approve`,
          {},
          {
            preserveScroll: true,
            onSuccess: () =>
              setLocalRows((prev) =>
                prev.map((r) =>
                  r.id === row.id ? { ...r, purchase_request_status: "approved" } : r
                )
              ),
          }
        );
      },
    });
  };

    const rejectRequest = (row) => {
      setConfirm({
        open: true,
        tone: "rose",
        title: "Decline Request",
        message: `Decline restock request for ${row.name} (${row.variant})?`,
        onConfirm: () => {
          setConfirm((p) => ({ ...p, open: false }));
          router.post(
            `/dashboard/admin/purchase-requests/${row.purchase_request_id}/reject`,
            {},
            {
              preserveScroll: true,
              onSuccess: () =>
                setLocalRows((prev) =>
                  prev.map((r) =>
                    r.id === row.id ? { ...r, purchase_request_status: "rejected" } : r
                  )
                ),
            }
          );
        },
      });
    };

  const handleOrderSubmit = (payload) => {
    const row = orderModal.item;
    
    // Create purchase directly
    const purchasePayload = {
      product_variant_id: payload.product_variant_id,
      supplier_id: payload.supplier_id,
      qty: payload.qty,
      unit_cost: payload.unit_cost,
      notes: payload.notes,
      location_id: row?.location_id ?? 1,
    };

    router.post("/dashboard/inventory/purchases", purchasePayload, {
      preserveScroll: true,
      onSuccess: () => {
        closeOrderModal();
        router.visit('/dashboard/inventory/purchases');
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
                </div>
                {x.sku ? (
                  <div className="text-xs text-slate-500 truncate">{niceText(x.sku)}</div>
                ) : null}
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
            <StockMini current={x.qty_filled ?? x.current_qty} threshold={x.reorder_level} />
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

  const openView = (row) => {
    setViewItem(row || null);
    setViewOpen(true);
  };

  return (
    <Layout title="Low stock">
      <div className="grid gap-6">
        <TopCard
          title="Low stock"
          subtitle={
            <div className="space-y-1">
              <div>{baseSubtitle}</div>
              <div className="text-xs text-slate-500">{scopeSubtitle}</div>
            </div>
          }
          right={
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200">
                {urgentCount} urgent
              </div>
            </div>
          }
        />

        <DataTableFilters
          q={q}
          onQ={setQ}
          onQDebounced={(v) => set("q", v, { resetPage: true })}
          placeholder="Search product, SKU, supplier..."
          filters={[
            {
              key: "scope",
              value: scope,
              onChange: (v) => set("scope", v, { resetPage: true }),
              options: scopeOptions,
            },
            { key: "risk", value: risk, onChange: (v) => set("risk", v, { resetPage: true }), options: riskOptions },
            ...(isAdmin
              ? [{ key: "req", value: req, onChange: (v) => set("req", v, { resetPage: true }), options: reqOptions }]
              : []),
          ]}
        />

        {!loading && filteredRows.length === 0 ? (
          <EmptyHint />
        ) : (
          <DataTable
            columns={columns}
            rows={filteredRows}
            loading={loading}
            searchQuery={q}
            emptyTitle={emptyTitle}
            emptyHint={emptyHint}
            renderActions={(row) =>
              loading ? (
                <SkeletonButton w="w-28" />
              ) : (
                <div className="flex items-center justify-end gap-2">
                  <TableActionButton icon={Eye} title="Quick View" onClick={() => openView(row)}>
                    View
                  </TableActionButton>

                  {!isAdmin ? (
                    String(row.purchase_request_status || "none") === "pending" ? (
                      <TableActionButton icon={ArrowRight} disabled title="Pending Request">
                        Pending
                      </TableActionButton>
                    ) : (
                      <TableActionButton icon={ArrowRight} title="Request Restock" onClick={() => openRequestModal(row)}>
                        Request
                      </TableActionButton>
                    )
                  ) : String(row.purchase_request_status || "none") === "pending" ? (
                    <>
                        <TableActionButton
                          tone="primary"
                          icon={CheckCircle2}
                          title="Approve Request"
                          onClick={() => approveRequest(row)}
                        >
                        Approve
                      </TableActionButton>

                        <TableActionButton
                          tone="danger"
                          icon={XCircle}
                          title="Decline Request"
                          onClick={() => rejectRequest(row)}
                        >
                        Decline
                      </TableActionButton>
                    </>
                  ) : null}
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

        <RequestRestockModal
          open={orderModal.open}
          onClose={closeOrderModal}
          item={orderModal.item}
          products={productHash}
          suppliers={suppliers}
          mode={orderModal.mode}
          onSubmit={handleOrderSubmit}
          loading={loading}
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

        <StockViewModal
          open={viewOpen}
          onClose={() => {
            setViewOpen(false);
            setViewItem(null);
          }}
          item={viewItem}
        />
      </div>
    </Layout>
  );
}
