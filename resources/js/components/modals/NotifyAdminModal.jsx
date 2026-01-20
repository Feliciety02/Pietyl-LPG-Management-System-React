import React, { useMemo, useState } from "react";
import ModalShell from "./ModalShell";

export default function NotifyAdminModal({
  open,
  onClose,
  items = [],
  onSubmit, // (payload) => void
  loading = false,
}) {
  const defaultMessage = useMemo(() => {
    const critical = items.filter((x) => x.risk_level === "critical");
    const warning = items.filter((x) => x.risk_level === "warning");

    const firstLine = "Low stock update";
    const lines = [];

    if (critical.length) lines.push(`Critical: ${critical.length} item(s)`);
    if (warning.length) lines.push(`Warning: ${warning.length} item(s)`);

    const sample = items.slice(0, 3).map((x) => `${x.name} (${x.variant}) qty ${x.current_qty}`);

    return [firstLine, ...lines, "", "Sample items:", ...sample].join("\n");
  }, [items]);

  const [message, setMessage] = useState(defaultMessage);

  const submit = () => {
    onSubmit?.({ message });
  };

  return (
    <ModalShell
      open={open}
      title="Notify Admin"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            className="rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      }
    >
      <div className="grid gap-3">
        <div className="text-sm text-slate-600">
          Send a short alert to the owner so purchase requests and thresholds can be handled.
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[160px] w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-teal-500/15"
          placeholder="Write your message..."
        />
      </div>
    </ModalShell>
  );
}