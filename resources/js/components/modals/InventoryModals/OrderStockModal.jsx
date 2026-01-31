import React, { useEffect, useMemo, useState } from "react";
import { Package, Hash, StickyNote, Truck, AlertTriangle } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="text-xs font-extrabold text-slate-700">{label}</div>
      {hint ? <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div> : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function InputShell({ icon: Icon, children, className = "" }) {
  return (
    <div
      className={cx(
        "flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5",
        "focus-within:ring-teal-500/30",
        className
      )}
    >
      {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
      {children}
    </div>
  );
}

function Textarea({ icon: Icon, className = "", ...props }) {
  return (
    <div
      className={cx(
        "rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5",
        "focus-within:ring-teal-500/30",
        className
      )}
    >
      <div className="flex items-start gap-2">
        {Icon ? <Icon className="mt-0.5 h-4 w-4 text-slate-500" /> : null}
        <textarea
          {...props}
          className="min-h-[96px] w-full resize-none bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

export default function OrderStockModal({
  open,
  onClose,
  item = null,
  products = [],
  suppliers = {},
  onSubmit,
  loading = false,
}) {
  const [productId, setProductId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [qty, setQty] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;

    const presetProductId = item?.id ? String(item.id) : "";
    setProductId(presetProductId);

    const variantSuppliers = suppliers[presetProductId]?.suppliers || [];
    const defaultSupplier = variantSuppliers.find((s) => s.is_primary) || variantSuppliers[0];

    setSupplierId(defaultSupplier ? String(defaultSupplier.id) : "");
    setQty(item?.suggest_qty ? String(item.suggest_qty) : "");
    setUnitCost(defaultSupplier?.unit_cost ? String(defaultSupplier.unit_cost) : "");
    setNotes("");
  }, [open, item, suppliers]);

  const selectedProduct = useMemo(() => {
    if (!productId) return null;
    return products.find((p) => String(p.id) === String(productId)) || null;
  }, [products, productId]);

  const selectedSupplier = useMemo(() => {
    if (!supplierId) return null;
    return suppliers[productId]?.suppliers.find((s) => String(s.id) === String(supplierId)) || null;
  }, [suppliers, productId, supplierId]);

  const supplierMissing = Boolean(selectedProduct) && !supplierId;
  const canSubmit = Boolean(productId) && safeNum(qty) > 0 && !supplierMissing;

  const pickProduct = (e) => {
    const nextId = e.target.value;
    setProductId(nextId);

    const variantSuppliers = suppliers[nextId]?.suppliers || [];
    const defaultSupplier = variantSuppliers.find((s) => s.is_primary) || variantSuppliers[0];
    setSupplierId(defaultSupplier ? String(defaultSupplier.id) : "");
    setUnitCost(defaultSupplier?.unit_cost ? String(defaultSupplier.unit_cost) : "");

    if (!nextId) {
      setQty("");
      setUnitCost("");
      setNotes("");
    }
  };

  const submit = () => {
    if (!canSubmit || loading) return;

    onSubmit?.({
      product_variant_id: Number(productId),
      supplier_id: Number(supplierId),
      qty: safeNum(qty),
      unit_cost: safeNum(unitCost),
      notes: notes.trim() || null,
    });
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      layout="compact"
      title="Order stock"
      subtitle="Pick product, confirm supplier, enter quantity."
      icon={Package}
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
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4",
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
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Product" hint="Select a product and variant">
            <InputShell>
              <select
                value={productId}
                onChange={pickProduct}
                className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
                disabled={loading}
              >
                <option value="">Select a product</option>
                {products.map((p) => {
                  const variantSuppliers = suppliers[p.id]?.suppliers || [];
                  const productLabel = `${p.product_name}: ${p.variant_name}`;
                  return (
                    <option key={p.id} value={String(p.id)}>
                      {productLabel}
                    </option>
                  );
                })}
              </select>
            </InputShell>
          </Field>

          <Field label="Supplier" hint="Auto-picked from product">
            <div
              className={cx(
                "rounded-2xl bg-white ring-1 px-3 py-2.5",
                supplierMissing ? "ring-rose-200" : "ring-slate-200"
              )}
            >
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-slate-500" />
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-slate-900 truncate">
                    {selectedSupplier?.name || (selectedProduct ? "No supplier linked" : "Select a product")}
                  </div>
                  {supplierMissing ? (
                    <div className="mt-0.5 text-[11px] font-semibold text-rose-700 inline-flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Set a default supplier first
                    </div>
                  ) : (
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {selectedSupplier ? "picked automatically" : "—"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Quantity" hint="Required">
            <InputShell icon={Hash}>
              <input
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="0"
                className="w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none placeholder:text-slate-400"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
              />
            </InputShell>
          </Field>

          <Field label="Unit Cost" hint="Auto-filled, editable (₱)">
            <InputShell icon={Hash}>
              <input
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                className="w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none placeholder:text-slate-400"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
              />
            </InputShell>
          </Field>
        </div>

        <Field label="Notes" hint="Optional">
          <Textarea
            icon={StickyNote}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal notes..."
            disabled={loading}
          />
        </Field>
      </div>
    </ModalShell>
  );
}