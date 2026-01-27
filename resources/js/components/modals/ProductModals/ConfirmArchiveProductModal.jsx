import React from "react";
import { Archive } from "lucide-react";
import ModalShell from "../ModalShell";

export default function ConfirmArchiveProductModal({
  open,
  onClose,
  product,
  onConfirm,
  loading,
}) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Archive product"
      subtitle={`Archive ${product?.name || "this product"}?`}
      icon={Archive}
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2 ring-1 ring-slate-200">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-rose-600 px-4 py-2 text-white font-extrabold"
          >
            Archive
          </button>
        </div>
      }
    >
      <p className="text-sm text-slate-600">
        This product will no longer be selectable for sales or inventory actions.
      </p>
    </ModalShell>
  );
}
