import React, { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import ModalShell from "@/components/modals/ModalShell";
import { TableActionButton } from "@/components/Table/ActionTableButton";
import { CheckCircle2, ArrowRight, RotateCcw, PlusCircle } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const timeline = [
  { key: "draft", label: "Draft" },
  { key: "submitted", label: "Submitted" },
  { key: "approved_pending_supplier", label: "Approved" },
  { key: "supplier_contacted_waiting_delivery", label: "Supplier contacted" },
  { key: "partially_received", label: "Partially received" },
  { key: "fully_received", label: "Fully received" },
];

const statusText = {
  draft: "Draft",
  submitted: "Submitted",
  approved_pending_supplier: "Approved",
  supplier_contacted_waiting_delivery: "Supplier contacted",
  partially_received: "Partially received",
  fully_received: "Fully received",
  cancelled: "Cancelled",
};

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-2xl px-4 py-2 text-sm font-extrabold",
        active
          ? "bg-teal-600 text-white ring-1 ring-teal-600"
          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
      )}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }) {
  const tone =
    status === "draft"
      ? "bg-slate-100 text-slate-600 ring-slate-200"
      : status === "submitted"
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : status === "approved_pending_supplier"
      ? "bg-teal-50 text-teal-700 ring-teal-200"
      : status === "supplier_contacted_waiting_delivery"
      ? "bg-sky-50 text-sky-700 ring-sky-200"
      : status === "partially_received"
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : status === "fully_received"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "cancelled"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={cx("inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold ring-1", tone)}>
      {statusText[status] ?? status}
    </span>
  );
}

function RiskPill({ level }) {
  const tone =
    level === "critical"
      ? "bg-rose-500/10 text-rose-800 ring-rose-300"
      : level === "warning"
      ? "bg-amber-500/10 text-amber-800 ring-amber-300"
      : "bg-emerald-500/10 text-emerald-800 ring-emerald-300";
  return (
    <span className={cx("inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold ring-1", tone)}>
      {String(level || "ok").toUpperCase()}
    </span>
  );
}

function RequestTimeline({ status }) {
  const index = timeline.findIndex((step) => step.key === status);
  return (
    <div className="flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">
      {timeline.slice(0, 4).map((step, idx) => (
        <div key={step.key} className="flex flex-col items-center gap-1">
          <div
            className={cx(
              "h-2.5 w-2.5 rounded-full",
              idx <= index ? "bg-teal-600" : "bg-slate-200"
            )}
          />
          <span className={idx <= index ? "text-teal-600" : "text-slate-400"}>{step.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function PurchaseRequests() {
  const page = usePage();
  const lowStock = page.props?.lowStock ?? {};
  const lowStockRows = lowStock.low_stock?.data ?? [];
  const myRequests = page.props?.myRequests ?? [];
  const products = page.props?.products ?? [];
  const suppliers = page.props?.suppliers ?? [];
  const locations = page.props?.locations ?? [];

  const blankItem = () => ({
    product_id: products[0]?.id ?? "",
    requested_qty: 1,
    unit_cost_estimated: "",
  });

  const [activeTab, setActiveTab] = useState("low");
  const [form, setForm] = useState({ reason: "", notes: "", items: [blankItem()] });
  const [editingRequest, setEditingRequest] = useState(null);
  const [receiveModal, setReceiveModal] = useState({ open: false, request: null, form: null });

  const lowStockUrgent = useMemo(
    () => lowStockRows.filter((row) => String(row.risk_level) === "critical").length,
    [lowStockRows]
  );

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, blankItem()],
    }));
  };

  const updateItem = (idx, changes) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, index) => (index === idx ? { ...item, ...changes } : item)),
    }));
  };

  const removeItem = (idx) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, index) => index !== idx),
    }));
  };

  const resetForm = () => {
    setForm({ reason: "", notes: "", items: [blankItem()] });
    setEditingRequest(null);
  };

  const openEdit = (request) => {
    setActiveTab("new");
    setEditingRequest(request);
    setForm({
      reason: request.reason || "",
      notes: request.notes || "",
      items: request.items.map((item) => ({
        product_id: item.product_id,
        requested_qty: item.approved_qty ?? item.requested_qty ?? 1,
        unit_cost_estimated: item.unit_cost_estimated ?? "",
      })),
    });
  };

  const applyLowStock = (row) => {
    setActiveTab("new");
    setEditingRequest(null);
    setForm({
      reason: `Restock request for ${row.name}`,
      notes: `Adjusted from low stock suggestion.`,
      items: [
        {
          product_id: row.product_variant_id ?? row.product_id ?? "",
          requested_qty: Math.max(Number(row.reorder_level || 0) - Number(row.current_qty || 0), 1),
          unit_cost_estimated: "",
        },
      ],
    });
  };

  const handleSaveRequest = () => {
    const payload = {
      reason: form.reason,
      notes: form.notes,
      items: form.items
        .map((item) => ({
          product_id: item.product_id,
          requested_qty: Number(item.requested_qty) || 0,
          unit_cost_estimated: item.unit_cost_estimated ? Number(item.unit_cost_estimated) : undefined,
        }))
        .filter((item) => item.product_id && item.requested_qty > 0),
    };

    if (!payload.items.length) return;

    const action = editingRequest
      ? router.put(`/dashboard/inventory/purchase-requests/${editingRequest.id}`, payload, {
          preserveState: true,
          onSuccess: () => {
            resetForm();
            router.reload({ only: ["myRequests"] });
          },
        })
      : router.post("/dashboard/inventory/purchase-requests", payload, {
          preserveState: true,
          onSuccess: () => {
            resetForm();
            router.reload({ only: ["myRequests"] });
          },
        });

    return action;
  };

  const openReceive = (request) => {
    const items = request.items.map((item) => ({
      purchase_request_item_id: item.id,
      received_qty: 0,
      damaged_qty: 0,
      unit_cost_final: item.unit_cost_final ?? item.unit_cost_estimated ?? 0,
    }));

    setReceiveModal({
      open: true,
      request,
      form: {
        location_id: locations[0]?.id ?? "",
        delivery_receipt_no: "",
        notes: "",
        items,
      },
    });
  };

  const updateReceiveRow = (idx, changes) => {
    setReceiveModal((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        items: prev.form.items.map((item, index) => (index === idx ? { ...item, ...changes } : item)),
      },
    }));
  };

  const handleReceive = () => {
    if (!receiveModal.request) return;
    router.post(`/dashboard/inventory/purchase-requests/${receiveModal.request.id}/receipts`, receiveModal.form, {
      preserveState: true,
      onSuccess: () => {
        setReceiveModal({ open: false, request: null, form: null });
        router.reload({ only: ["myRequests"] });
      },
    });
  };

  const availableLocations = locations;

  return (
    <Layout title="Purchase requests">
      <div className="grid gap-6">
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-extrabold text-slate-900">Purchase requests</div>
            <div className="text-sm text-slate-500">Track draft requests, approvals, and receipts.</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TabButton active={activeTab === "low"} onClick={() => setActiveTab("low")}>Low stock</TabButton>
            <TabButton active={activeTab === "new"} onClick={() => setActiveTab("new")}>New request</TabButton>
            <TabButton active={activeTab === "mine"} onClick={() => setActiveTab("mine")}>My requests</TabButton>
          </div>
        </div>

        {activeTab === "low" ? (
          <section className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-extrabold tracking-[0.2em] uppercase text-slate-500">Low stock suggestions</div>
                <div className="text-sm text-slate-600">{lowStockRows.length} items below thresholds</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-2 text-xs font-extrabold text-slate-700">
                {lowStockUrgent} urgent
              </div>
            </div>
            {lowStockRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
                All items are healthy. Adjust restock rules to trigger new suggestions.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Current</th>
                      <th className="px-3 py-2">Reorder</th>
                      <th className="px-3 py-2">Risk</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lowStockRows.map((row) => (
                      <tr key={row.id}>
                        <td className="px-3 py-3">
                          <div className="font-semibold text-slate-900 truncate">
                            {row.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {row.variant ? row.variant : row.sku}
                          </div>
                        </td>
                        <td className="px-3 py-3">{row.current_qty ?? "—"}</td>
                        <td className="px-3 py-3">{row.reorder_level ?? "—"}</td>
                        <td className="px-3 py-3">
                          <RiskPill level={row.risk_level} />
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={row.purchase_request_status || "draft"} />
                        </td>
                        <td className="px-3 py-3 text-right">
                          <TableActionButton
                            icon={ArrowRight}
                            tone="primary"
                            title="Create purchase request"
                            onClick={() => applyLowStock(row)}
                          >
                            Restock
                          </TableActionButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : activeTab === "new" ? (
          <section className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-6 space-y-6">
            <div className="text-sm text-slate-600">Create a new purchase request and add the items you need restocked.</div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">Reason</label>
                <input
                  value={form.reason}
                  onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/30"
                  placeholder="Why do you need this?"
                />
              </div>
              <div>
                <label className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/30 resize-none"
                  placeholder="Optional context"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">Items</div>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-teal-700"
                  >
                    <PlusCircle className="h-4 w-4" /> Add item
                  </button>
                </div>
                <div className="space-y-3">
                  {form.items.map((item, index) => (
                    <div key={`${item.product_id}-${index}`} className="grid grid-cols-12 gap-3 rounded-2xl border border-slate-200 p-3">
                      <div className="col-span-5">
                        <label className="text-[11px] font-semibold text-slate-500">Product</label>
                        <select
                          value={item.product_id}
                          onChange={(e) => updateItem(index, { product_id: e.target.value })}
                          className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                        >
                          <option value="">Select product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} {product.sku ? `(${product.sku})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <label className="text-[11px] font-semibold text-slate-500">Qty</label>
                        <input
                          type="number"
                          min={1}
                          value={item.requested_qty}
                          onChange={(e) => updateItem(index, { requested_qty: Number(e.target.value) })}
                          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="text-[11px] font-semibold text-slate-500">Est. unit cost</label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.unit_cost_estimated}
                          onChange={(e) => updateItem(index, { unit_cost_estimated: e.target.value })}
                          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="col-span-1 flex items-end justify-end">
                        {form.items.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-rose-600 hover:text-rose-700"
                          >
                            ×
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveRequest}
                  className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {editingRequest ? "Update request" : "Save draft"}
                </button>
                {editingRequest ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-700"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            {myRequests.length === 0 ? (
              <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-10 text-center text-sm text-slate-500">
                No purchase requests yet. Create one to start tracking a restock.
              </div>
            ) : (
              myRequests.map((request) => (
                <div key={request.id} className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-extrabold text-slate-900">{request.pr_number}</div>
                      <div className="text-sm text-slate-500">{request.reason || "No reason provided"}</div>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">Supplier</div>
                      <div className="mt-1 text-sm text-slate-700">{request.supplier?.name ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">Estimated cost</div>
                      <div className="mt-1 text-sm text-slate-700">?{Number(request.total_estimated_cost || 0).toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">Requested at</div>
                      <div className="mt-1 text-sm text-slate-700">{request.requested_at ?? "—"}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {request.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{item.product_name}</div>
                          <div className="text-xs text-slate-500">Requested qty: {item.requested_qty}</div>
                        </div>
                        <div className="text-xs text-slate-500">Approved: {item.approved_qty ?? "—"}</div>
                      </div>
                    ))}
                  </div>
                  <RequestTimeline status={request.status} />
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {request.status === "draft" ? (
                      <>
                        <TableActionButton
                          icon={RotateCcw}
                          title="Edit request"
                          onClick={() => openEdit(request)}
                        >
                          Edit
                        </TableActionButton>
                        <TableActionButton
                          icon={ArrowRight}
                          tone="primary"
                          title="Submit request"
                          onClick={() =>
                            router.post(`/dashboard/inventory/purchase-requests/${request.id}/submit`, {}, {
                              preserveScroll: true,
                              onSuccess: () => router.reload({ only: ["myRequests"] }),
                            })
                          }
                        >
                          Submit
                        </TableActionButton>
                      </>
                    ) : null}
                    {request.status === "supplier_contacted_waiting_delivery" || request.status === "partially_received" ? (
                      <TableActionButton icon={CheckCircle2} tone="primary" title="Receive delivery" onClick={() => openReceive(request)}>
                        Receive
                      </TableActionButton>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </section>
        )}
      </div>

      <ModalShell
        open={receiveModal.open}
        onClose={() => setReceiveModal({ open: false, request: null, form: null })}
        title={`Receive ${receiveModal.request?.pr_number ?? ""}`}
        footerClassName="flex items-center justify-end gap-2"
        footer={
          <>
            <button
              type="button"
              onClick={() => setReceiveModal({ open: false, request: null, form: null })}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReceive}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white"
            >
              <CheckCircle2 className="h-4 w-4" /> Confirm receipt
            </button>
          </>
        }
      >
        {receiveModal.form ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">Location</label>
                <select
                  value={receiveModal.form.location_id}
                  onChange={(e) => setReceiveModal((prev) => ({ ...prev, form: { ...prev.form, location_id: e.target.value } }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                >
                  {availableLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">Delivery receipt</label>
                <input
                  value={receiveModal.form.delivery_receipt_no}
                  onChange={(e) => setReceiveModal((prev) => ({ ...prev, form: { ...prev.form, delivery_receipt_no: e.target.value } }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  placeholder="Receipt number"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">Notes</label>
              <textarea
                value={receiveModal.form.notes}
                onChange={(e) => setReceiveModal((prev) => ({ ...prev, form: { ...prev.form, notes: e.target.value } }))}
                rows={2}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 resize-none"
                placeholder="Optional remarks"
              />
            </div>
            <div className="space-y-3">
              {receiveModal.form.items.map((item, index) => (
                <div key={item.purchase_request_item_id} className="grid grid-cols-12 gap-3 rounded-2xl border border-slate-200 px-3 py-2">
                  <div className="col-span-5 text-sm font-semibold text-slate-900">
                    {receiveModal.request?.items[index]?.product_name}
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] text-slate-500">Received</label>
                    <input
                      type="number"
                      min={0}
                      value={item.received_qty}
                      onChange={(e) => updateReceiveRow(index, { received_qty: Number(e.target.value) })}
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] text-slate-500">Damaged</label>
                    <input
                      type="number"
                      min={0}
                      value={item.damaged_qty}
                      onChange={(e) => updateReceiveRow(index, { damaged_qty: Number(e.target.value) })}
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="text-[11px] text-slate-500">Unit cost</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.unit_cost_final}
                      onChange={(e) => updateReceiveRow(index, { unit_cost_final: Number(e.target.value) })}
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </ModalShell>
    </Layout>
  );
}
