import React, { useEffect, useState } from "react";
import { X, Copy } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function ModalShell({ open, onClose, children, title, subtitle }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">{title}</div>
              {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 hover:bg-slate-50 border border-slate-200"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-slate-600" />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function DuplicateRoleModal({ open, onClose, role, onSubmit }) {
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!open) return;
    const base = String(role?.name || "");
    setName(base ? `${base}_copy` : "");
    setLabel(role?.label ? `${role.label} Copy` : "");
  }, [open, role]);

  const canSubmit = name.trim().length > 0;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Duplicate role"
      subtitle={role ? `From ${String(role.label || role.name || "role")}` : ""}
    >
      <div className="grid gap-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
              <Copy className="h-4 w-4 text-slate-600" />
            </div>
            <div className="text-sm text-slate-700">
              This creates a new role with the same access as the selected role.
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700">New role key</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="example: warehouse_staff"
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-slate-900/5"
          />
          <div className="mt-1 text-xs text-slate-500">Use lowercase and underscores.</div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700">Label</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Example: Warehouse Staff"
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-slate-900/5"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-800 border border-slate-200 hover:bg-slate-50 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onSubmit?.({ name: name.trim(), label: label.trim() })}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-semibold transition",
              canSubmit
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            Create
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
