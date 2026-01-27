import React, { useEffect, useMemo, useState } from "react";
import { PackagePlus, Tag, Layers, PhilippinePeso, Building2 } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
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

/* named export (optional, but helpful) */
export function AddProductModal({
  open,
  onClose,
  onSubmit,
  suppliers = [],
  loading = false,
}) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [type, setType] = useState("lpg");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [supplierId, setSupplierId] = useState("none");

  useEffect(() => {
    if (!open) return;
    setName("");
    setSku("");
    setType("lpg");
    setSize("");
    setPrice("");
    setSupplierId("none");
  }, [open]);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!sku.trim()) return false;

    const n = Number(String(price || "").replace(/,/g, ""));
    if (!Number.isFinite(n) || n <= 0) return false;

    return true;
  }, [name, sku, price]);

  const submit = () => {
    if (!canSubmit || loading) return;

    onSubmit?.({
      name: name.trim(),
      sku: sku.trim(),
      type,
      size_label: String(size || "").trim() ? String(size).trim() : null,
      default_price: String(price || "").trim(),
      supplier_id: supplierId === "none" ? null : supplierId,
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
        <Field label="Product name">
          <Input
            icon={PackagePlus}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="LPG Cylinder 11kg"
            autoFocus
          />
        </Field>

        <Field label="SKU">
          <Input
            icon={Tag}
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="LPG-11KG-REG"
          />
        </Field>

        <Field label="Type">
          <Select icon={Layers} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="lpg">LPG</option>
            <option value="refill">Refill</option>
            <option value="accessory">Accessory</option>
          </Select>
        </Field>

        <Field label="Size (optional)" hint="Example: 11kg, 22kg">
          <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="11kg" />
        </Field>

        <Field label="Default price">
          <Input
            icon={PhilippinePeso}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
          />
        </Field>

        <Field label="Supplier (optional)">
          <Select
            icon={Building2}
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          >
            <option value="none">No supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </ModalShell>
  );
}

/* default export (this is what your app expects if you import without braces) */
export default AddProductModal;
