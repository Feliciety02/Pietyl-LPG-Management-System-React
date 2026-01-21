import React, { useEffect, useMemo, useState } from "react";
import { usePage } from "@inertiajs/react";
import ModalShell from "./ModalShell";
import { Info, PackagePlus } from "lucide-react";

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function PurchaseRequestModal({
  open,
  onClose,
  item,
  onSubmit,
  loading = false,
}) {
  const page = usePage();
  const roleKey = page.props?.auth?.user?.role || "inventory_manager";
  const isAdmin = roleKey === "admin";

  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setQty("");
    setNote("");
  }, [open]);

  const stockNow = safeNum(item?.current_qty);
  const reorder = safeNum(item?.reorder_level);

  const suggestedQty = useMemo(() => {
    if (!item) return 0;
    if (reorder <= 0) return 0;
    if (stockNow >= reorder) return Math.max(1, reorder);
    return Math.max(1, reorder - stockNow);
  }, [item, reorder, stockNow]);

  const title = isAdmin ? "Create purchase" : "Create purchase request";
  const subtitle = isAdmin
    ? "Record a restock order for tracking."
    : "Send a request to the owner for approval.";
  const primaryLabel = isAdmin ? "Create purchase" : "Submit request";

  const helper =
    reorder > 0
      ? `Tip: reorder level is ${reorder}. Current stock is ${stockNow}.`
      : `Tip: current stock is ${stockNow}.`;

  const canSubmit = safeNum(qty) > 0;

  if (!item) return null;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-md"
      title={title}
      subtitle={subtitle}
      icon={PackagePlus}
      bodyClassName="p-6 grid gap-4"
      footerClassName="p-6 pt-0"
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
            onClick={() =>
              onSubmit?.({
                item_id: item.id,
                qty: safeNum(qty),
                note: note.trim() || null,
                mode: isAdmin ? "purchase" : "request",
              })
            }
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white focus:outline-none focus:ring-4",
              loading || !canSubmit
                ? "bg-slate-300 cursor-not-allowed ring-slate-300"
                : "bg-teal-600 hover:bg-teal-700 focus:ring-teal-500/25 ring-teal-600"
            )}
            disabled={loading || !canSubmit}
          >
            {loading ? "Saving..." : primaryLabel}
          </button>
        </div>
      }
    >
      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <div className="font-extrabold text-slate-900">
          {item.name}{" "}
          <span className="text-slate-500 font-semibold">({item.variant})</span>
        </div>

        <div className="mt-1 text-xs text-slate-500">
          {item.sku || "—"}
          {item.supplier_name ? ` • Supplier: ${item.supplier_name}` : ""}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
            <div className="text-[11px] font-extrabold text-slate-500">
              Current stock
            </div>
            <div className="mt-1 text-base font-extrabold text-slate-900">
              {stockNow}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
            <div className="text-[11px] font-extrabold text-slate-500">
              Reorder level
            </div>
            <div className="mt-1 text-base font-extrabold text-slate-900">
              {reorder > 0 ? reorder : "Off"}
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-extrabold text-slate-700">
          Quantity to order
        </label>

        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-extrabold focus:outline-none focus:ring-4 focus:ring-teal-500/15"
            placeholder={suggestedQty > 0 ? `Suggested: ${suggestedQty}` : "Enter quantity"}
          />

          {suggestedQty > 0 ? (
            <button
              type="button"
              onClick={() => setQty(String(suggestedQty))}
              className="shrink-0 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
              disabled={loading}
              title="Use suggested quantity"
            >
              Use suggested
            </button>
          ) : null}
        </div>

        <div className="mt-2 flex items-start gap-2 text-xs text-slate-500">
          <Info className="mt-0.5 h-4 w-4 text-slate-400" />
          <div className="leading-relaxed">{helper}</div>
        </div>
      </div>

      <div>
        <label className="text-xs font-extrabold text-slate-700">
          Note (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-2 w-full min-h-[92px] rounded-2xl border border-slate-200 p-3 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-teal-500/15"
          placeholder={
            isAdmin
              ? "Example: supplier confirmed delivery tomorrow morning"
              : "Example: running out fast, please approve today"
          }
        />
      </div>

      <div className="text-[11px] text-slate-500">
        {isAdmin
          ? "Creates a purchase entry for tracking deliveries and costs."
          : "Sends a request to the owner. Once approved, it can be processed as a purchase."}
      </div>
    </ModalShell>
  );
}
