import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function ConfirmActionModal({
  open,
  onClose,
  title = "Confirm action",
  message = "Are you sure you want to continue?",
  confirmLabel = "Confirm",
  tone = "teal", // teal | rose
  onConfirm,
  loading = false,
  showNote = false,
  note = "",
  onNote,
  notePlaceholder = "Optional note...",
}) {
  const isDanger = tone === "rose";

  const icon = isDanger ? AlertTriangle : CheckCircle2;

  const confirmBtn = isDanger
    ? "bg-rose-600 ring-rose-600 hover:bg-rose-700 focus:ring-rose-500/25"
    : "bg-teal-600 ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25";

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-md"
      layout="compact"
      title={title}
      subtitle={isDanger ? "This can’t be easily undone." : "Please confirm to continue."}
      icon={icon}
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
            onClick={onConfirm}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4",
              loading ? "bg-slate-300 ring-slate-300 cursor-not-allowed" : confirmBtn
            )}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      }
    >
      <div className="text-sm font-semibold text-slate-700 leading-relaxed">
        {message}
      </div>

      {showNote ? (
        <div className="mt-3">
          <div className="text-xs font-extrabold text-slate-700">Note (optional)</div>
          <textarea
            value={note}
            onChange={(e) => onNote?.(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
            placeholder={notePlaceholder}
          />
        </div>
      ) : null}

      {isDanger ? (
        <div className="mt-3 rounded-2xl bg-rose-600/10 ring-1 ring-rose-700/10 px-4 py-3 text-xs font-semibold text-rose-900">
          double check before confirming.
        </div>
      ) : null}
    </ModalShell>
  );
}
