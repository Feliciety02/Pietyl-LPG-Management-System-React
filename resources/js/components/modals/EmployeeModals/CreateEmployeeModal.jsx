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

function Input(props) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className="w-full rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
    />
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
}) {
  const [employeeNo, setEmployeeNo] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState("active");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setEmployeeNo(nextEmployeeNo || "");
    setFirst("");
    setLast("");
    setPosition("");
    setStatus("active");
    setErr("");
  }, [open, nextEmployeeNo]);

  const canSubmit = useMemo(() => {
    if (!safeText(first)) return false;
    if (!safeText(last)) return false;
    if (loading) return false;
    return true;
  }, [first, last, loading]);

  const submit = () => {
    if (!safeText(first) || !safeText(last)) {
      setErr("First name and last name are required.");
      return;
    }

    setErr("");

    onSubmit?.({
      employee_no: safeText(employeeNo) || null,
      first_name: safeText(first),
      last_name: safeText(last),
      position: safeText(position) || null,
      status: safeText(status) || "active",
    });
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-lg"
      layout="compact"
      title="Add employee"
      subtitle="Create a staff record for HR and operations"
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" required>
            <Input value={first} onChange={(e) => setFirst(e.target.value)} placeholder="Juan" autoFocus />
          </Field>

          <Field label="Last name" required>
            <Input value={last} onChange={(e) => setLast(e.target.value)} placeholder="Dela Cruz" />
          </Field>
        </div>

        <Field label="Employee no" hint="Auto-generated.">
          <Input
            value={employeeNo}
            onChange={(e) => setEmployeeNo(e.target.value)}
            placeholder="EMP-0007"
            readOnly
          />
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
