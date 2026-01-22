import React from "react";
import ModalShell from "../ModalShell";
import { posIcons } from "@/components/ui/Icons";

export default function MarkPaidModal({ open, onClose, sale }) {
  if (!sale) return null;

  const Cash = posIcons.cash;

  return (
    <ModalShell open={open} onClose={onClose} maxWidthClass="max-w-md">
      <div className="p-6 text-center">
        <Cash className="mx-auto h-8 w-8 text-teal-600" />
        <div className="mt-3 font-extrabold">Mark as paid?</div>
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
              alert(`Marked ${sale.ref} as paid`);
              onClose();
            }}
            className="rounded-2xl bg-teal-600 px-4 py-2 text-white"
          >
            Confirm
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
