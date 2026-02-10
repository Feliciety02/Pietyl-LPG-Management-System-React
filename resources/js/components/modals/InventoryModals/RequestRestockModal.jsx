import React, { useEffect, useMemo, useState } from "react";
import { Package, StickyNote, Calculator, AlertTriangle, Truck } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

/* helpers */

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

const MISSING = "—";
const PESO = "₱";

function formatAmount(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function pickDefaultSupplier(variantSuppliers = []) {
  if (!Array.isArray(variantSuppliers) || !variantSuppliers.length) return null;
  return variantSuppliers.find((s) => s.is_primary) || variantSuppliers[0] || null;
}

function supplierUnitCost(supplier) {
  const cost = safeNum(supplier?.supplier_cost ?? supplier?.unit_cost ?? 0);
  return cost > 0 ? cost : 0;
}

/* UI */

function Field({ label, hint, required = false, children }) {
  return (
    <div>
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

function Input({ left, children, ...props }) {
  return (
    <div className="h-11 w-full flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 focus-within:ring-teal-500/30">
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
    </div>
  );
}

function Textarea({ icon: Icon, ...props }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-teal-500/30">
      <div className="flex items-start gap-2">
        {Icon ? <Icon className="mt-0.5 h-4 w-4 text-slate-500" /> : null}
        <textarea
          {...props}
          className="min-h-[90px] w-full resize-none bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
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

/* component */

export default function RequestRestockModal({
  open,
  onClose,
  item = null,
  products = [],
  suppliers = {},
  onSubmit,
  loading = false,
  mode = "purchase",
}) {
  const [productId, setProductId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [qty, setQty] = useState("");
  const [unitCost, setUnitCost] = useState(0);
  const [notes, setNotes] = useState("");
  const [negativeQty, setNegativeQty] = useState(false);

  const variantSuppliers = useMemo(() => {
    if (!productId) return [];
    return suppliers?.[productId]?.suppliers || [];
  }, [suppliers, productId]);

  const selectedSupplier = useMemo(() => {
    if (!supplierId) return null;
    return variantSuppliers.find((s) => String(s.id) === String(supplierId)) || null;
  }, [variantSuppliers, supplierId]);

  const supplierMissing = Boolean(productId) && variantSuppliers.length === 0;

  useEffect(() => {
  if (!open) return;

  const presetProductId = item?.product_variant_id
    ? String(item.product_variant_id)
    : item?.id
    ? String(item.id)
    : "";

  setProductId(presetProductId);
  
  // Calculate suggested quantity based on reorder level
  const currentQty = item?.qty_filled ?? item?.current_qty ?? 0;
  const reorderLevel = item?.reorder_level ?? 0;
  const suggestedQty = Math.max(reorderLevel - currentQty, 0);
  
  setQty(suggestedQty > 0 ? String(suggestedQty) : "");
  setNotes("");
  setNegativeQty(false);

  const presetSuppliers = suppliers?.[presetProductId]?.suppliers || [];
  const defaultSupplier = pickDefaultSupplier(presetSuppliers);

  setSupplierId(defaultSupplier ? String(defaultSupplier.id) : "");
  setUnitCost(defaultSupplier ? supplierUnitCost(defaultSupplier) : 0);
}, [open, item, suppliers]);

  const qtyClean = useMemo(() => decimalOnly(qty), [qty]);
  const qtyValue = useMemo(() => safeNum(qtyClean), [qtyClean]);

  useEffect(() => {
    setNegativeQty(String(qty || "").includes("-"));
  }, [qty]);

  useEffect(() => {
    if (!productId) {
      setSupplierId("");
      setUnitCost(0);
      return;
    }

    const list = suppliers?.[productId]?.suppliers || [];
    const stillValid =
      supplierId && list.some((s) => String(s.id) === String(supplierId));

    if (!stillValid) {
      const def = pickDefaultSupplier(list);
      setSupplierId(def ? String(def.id) : "");
      setUnitCost(def ? supplierUnitCost(def) : 0);
    }
  }, [productId, suppliers]); // intentionally not depending on supplierId to avoid loops

  useEffect(() => {
    if (!productId) return;
    if (!supplierId) {
      setUnitCost(0);
      return;
    }
    const cost = supplierUnitCost(selectedSupplier);
    setUnitCost(cost);
  }, [productId, supplierId, selectedSupplier]);

  const totalCost = useMemo(() => qtyValue * safeNum(unitCost), [qtyValue, unitCost]);

  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (!productId) return false;
    if (!supplierId) return false;
    if (supplierMissing) return false;
    if (negativeQty) return false;
    if (qtyValue <= 0) return false;
    if (safeNum(unitCost) <= 0) return false;
    return true;
  }, [loading, productId, supplierId, supplierMissing, negativeQty, qtyValue, unitCost]);

  const submit = () => {
    if (!canSubmit) return;

    onSubmit?.({
      product_variant_id: Number(productId),
      supplier_id: Number(supplierId),
      qty: qtyValue,
      unit_cost: safeNum(unitCost),
      notes: notes.trim() || null,
    });
  };

  const unitCostDisplay = safeNum(unitCost) > 0 ? formatAmount(unitCost) : MISSING;
  const totalDisplay = formatAmount(totalCost);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      layout="compact"
      maxWidthClass="max-w-5xl"
      title="Request Restock"
      subtitle="Select a product and the supplier unit cost will auto fill."
      icon={Package}
      bodyClassName="p-6"
      footerClassName="p-6 pt-0"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25",
              !canSubmit
                ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                : "bg-teal-600 ring-teal-600 hover:bg-teal-700"
            )}
          >
            {loading ? "Saving..." : mode === "request" ? "Submit request" : "Create purchase"}
          </button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-[1.25fr_1fr]">
        <div className="grid gap-4">
          <Field label="Product" required>
            <Input>
              <select
                value={productId}
                onChange={(e) => setProductId(String(e.target.value))}
                className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
                disabled={loading}
              >
                <option value="">Select a product</option>
                {products.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.product_name || p.name}
                  </option>
                ))}
              </select>
            </Input>
          </Field>

          <Field label="Supplier" hint="Auto selected from product suppliers" required>
            <Input>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(String(e.target.value))}
                className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
                disabled={loading || !productId || variantSuppliers.length === 0}
              >
                <option value="">
                  {productId ? (variantSuppliers.length ? "Select supplier" : "No suppliers found") : "Select product first"}
                </option>
                {variantSuppliers.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Input>

            {supplierMissing ? (
              <div className="mt-2 rounded-2xl bg-rose-50 ring-1 ring-rose-200 px-4 py-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-700" />
                  <div className="text-sm font-semibold text-rose-900">
                    This product has no supplier pricing yet. Add a supplier cost to auto fill unit cost.
                  </div>
                </div>
              </div>
            ) : null}
          </Field>

          <Field label="Quantity" required>
            <Input
              value={qtyClean}
              onKeyDown={allowDecimalKeyDown}
              onChange={(e) => setQty(decimalOnly(e.target.value))}
              placeholder="0"
              disabled={loading}
            />
            {negativeQty ? (
              <div className="mt-1 text-[11px] font-semibold text-rose-700">
                Negative quantities are not allowed.
              </div>
            ) : null}
          </Field>

          <Field label="Notes">
            <Textarea
              icon={StickyNote}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              disabled={loading}
            />
          </Field>
        </div>

        <div className="grid gap-4">
          <Field label="Unit cost"  required>
            <Input left={PESO} readOnly value={unitCostDisplay} />
            {productId && supplierId && safeNum(unitCost) <= 0 ? (
              <div className="mt-1 text-[11px] font-semibold text-rose-700">
                Selected supplier has no cost value. Fill supplier_cost or unit_cost on that supplier record.
              </div>
            ) : null}
          </Field>

          <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-slate-600" />
              <div className="text-xs font-extrabold text-slate-700">Cost summary</div>
            </div>

            <SummaryRow label="Unit cost" value={`${PESO}${unitCostDisplay}`} />
            <SummaryRow label="Quantity" value={qtyValue > 0 ? String(qtyValue) : MISSING} />

            <div className="my-2 h-px bg-slate-200/70" />

            <SummaryRow label="Total" value={`${PESO}${totalDisplay}`} strong />
          </div>

          <div className="rounded-2xl bg-white ring-1 ring-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-2xl bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center">
                <Truck className="h-4 w-4 text-slate-600" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-slate-900">
                  Using supplier pricing
                </div>
                <div className="mt-0.5 text-xs text-slate-500 truncate">
                  {selectedSupplier?.name || "No supplier selected"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
