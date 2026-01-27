import React from "react";
import { AlertTriangle, Lock, Archive } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function ConfirmRoleArchiveModal({
  open,
  onClose,
  role,
  onConfirm,
  loading = false,
}) {
  const isSystem = Boolean(role?.is_system);
  const roleLabel = role ? String(role.label || role.name || "role") : "role";

  const title = isSystem ? "Protected role" : "Archive role";
  const subtitle = isSystem ? "This can’t be archived." : "This can’t be easily undone.";

  const confirmBtn = isSystem
    ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
    : "bg-rose-600 ring-rose-600 hover:bg-rose-700 focus:ring-rose-500/25";

  const confirm = () => {
    if (isSystem || loading) return;
    onConfirm?.();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-md"
      layout="compact"
      title={title}
      subtitle={subtitle}
      icon={isSystem ? Lock : AlertTriangle}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
            disabled={loading}
          >
            {isSystem ? "Close" : "Cancel"}
          </button>

          {!isSystem ? (
            <button
              type="button"
              onClick={confirm}
              className={cx(
                "rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4",
                loading ? "bg-slate-300 ring-slate-300 cursor-not-allowed" : confirmBtn
              )}
              disabled={loading}
            >
              {loading ? "Archiving..." : "Archive"}
            </button>
          ) : null}
        </div>
      }
    >
      <div className="grid gap-3">
        <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
              {isSystem ? (
                <Lock className="h-5 w-5 text-slate-700" />
              ) : (
                <Archive className="h-5 w-5 text-rose-700" />
              )}
            </div>

            <div className="min-w-0">
              <div className="text-sm font-extrabold text-slate-900 truncate">
                {roleLabel}
              </div>

              <div className="mt-1 text-sm font-semibold text-slate-700 leading-relaxed">
                {isSystem
                  ? "System roles are protected and cannot be archived. Create a new role if you need a different workflow."
                  : "Archiving prevents new assignments and hides it from active lists. Existing users should be reassigned first."}
              </div>
            </div>
          </div>
        </div>

        {!isSystem ? (
          <div className="rounded-2xl bg-rose-600/10 ring-1 ring-rose-700/10 px-4 py-3 text-xs font-semibold text-rose-900">
            double check before confirming.
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}
