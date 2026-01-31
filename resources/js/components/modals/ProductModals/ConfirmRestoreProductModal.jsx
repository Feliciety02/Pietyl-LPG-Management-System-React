import React from "react";
import { RotateCcw } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function ConfirmRestoreProductModal({
  open,
  onClose,
  product,
  onConfirm,
  loading = false,
}) {
  if (!product) return null;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-md"
      layout="compact"
      title="Restore product"
      subtitle="This will make the product available again"
      icon={RotateCcw}
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
            onClick={() => onConfirm?.(product)}
            disabled={loading}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4",
              loading
                ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                : "bg-teal-600 ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25"
            )}
          >
            {loading ? "Restoring..." : "Restore"}
          </button>
        </div>
      }
    >
      <div className="rounded-2xl bg-teal-600/10 ring-1 ring-teal-700/10 px-4 py-3 text-sm font-semibold text-teal-900">
        You are about to restore <span className="font-extrabold">{product.name}</span>.
      </div>
    </ModalShell>
  );
}
