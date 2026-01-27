import React, { useEffect, useMemo, useRef, useState } from "react";
import { Package, Search, Hash, StickyNote, Truck, X } from "lucide-react";
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
          className="min-h-[88px] w-full resize-none bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

function Pill({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    teal: "bg-teal-50 text-teal-800 ring-teal-100",
    rose: "bg-rose-50 text-rose-900 ring-rose-100",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        tones[tone] || tones.slate
      )}
    >
      {children}
    </span>
  );
}

function ProductCombobox({
  valueId,
  onSelect,
  products,
  suppliers,
  disabled = false,
  autoFocus = false,
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  const selectedProduct = useMemo(() => {
    if (!valueId) return null;
    return products.find((p) => String(p.id) === String(valueId)) || null;
  }, [products, valueId]);

  const selectedLabel = useMemo(() => {
    if (!selectedProduct) return "";
    const sku = selectedProduct.sku ? `${selectedProduct.sku} · ` : "";
    const name = `${selectedProduct.name || ""}${selectedProduct.variant ? ` (${selectedProduct.variant})` : ""}`;
    return `${sku}${name}`.trim();
  }, [selectedProduct]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products.slice(0, 8);

    const matches = products.filter((p) => {
      const hay = `${p.name || ""} ${p.variant || ""} ${p.sku || ""}`.toLowerCase();
      return hay.includes(term);
    });

    return matches.slice(0, 8);
  }, [products, q]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
  }, [open, q]);

  useEffect(() => {
    if (!open) return;

    const onDoc = (e) => {
      const t = e.target;
      if (panelRef.current?.contains(t) || inputRef.current?.contains(t)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pick = (p) => {
    onSelect?.(String(p.id));
    setOpen(false);
    setQ("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onKeyDown = (e) => {
    if (disabled) return;

    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }

    if (e.key === "Escape") {
      setOpen(false);
      return;
    }

    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const p = filtered[activeIndex];
      if (p) pick(p);
      return;
    }
  };

  return (
    <div className="relative">
      <InputShell icon={Search}>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={selectedProduct ? "Search another product..." : "Search product, SKU, variant..."}
          className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
          disabled={disabled}
          autoFocus={autoFocus}
        />
      </InputShell>

      {selectedProduct ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Pill>
            <span className="truncate max-w-[380px]">{selectedLabel}</span>
            <button
              type="button"
              onClick={() => onSelect?.("")}
              className="rounded-full p-1 text-slate-500 hover:bg-white hover:text-slate-700 ring-1 ring-transparent hover:ring-slate-200"
              disabled={disabled}
              aria-label="Clear selected product"
              title="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </Pill>
        </div>
      ) : null}

      {open ? (
        <div
          ref={panelRef}
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm"
        >
          {filtered.length ? (
            <div className="max-h-64 overflow-auto py-1">
              {filtered.map((p, idx) => {
                const sku = p.sku ? `${p.sku} · ` : "";
                const name = `${p.name || ""}${p.variant ? ` (${p.variant})` : ""}`;
                const active = idx === activeIndex;

                const supplierName = p.default_supplier_id
                  ? suppliers.find((s) => String(s.id) === String(p.default_supplier_id))?.name
                  : null;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => pick(p)}
                    className={cx(
                      "w-full text-left px-3 py-2",
                      active ? "bg-slate-50" : "bg-white",
                      "hover:bg-slate-50"
                    )}
                  >
                    <div className="text-sm font-extrabold text-slate-900">
                      {sku}
                      <span className="font-extrabold">{name}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {supplierName ? `supplier: ${supplierName}` : "no supplier set for this product"}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-3 py-3 text-sm font-semibold text-slate-600">No matches</div>
          )}
        </div>
      ) : null}
    </div>
  );
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
  const [productId, setProductId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;

    const presetProductId = item?.id ? String(item.id) : "";
    const presetSupplierId = item?.default_supplier_id ? String(item.default_supplier_id) : "";

    setProductId(presetProductId);
    setSupplierId(presetSupplierId);
    setQty(item?.suggest_qty ? String(item.suggest_qty) : "");
    setNotes("");
  }, [open, item]);

  const selectedProduct = useMemo(() => {
    if (!productId) return null;
    return products.find((p) => String(p.id) === String(productId)) || null;
  }, [products, productId]);

  const selectedSupplier = useMemo(() => {
    if (!supplierId) return null;
    return suppliers.find((s) => String(s.id) === String(supplierId)) || null;
  }, [suppliers, supplierId]);

  const supplierMissing = Boolean(selectedProduct) && !supplierId;

  const canSubmit = Boolean(productId) && safeNum(qty) > 0 && !supplierMissing;

  const onSelectProduct = (nextId) => {
    setProductId(nextId);

    const picked = products.find((p) => String(p.id) === String(nextId));
    const nextSupplierId = picked?.default_supplier_id ? String(picked.default_supplier_id) : "";

    setSupplierId(nextSupplierId);

    if (!nextId) {
      setQty("");
      setNotes("");
    }
  };

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
      maxWidthClass="max-w-3xl"
      layout="compact"
      title="Order stock"
      subtitle="Choose a product, we will auto pick the supplier."
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
        <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Product" hint="Type to search, press Enter to select.">
              <ProductCombobox
                valueId={productId}
                onSelect={onSelectProduct}
                products={products}
                suppliers={suppliers}
                disabled={loading}
                autoFocus
              />
            </Field>

            <Field label="Supplier" hint="Auto assigned from product settings.">
              <div className="rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-slate-500" />
                  <div className="text-sm font-extrabold text-slate-900">
                    {selectedSupplier?.name || "No supplier linked"}
                  </div>
                </div>

                {supplierMissing ? (
                  <div className="mt-1 text-[11px] font-semibold text-rose-700">
                    This product has no default supplier. Set one before ordering.
                  </div>
                ) : (
                  <div className="mt-1 text-[11px] text-slate-500">
                    {selectedSupplier ? "picked automatically" : "select a product to see supplier"}
                  </div>
                )}
              </div>

              {selectedSupplier ? (
                <div className="mt-2">
                  <Pill tone="teal">{selectedSupplier.name}</Pill>
                </div>
              ) : null}
            </Field>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Quantity" hint="Required">
            <InputShell icon={Hash}>
              <input
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                type="number"
                min="1"
                placeholder="0"
                className="w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none placeholder:text-slate-400"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
              />
            </InputShell>
          </Field>

          <Field label="Notes" hint="Optional, internal notes only.">
            <Textarea
              icon={StickyNote}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything the supplier should know..."
              disabled={loading}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") submit();
              }}
            />
          </Field>
        </div>
      </div>
    </ModalShell>
  );
}
