import React, { useState } from "react";
import { Building2, UserRound, Phone, Mail, MapPin, Copy } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Item({ icon: Icon, label, value, right }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2 min-w-0">
        <Icon className="mt-0.5 h-4 w-4 text-slate-500" />
        <div className="min-w-0">
          <div className="text-xs text-slate-500">{label}</div>
          <div className="text-sm font-extrabold text-slate-900 truncate">{value || "—"}</div>
        </div>
      </div>
      {right}
    </div>
  );
}

function formatCurrency(value) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

export default function SupplierDetailsModal({
  open,
  onClose,
  supplier,
  loading = false,
  items = [],
}) {
  const [copied, setCopied] = useState(false);

  const canCopy = Boolean(supplier?.phone);

  const copyPhone = async () => {
    if (!canCopy) return;
    try {
      await navigator.clipboard.writeText(String(supplier.phone));
      setCopied(true);
      setTimeout(() => setCopied(false), 900);
    } catch {
      setCopied(false);
    }
  };

  if (!supplier) return null;

  const displaySupplier = supplier;
  const displayItems = Array.isArray(items) ? items : [];

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      layout="compact"
      title="Supplier"
      subtitle="Quick view"
      icon={Building2}
      footer={
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-5 py-2.5 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="text-center">
          <div className="text-lg font-extrabold text-slate-900">{displaySupplier.name}</div>
          <div className="mt-1 text-xs text-slate-500">Supplier ID {displaySupplier.id}</div>
        </div>

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-5 grid gap-4">
          <Item icon={UserRound} label="Contact" value={displaySupplier.contact_name || "No contact"} />
          <Item
            icon={Phone}
            label="Phone"
            value={displaySupplier.phone || "No phone"}
            right={
              canCopy ? (
                <button
                  type="button"
                  onClick={copyPhone}
                  className={cx(
                    "rounded-2xl px-3 py-2 text-xs font-extrabold ring-1 transition",
                    copied
                      ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
                      : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"
                  )}
                  title="Copy phone"
                >
                  <span className="inline-flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    {copied ? "Copied" : "Copy"}
                  </span>
                </button>
              ) : null
            }
          />
          <Item icon={Mail} label="Email" value={displaySupplier.email || "—"} />
          <Item icon={MapPin} label="Address" value={displaySupplier.address || "—"} />
          {displaySupplier.notes ? (
            <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4 text-sm text-slate-700">
              <div className="text-xs font-semibold text-slate-500 mb-1">Notes</div>
              <div>{displaySupplier.notes}</div>
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-5 space-y-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Items supplied ({loading ? "Loading…" : displayItems.length})
            </div>
          {loading ? (
            <div className="text-center text-sm text-slate-500">Loading supplier items…</div>
          ) : displayItems.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-4 py-6 text-center text-sm text-slate-500">
              No items linked to this supplier yet.
            </div>
          ) : (
            <div className="grid gap-2">
              <div className="grid grid-cols-[2fr,1fr,1fr,1fr,1fr,1fr] gap-2 text-[11px] uppercase tracking-wide text-slate-500">
                <span>Item</span>
                <span>Category</span>
                <span>SKU</span>
                <span>Price</span>
                <span>Stock</span>
                <span>Status</span>
              </div>
              {displayItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[2fr,1fr,1fr,1fr,1fr,1fr] gap-2 text-sm text-slate-700"
                >
                  <span className="font-semibold text-slate-900">
                    {item.product_name || "Item"} {item.variant_name ? `· ${item.variant_name}` : ""}
                  </span>
                  <span>{item.category || "General"}</span>
                  <span>{item.sku || "—"}</span>
                  <span>{formatCurrency(item.price)}</span>
                  <span>
                    {typeof item.stock === "number"
                      ? item.stock.toLocaleString()
                      : item.stock ?? "0"}
                  </span>
                  <span className="text-xs font-bold uppercase text-slate-500">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
