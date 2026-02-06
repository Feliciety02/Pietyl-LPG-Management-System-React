import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminPasswordConfirmModal({ open, onClose, onConfirmed, error: externalError }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setShowPassword(false);
      setError("");
      setLoading(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await axios.post("/dashboard/admin/password/confirm", { password });
      onConfirmed?.();
    } catch (err) {
      setError(err?.response?.data?.message || "Incorrect password.");
    } finally {
      setLoading(false);
    }
  };

  const resolvedError = externalError || error;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Confirm yourself"
      subtitle="Enter your administrator password to apply VAT settings."
      icon={ShieldCheck}
      layout="compact"
      maxWidthClass="max-w-md"
      footerClassName="space-x-2"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4",
              loading
                ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                : "bg-teal-600 ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25"
            )}
          >
            {loading ? "Verifying..." : "Confirm"}
          </button>
        </div>
      }
    >
      <div className="grid gap-3">
        <div className="text-sm font-semibold text-slate-600">
          For security, confirm your password before changing sensitive financial settings.
        </div>
        <label className="grid gap-2 text-xs font-extrabold text-slate-500">
          Password
          <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-2 focus-within:ring-teal-500/25">
            <Eye className="h-4 w-4 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>
        {resolvedError ? (
          <div className="rounded-2xl bg-rose-50 ring-1 ring-rose-500/30 px-4 py-3 text-sm font-semibold text-rose-800">
            {resolvedError}
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}
