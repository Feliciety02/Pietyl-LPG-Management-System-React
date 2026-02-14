import React from "react";
import { RotateCcw } from "lucide-react";
import ModalShell from "../ModalShell";

export default function ConfirmRestorePromoModal({
  open,
  onClose,
  promo,
  onConfirm,
  loading,
}) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Restore promo"
      subtitle={`Restore ${promo?.code || "this promo"}?`}
      icon={RotateCcw}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 ring-1 ring-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-teal-600 px-4 py-2 text-white font-extrabold"
          >
            Restore
          </button>
        </div>
      }
    >
      <p className="text-sm text-slate-600">
        This code will be available again in POS.
      </p>
    </ModalShell>
  );
}
