// resources/js/components/modals/ProductModals/AddProductModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { PackagePlus, Tag, Layers, Building2 } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

/* ---------------- helpers ---------------- */

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

function slugifySku(value = "") {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function compactCode(value = "", max = 3) {
  const cleaned = String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (!cleaned) return "";
  return cleaned.slice(0, max);
}

function nextSequence(base, existingSkus = []) {
  if (!base) return "";
  const prefix = `${base}-`;
  let max = 0;

  existingSkus.forEach((sku) => {
    if (!sku || typeof sku !== "string") return;
    if (!sku.startsWith(prefix)) return;

    const match = sku.match(/-(\d{3,})$/);
    if (!match) return;

    const n = Number(match[1]);
    if (Number.isFinite(n) && n > max) max = n;
  });

  const next = max + 1 || 1;
  const padded = String(next).padStart(3, "0");
  return `${base}-${padded}`;
}

/* ---------------- UI primitives ---------------- */

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="text-xs font-extrabold text-slate-700">{label}</div>
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

function Select({ icon: Icon, children, ...props }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-teal-500/30">
      {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
      <select
        {...props}
        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
      >
        {children}
      </select>
    </div>
  );
}

/* ---------------- constants ---------------- */

const PRODUCT_TYPES = [
  { value: "lpg", label: "LPG" },
  { value: "stove", label: "Stove" },
  { value: "accessories", label: "Accessories" },
];

const STOVE_TYPES = [
  { value: "single", label: "Single burner" },
  { value: "double", label: "Double burner" },
];

export default function AddProductModal({
  open,
  onClose,
  onSubmit,
  suppliers = [],
  existingSkus = [],
  loading = false,
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("lpg");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [negativePrice, setNegativePrice] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [stoveType, setStoveType] = useState("single");

  useEffect(() => {
    if (!open) return;
    setName("");
    setType("lpg");
    setSize("");
    setPrice("");
    setNegativePrice(false);
    setSupplierId("");
    setStoveType("single");
  }, [open]);

  const sizeClean = useMemo(() => decimalOnly(size), [size]);
  const priceClean = useMemo(() => decimalOnly(price), [price]);

  const sku = useMemo(() => {
    const nameCode = compactCode(name, 3);

    if (type === "lpg") {
      const sizeSlug = slugifySku(sizeClean);
      const base = sizeSlug && nameCode ? `LPG-${sizeSlug}-${nameCode}` : "";
      return nextSequence(base, existingSkus);
    }

    if (type === "stove") {
      const stoveCode = stoveType === "double" ? "DBL" : "SNG";
      const base = nameCode ? `STV-${stoveCode}-${nameCode}` : "";
      return nextSequence(base, existingSkus);
    }

    return "";
  }, [type, sizeClean, stoveType, name, existingSkus]);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!sku.trim()) return false;
    if (!supplierId) return false;
    if (negativePrice) return false;

    const n = Number(String(priceClean || "").replace(/,/g, ""));
    if (!Number.isFinite(n) || n <= 0) return false;

    if (type === "lpg" && !String(sizeClean || "").trim()) return false;
    if (type === "stove" && !stoveType) return false;

    return true;
  }, [name, sku, priceClean, supplierId, type, sizeClean, stoveType, negativePrice]);

  const submit = () => {
    if (!canSubmit || loading) return;

    onSubmit?.({
      name: name.trim(),
      sku: sku.trim(),
      type,
      size_label: type === "lpg" ? String(sizeClean || "").trim() || null : null,
      price: String(priceClean || "").trim(),
      supplier_id: supplierId,
      stove_type: type === "stove" ? stoveType : null,
    });
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-lg"
      layout="compact"
      title="Add product"
      subtitle="Create a new item for the product catalog"
      icon={PackagePlus}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
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
            {loading ? "Saving..." : "Create product"}
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Product type">
            <Select
              icon={Layers}
              value={type}
              onChange={(e) => {
                const next = e.target.value;
                setType(next);
                if (next !== "lpg") setSize("");
              }}
            >
              {PRODUCT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>

          {type === "stove" ? (
            <Field label="Stove type">
              <Select value={stoveType} onChange={(e) => setStoveType(e.target.value)}>
                {STOVE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
        </div>

        <Field label="Product name">
          <Input
            icon={PackagePlus}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="LPG Cylinder"
            autoFocus
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          {type === "lpg" ? (
            <Field label="Size">
              <Input
                value={sizeClean}
                onKeyDown={allowDecimalKeyDown}
                onChange={(e) => setSize(decimalOnly(e.target.value))}
                placeholder="11"
                inputMode="decimal"
                right="KG"
              />
            </Field>
          ) : null}

          <Field label="Price">
            <Input
              left="₱"
              value={priceClean}
              onKeyDown={allowDecimalKeyDown}
              onChange={(e) => {
                const raw = e.target.value;

                if (raw.includes("-")) {
                  setNegativePrice(true);
                  setPrice(raw.replace(/-/g, ""));
                  return;
                }

                const cleaned = decimalOnly(raw);
                const parsed = Number(String(cleaned || "").replace(/,/g, ""));
                setNegativePrice(Number.isFinite(parsed) ? parsed < 0 : false);
                setPrice(cleaned);
              }}
              inputMode="decimal"
              placeholder="0.00"
            />
            {negativePrice ? (
              <div className="mt-1 text-[11px] font-semibold text-rose-700">
                Negative prices are not allowed.
              </div>
            ) : null}
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Supplier">
            <Select
              icon={Building2}
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="SKU">
            <Input icon={Tag} value={sku} placeholder="Auto-generated" readOnly />
          </Field>
        </div>
      </div>
    </ModalShell>
  );
}
