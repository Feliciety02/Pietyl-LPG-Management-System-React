import React, { useEffect, useMemo, useRef, useState } from "react";
import { UserRound, BadgeCheck, User } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeText(v) {
  return String(v ?? "").trim();
}

function Field({ label, hint, required = false, children }) {
  return (
    <div className="grid gap-2">
      <div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-extrabold text-slate-700">{label}</div>
          {required ? <div className="text-[11px] font-semibold text-slate-400">required</div> : null}
        </div>
        {hint ? <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div> : null}
      </div>
      {children}
    </div>
  );
}

function InputRow({ icon: Icon, ...props }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-4 focus-within:ring-teal-500/15">
      {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
      <input
        {...props}
        className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}

function Select({ icon: Icon, children, ...props }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-4 focus-within:ring-teal-500/15">
      {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
      <select {...props} className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none">
        {children}
      </select>
    </div>
  );
}

function niceText(v, fallback = "None") {
  const s = safeText(v);
  return s ? s : fallback;
}

const POSITION_OPTIONS = [
  "Owner / Admin",
  "Cashier",
  "Delivery Rider",
  "Inventory Manager",
  "Accountant",
  "Warehouse Staff",
];

const STATUS_OPTIONS = ["active", "inactive", "resigned", "terminated"];

export default function EditEmployeeModal({
  open,
  onClose,
  employee,
  onSubmit,
  loading = false,
}) {
  const [name, setName] = useState("");
  const [employeeNo, setEmployeeNo] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState("active");

  const [localError, setLocalError] = useState("");
  const [saving, setSaving] = useState(false);

  const lastEmployeeIdRef = useRef(null);

  const positionOptions = useMemo(() => {
    const current = safeText(position);
    if (current && !POSITION_OPTIONS.includes(current)) return [current, ...POSITION_OPTIONS];
    return POSITION_OPTIONS;
  }, [position]);

  useEffect(() => {
    if (!open) {
      lastEmployeeIdRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!employee?.id) return;
    if (lastEmployeeIdRef.current === employee.id) return;

    setName(employee?.user?.name || "");
    setEmployeeNo(safeText(employee?.employee_no));
    setPosition(safeText(employee?.position));
    setStatus(safeText(employee?.status) || "active");

    setLocalError("");
    setSaving(false);
    lastEmployeeIdRef.current = employee.id;
  }, [open, employee?.id]);

  const canSubmit = useMemo(() => {
    if (!employee?.id) return false;

    if (!safeText(name)) return false;
    if (!safeText(employeeNo)) return false;
    if (!safeText(position)) return false;
    if (!safeText(status)) return false;

    if (!STATUS_OPTIONS.includes(status)) return false;

    if (loading) return false;
    if (saving) return false;

    return true;
  }, [employee, name, employeeNo, position, status, loading, saving]);

  const submit = async () => {
    if (!employee?.id) {
      setLocalError("Employee not loaded yet.");
      return;
    }

    const nm = safeText(name);
    const eno = safeText(employeeNo);
    const pos = safeText(position);
    const st = safeText(status);

    if (!nm || !eno || !pos || !st) {
      setLocalError("Name, employee no, position, and status are required.");
      return;
    }

    if (!STATUS_OPTIONS.includes(st)) {
      setLocalError("Invalid status.");
      return;
    }

    setLocalError("");
    setSaving(true);

    try {
      const ok = await onSubmit?.({
        employee_no: eno,
        position: pos,
        status: st,
        user: {
          id: employee?.user?.id,
          name: nm,
        },
      });

      if (ok) onClose?.();
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
      subtitle="Update employee details, linked account name, and status"
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
              !canSubmit ? "bg-slate-300 ring-slate-300 cursor-not-allowed" : "bg-teal-600 ring-teal-600 hover:bg-teal-700"
            )}
          >
            {saving ? "Saving..." : "Save changes"}
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
          <div className="h-11 rounded-2xl bg-slate-200/80 animate-pulse" />
        </div>
      ) : (
        <div className="grid gap-4">
          {localError ? (
            <div className="rounded-2xl bg-rose-600/10 ring-1 ring-rose-700/10 px-4 py-3 text-sm font-semibold text-rose-900">
              {localError}
            </div>
          ) : null}

          <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-4 py-2.5">
            <div className="text-xs font-extrabold text-slate-700">Linked account</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {employee.user?.email ? employee.user.email : "Not linked"}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">
              {employee.user?.role ? `Role: ${niceText(employee.user.role)}` : "Role: None"}
            </div>
          </div>

          <Field label="Account name" hint="This updates the linked user's display name." required>
            <InputRow
              icon={User}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan Dela Cruz"
              disabled={saving || loading}
              autoFocus
            />
          </Field>

          <Field label="Employee no" hint="Required" required>
            <InputRow
              value={employeeNo}
              onChange={(e) => setEmployeeNo(e.target.value)}
              placeholder="EMP-0001"
              disabled={saving || loading}
            />
          </Field>

          <Field label="Position" hint="Required. Controls role assignment." required>
            <Select value={position} onChange={(e) => setPosition(e.target.value)} disabled={saving || loading}>
              <option value="" disabled>
                Select position
              </option>
              {positionOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Status" required>
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
      )}
    </ModalShell>
  );
}
  