import React from "react";
import { Copy, Archive, Lock, Layers3 } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function ActionCard({
  icon: Icon,
  title,
  hint,
  onClick,
  disabled = false,
  tone = "neutral", // neutral | danger | locked
}) {
  const isDanger = tone === "danger";
  const isLocked = tone === "locked";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "w-full text-left rounded-2xl px-4 py-3 ring-1 transition focus:outline-none focus:ring-4",
        disabled
          ? "bg-slate-50 text-slate-400 ring-slate-200 cursor-not-allowed"
          : isDanger
          ? "bg-white ring-slate-200 hover:bg-rose-50 focus:ring-rose-500/15"
          : "bg-white ring-slate-200 hover:bg-slate-50 focus:ring-teal-500/15"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cx(
            "mt-0.5 h-9 w-9 rounded-2xl ring-1 flex items-center justify-center",
            disabled
              ? "bg-white ring-slate-200"
              : isDanger
              ? "bg-rose-50 ring-rose-100"
              : isLocked
              ? "bg-slate-50 ring-slate-200"
              : "bg-teal-50 ring-teal-100"
          )}
        >
          <Icon
            className={cx(
              "h-4 w-4",
              disabled
                ? "text-slate-400"
                : isDanger
                ? "text-rose-600"
                : isLocked
                ? "text-slate-600"
                : "text-teal-600"
            )}
          />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800">
            {title}
          </div>

          {hint ? (
            <div className="mt-0.5 text-sm text-slate-600 leading-relaxed">
              {hint}
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export default function RoleActionsModal({
  open,
  onClose,
  role,
  onDuplicate,
  onArchive,
  loading = false,
}) {
  const isSystem = Boolean(role?.is_system);
  const roleLabel = role ? String(role.label || role.name || "role") : "role";
  const canAct = Boolean(role?.id) && !loading;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-md"
      layout="compact"
      title="Role actions"
      subtitle={`For ${roleLabel}`}
      icon={Layers3}
    >
      <div className="grid gap-2">
        <ActionCard
          icon={Copy}
          title="Duplicate role"
          hint="Create a new role with similar access and permissions."
          onClick={() => canAct && onDuplicate?.()}
          disabled={!role?.id || loading}
        />

        <ActionCard
          icon={isSystem ? Lock : Archive}
          title={isSystem ? "Protected role" : "Archive role"}
          hint={
            isSystem
              ? "This role is part of the system and can’t be archived."
              : "Prevents new assignments and removes it from active lists."
          }
          onClick={() => canAct && !isSystem && onArchive?.()}
          disabled={!role?.id || loading || isSystem}
          tone={isSystem ? "locked" : "danger"}
        />

        {!isSystem ? (
          <div className="mt-1 rounded-2xl bg-rose-600/10 ring-1 ring-rose-700/10 px-4 py-2 text-xs text-rose-800">
            users should be reassigned before archiving.
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}
