// resources/js/components/modals/ProductModals/EditProductModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Package, Tag, Layers, PhilippinePeso, Building2 } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="text-xs font-extrabold text-slate-700">{label}</div>
      {hint ? (
        <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div>
      ) : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Input({ icon: Icon, ...props }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-teal-500/30">
      {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
      <input
        {...props}
        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
      />
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

function Tabs({ tabs, value, onChange }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-slate-50 p-1 ring-1 ring-slate-200">
      {tabs.map((t) => {
        const active = t.value === value;

        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={cx(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition",
              active
                ? "bg-teal-600/10 text-teal-900 ring-1 ring-teal-500/30"
                : "text-slate-600 hover:text-slate-800"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

const PRODUCT_TYPES = [
  { value: "lpg", label: "LPG" },
  { value: "stove", label: "Stove" },
  { value: "accessories", label: "Accessories" },
];

const STOVE_TYPES = [
  { value: "single", label: "Single burner" },
  { value: "double", label: "Double burner" },
];

const ACCESSORY_TABS = [
  { value: "hose", label: "Hose" },
  { value: "regulator", label: "Regulator" },
  { value: "others", label: "Others" },
];

function safeMoney(v) {
  if (v == null) return "";
  const s = String(v).trim();
  return s;
}

function inferAccessoryTab(sku = "") {
  const hay = String(sku || "").toUpperCase();
  if (hay.includes("HOSE")) return "hose";
  if (hay.includes("REG")) return "regulator";
  return "others";
}

function inferStoveType(name = "") {
  const hay = String(name || "").toLowerCase();
  if (hay.includes("double")) return "double";
  return "single";
}

/* named export (optional) */
export function EditProductModal({
  open,
  onClose,
  product,
  onSubmit,
  suppliers = [],
  existingSkus = [],
  loading = false,
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("lpg");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [stoveType, setStoveType] = useState("single");
  const [accessoryTab, setAccessoryTab] = useState("hose");
  const [length, setLength] = useState("");

  useEffect(() => {
    if (!open) return;

    setName(product?.name || "");
    const nextType = product?.type || "lpg";
    setType(nextType);
    setSize(product?.size_label || "");
    setPrice(safeMoney(product?.price));
    setSupplierId(product?.supplier?.id != null ? String(product.supplier.id) : "");
    setStoveType(inferStoveType(product?.name));
    setAccessoryTab(inferAccessoryTab(product?.sku));
    setLength(nextType === "accessories" ? product?.size_label || "" : "");
  }, [open, product]);

  const sku = useMemo(() => {
    const nameCode = compactCode(name, 3);
    const skuPool = existingSkus.filter((s) => s && s !== product?.sku);

    if (type === "lpg") {
      const sizeSlug = slugifySku(size);
      const base = sizeSlug && nameCode ? `LPG-${sizeSlug}-${nameCode}` : "";
      return nextSequence(base, skuPool);
    }

    if (type === "stove") {
      const stoveCode = stoveType === "double" ? "DBL" : "SNG";
      const base = nameCode ? `STV-${stoveCode}-${nameCode}` : "";
      return nextSequence(base, skuPool);
    }

    if (type === "accessories") {
      const accessoryCode =
        accessoryTab === "hose" ? "HOSE" : accessoryTab === "regulator" ? "REG" : "OTH";
      const base = nameCode ? `ACC-${accessoryCode}-${nameCode}` : "";
      return nextSequence(base, skuPool);
    }

    return "";
  }, [type, size, stoveType, accessoryTab, name, existingSkus, product?.sku]);

  const canSubmit = useMemo(() => {
    if (!product?.id) return false;
    if (!name.trim()) return false;
    if (!sku.trim()) return false;
    if (!supplierId) return false;

    const n = Number(String(price || "").replace(/,/g, ""));
    if (!Number.isFinite(n) || n <= 0) return false;

    if (type === "lpg" && !String(size || "").trim()) return false;
    if (type === "stove" && !stoveType) return false;
    if (type === "accessories") {
      if (accessoryTab === "hose" && !String(length || "").trim()) return false;
      if (!accessoryTab) return false;
    }

    return true;
  }, [product, name, sku, price, supplierId, type, size, stoveType, accessoryTab, length]);

  const submit = () => {
    if (!canSubmit || loading) return;

    onSubmit?.({
      id: product.id,
      name: name.trim(),
      sku: sku.trim(),
      type,
      size_label:
        type === "lpg"
          ? String(size || "").trim() || null
          : type === "accessories" && accessoryTab === "hose"
          ? String(length || "").trim() || null
          : null,
      price: String(price || "").trim(),
      supplier_id: supplierId,
      stove_type: type === "stove" ? stoveType : null,
      accessory_type: type === "accessories" ? accessoryTab : null,
    });
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-lg"
      layout="compact"
      title="Edit product"
      subtitle="Update the item details in your product catalog"
      icon={Package}
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
            {loading ? "Saving..." : "Save changes"}
          </button>
        </div>
      }
    >
      {!product ? (
        <div className="grid gap-3">
          <div className="h-11 rounded-2xl bg-slate-200/80 animate-pulse" />
          <div className="h-11 rounded-2xl bg-slate-200/80 animate-pulse" />
          <div className="h-11 rounded-2xl bg-slate-200/80 animate-pulse" />
          <div className="h-11 rounded-2xl bg-slate-200/80 animate-pulse" />
          <div className="h-11 rounded-2xl bg-slate-200/80 animate-pulse" />
          <div className="h-11 rounded-2xl bg-slate-200/80 animate-pulse" />
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Product type">
              <Select icon={Layers} value={type} onChange={(e) => setType(e.target.value)}>
                {PRODUCT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Product name">
            <Input
              icon={Package}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="LPG Cylinder 11kg"
              autoFocus
            />
          </Field>

          {type === "accessories" ? (
            <div className="grid gap-3">
              <div className="text-xs font-extrabold text-slate-700">Accessory type</div>
              <Tabs tabs={ACCESSORY_TABS} value={accessoryTab} onChange={setAccessoryTab} />
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {type === "lpg" ? (
              <Field label="Size">
                <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="11kg" />
              </Field>
            ) : null}

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

            {type === "accessories" && accessoryTab === "hose" ? (
              <Field label="Length">
                <Input
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="1.5m"
                />
              </Field>
            ) : null}

            <Field label="Price">
              <Input
                icon={PhilippinePeso}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
              />
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
      )}
    </ModalShell>
  );
}

/* default export */
export default EditProductModal;
