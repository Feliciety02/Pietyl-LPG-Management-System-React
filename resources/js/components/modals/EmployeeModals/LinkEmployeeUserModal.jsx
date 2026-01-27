import React, { useEffect, useMemo, useState } from "react";
import { Link2, Mail } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeText(v) {
  return String(v ?? "").trim();
}

function Field({ label, hint, children }) {
  return (
    <div className="grid gap-2">
      <div>
        <div className="text-xs font-extrabold text-slate-700">{label}</div>
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

export default function LinkEmployeeUserModal({ open, onClose, employee, onSubmit, loading = false }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("cashier");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setRole("cashier");
    setErr("");
  }, [open]);

  if (!employee) return null;

  const canSubmit = useMemo(() => {
    if (!safeText(email)) return false;
    if (loading) return false;
    return true;
  }, [email, loading]);

  const submit = () => {
    const e = safeText(email).toLowerCase();
    if (!e) {
      setErr("Email is required.");
      return;
    }
    setErr("");
    onSubmit?.({ email: e, role });
  };

  const name = `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Employee";

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-md"
      layout="compact"
      title="Link account"
      subtitle={name}
      icon={Link2}
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
            {loading ? "Linking..." : "Link"}
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

        <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
          <div className="text-sm font-extrabold text-slate-800">Attach a login account</div>
          <div className="mt-1 text-sm text-slate-600 leading-relaxed">
            This will connect a user to the employee record for access control and activity tracking.
          </div>
        </div>

        <Field label="User email" hint="Use an existing user email, or the email you will register.">
          <InputRow
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@company.com"
            inputMode="email"
          />
        </Field>

        <Field label="Role" hint="Choose the access level for this employee account.">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
          >
            <option value="cashier">Cashier</option>
            <option value="inventory_manager">Inventory Manager</option>
            <option value="rider">Rider</option>
            <option value="accountant">Accountant</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
      </div>
    </ModalShell>
  );
}
