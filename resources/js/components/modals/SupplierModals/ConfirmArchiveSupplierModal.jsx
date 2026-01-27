import React from "react";
import { Archive } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function ConfirmArchiveSupplierModal({
  open,
  onClose,
  supplier,
  onConfirm,
  loading = false,
}) {
  if (!supplier) return null;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-md"
      layout="compact"
      title="Archive supplier"
      subtitle="This will hide the supplier from active lists"
      icon={Archive}
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
            onClick={() => onConfirm?.(supplier)}
            disabled={loading}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4",
              loading
                ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                : "bg-rose-600 ring-rose-600 hover:bg-rose-700 focus:ring-rose-500/25"
            )}
          >
            {loading ? "Archiving..." : "Archive"}
          </button>
        </div>
      }
    >
      <div className="rounded-2xl bg-rose-600/10 ring-1 ring-rose-700/10 px-4 py-3 text-sm font-semibold text-rose-900">
        You are about to archive <span className="font-extrabold">{supplier.name}</span>.
        You can re enable it later if needed.
      </div>
    </ModalShell>
  );
}
