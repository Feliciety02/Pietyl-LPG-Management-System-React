import React from "react";
import ModalShell from "./ModalShell";
import { posIcons } from "@/components/ui/Icons";

export default function ReprintReceiptModal({ open, onClose, sale }) {
  if (!sale) return null;

  const Receipt = posIcons.receipt;

  return (
    <ModalShell open={open} onClose={onClose} maxWidthClass="max-w-md">
      <div className="p-6 text-center">
        <Receipt className="mx-auto h-8 w-8 text-slate-600" />
        <div className="mt-3 font-extrabold">Reprint receipt?</div>
        <div className="mt-1 text-sm text-slate-600">{sale.ref}</div>

        <div className="mt-5 flex justify-center gap-3">
          <button
            onClick={onClose}
            className="rounded-2xl px-4 py-2 ring-1 ring-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              alert(`Reprinted ${sale.ref}`);
              onClose();
            }}
            className="rounded-2xl bg-slate-800 px-4 py-2 text-white"
          >
            Reprint
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
