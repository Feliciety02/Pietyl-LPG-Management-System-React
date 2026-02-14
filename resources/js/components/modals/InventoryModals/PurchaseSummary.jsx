import React from "react";
import KpiCard from "@/components/ui/KpiCard";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

/* ---------------- formatting helpers ---------------- */

export function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `₱${n.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function niceText(v) {
  if (v == null) return "—";
  const s = String(v).trim();
  return s ? s : "—";
}

export function toStatusKey(status) {
  return String(status || "")
    .toLowerCase()
    .replace(/\s+/g, "_");
}

export function statusLabel(status) {
  const s = toStatusKey(status);
  if (s === "awaiting_confirmation") return "For checking";
  if (s === "discrepancy_reported") return "Issue reported";
  if (s === "delivered") return "Delivered";
  if (s === "pending") return "Pending";
  if (s === "approved") return "Approved";
  if (s === "completed") return "Completed";
  if (s === "rejected") return "Rejected";
  return status ? String(status) : "—";
}

/* ---------------- status badge ---------------- */

export function StatusBadge({ status }) {
  const s = toStatusKey(status);

  const tone =
    s === "approved" || s === "completed"
      ? "bg-emerald-600/10 text-emerald-900 ring-emerald-700/10"
      : s === "pending"
      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
      : s === "rejected"
      ? "bg-rose-600/10 text-rose-900 ring-rose-700/10"
      : s === "delivered" || s === "awaiting_confirmation"
      ? "bg-sky-600/10 text-sky-900 ring-sky-700/10"
      : s === "discrepancy_reported"
      ? "bg-orange-600/10 text-orange-900 ring-orange-700/10"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ring-1",
        tone
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

/* ---------------- summary extractor ---------------- */

export function getPurchaseSummary(purchase) {
  if (!purchase) return null;

  const item = [
    niceText(purchase.product_name),
    purchase.variant ? `(${String(purchase.variant).trim()})` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    ref: niceText(purchase.reference_no),
    supplier: niceText(purchase.supplier_name),
    item,
    quantity: niceText(purchase.qty ?? purchase.quantity),
    created: niceText(purchase.created_at),
    total: money(purchase.total_cost),
    status: purchase.status,
  };
}

/* ---------------- UI component ---------------- */

export function PurchaseSummary({ purchase }) {
  const meta = getPurchaseSummary(purchase);
  if (!meta) return null;

  // damage projection (only show if damaged_qty > 0)
  const damagedQty = Number(purchase?.damaged_qty ?? 0);
  const qty = Math.max(1, Number(purchase?.qty ?? purchase?.quantity ?? 1));

  const unitCost = (() => {
    const rawUnit = Number(purchase?.unit_cost ?? 0);
    if (Number.isFinite(rawUnit) && rawUnit > 0) return rawUnit;

    const total = Number(purchase?.total_cost ?? 0);
    if (Number.isFinite(total) && total > 0) return total / qty;

    return 0;
  })();

  const damageAmount =
    damagedQty > 0 && Number.isFinite(unitCost) && unitCost > 0 ? damagedQty * unitCost : 0;

  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
      <div className="p-5 grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-base font-extrabold text-slate-900 truncate">{meta.ref}</div>
            <StatusBadge status={meta.status} />
          </div>

          <div className="mt-3 grid gap-2">
            <div className="flex items-baseline gap-3 text-sm">
              <span className="w-20 shrink-0 text-xs font-semibold text-slate-500">Supplier</span>
              <span className="font-semibold text-slate-800 truncate">{meta.supplier}</span>
            </div>

            <div className="flex items-baseline gap-3 text-sm">
              <span className="w-20 shrink-0 text-xs font-semibold text-slate-500">Item</span>
              <span className="font-semibold text-slate-800 truncate">{meta.item}</span>
            </div>

            <div className="flex items-baseline gap-3 text-sm">
              <span className="w-20 shrink-0 text-xs font-semibold text-slate-500">Quantity</span>
              <span className="font-semibold text-slate-800">{meta.quantity}</span>
            </div>

            <div className="flex items-baseline gap-3 text-sm">
              <span className="w-20 shrink-0 text-xs font-semibold text-slate-500">Date</span>
              <span className="text-slate-700">{meta.created}</span>
            </div>
          </div>
        </div>

        {/* KPI STACK (Damage + Total) */}
        <div className="shrink-0 flex items-start gap-3">
          {damageAmount > 0 ? (
            <KpiCard
              label="Damage"
              value={money(damageAmount)}
              hint={`${damagedQty} unit${damagedQty === 1 ? "" : "s"}`}
              tone="rose"
            />
          ) : null}

          <KpiCard label="Total" value={meta.total} tone="teal" />
        </div>
      </div>
    </div>
  );
}
