import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
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

function InputRow({ icon: Icon, suffix, ...props }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-4 focus-within:ring-teal-500/15">
      {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
      <input
        {...props}
        className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
      />
      {suffix ? <div className="flex-shrink-0">{suffix}</div> : null}
    </div>
  );
}

export default function ResetPasswordConfirmModal({
  open,
  user,
  error = "",
  onClose,
  onSuccess,
}) {
  const [phase, setPhase] = useState("confirm");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPhase("confirm");
    setAdminPassword("");
    setShowAdminPassword(false);
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setLocalError("");
  }, [open]);

  const resetState = () => {
    setPhase("confirm");
    setAdminPassword("");
    setShowAdminPassword(false);
  };

  const handleConfirm = async () => {
    if (!adminPassword.trim()) {
      setLocalError("Password is required.");
      return;
    }

    setLocalError("");
    setSaving(true);

    try {
      await axios.post("/dashboard/admin/password/confirm", { password: adminPassword });
      setPhase("reset");
    } catch (err) {
      setLocalError(err?.response?.data?.message || "Incorrect password.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!newPassword.trim()) {
      setLocalError("New password is required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    if (!user?.id) {
      setLocalError("No user selected.");
      return;
    }

    setLocalError("");
    setSaving(true);

    try {
      await axios.post(`/dashboard/admin/users/${user.id}/reset-password`, {
        admin_password: adminPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });
      setPhase("complete");
      setLocalError("");
    } catch (err) {
      setLocalError(
        err?.response?.data?.new_password?.[0] ||
          err?.response?.data?.admin_password?.[0] ||
          err?.response?.data?.message ||
          "Failed to reset password."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    resetState();
    onClose?.();
  };

  const handleDone = () => {
    resetState();
    onSuccess?.();
  };

  const stepMessage = phase === "confirm"
    ? `Confirm your administrator password before resetting ${user?.email || "this user"}'s password.`
    : phase === "reset"
    ? `Enter a new password for ${user?.email || "this user"}.`
    : `Password reset complete for ${user?.email || "this user"}.`;

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      maxWidthClass="max-w-lg"
      layout="compact"
      title="Reset password"
      subtitle={stepMessage}
      icon={ShieldCheck}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={phase === "complete" ? handleDone : handleClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
          >
            {phase === "complete" ? "Close" : "Cancel"}
          </button>
          {phase !== "complete" ? (
            <button
              type="button"
              onClick={phase === "confirm" ? handleConfirm : handleReset}
              disabled={saving}
              className={cx(
                "rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4",
                saving
                  ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                  : "bg-teal-600 ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25"
              )}
            >
              {saving
                ? phase === "confirm"
                  ? "Validating..."
                  : "Resetting..."
                : phase === "confirm"
                ? "Confirm"
                : "Reset password"}
            </button>
          ) : null}
        </div>
      }
    >
      <div className="grid gap-4">
        {(phase === "confirm" || phase === "reset") && (
          <Field label="Confirm your password" required>
            <InputRow
              icon={Eye}
              type={showAdminPassword ? "text" : "password"}
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              suffix={
                <button
                  type="button"
                  onClick={() => setShowAdminPassword((prev) => !prev)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  aria-label={showAdminPassword ? "Hide password" : "Show password"}
                >
                  {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
          </Field>
        )}

        {phase === "reset" && (
          <>
            <Field label="New password" required>
              <InputRow
                icon={Eye}
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </Field>

            <Field label="Confirm password" required>
              <InputRow
                icon={Eye}
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </Field>
          </>
        )}

        {phase === "complete" && (
          <div className="rounded-2xl bg-teal-50 ring-1 ring-teal-200 px-4 py-3 text-sm font-semibold text-teal-900">
            Password reset request completed for {user?.email || "this user"}.
          </div>
        )}

        {localError || error ? (
          <div className="rounded-2xl bg-rose-600/10 ring-1 ring-rose-700/10 px-4 py-3 text-sm font-semibold text-rose-900">
            {localError || error}
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}
