import React, { useEffect, useMemo, useState } from "react";
import ModalShell from "../ModalShell";
import { UserPlus } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeText(v) {
  return String(v ?? "").trim();
}

function Field({ label, hint, required = false, children }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="text-xs font-extrabold text-slate-700">{label}</div>
        {required ? <div className="text-[11px] font-semibold text-slate-400">required</div> : null}
      </div>
      {hint ? <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div> : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Input({ icon: Icon, left, right, ...props }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-teal-500/30">
      {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}

      {left ? (
        <div className="shrink-0 pr-2 border-r border-slate-200/70 text-xs font-extrabold text-slate-600">{left}</div>
      ) : null}

      <input
        {...props}
        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
      />

      {right ? (
        <div className="shrink-0 pl-2 border-l border-slate-200/70 text-xs font-extrabold text-slate-600">{right}</div>
      ) : null}
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

const POSITION_OPTIONS = [
  "Owner / Admin",
  "Cashier",
  "Delivery Rider",
  "Inventory Manager",
  "Accountant",
  "Warehouse Staff",
];

export default function CreateEmployeeModal({
  open,
  onClose,
  onSubmit,
  loading = false,
  nextEmployeeNo = "",
  eligibleUsers = [],
}) {
  const [userId, setUserId] = useState("");
  const [employeeNo, setEmployeeNo] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState("active");
  const [err, setErr] = useState("");

  const selectedUser = useMemo(() => {
    const idNum = Number(userId);
    if (!idNum) return null;
    return eligibleUsers.find((u) => Number(u.id) === idNum) || null;
  }, [userId, eligibleUsers]);

  useEffect(() => {
    if (!open) return;
    setUserId("");
    setEmployeeNo(nextEmployeeNo || "");
    setPosition("");
    setStatus("active");
    setErr("");
  }, [open, nextEmployeeNo]);

  const canSubmit = useMemo(() => {
    if (!Number(userId)) return false;
    if (loading) return false;
    return true;
  }, [userId, loading]);

  const submit = () => {
    if (!Number(userId)) {
      setErr("Please select a user.");
      return;
    }

    setErr("");

    onSubmit?.({
      user_id: Number(userId),
      employee_no: safeText(employeeNo) || null,
      position: safeText(position) || null,
      status: safeText(status) || "active",
    });
  };

  const hasEligible = eligibleUsers?.length > 0;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-lg"
      layout="compact"
      title="Add employee"
      subtitle="Assign a user to an employee record and role"
      icon={UserPlus}
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
              !canSubmit ? "bg-slate-300 ring-slate-300 cursor-not-allowed" : "bg-teal-600 ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25"
            )}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        {err ? (
          <div className="rounded-2xl bg-rose-600/10 ring-1 ring-rose-700/10 px-4 py-3 text-sm font-semibold text-rose-900">
            {err}
          </div>
        ) : null}

        {!hasEligible ? (
          <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
            No eligible users available. Create a user first in Users tab.
          </div>
        ) : null}

        <Field label="User" hint="Only users without an employee record are shown." required>
          <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Select user</option>
            {eligibleUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </Select>
        </Field>

        {selectedUser ? (
          <div className="rounded-2xl bg-white ring-1 ring-slate-200 px-4 py-3">
            <div className="text-xs font-extrabold text-slate-700">Selected</div>
            <div className="mt-1 text-sm font-extrabold text-slate-900">{selectedUser.name}</div>
            <div className="text-xs text-slate-500">{selectedUser.email}</div>
          </div>
        ) : null}

        <Field label="Employee no" hint="Auto-generated.">
          <Input value={employeeNo} readOnly placeholder="EMP-0007" />
        </Field>

        <Field label="Position" hint="Optional, you can update later.">
          <Select value={position} onChange={(e) => setPosition(e.target.value)}>
            <option value="">Select position</option>
            {POSITION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="resigned">Resigned</option>
            <option value="terminated">Terminated</option>
          </Select>
        </Field>
      </div>
    </ModalShell>
  );
}
