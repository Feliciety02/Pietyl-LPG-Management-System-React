import React from "react";
import { RotateCcw } from "lucide-react";
import ModalShell from "../ModalShell";

export default function ConfirmRoleRestoreModal({
  open,
  onClose,
  role,
  onConfirm,
  loading = false,
}) {
  const roleLabel = role ? String(role.label || role.name || "role") : "role";

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-md"
      layout="compact"
      title="Restore role"
      subtitle="Bring this role back to active use"
      icon={RotateCcw}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white ring-1 ring-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/25 disabled:bg-slate-300 disabled:ring-slate-300 disabled:cursor-not-allowed"
          >
            {loading ? "Restoring..." : "Restore"}
          </button>
        </div>
      }
    >
      <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
        <div className="text-sm font-extrabold text-slate-800 truncate">
          {roleLabel}
        </div>
        <div className="mt-1 text-sm font-semibold text-slate-600">
          This role will be active again and available for assignment.
        </div>
      </div>
    </ModalShell>
  );
}
