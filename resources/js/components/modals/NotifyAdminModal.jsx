import React, { useEffect, useState } from "react";
import ModalShell from "./ModalShell";

export default function NotifyAdminModal({
  open,
  onClose,
  defaultMessage = "",
  onSubmit,
  loading = false,
}) {
  const [message, setMessage] = useState(defaultMessage);

  useEffect(() => {
    if (open) setMessage(defaultMessage);
  }, [open, defaultMessage]);

  return (
    <ModalShell open={open} onClose={onClose} maxWidthClass="max-w-lg">
      <div className="p-6">
        <div className="text-lg font-extrabold text-slate-900">Notify Admin</div>
        <div className="mt-1 text-sm text-slate-600">
          Send a low stock alert to the owner for review or action.
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-4 w-full min-h-[160px] rounded-2xl border border-slate-200 p-4 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-teal-500/15"
          placeholder="Write your message..."
        />

        <div className="mt-6 flex items-center justify-end gap-2">
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
            onClick={() => onSubmit?.({ message })}
            className="rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 focus:ring-4 focus:ring-teal-500/25"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}