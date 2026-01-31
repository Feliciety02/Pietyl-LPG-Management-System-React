import React, { useMemo, useState } from "react";
import { Layers3, Plus } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function normalizeKey(v) {
  return String(v ?? "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_");
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="text-xs font-extrabold text-slate-700">{label}</div>
      <div className="mt-2">{children}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

export default function NewRoleModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}) {
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");

  const normalized = useMemo(() => normalizeKey(name), [name]);
  const canSubmit = normalized.length > 0 && !loading;

  const submit = () => {
    if (!canSubmit) return;

    onSubmit?.({
      name: normalized,
      label: String(label ?? "").trim() || null,
    });
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-md"
      layout="compact"
      title="Create new role"
      subtitle="Define a new access role for the system"
      icon={Layers3}
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
            onClick={submit}
            disabled={!canSubmit}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4",
              !canSubmit
                ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                : "bg-teal-600 ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25"
            )}
          >
            {loading ? "Creating..." : "Create role"}
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        {/* INFO CARD */}
        <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
              <Plus className="h-5 w-5 text-slate-600" />
            </div>

            <div className="min-w-0">
              <div className="text-sm font-extrabold text-slate-800">
                You’re creating a new role
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-600 leading-relaxed">
                This role will start with no users assigned. You’ll configure
                permissions after creation.
              </div>
            </div>
          </div>
        </div>

        {/* FORM */}
        <div className="grid gap-4">
          <Field
            label="Role key"
            hint="required. lowercase and underscores only. used internally by the system."
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="example: warehouse_staff"
              className="w-full rounded-2xl bg-white px-3 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
            />

            {name && normalized !== name.trim() ? (
              <div className="mt-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2 text-xs text-slate-600">
                will be saved as{" "}
                <span className="font-semibold text-slate-700">
                  {normalized}
                </span>
              </div>
            ) : null}
          </Field>

          <Field
            label="Label"
            hint="optional. this is what people see in the UI."
          >
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Example: Warehouse Staff"
              className="w-full rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
            />
          </Field>
        </div>
      </div>
    </ModalShell>
  );
}
