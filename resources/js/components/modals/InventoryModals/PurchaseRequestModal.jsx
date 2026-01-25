import React, { useEffect, useMemo, useState } from "react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function PurchaseRequestModal({
  open,
  onClose,
  item = null,
  products = [],
  onSubmit,
  loading = false,
}) {
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setQty("");
    setNote("");
  }, [open]);

  const product = useMemo(() => {
    if (!item?.id) return null;
    return products.find((p) => String(p.id) === String(item.id)) || item;
  }, [products, item]);

  const canSubmit = Boolean(item?.id) && safeNum(qty) > 0;

  const submit = () => {
    if (!canSubmit || loading) return;

    onSubmit?.({
      product_id: Number(item.id),
      qty: safeNum(qty),
      note: note?.trim() || null,
    });
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Request restock"
      subtitle="Send a restock request for owner approval."
      maxWidthClass="max-w-xl"
      bodyClassName="p-6"
      footerClassName="p-6 pt-0"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 focus:ring-4 focus:ring-teal-500/15"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || loading}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white focus:ring-4",
              !canSubmit || loading
                ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                : "bg-teal-600 ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25"
            )}
          >
            {loading ? "Sending..." : "Submit request"}
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
          <div className="text-sm font-extrabold text-slate-900">
            {product?.name || "Product"}{" "}
            <span className="text-slate-500 font-semibold">
              {product?.variant ? `(${product.variant})` : ""}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {product?.sku ? `${product.sku} • ` : ""}
            {product?.supplier_name || "No supplier"}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="text-xs font-extrabold text-slate-700">Requested quantity</div>
            <input
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              type="number"
              min="1"
              className="mt-2 w-full rounded-2xl bg-white px-3 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
              placeholder="0"
            />
            <div className="mt-1 text-xs text-slate-500">required</div>
          </div>

          <div>
            <div className="text-xs font-extrabold text-slate-700">Note</div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-2 w-full rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
              placeholder="Optional"
            />
            <div className="mt-1 text-xs text-slate-500">optional</div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
