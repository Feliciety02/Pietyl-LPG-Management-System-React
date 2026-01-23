import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePage } from "@inertiajs/react";
import ModalShell from "./ModalShell";
import { Search, PackagePlus, Tag } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function getCategory(p) {
  return p?.category || p?.category_name || p?.type || p?.group || "Other";
}

function useDebouncedValue(value, delay = 160) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function CreatePurchaseModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}) {
  const page = usePage();
  const roleKey = page.props?.auth?.user?.role || "inventory_manager";
  const isAdmin = roleKey === "admin";

  const products = page.props?.product_hash ?? [];
  const suppliers = page.props?.suppliers ?? [];

  

  const [q, setQ] = useState("");
  const qDebounced = useDebouncedValue(q);

  const [category, setCategory] = useState("All");
  const [productId, setProductId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [qty, setQty] = useState("");

  const searchRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setCategory("All");
    setProductId("");
    setSupplierId("");
    setQty("");
    setTimeout(() => searchRef.current?.focus?.(), 0);
  }, [open]);

  const title = isAdmin ? "New Purchase" : "New Purchase Request";
  const subtitle = isAdmin
    ? "Choose item, supplier, and quantity."
    : "Choose item and quantity, then send for approval.";

  const primaryLabel = isAdmin ? "Create purchase" : "Send request";

  const categories = useMemo(() => {
    const set = new Set(products.map(getCategory));
    const arr = Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
    return ["All", ...arr];
  }, [products]);

  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === String(productId)) || null,
    [products, productId]
  );

  const supplierOptions = useMemo(() => {
    if (!selectedProduct) return suppliers;

    if (Array.isArray(selectedProduct.supplier_ids) && selectedProduct.supplier_ids.length) {
      const allow = new Set(selectedProduct.supplier_ids.map(String));
      return suppliers.filter((s) => allow.has(String(s.id)));
    }

    if (selectedProduct.default_supplier_id) {
      return suppliers.filter(
        (s) => String(s.id) === String(selectedProduct.default_supplier_id)
      );
    }

    return suppliers;
  }, [selectedProduct, suppliers]);

  useEffect(() => {
    if (!selectedProduct) return;

    if (supplierOptions.length === 1) {
      setSupplierId(String(supplierOptions[0].id));
    } else {
      setSupplierId("");
    }
  }, [selectedProduct, supplierOptions]);

  const filteredProducts = useMemo(() => {
    const term = qDebounced.trim().toLowerCase();
    const list = products.filter((p) => {
      const catOk = category === "All" ? true : getCategory(p) === category;
      if (!catOk) return false;

      if (!term) return true;

      const hay = `${p.name || ""} ${p.variant || ""} ${p.sku || ""}`.toLowerCase();
      return hay.includes(term);
    });

    return list.slice(0, 50);
  }, [products, qDebounced, category]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const p of filteredProducts) {
      const c = getCategory(p);
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(p);
    }
    return Array.from(map.entries()).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  }, [filteredProducts]);

  const canSubmit =
    selectedProduct &&
    safeNum(qty) > 0 &&
    (supplierOptions.length === 0 || Boolean(supplierId));

  const submit = () => {
    if (!selectedProduct) return;

    onSubmit?.({
      mode: isAdmin ? "purchase" : "request",
      product_id: selectedProduct.id,
      supplier_id: supplierId ? Number(supplierId) : null,
      qty: safeNum(qty),
    });
  };

  const footer = (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
        disabled={loading}
      >
        Cancel
      </button>

      // TODO : FINISH THE REQUEST TABLE BEFORE ADDING CONTROLLER METHOD FUNCTIONALITY HERE
      <button
        type="button"
        onClick={submit}
        disabled={loading || !canSubmit}
        className={cx(
          "rounded-2xl px-4 py-2 text-sm font-extrabold text-white focus:outline-none focus:ring-4 transition",
          loading || !canSubmit
            ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
            : "bg-teal-600 hover:bg-teal-700 ring-teal-600 focus:ring-teal-500/25"
        )}
      >
        {loading ? "Saving..." : primaryLabel}
      </button>
    </div>
  );

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-lg"
      layout="compact"
      title={title}
      subtitle={subtitle}
      icon={PackagePlus}
      footer={footer}
      bodyClassName="p-6"
      footerClassName="p-6 pt-0"
    >
      <div className="space-y-4">
        {/* Top controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 ring-1 ring-slate-200/30">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-56 bg-transparent text-sm outline-none placeholder:text-slate-400"
              placeholder="Search product or SKU"
            />
            {q ? (
              <button
                type="button"
                onClick={() => setQ("")}
                className="rounded-full px-2 py-1 text-xs font-extrabold text-slate-600 hover:bg-slate-50"
                aria-label="Clear search"
              >
                Clear
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 ring-1 ring-slate-200/30">
            <Tag className="h-4 w-4 text-slate-500" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-transparent text-sm font-semibold outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500">
            {filteredProducts.length} shown
          </div>
        </div>

        {/* Product list (single column, compact) */}
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 overflow-hidden">
          <div className="max-h-[34vh] overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-sm text-slate-600">No matching products</div>
            ) : (
              <div className="p-2 space-y-3">
                {grouped.map(([cat, list]) => (
                  <div key={cat}>
                    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-2 py-2">
                      <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                        {cat}
                      </div>
                    </div>

                    <div className="space-y-1">
                      {list.map((p) => {
                        const active = String(p.id) === String(productId);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setProductId(String(p.id))}
                            className={cx(
                              "w-full rounded-2xl px-3 py-2 text-left transition ring-1",
                              active
                                ? "bg-teal-600 text-white ring-teal-600"
                                : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-extrabold truncate">
                                  {p.name}{" "}
                                  <span className={active ? "text-white/80" : "text-slate-500"}>
                                    ({p.variant || "—"})
                                  </span>
                                </div>
                                <div
                                  className={cx(
                                    "text-xs truncate",
                                    active ? "text-white/80" : "text-slate-500"
                                  )}
                                >
                                  {p.sku || "—"}
                                </div>
                              </div>

                              {active ? (
                                <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-extrabold">
                                  Selected
                                </span>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-4 space-y-3">
          <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
            {selectedProduct ? (
              <>
                <div className="text-sm font-extrabold text-slate-900">
                  {selectedProduct.name}{" "}
                  <span className="text-slate-500 font-semibold">
                    ({selectedProduct.variant || "—"})
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {selectedProduct.sku || "—"} • {getCategory(selectedProduct)}
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-600">
                Select a product to continue
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-extrabold text-slate-700">Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                disabled={!selectedProduct || supplierOptions.length === 0}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/15"
              >
                <option value="">
                  {supplierOptions.length === 0 ? "Not required" : "Select supplier"}
                </option>
                {supplierOptions.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
              {selectedProduct && supplierOptions.length > 1 ? (
                <div className="mt-1 text-[11px] text-slate-500">
                  Choose where you will order it
                </div>
              ) : null}
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700">Quantity</label>
              <input
                type="number"
                min="1"
                inputMode="numeric"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                disabled={!selectedProduct}
                placeholder="Enter quantity"
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-teal-500/15"
              />
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            {isAdmin
              ? "You can create this even if stock is still okay."
              : "This sends a request for approval before buying."}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
