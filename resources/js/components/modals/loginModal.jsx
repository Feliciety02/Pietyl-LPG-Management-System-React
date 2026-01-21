import React, { useState } from "react";
import { router } from "@inertiajs/react";
import HeaderLogo from "../../../images/Header_Logo.png";
import ModalShell from "./ModalShell";

export default function LoginModal({ open, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "", general: "" });

  function onSubmit(e) {
    e.preventDefault();
    setErrors({ email: "", password: "", general: "" });
    setProcessing(true);

    router.post(
      "/login",
      { email, password, remember },
      {
        preserveScroll: true,
        onFinish: () => setProcessing(false),
        onError: (errs) => {
          setErrors({
            email: errs?.email || "",
            password: errs?.password || "",
            general: errs?.message || "",
          });
        },
      }
    );
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-md"
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={HeaderLogo} alt="PIETYL" className="h-10 w-auto" />
            <div>
              <div className="text-sm font-extrabold text-slate-900">PIETYL</div>
              <div className="text-xs text-slate-600/80">LPG Operations Platform</div>
            </div>
          </div>
        </div>
      }
      bodyClassName="p-8"
      footer={null}
    >
      <div className="mt-4 text-center">
        <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Sign in
        </h3>
        <p className="mt-2 text-sm text-slate-600/90">
          Use the account provided by your administrator.
        </p>
      </div>

      {errors.general ? (
        <div className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-200">
          {errors.general}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <div className="relative">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              placeholder="Email"
              className={[
                "peer w-full rounded-2xl bg-slate-50/80 px-5 pb-3.5 pt-8 text-sm text-slate-900 ring-1 outline-none transition focus:bg-white",
                errors.email
                  ? "ring-rose-300 focus:ring-rose-400"
                  : "ring-slate-200 focus:ring-teal-400",
              ].join(" ")}
            />
            <label
              htmlFor="email"
              className="pointer-events-none absolute left-5 top-3.5 text-xs font-extrabold tracking-wide text-slate-600/90 transition
              peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-semibold
              peer-focus:top-3.5 peer-focus:text-xs peer-focus:font-extrabold peer-focus:text-teal-800"
            >
              Email
            </label>
          </div>
          {errors.email ? (
            <p className="mt-1.5 text-xs font-semibold text-rose-700">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div>
          <div className="relative">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Password"
              className={[
                "peer w-full rounded-2xl bg-slate-50/80 px-5 pb-3.5 pt-8 text-sm text-slate-900 ring-1 outline-none transition focus:bg-white",
                errors.password
                  ? "ring-rose-300 focus:ring-rose-400"
                  : "ring-slate-200 focus:ring-teal-400",
              ].join(" ")}
            />
            <label
              htmlFor="password"
              className="pointer-events-none absolute left-5 top-3.5 text-xs font-extrabold tracking-wide text-slate-600/90 transition
              peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-semibold
              peer-focus:top-3.5 peer-focus:text-xs peer-focus:font-extrabold peer-focus:text-teal-800"
            >
              Password
            </label>
          </div>
          {errors.password ? (
            <p className="mt-1.5 text-xs font-semibold text-rose-700">
              {errors.password}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500/25"
            />
            <span className="text-sm text-slate-700">Remember me</span>
          </label>

          <a
            href="/forgot-password"
            className="text-sm font-extrabold text-teal-800 hover:text-teal-900 transition"
          >
            Forgot password
          </a>
        </div>

        <div className="pt-3 text-center">
          <button
            type="submit"
            disabled={processing}
            className={[
              "w-full inline-flex items-center justify-center rounded-2xl px-4 py-3.5 text-sm font-extrabold text-white transition",
              "shadow-sm shadow-teal-600/20 focus:outline-none focus:ring-4 focus:ring-teal-500/25",
              processing
                ? "bg-teal-600/70 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700",
            ].join(" ")}
          >
            {processing ? "Signing in..." : "Sign in"}
          </button>
        </div>

        <div className="pt-3 text-center text-xs text-slate-600/80">
          Protected access for staff accounts only.
        </div>
      </form>
    </ModalShell>
  );
}