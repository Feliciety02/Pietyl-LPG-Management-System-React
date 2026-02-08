import React, { useEffect, useMemo, useState } from "react";
import {
  Package,
  Hash,
  StickyNote,
  Truck,
  AlertTriangle,
  Layers3,
  Calculator,
  CheckCircle2,
} from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

/* ---------------- helpers ---------------- */

function safeNum(v) {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function decimalOnly(v) {
  const s = String(v || "").replace(/[^\d.]/g, "");
  const parts = s.split(".");
  if (parts.length <= 1) return s;
  return `${parts[0]}.${parts.slice(1).join("")}`;
}

function allowDecimalKeyDown(e) {
  const k = e.key;

  const allowed =
    k === "Backspace" ||
    k === "Delete" ||
    k === "Tab" ||
    k === "Enter" ||
    k === "Escape" ||
    k === "ArrowLeft" ||
    k === "ArrowRight" ||
    k === "Home" ||
    k === "End";

  if (allowed) return;
  if (e.ctrlKey || e.metaKey) return;

  if (k === ".") {
    if (String(e.currentTarget.value || "").includes(".")) e.preventDefault();
    return;
  }

  if (!/^\d$/.test(k)) e.preventDefault();
}

function formatCurrency(value) {
  const n = Number(value || 0);
  return `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ---------------- UI primitives ---------------- */

function Field({ label, hint, required = false, children }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <div className="text-xs font-extrabold text-slate-700">{label}</div>
        {required ? (
          <div className="text-[11px] font-semibold text-slate-400">required</div>
        ) : null}
      </div>
      {hint ? <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div> : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Input({ icon: Icon, left, right, children, className = "", ...props }) {
  return (
    <div
      className={cx(
        "h-11 w-full flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3",
        "focus-within:ring-teal-500/30",
        className
      )}
    >
      {Icon ? <Icon className="h-4 w-4 text-slate-500 shrink-0" /> : null}

      {left ? (
        <div className="shrink-0 pr-2 border-r border-slate-200/70 text-xs font-extrabold text-slate-600">
          {left}
        </div>
      ) : null}

      {children ? (
        children
      ) : (
        <input
          {...props}
          className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
        />
      )}

      {right ? (
        <div className="shrink-0 pl-2 border-l border-slate-200/70 text-xs font-extrabold text-slate-600">
          {right}
        </div>
      ) : null}
    </div>
  );
}

function Textarea({ icon: Icon, className = "", ...props }) {
  return (
    <div
      className={cx(
        "w-full rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5",
        "focus-within:ring-teal-500/30",
        className
      )}
    >
      <div className="flex items-start gap-2">
        {Icon ? <Icon className="mt-0.5 h-4 w-4 text-slate-500 shrink-0" /> : null}
        <textarea
          {...props}
          className="min-h-[110px] w-full resize-none bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

function MetaPill({ children }) {
  return (
    <span className="inline-flex items-center rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
      {children}
    </span>
  );
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-xs font-extrabold text-slate-600">{label}</div>
      <div className={cx("text-sm text-slate-900", strong ? "font-extrabold" : "font-semibold")}>
        {value}
      </div>
    </div>
  );
}

/* ---------------- data helpers ---------------- */

function getDefaultSupplierCost(variantId, suppliers) {
  if (!variantId) return 0;
  const variantSuppliers = suppliers[variantId]?.suppliers || [];
  const primary = variantSuppliers.find((s) => s.is_primary) || variantSuppliers[0];
  return primary ? Number(primary.unit_cost ?? primary.supplier_cost ?? 0) : 0;
}

function resolveUnitCost(variantId, suppliers, product) {
  const supplierCost = getDefaultSupplierCost(variantId, suppliers);
  if (supplierCost > 0) return supplierCost;

  const productCost = Number(product?.supplier_cost ?? product?.unit_cost ?? 0);
  return productCost > 0 ? productCost : 0;
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
  const [unitCost, setUnitCost] = useState(0);
  const [notes, setNotes] = useState("");
  const [negativeQty, setNegativeQty] = useState(false);

  const selectedProduct = useMemo(() => {
    if (!productId) return null;
    return products.find((p) => String(p.id) === String(productId)) || null;
  }, [products, productId]);

  const selectedSupplier = useMemo(() => {
    if (!supplierId) return null;
    return suppliers[productId]?.suppliers?.find((s) => String(s.id) === String(supplierId)) || null;
  }, [suppliers, productId, supplierId]);

  const supplierMissing = Boolean(selectedProduct) && !supplierId;

  useEffect(() => {
    if (!open) return;

    const presetProductId = item?.product_variant_id
      ? String(item.product_variant_id)
      : item?.id
      ? String(item.id)
      : "";

    setProductId(presetProductId);

    const variantSuppliers = suppliers[presetProductId]?.suppliers || [];
    const defaultSupplier = variantSuppliers.find((s) => s.is_primary) || variantSuppliers[0];

    const presetSupplier = item?.supplier_id
      ? variantSuppliers.find((s) => String(s.id) === String(item.supplier_id))
      : null;

    const effectiveSupplier = presetSupplier || defaultSupplier;

    setSupplierId(effectiveSupplier ? String(effectiveSupplier.id) : "");
    setQty(item?.suggest_qty ? String(item.suggest_qty) : "");
    setNotes("");

    const baseProduct =
      products.find((p) => String(p.id) === String(presetProductId)) || selectedProduct;

    setUnitCost(resolveUnitCost(presetProductId, suppliers, baseProduct));
    setNegativeQty(false);
  }, [open, item, suppliers, products, selectedProduct]);

  const qtyClean = useMemo(() => decimalOnly(qty), [qty]);
  const qtyValue = useMemo(() => safeNum(qtyClean), [qtyClean]);

  useEffect(() => {
    const hasMinus = String(qty || "").includes("-");
    const parsed = safeNum(qtyClean);
    setNegativeQty(hasMinus || parsed < 0);
  }, [qty, qtyClean]);

  useEffect(() => {
    if (!productId) {
      setUnitCost(0);
      return;
    }
    setUnitCost(resolveUnitCost(productId, suppliers, selectedProduct));
  }, [productId, suppliers, selectedProduct]);

  const totalCost = useMemo(() => qtyValue * safeNum(unitCost), [qtyValue, unitCost]);

  const canSubmit = useMemo(() => {
    if (!productId) return false;
    if (loading) return false;
    if (supplierMissing) return false;
    if (negativeQty) return false;
    if (qtyValue <= 0) return false;
    if (safeNum(unitCost) <= 0) return false;
    return true;
  }, [productId, loading, supplierMissing, negativeQty, qtyValue, unitCost]);

  const pickProduct = (e) => {
    const nextId = e.target.value;
    setProductId(nextId);

    const variantSuppliers = suppliers[nextId]?.suppliers || [];
    const defaultSupplier = variantSuppliers.find((s) => s.is_primary) || variantSuppliers[0];
    setSupplierId(defaultSupplier ? String(defaultSupplier.id) : "");

    const baseProduct = products.find((p) => String(p.id) === String(nextId)) || null;
    setUnitCost(resolveUnitCost(nextId, suppliers, baseProduct));

    if (!nextId) {
      setQty("");
      setUnitCost(0);
      setNotes("");
      setNegativeQty(false);
    }
  };

  const submit = () => {
    if (!canSubmit || loading) return;

    onSubmit?.({
      product_variant_id: Number(productId),
      supplier_id: Number(supplierId),
      qty: qtyValue,
      unit_cost: safeNum(unitCost),
      notes: notes.trim() || null,
    });
  };

  const productLabel = selectedProduct
    ? `${selectedProduct.product_name || selectedProduct.name || "Product"}${
        selectedProduct.variant_name ? ` (${selectedProduct.variant_name})` : ""
      }`
    : "";

  const productSku = selectedProduct?.sku || selectedProduct?.variant_sku || "";

  const supplierChip =
    selectedSupplier?.name || (selectedProduct ? "No supplier linked" : "Select a product");

  const unitCostDisplay = safeNum(unitCost) > 0 ? formatCurrency(unitCost) : "—";
  const totalDisplay = formatCurrency(totalCost);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      layout="compact"
      title="Order stock"
      subtitle="Everything aligned in a clean 2-column layout."
      icon={Package}
      bodyClassName="p-6"
      footerClassName="p-6 pt-0"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || loading}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25",
              !canSubmit || loading
                ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                : "bg-teal-600 ring-teal-600 hover:bg-teal-700"
            )}
          >
            {loading ? "Saving..." : "Create purchase"}
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        {/* Top summary card spans full width but keeps equal internal rhythm */}
        <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
              <Layers3 className="h-5 w-5 text-slate-600" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-extrabold text-slate-800">
                {productLabel || "Select a product"}
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {productSku ? <MetaPill>SKU: {productSku}</MetaPill> : null}
                <MetaPill>Supplier: {supplierChip}</MetaPill>
                {qtyValue > 0 ? <MetaPill>Qty: {String(qtyValue)}</MetaPill> : null}
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
                <Truck className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </div>

          {supplierMissing ? (
            <div className="mt-3 rounded-2xl bg-rose-600/10 ring-1 ring-rose-700/10 px-4 py-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-700" />
                <div className="text-sm font-semibold text-rose-900">
                  No supplier linked for this product. Set a default supplier first.
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* 2-column main layout, everything equal height/spacing */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* LEFT COLUMN */}
          <div className="grid gap-4">
            <Field label="Product" hint="Select a product and variant" required>
              <Input className="pr-2">
                <select
                  value={productId}
                  onChange={pickProduct}
                  className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
                  disabled={loading}
                >
                  <option value="">Select a product</option>
                  {products.map((p) => {
                    const label = `${p.product_name || p.name || "Product"}: ${
                      p.variant_name || p.variant || "Default"
                    }`;
                    return (
                      <option key={p.id} value={String(p.id)}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </Input>
            </Field>

            <Field
              label="Supplier"
              hint={selectedSupplier ? "Picked automatically (default supplier)" : "Auto-picked from product"}
              required
            >
              <div
                className={cx(
                  "h-11 w-full rounded-2xl bg-white ring-1 px-3 flex items-center gap-2",
                  supplierMissing ? "ring-rose-200" : "ring-slate-200"
                )}
              >
                {supplierMissing ? (
                  <AlertTriangle className="h-4 w-4 text-rose-700 shrink-0" />
                ) : (
                  <Truck className="h-4 w-4 text-slate-500 shrink-0" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900 truncate">{supplierChip}</div>
                </div>

                {!supplierMissing && selectedSupplier ? (
                  <div className="shrink-0 inline-flex items-center gap-1.5 rounded-2xl bg-teal-600/10 px-2.5 py-1 text-[11px] font-extrabold text-teal-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    ready
                  </div>
                ) : null}
              </div>

              {supplierMissing ? (
                <div className="mt-1 text-[11px] font-semibold text-rose-700">
                  Link a supplier to continue.
                </div>
              ) : null}
            </Field>

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

          {/* RIGHT COLUMN */}
          <div className="grid gap-4">
            <Field label="Unit cost" hint="Supplier rate per unit" required>
              <Input icon={Hash} readOnly value={unitCostDisplay} />
              {safeNum(unitCost) <= 0 ? (
                <div className="mt-1 text-[11px] font-semibold text-rose-700">
                  Supplier cost is missing. Link a supplier price first.
                </div>
              ) : null}
            </Field>

            <Field label="Quantity" hint="Required" required>
              <Input
                icon={Hash}
                value={qtyClean}
                onKeyDown={(e) => {
                  allowDecimalKeyDown(e);
                  if (e.key === "Enter") submit();
                }}
                onChange={(e) => {
                  const raw = e.target.value;

                  if (raw.includes("-")) {
                    setNegativeQty(true);
                    setQty(raw.replace(/-/g, ""));
                    return;
                  }

                  setQty(decimalOnly(raw));
                }}
                inputMode="decimal"
                placeholder="0"
                disabled={loading}
              />
              {negativeQty ? (
                <div className="mt-1 text-[11px] font-semibold text-rose-700">
                  Negative quantities are not allowed.
                </div>
              ) : null}
            </Field>

            {/* Summary takes remaining space and stays visually equal */}
            <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
                  <Calculator className="h-4 w-4 text-slate-600" />
                </div>
                <div className="text-xs font-extrabold text-slate-700">Cost summary</div>
              </div>

              <div className="mt-3 grid gap-2">
                <SummaryRow label="Unit cost" value={unitCostDisplay} />
                <SummaryRow label="Quantity" value={qtyValue > 0 ? String(qtyValue) : "—"} />
                <div className="my-1 h-px bg-slate-200/70" />
                <SummaryRow label="Total cost" value={totalDisplay} strong />
              </div>

              <div className="mt-2 text-[11px] text-slate-500">
                Total is computed from the current supplier unit cost.
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
