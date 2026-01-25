import React, { useEffect, useMemo, useState } from "react";
import ModalShell from "../ModalShell";
import { Search } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function NewPurchaseModal({
  open,
  onClose,
  item = null,
  products = [],
  suppliers = [],
  onSubmit,
  loading = false,
}) {
  const [q, setQ] = useState("");
  const [productId, setProductId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;

    const presetProductId = item?.id ? String(item.id) : "";
    const presetSupplierId = item?.default_supplier_id
      ? String(item.default_supplier_id)
      : "";

    setQ("");
    setProductId(presetProductId);
    setSupplierId(presetSupplierId);
    setQty(item?.suggest_qty ? String(item.suggest_qty) : "");
    setNotes("");
  }, [open, item]);

  const filteredProducts = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;

    return products.filter((p) => {
      const hay = `${p.name || ""} ${p.variant || ""} ${p.sku || ""}`.toLowerCase();
      return hay.includes(term);
    });
  }, [products, q]);

  const selectedProduct = useMemo(() => {
    if (!productId) return null;
    return products.find((p) => String(p.id) === String(productId)) || null;
  }, [products, productId]);

  const selectedSupplier = useMemo(() => {
    if (!supplierId) return null;
    return suppliers.find((s) => String(s.id) === String(supplierId)) || null;
  }, [suppliers, supplierId]);

  const canSubmit = Boolean(productId) && Boolean(supplierId) && safeNum(qty) > 0;

  const submit = () => {
    if (!canSubmit || loading) return;

    onSubmit?.({
      product_id: Number(productId),
      supplier_id: Number(supplierId),
      qty: safeNum(qty),
      notes: notes?.trim() || null,
    });
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Order stock"
      subtitle="Create a purchase order for a supplier."
      maxWidthClass="max-w-3xl"
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
            {loading ? "Saving..." : "Create purchase"}
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="text-xs font-extrabold text-slate-700">Product</div>

            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                placeholder="Search product, SKU, variant..."
              />
            </div>

            <select
              value={productId}
              onChange={(e) => {
                const next = e.target.value;
                setProductId(next);

                const picked = products.find((p) => String(p.id) === String(next));
                if (picked?.default_supplier_id) {
                  setSupplierId(String(picked.default_supplier_id));
                }
              }}
              className="mt-2 w-full rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
            >
              <option value="">Select a product</option>
              {filteredProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {(p.sku ? `${p.sku} · ` : "") + `${p.name}${p.variant ? ` (${p.variant})` : ""}`}
                </option>
              ))}
            </select>

            {selectedProduct ? (
              <div className="mt-2 text-xs text-slate-500">
                default supplier:{" "}
                <span className="font-semibold text-slate-700">
                  {suppliers.find((s) => String(s.id) === String(selectedProduct.default_supplier_id))
                    ?.name || "none"}
                </span>
              </div>
            ) : null}
          </div>

          <div>
            <div className="text-xs font-extrabold text-slate-700">Supplier</div>

            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="mt-2 w-full rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
            >
              <option value="">Select a supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {selectedSupplier ? (
              <div className="mt-2 text-xs text-slate-500">
                ordering from{" "}
                <span className="font-semibold text-slate-700">{selectedSupplier.name}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="text-xs font-extrabold text-slate-700">Quantity</div>
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
            <div className="text-xs font-extrabold text-slate-700">Notes</div>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
