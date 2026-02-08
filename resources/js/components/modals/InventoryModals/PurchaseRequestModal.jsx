import React, { useEffect, useMemo, useState } from "react";
import { PackagePlus, Layers3, StickyNote, Hash, Calculator, Truck } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

/* ---------------- helpers ---------------- */

function safeNum(v) {
  const n = Number(String(v || "").replace(/,/g, ""));
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

/* ---------------- UI primitives (match AddProductModal style) ---------------- */

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

function Input({ icon: Icon, left, right, ...props }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-teal-500/30">
      {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}

      {left ? (
        <div className="shrink-0 pr-2 border-r border-slate-200/70 text-xs font-extrabold text-slate-600">
          {left}
        </div>
      ) : null}

      <input
        {...props}
        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
      />

      {right ? (
        <div className="shrink-0 pl-2 border-l border-slate-200/70 text-xs font-extrabold text-slate-600">
          {right}
        </div>
      ) : null}
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
  const [negativeQty, setNegativeQty] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQty("");
    setNote("");
    setUnitCost("");
    setNegativeQty(false);
  }, [open]);

  const displayData = useMemo(() => {
    if (!item) return null;

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

  const qtyClean = useMemo(() => decimalOnly(qty), [qty]);
  const normalizedQty = useMemo(() => safeNum(qtyClean), [qtyClean]);

  useEffect(() => {
    const n = safeNum(qtyClean);
    setNegativeQty(Number.isFinite(n) ? n < 0 : false);
  }, [qtyClean]);

  const totalCost = useMemo(() => safeNum(unitCost) * normalizedQty, [unitCost, normalizedQty]);

  const canSubmit = useMemo(() => {
    if (!item?.id) return false;
    if (loading) return false;
    if (negativeQty) return false;
    if (normalizedQty <= 0) return false;
    if (safeNum(unitCost) <= 0) return false;
    return true;
  }, [item, loading, negativeQty, normalizedQty, unitCost]);

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
      maxWidthClass="max-w-xl"
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
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
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

            <div className="min-w-0 flex-1">
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

            <div className="hidden sm:flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
                <Truck className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Unit cost" hint="Auto-filled from the linked supplier">
            <Input icon={Hash} readOnly value={unitCostDisplay} />
          </Field>

          <Field label="Requested quantity" hint="How many units to restock" required>
            <Input
              icon={Hash}
              value={qtyClean}
              onKeyDown={allowDecimalKeyDown}
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
            />
            {negativeQty ? (
              <div className="mt-1 text-[11px] font-semibold text-rose-700">
                Negative quantities are not allowed.
              </div>
            ) : null}
          </Field>
        </div>

        <Field label="Notes" hint="Optional context for the approver">
          <Input
            icon={StickyNote}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional"
          />
        </Field>

        <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
              <Calculator className="h-4 w-4 text-slate-600" />
            </div>
            <div className="text-xs font-extrabold text-slate-700">Cost summary</div>
          </div>

          <div className="mt-3 grid gap-2">
            <SummaryRow label="Unit cost" value={unitCostDisplay} />
            <SummaryRow label="Quantity" value={normalizedQty ? String(normalizedQty) : "—"} />
            <div className="my-1 h-px bg-slate-200/70" />
            <SummaryRow label="Total cost" value={totalCostDisplay} strong />
          </div>

          <div className="mt-2 text-[11px] text-slate-500">
            Total is computed from the current supplier unit cost.
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
