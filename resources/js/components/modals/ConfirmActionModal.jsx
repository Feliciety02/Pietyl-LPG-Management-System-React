import React from "react";
import ModalShell from "./ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function ConfirmActionModal({
  open,
  onClose,
  title = "Confirm action",
  message = "Are you sure you want to continue?",
  tone = "teal", // "teal" | "rose" | "slate"
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  loading = false,
}) {
  const toneBtn =
    tone === "rose"
      ? "bg-rose-600 hover:bg-rose-700 focus:ring-rose-500/25"
      : tone === "slate"
      ? "bg-slate-900 hover:bg-slate-800 focus:ring-slate-500/25"
      : "bg-teal-600 hover:bg-teal-700 focus:ring-teal-500/25";

  return (
    <ModalShell
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition"
            disabled={loading}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white transition focus:outline-none focus:ring-4",
              toneBtn
            )}
            disabled={loading}
          >
            {loading ? "Working..." : confirmLabel}
          </button>
        </div>
      }
    >
      <div className="text-sm text-slate-600">{message}</div>
    </ModalShell>
  );
}