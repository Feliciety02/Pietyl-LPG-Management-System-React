import React, { useEffect, useMemo, useState } from "react";
import { UserRound, BadgeCheck, StickyNote } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="text-xs font-extrabold text-slate-700">{label}</div>
      {hint ? <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div> : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Input({ icon: Icon, ...props }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-teal-500/30">
      {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
      <input
        {...props}
        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}

function Select({ icon: Icon, children, ...props }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-teal-500/30">
      {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
      <select {...props} className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none">
        {children}
      </select>
    </div>
  );
}

function Textarea({ icon: Icon, ...props }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-teal-500/30">
      <div className="flex items-start gap-2">
        {Icon ? <Icon className="mt-0.5 h-4 w-4 text-slate-500" /> : null}
        <textarea
          {...props}
          className="min-h-[56px] w-full resize-none bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

function niceText(v, fallback = "None") {
  if (v == null) return fallback;
  const s = String(v).trim();
  return s ? s : fallback;
}

export default function EditEmployeeModal({ open, onClose, employee, onSubmit, loading = false }) {
  const [employeeNo, setEmployeeNo] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");

  const [localError, setLocalError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setEmployeeNo(employee?.employee_no || "");
    setFirstName(employee?.first_name || "");
    setLastName(employee?.last_name || "");
    setPosition(employee?.position || "");
    setStatus(employee?.status || "active");
    setNotes(employee?.notes || "");

    setLocalError("");
    setSaving(false);
  }, [open, employee]);

  const canSubmit = useMemo(() => {
    if (!employee?.id) return false;
    if (!firstName.trim()) return false;
    if (!lastName.trim()) return false;
    if (!position.trim()) return false;
    if (!status) return false;
    if (loading) return false;
    if (saving) return false;
    return true;
  }, [employee, firstName, lastName, position, status, loading, saving]);

  const submit = async () => {
    if (!employee?.id) {
      setLocalError("Employee not loaded yet.");
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !position.trim()) {
      setLocalError("First name, last name, and position are required.");
      return;
    }

    setLocalError("");
    setSaving(true);

    try {
      await onSubmit?.({
        employee_no: employeeNo.trim() || null,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        position: position.trim(),
        status: status,
        notes: notes.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-lg"
      layout="compact"
      title="Edit employee"
      subtitle="Update employee details and status"
      icon={UserRound}
      bodyClassName="p-4"
      footerClassName="p-4 pt-0"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
            disabled={saving || loading}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25",
              !canSubmit
                ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                : "bg-teal-600 ring-teal-600 hover:bg-teal-700"
            )}
          >
            {saving ? "Saving" : "Save changes"}
          </button>
        </div>
      }
    >
      {!employee ? (
        <div className="grid gap-3">
          <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3">
            <div className="h-4 w-44 rounded bg-slate-200/80 animate-pulse" />
            <div className="mt-2 h-4 w-64 rounded bg-slate-200/80 animate-pulse" />
          </div>
          <div className="h-11 rounded-2xl bg-slate-200/80 animate-pulse" />
          <div className="h-11 rounded-2xl bg-slate-200/80 animate-pulse" />
          <div className="h-11 rounded-2xl bg-slate-200/80 animate-pulse" />
          <div className="h-20 rounded-2xl bg-slate-200/80 animate-pulse" />
        </div>
      ) : (
        <div className="grid gap-3">
          {localError ? (
            <div className="rounded-2xl bg-rose-600/10 ring-1 ring-rose-700/10 px-4 py-3 text-sm font-semibold text-rose-900">
              {localError}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name">
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Maria"
                autoFocus
                disabled={saving || loading}
              />
            </Field>

            <Field label="Last name">
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Santos"
                disabled={saving || loading}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Position">
              <Input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Cashier"
                disabled={saving || loading}
              />
            </Field>

            <Field label="Status">
              <Select
                icon={BadgeCheck}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={saving || loading}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="resigned">Resigned</option>
                <option value="terminated">Terminated</option>
              </Select>
            </Field>
          </div>

          <Field label="Employee no" hint="Optional">
            <Input
              value={employeeNo}
              onChange={(e) => setEmployeeNo(e.target.value)}
              placeholder="EMP-0001"
              disabled={saving || loading}
            />
          </Field>

          <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-4 py-2.5">
            <div className="text-xs font-extrabold text-slate-700">Linked account</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {employee.user?.email ? employee.user.email : "Not linked"}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">
              {employee.user?.role ? `Role: ${niceText(employee.user.role)}` : "Role: None"}
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  );
}