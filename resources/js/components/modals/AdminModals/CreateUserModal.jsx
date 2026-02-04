import React, { useEffect, useMemo, useState } from "react";
import { UserPlus, Mail, User } from "lucide-react";
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

export default function CreateUserModal({
  open,
  onClose,
  onSubmit,
  loading = false,
  roles,
  serverError = "",
}) {
  const defaultRoleName = (Array.isArray(roles) && roles.length > 0 && roles[0]?.name) ? roles[0].name : "cashier";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(defaultRoleName);
  const [status, setStatus] = useState("active");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    setEmail("");
    setPassword("");
    setRole(roles?.[0]?.name || "cashier");
    setStatus("active");
    setErr("");
  }, [open, roles]);

  const canSubmit = useMemo(() => {
    if (!safeText(name)) return false;
    if (!safeText(email)) return false;
    if (!safeText(password)) return false;
    if (!safeText(role)) return false;
    if (loading) return false;
    return true;
  }, [name, email, password, role, loading]);

  const submit = () => {
    if (!safeText(name) || !safeText(email) || !safeText(password)) {
      setErr("Name, email, and password are required.");
      return;
    }

    setErr("");
    onSubmit?.({
      name: safeText(name),
      email: safeText(email).toLowerCase(),
      password: safeText(password),
      role: safeText(role),
      is_active: status === "active",
    });
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-lg"
      layout="compact"
      title="Add user"
      subtitle="Create a login account"
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
              !canSubmit
                ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                : "bg-teal-600 ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25"
            )}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        {err || serverError ? (
          <div className="rounded-2xl bg-rose-600/10 ring-1 ring-rose-700/10 px-4 py-3 text-sm font-semibold text-rose-900">
            {err || serverError}
          </div>
        ) : null}

        <Field label="Name" required>
          <InputRow
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Juan Dela Cruz"
            autoFocus
          />
        </Field>

        <Field label="Email" required>
          <InputRow
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@company.com"
            inputMode="email"
          />
        </Field>

        <Field label="Password" required>
          <InputRow
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            type="password"
          />
        </Field>

      </div>
    </ModalShell>
  );
}
