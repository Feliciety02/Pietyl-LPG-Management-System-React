import React, { useMemo } from "react";
import ModalShell from "../ModalShell";
import { PurchaseStatusPill } from "@/Pages/InventoryPage/purchases/purchaseStatus";

function niceText(value, fallback = "—") {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

function formatQty(value) {
  if (value == null || value === "") return "0";
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return number.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/80 ring-1 ring-slate-200/70 px-3 py-2">
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export default function ViewStockRequestModal({ open, onClose, request }) {
  const meta = useMemo(() => {
    if (!request) return null;
    const items = Array.isArray(request.items) ? request.items : [];

    return {
      ref: niceText(request.request_number),
      supplier: niceText(request.supplier_name),
      location: niceText(request.location),
      priority: niceText(request.priority || ""),
      notes: (request.notes || "").trim(),
      expectedQty: formatQty(request.expected_qty),
      receivedQty: formatQty(request.received_qty),
      itemsCount: items.length,
      createdAt: niceText(request.created_at),
      items,
    };
  }, [request]);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Stock request"
      subtitle="Request summary"
      maxWidthClass="max-w-3xl"
      bodyClassName="p-4"
      footerClassName="p-4 pt-0"
      footer={
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 focus:ring-4 focus:ring-teal-500/15"
          >
            Close
          </button>
        </div>
      }
    >
      {!request ? (
        <div className="rounded-3xl bg-slate-50/70 ring-1 ring-slate-200/70 p-6 text-center">
          <div className="text-base font-extrabold text-slate-900">No request selected</div>
          <div className="mt-2 text-sm text-slate-600">Select a row and press View.</div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-3xl bg-white/80 ring-1 ring-slate-200/70 p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-lg font-extrabold text-slate-900">{meta?.ref}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <PurchaseStatusPill status={request.status} />
                  {meta?.priority ? (
                    <span className="text-xs font-semibold uppercase text-slate-500">{meta.priority}</span>
                  ) : null}
                </div>
              </div>
              <div className="text-right text-xs font-semibold text-slate-500">
                <div>{meta?.location}</div>
                <div className="mt-1 text-slate-700">{meta?.supplier}</div>
                <div className="text-[11px] text-slate-400 mt-1">{meta?.createdAt}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStat label="Expected qty" value={meta?.expectedQty} />
            <MiniStat label="Received qty" value={meta?.receivedQty} />
            <MiniStat label="Items" value={String(meta?.itemsCount ?? 0)} />
          </div>

          <div className="rounded-3xl bg-slate-50/70 ring-1 ring-slate-200/70 p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Items</div>
            <div className="mt-3 space-y-3">
              {meta?.items?.length ? (
                meta.items.map((item) => (
                  <div
                    key={item.id ?? item.product_variant_id ?? `${item.product_name}-${item.variant_name}`}
                    className="rounded-2xl bg-white/90 ring-1 ring-slate-200/70 p-3"
                  >
                    <div className="text-sm font-semibold text-slate-900">
                      {niceText(item.product_name)}
                      {item.variant_name ? (
                        <span className="text-xs text-slate-500"> ({item.variant_name})</span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-500">
                      <span>Requested {formatQty(item.requested_qty)}</span>
                      <span>Approved {formatQty(item.approved_qty)}</span>
                      <span>Received {formatQty(item.received_qty)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-white/70 ring-1 ring-slate-200/70 p-3 text-sm text-slate-600">No items yet.</div>
              )}
            </div>
          </div>

          {meta?.notes ? (
            <div className="rounded-3xl bg-white/80 ring-1 ring-slate-200/70 p-4">
              <div className="text-xs font-semibold text-slate-500">Notes</div>
              <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{meta.notes}</div>
            </div>
          ) : null}
        </div>
      )}
    </ModalShell>
  );
}
