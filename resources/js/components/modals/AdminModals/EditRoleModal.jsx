import React, { useEffect, useMemo, useState } from "react";
import { Layers3, Pencil } from "lucide-react";
import ModalShell from "../ModalShell";

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

export default function EditRoleModal({
  open,
  onClose,
  role,
  onSubmit,
  loading = false,
}) {
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(role?.name || "");
    setLabel(role?.label || "");
  }, [open, role]);

  const normalized = useMemo(() => normalizeKey(name), [name]);
  const canSubmit = Boolean(role?.id) && normalized.length > 0 && !loading;

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
      title="Edit role"
      subtitle="Update role details"
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
            className="rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white ring-1 ring-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/25 disabled:bg-slate-300 disabled:ring-slate-300 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save changes"}
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
              <Pencil className="h-5 w-5 text-slate-600" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-slate-800">
                Editing role details
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-600 leading-relaxed">
                Update the role key and label. Changing the key affects internal
                references.
              </div>
            </div>
          </div>
        </div>

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
              disabled={!role?.id || loading}
            />

            {name && normalized !== name.trim() ? (
              <div className="mt-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2 text-xs text-slate-600">
                will be saved as{" "}
                <span className="font-semibold text-slate-700">{normalized}</span>
              </div>
            ) : null}
          </Field>

          <Field label="Label" hint="optional. this is what people see in the UI.">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Example: Warehouse Staff"
              className="w-full rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
              disabled={!role?.id || loading}
            />
          </Field>
        </div>
      </div>
    </ModalShell>
  );
}
