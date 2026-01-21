
import React, { useEffect, useMemo, useState } from "react";
import { usePage } from "@inertiajs/react";
import ModalShell from "./ModalShell";
import { Search, PackagePlus } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function CreatePurchaseModal({
  open,
  onClose,
  products = [],
  suppliers = [],
  onSubmit,
  loading = false,
}) {
  const page = usePage();
  const roleKey = page.props?.auth?.user?.role || "inventory_manager";
  const isAdmin = roleKey === "admin";

  const [q, setQ] = useState("");
  const [productId, setProductId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [qty, setQty] = useState("");

  useEffect(() => {
    if (!open) return;
    setQ("");
    setProductId("");
    setSupplierId("");
    setQty("");
  }, [open]);

  const title = isAdmin ? "New Purchase" : "New Purchase Request";
  const subtitle = isAdmin
    ? "Order any product from your suppliers"
    : "Send a request for approval";

  const primaryLabel = isAdmin ? "Create purchase" : "Send request";

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
    const term = q.trim().toLowerCase();
    if (!term) return products.slice(0, 30);

    return products
      .filter((p) =>
        `${p.name || ""} ${p.variant || ""} ${p.sku || ""}`
          .toLowerCase()
          .includes(term)
      )
      .slice(0, 30);
  }, [products, q]);

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

      <button
        type="button"
        onClick={submit}
        className="rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/25"
        disabled={loading || !canSubmit}
      >
        {loading ? "Saving..." : primaryLabel}
      </button>
    </div>
  );

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      layout="default"
      title={title}
      subtitle={subtitle}
      icon={PackagePlus}
      footer={footer}
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* Product picker */}
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 bg-white">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Search product or SKU"
              />
            </div>

            <div className="mt-2 text-xs text-slate-500">
              Showing up to 30 results
            </div>
          </div>

          <div className="max-h-[45vh] overflow-y-auto p-2 space-y-1">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-sm text-slate-600">No matching products</div>
            ) : (
              filteredProducts.map((p) => {
                const active = String(p.id) === String(productId);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProductId(String(p.id))}
                    className={cx(
                      "w-full rounded-2xl px-3 py-2 text-left transition",
                      active ? "bg-teal-600 text-white" : "hover:bg-slate-50 text-slate-800"
                    )}
                  >
                    <div className="text-sm font-extrabold truncate">
                      {p.name}{" "}
                      <span className={active ? "text-white/80" : "text-slate-500"}>
                        ({p.variant || "—"})
                      </span>
                    </div>
                    <div className={cx("text-xs truncate", active ? "text-white/80" : "text-slate-500")}>
                      {p.sku || "—"}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Details */}
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-5 space-y-4">
          <div>
            <div className="text-xs font-extrabold text-slate-700">Selected product</div>
            <div className="mt-1 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
              {selectedProduct ? (
                <>
                  <div className="text-sm font-extrabold text-slate-900">
                    {selectedProduct.name}{" "}
                    <span className="text-slate-500 font-semibold">
                      ({selectedProduct.variant || "—"})
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{selectedProduct.sku || "—"}</div>
                </>
              ) : (
                <div className="text-sm text-slate-600">Choose a product</div>
              )}
            </div>
          </div>

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
                Choose where to order this product
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

          <div className="text-[11px] text-slate-500">
            {isAdmin
              ? "This can be created even if stock is still okay."
              : "This sends a request for approval before buying."}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}