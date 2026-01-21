import React from "react";
import ModalShell from "./ModalShell";
import { posIcons } from "@/components/ui/Icons";

export default function SaleDetailsModal({ open, onClose, sale }) {
  if (!sale) return null;

  return (
    <ModalShell open={open} onClose={onClose} maxWidthClass="max-w-2xl">
      <div className="p-6">
        <div className="text-lg font-extrabold">{sale.ref}</div>
        <div className="text-sm text-slate-600">{sale.customer}</div>

        <div className="mt-4 space-y-2">
          {sale.lines.map((l, i) => (
            <div key={i} className="rounded-2xl bg-slate-50 p-3">
              <div className="font-semibold">
                {l.name} ({l.variant})
              </div>
              <div className="text-xs text-slate-500">
                {l.qty} × ₱{l.unit_price}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}
