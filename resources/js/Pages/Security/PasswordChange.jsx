import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { Eye, EyeOff, LockKeyhole, ShieldAlert } from "lucide-react";
import Layout from "../Dashboard/Layout";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function PasswordChange() {
  const page = usePage();
  const user = page.props?.auth?.user || null;
  const passwordSecurity = page.props?.password_security || {};

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const submit = (e) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({
      current_password: "",
      password: "",
      password_confirmation: "",
    });

    router.put(
      "/security/password",
      {
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      },
      {
        preserveScroll: true,
        onFinish: () => setProcessing(false),
        onError: (nextErrors) => {
          setErrors({
            current_password: nextErrors?.current_password || "",
            password: nextErrors?.password || "",
            password_confirmation: nextErrors?.password_confirmation || "",
          });
        },
      }
    );
  };

  return (
    <Layout title="Password Security">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-extrabold text-slate-900">Password change required</h1>
              <p className="mt-1 text-sm text-slate-600">
                {passwordSecurity.must_change_password
                  ? "Your current password is temporary or recently reset. Update it before using the rest of the system."
                  : "Use a strong password to keep your account secure."}
              </p>
              <div className="mt-3 text-xs font-semibold text-slate-500">
                Signed in as {user?.email}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <LockKeyhole className="h-5 w-5 text-teal-700" />
            <div className="text-sm font-extrabold text-slate-900">Set a new password</div>
          </div>

          <div className="mt-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Password rules</div>
            <div className="mt-2 text-sm text-slate-700">
              Use at least {passwordSecurity.minimum_length || 12} characters with uppercase, lowercase, number, and symbol characters.
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-extrabold text-slate-900">Current password</label>
              <div className="relative mt-2">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className={cx(
                    "w-full rounded-2xl border bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-teal-500/15",
                    errors.current_password ? "border-rose-300" : "border-slate-200"
                  )}
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.current_password ? <div className="mt-2 text-xs font-semibold text-rose-700">{errors.current_password}</div> : null}
            </div>

            <div>
              <label className="text-sm font-extrabold text-slate-900">New password</label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className={cx(
                    "w-full rounded-2xl border bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-teal-500/15",
                    errors.password ? "border-rose-300" : "border-slate-200"
                  )}
                  placeholder="Choose a strong new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password ? <div className="mt-2 text-xs font-semibold text-rose-700">{errors.password}</div> : null}
            </div>

            <div>
              <label className="text-sm font-extrabold text-slate-900">Confirm new password</label>
              <div className="relative mt-2">
                <input
                  type={showPasswordConfirmation ? "text" : "password"}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  autoComplete="new-password"
                  className={cx(
                    "w-full rounded-2xl border bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-teal-500/15",
                    errors.password_confirmation ? "border-rose-300" : "border-slate-200"
                  )}
                  placeholder="Repeat the new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirmation((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  {showPasswordConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password_confirmation ? <div className="mt-2 text-xs font-semibold text-rose-700">{errors.password_confirmation}</div> : null}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={processing}
              className={cx(
                "rounded-2xl px-4 py-2 text-sm font-extrabold text-white transition focus:outline-none focus:ring-4 focus:ring-teal-500/25",
                processing ? "cursor-not-allowed bg-teal-600/70" : "bg-teal-600 hover:bg-teal-700"
              )}
            >
              {processing ? "Updating..." : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
