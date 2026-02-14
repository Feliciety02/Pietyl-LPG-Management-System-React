import React from "react";
import { Archive } from "lucide-react";
import ModalShell from "../ModalShell";

export default function ConfirmDiscontinuePromoModal({
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
      title="Discontinue promo"
      subtitle={`Discontinue ${promo?.code || "this promo"}?`}
      icon={Archive}
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
            className="rounded-xl bg-rose-600 px-4 py-2 text-white font-extrabold"
          >
            Discontinue
          </button>
        </div>
      }
    >
      <p className="text-sm text-slate-600">
        This code will no longer be accepted at POS.
      </p>
    </ModalShell>
  );
}
