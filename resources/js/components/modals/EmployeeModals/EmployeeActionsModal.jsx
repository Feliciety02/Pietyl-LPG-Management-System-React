import React from "react";
import { MoreVertical, Pencil, Link2, Unlink } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function ActionCard({ icon: Icon, title, hint, onClick, disabled = false, tone = "neutral" }) {
  const isDanger = tone === "danger";

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
            "mt-0.5 h-9 w-9 rounded-2xl flex items-center justify-center",
            disabled ? "bg-white" : isDanger ? "bg-rose-50" : "bg-slate-50"
          )}
        >
          <Icon className={cx("h-4 w-4", isDanger ? "text-rose-600" : "text-slate-600")} />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800">{title}</div>
          {hint ? <div className="mt-0.5 text-sm text-slate-600">{hint}</div> : null}
        </div>
      </div>
    </button>
  );
}

export default function EmployeeActionsModal({
  open,
  onClose,
  employee,
  onEdit,
  onLinkAccount,
  onUnlinkAccount,
}) {
  const hasEmployee = Boolean(employee?.id);
  const isLinked = Boolean(employee?.user);

  const name =
    employee ? `${employee.first_name || ""} ${employee.last_name || ""}`.trim() : "Employee";

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-md"
      layout="compact"
      title="Employee actions"
      subtitle={name}
      icon={MoreVertical}
    >
      <div className="grid gap-2">
        <ActionCard
          icon={Pencil}
          title="Edit employee"
          hint="Update position, status, and details."
          onClick={onEdit}
          disabled={!hasEmployee}
        />

        <ActionCard
          icon={Link2}
          title="Link user account"
          hint="Create or attach a login account for this employee."
          onClick={onLinkAccount}
          disabled={!hasEmployee || isLinked}
        />

        <ActionCard
          icon={Unlink}
          title="Unlink user account"
          hint="Detach the current user account from this employee."
          onClick={onUnlinkAccount}
          disabled={!hasEmployee || !isLinked}
          tone="danger"
        />
      </div>
    </ModalShell>
  );
}
