import React, { useMemo } from "react";
import ModalShell from "../ModalShell";
import { FileText } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function money(v) {
  const n = Number(v || 0);
  return `₱${n.toLocaleString()}`;
}

export default function PurchaseViewModal({
  open,
  onClose,
  purchase = null,
  onOpenFull,
}) {
  const rows = useMemo(() => {
    if (!purchase) return [];
    return [
      { label: "Reference", value: purchase.reference_no || "—" },
      { label: "Supplier", value: purchase.supplier_name || "—" },
      { label: "Product", value: `${purchase.product_name || "—"} (${purchase.variant || "—"})` },
      { label: "Ordered qty", value: purchase.qty ?? "—" },
      { label: "Received qty", value: purchase.received_qty ?? "—" },
      { label: "Unit cost", value: money(purchase.unit_cost) },
      { label: "Total cost", value: money(purchase.total_cost) },
      { label: "Status", value: String(purchase.status || "—") },
      { label: "Created", value: purchase.created_at || "—" },
      { label: "Notes", value: purchase.notes || "—" },
    ];
  }, [purchase]);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Purchase details"
      subtitle="Quick view of this purchase request."
      maxWidthClass="max-w-2xl"
      bodyClassName="p-6"
      footerClassName="p-6 pt-0"
      footer={
        <div className="flex items-center justify-end gap-2">
          {purchase?.id ? (
            <button
              type="button"
              onClick={() => onOpenFull?.(purchase.id)}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 focus:ring-4 focus:ring-teal-500/15"
            >
              <FileText className="h-4 w-4 text-slate-600" />
              Open full page
            </button>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1",
              "bg-teal-600 ring-teal-600 hover:bg-teal-700 focus:ring-4 focus:ring-teal-500/25"
            )}
          >
            Close
          </button>
        </div>
      }
    >
      {!purchase ? (
        <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
          <div className="text-sm font-extrabold text-slate-900">No purchase selected</div>
          <div className="mt-1 text-xs text-slate-500">Pick a row then tap View.</div>
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3"
            >
              <div className="text-xs font-extrabold text-slate-600">{r.label}</div>
              <div className="text-sm font-extrabold text-slate-900 text-right">
                {r.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
}
