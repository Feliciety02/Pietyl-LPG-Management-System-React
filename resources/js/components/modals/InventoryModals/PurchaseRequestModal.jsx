import React, { useEffect, useMemo, useState } from "react";
import { PackagePlus, Layers3, StickyNote, Hash } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function Field({ label, required = false, children }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="text-xs font-extrabold text-slate-700">{label}</div>
        {required ? (
          <div className="text-[11px] font-semibold text-slate-400">required</div>
        ) : null}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function InputShell({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-4 focus-within:ring-teal-500/15">
      {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
      {children}
    </div>
  );
}

function formatCurrency(value) {
  const n = Number(value || 0);
  return `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function TextInput({ icon, ...props }) {
  return (
    <InputShell icon={icon}>
      <input
        {...props}
        className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
      />
    </InputShell>
  );
}

function MetaPill({ children }) {
  return (
    <span className="inline-flex items-center rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
      {children}
    </span>
  );
}

export default function PurchaseRequestModal({
  open,
  onClose,
  item = null,
  products = [],
  suppliersByProduct = {},
  onSubmit,
  loading = false,
}) {
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [unitCost, setUnitCost] = useState("");

  useEffect(() => {
    if (!open) return;
    setQty("");
    setNote("");
    setUnitCost("");
  }, [open]);

  const displayData = useMemo(() => {
    if (!item) return null;
    
    // Item already has: name, variant, sku, supplier_name from the table row
    return {
      id: item.id,
      name: item.name || "Product",
      variant: item.variant || "",
      sku: item.sku || "",
      supplier_name: item.supplier_name || "—",
    };
  }, [item]);

  useEffect(() => {
    if (!open) return;
    const variantId = item?.product_variant_id ?? item?.id;
    if (!variantId) {
      setUnitCost("");
      return;
    }

    const supplierData =
      suppliersByProduct[String(variantId)]?.suppliers ||
      suppliersByProduct[Number(variantId)]?.suppliers ||
      [];
    const primarySupplier = supplierData.find((s) => s.is_primary) || supplierData[0];
    const fallback = Number(item?.supplier_cost ?? 0);
    const defaultCost = Number(primarySupplier?.unit_cost ?? fallback);
    setUnitCost(defaultCost > 0 ? defaultCost.toFixed(2) : "");
  }, [open, item, suppliersByProduct]);

  const normalizedQty = safeNum(qty);
  const totalCost = useMemo(() => safeNum(unitCost) * normalizedQty, [unitCost, normalizedQty]);
  const canSubmit = Boolean(item?.id) && normalizedQty > 0 && !loading;

  const submit = () => {
    if (!canSubmit) return;

    onSubmit?.({
      product_variant_id: Number(item.product_variant_id || item.id),
      qty: normalizedQty,
      note: note?.trim() || null,
      unit_cost: safeNum(unitCost),
    });
  };

  const unitCostDisplay = unitCost ? formatCurrency(Number(unitCost)) : "—";
  const totalCostDisplay = formatCurrency(totalCost);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-lg"
      layout="compact"
      title="Request restock"
      subtitle="Owner approval required"
      icon={PackagePlus}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4",
              !canSubmit
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
        {!item?.id ? (
          <div className="rounded-2xl bg-rose-600/10 ring-1 ring-rose-700/10 px-4 py-3 text-sm font-semibold text-rose-900">
            Select a product to continue.
          </div>
        ) : null}

        <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
              <Layers3 className="h-5 w-5 text-slate-600" />
            </div>

            <div className="min-w-0">
              <div className="text-sm font-extrabold text-slate-800">
                {displayData?.name || "Product"}{" "}
                <span className="text-slate-500 font-semibold">
                  {displayData?.variant ? `(${displayData.variant})` : ""}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {displayData?.sku ? <MetaPill>SKU: {displayData.sku}</MetaPill> : null}
                <MetaPill>Supplier: {displayData?.supplier_name || "—"}</MetaPill>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Unit cost" hint="Supplier cost per unit">
            <InputShell icon={Hash}>
              <input
                type="text"
                readOnly
                value={unitCostDisplay}
                className="w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none placeholder:text-slate-400"
              />
            </InputShell>
            <div className="mt-1 text-[11px] text-slate-500">
              Auto-filled from the linked supplier.
            </div>
          </Field>

          <Field label="Requested quantity" required>
            <TextInput
              icon={Hash}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="0"
            />
          </Field>
        </div>

        <Field label="Notes" hint="Optional">
          <TextInput
            icon={StickyNote}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional"
          />
        </Field>

        <Field label="Total cost" hint="Unit cost × quantity">
          <InputShell icon={Hash}>
            <input
              type="text"
              readOnly
              value={totalCostDisplay}
              className="w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none placeholder:text-slate-400"
            />
          </InputShell>
        </Field>
      </div>
    </ModalShell>
  );
}
