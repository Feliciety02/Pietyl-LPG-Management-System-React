import React, { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import ModalShell from "@/components/modals/ModalShell";
import { TableActionButton } from "@/components/Table/ActionTableButton";
import { CheckCircle2, XCircle, UserCheck } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const statusLabel = {
  draft: "Draft",
  submitted: "Submitted",
  approved_pending_supplier: "Approved",
  supplier_contacted_waiting_delivery: "Supplier contacted",
  partially_received: "Partially received",
  fully_received: "Fully received",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

function StatusBadge({ status }) {
  const tone =
    status === "submitted"
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
      : status === "draft"
      ? "bg-slate-100 text-slate-600 ring-slate-200"
      : "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={cx("inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold ring-1", tone)}>
      {statusLabel[status] ?? status}
    </span>
  );
}

export default function PurchaseRequestQueue() {
  const page = usePage();
  const requests = page.props?.requests ?? [];
  const suppliers = page.props?.suppliers ?? [];

  const [modal, setModal] = useState(null);
  const [approveForm, setApproveForm] = useState({
    supplier_id: suppliers[0]?.id ?? "",
    expected_delivery_date: "",
    notes: "",
    items: [],
  });
  const [rejectForm, setRejectForm] = useState({ rejection_reason: "" });
  const [contactForm, setContactForm] = useState({
    supplier_id: suppliers[0]?.id ?? "",
    expected_delivery_date: "",
    notes: "",
    supplier_reference: "",
  });

  const openApprove = (request) => {
    setModal({ type: "approve", request });
    setApproveForm({
      supplier_id: request.supplier?.id ?? suppliers[0]?.id ?? "",
      expected_delivery_date: request.expected_delivery_date ?? "",
      notes: request.notes ?? "",
      items: request.items.map((item) => ({
        purchase_request_item_id: item.id,
        approved_qty: item.approved_qty ?? item.requested_qty,
        unit_cost_estimated: item.unit_cost_estimated ?? "",
      })),
    });
  };

  const openReject = (request) => {
    setModal({ type: "reject", request });
    setRejectForm({ rejection_reason: "" });
  };

  const openContact = (request) => {
    setModal({ type: "contact", request });
    setContactForm((prev) => ({
      ...prev,
      supplier_id: request.supplier?.id ?? suppliers[0]?.id ?? prev.supplier_id,
    }));
  };

  const openCancel = (request) => {
    setModal({ type: "cancel", request });
  };

  const handleApprove = () => {
    if (!modal?.request) return;
    router.post(`/dashboard/admin/purchase-requests/${modal.request.id}/approve`, approveForm, {
      preserveState: true,
      onSuccess: () => {
        setModal(null);
        router.reload({ only: ["requests"] });
      },
    });
  };

  const handleReject = () => {
    if (!modal?.request) return;
    router.post(`/dashboard/admin/purchase-requests/${modal.request.id}/reject`, rejectForm, {
      preserveState: true,
      onSuccess: () => {
        setModal(null);
        router.reload({ only: ["requests"] });
      },
    });
  };

  const handleContact = () => {
    if (!modal?.request) return;
    router.post(`/dashboard/admin/purchase-requests/${modal.request.id}/supplier-contacted`, contactForm, {
      preserveState: true,
      onSuccess: () => {
        setModal(null);
        router.reload({ only: ["requests"] });
      },
    });
  };

  const handleCancel = () => {
    if (!modal?.request) return;
    router.post(`/dashboard/admin/purchase-requests/${modal.request.id}/cancel`, {}, {
      preserveState: true,
      onSuccess: () => {
        setModal(null);
        router.reload({ only: ["requests"] });
      },
    });
  };

  const activeSuppliers = useMemo(() => suppliers, [suppliers]);

  return (
    <Layout title="Purchase request approvals">
      <div className="grid gap-6">
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-extrabold text-slate-900">Approval queue</div>
            <div className="text-sm text-slate-500">Review submitted requests and mark suppliers as contacted.</div>
          </div>
        </div>
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-base font-extrabold text-slate-900">{request.pr_number}</div>
                  <div className="text-sm text-slate-500">Requested by {request.requested_by?.name ?? "—"}</div>
                </div>
                <StatusBadge status={request.status} />
              </div>
              <div className="text-sm text-slate-600">{request.reason ?? "No reason provided"}</div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Supplier</div>
                  <div className="mt-1 text-sm text-slate-700">{request.supplier?.name ?? "—"}</div>
                </div>
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Estimated cost</div>
                  <div className="mt-1 text-sm text-slate-700">₱{Number(request.total_estimated_cost ?? 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Expected delivery</div>
                  <div className="mt-1 text-sm text-slate-700">{request.expected_delivery_date ?? "—"}</div>
                </div>
              </div>
              <div>
                <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">Items</div>
                <div className="mt-2 grid gap-2">
                  {request.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-700">
                      <span>{item.product_name}</span>
                      <span>Qty: {item.requested_qty}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {request.status === "submitted" ? (
                  <>
                    <TableActionButton icon={CheckCircle2} tone="primary" onClick={() => openApprove(request)}>
                      Approve
                    </TableActionButton>
                    <TableActionButton icon={XCircle} tone="danger" onClick={() => openReject(request)}>
                      Reject
                    </TableActionButton>
                  </>
                ) : null}
                {request.status === "approved_pending_supplier" ? (
                  <TableActionButton icon={UserCheck} tone="primary" onClick={() => openContact(request)}>
                    Supplier contacted
                  </TableActionButton>
                ) : null}
                {(request.status === "submitted" || request.status === "approved_pending_supplier") && (
                  <TableActionButton icon={XCircle} tone="neutral" onClick={() => openCancel(request)}>
                    Cancel
                  </TableActionButton>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ModalShell
        open={modal?.type === "approve"}
        onClose={() => setModal(null)}
        title="Approve request"
        footerClassName="flex items-center justify-end gap-2"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApprove}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white"
            >
              <CheckCircle2 className="h-4 w-4" /> Approve
            </button>
          </>
        }
      >
        {modal?.request ? (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Supplier</label>
              <select
                value={approveForm.supplier_id}
                onChange={(e) => setApproveForm((prev) => ({ ...prev, supplier_id: e.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              >
                {activeSuppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Expected delivery</label>
              <input
                type="date"
                value={approveForm.expected_delivery_date}
                onChange={(e) => setApproveForm((prev) => ({ ...prev, expected_delivery_date: e.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Notes</label>
              <textarea
                rows={2}
                value={approveForm.notes}
                onChange={(e) => setApproveForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 resize-none"
              />
            </div>
            <div className="space-y-3">
              {approveForm.items.map((item, index) => (
                <div key={item.purchase_request_item_id} className="grid grid-cols-12 gap-3 rounded-2xl border border-slate-200 px-3 py-2">
                  <div className="col-span-5 text-sm font-semibold text-slate-900">
                    {modal.request.items[index]?.product_name}
                  </div>
                  <div className="col-span-3">
                    <label className="text-[11px] text-slate-500">Approved qty</label>
                    <input
                      type="number"
                      min={0}
                      value={item.approved_qty}
                      onChange={(e) =>
                        setApproveForm((prev) => ({
                          ...prev,
                          items: prev.items.map((row, idx) =>
                            idx === index ? { ...row, approved_qty: Number(e.target.value) } : row
                          ),
                        }))
                      }
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="text-[11px] text-slate-500">Unit cost</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.unit_cost_estimated}
                      onChange={(e) =>
                        setApproveForm((prev) => ({
                          ...prev,
                          items: prev.items.map((row, idx) =>
                            idx === index ? { ...row, unit_cost_estimated: Number(e.target.value) } : row
                          ),
                        }))
                      }
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </ModalShell>

      <ModalShell
        open={modal?.type === "reject"}
        onClose={() => setModal(null)}
        title="Reject request"
        footerClassName="flex items-center justify-end gap-2"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2 text-sm font-extrabold text-white"
            >
              <XCircle className="h-4 w-4" /> Reject
            </button>
          </>
        }
      >
        <textarea
          rows={3}
          value={rejectForm.rejection_reason}
          onChange={(e) => setRejectForm({ rejection_reason: e.target.value })}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 resize-none"
          placeholder="Reason for rejection"
        />
      </ModalShell>

      <ModalShell
        open={modal?.type === "contact"}
        onClose={() => setModal(null)}
        title="Mark supplier contacted"
        footerClassName="flex items-center justify-end gap-2"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleContact}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white"
            >
              <UserCheck className="h-4 w-4" /> Confirm
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Supplier</label>
            <select
              value={contactForm.supplier_id}
              onChange={(e) => setContactForm((prev) => ({ ...prev, supplier_id: e.target.value }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
            >
              {activeSuppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Expected delivery</label>
            <input
              type="date"
              value={contactForm.expected_delivery_date}
              onChange={(e) => setContactForm((prev) => ({ ...prev, expected_delivery_date: e.target.value }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
            />
          </div>
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Notes / reference</label>
            <textarea
              rows={2}
              value={contactForm.notes}
              onChange={(e) => setContactForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 resize-none"
              placeholder="Optional supplier note"
            />
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={modal?.type === "cancel"}
        onClose={() => setModal(null)}
        title="Cancel request"
        footerClassName="flex items-center justify-end gap-2"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-700"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2 text-sm font-extrabold text-white"
            >
              Cancel request
            </button>
          </>
        }
      >
        <div className="text-sm text-slate-600">
          Cancelling will mark the request as cancelled and drop any pending commitment.
        </div>
      </ModalShell>
    </Layout>
  );
}
