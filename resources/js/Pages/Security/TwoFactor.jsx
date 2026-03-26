import React, { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import { KeyRound, ShieldCheck, ShieldAlert, RefreshCw } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function TwoFactor() {
  const page = usePage();
  const auth = page.props?.auth || {};
  const user = auth.user;
  const twoFactor = page.props?.two_factor || {};

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState({ code: "", password: "" });

  const manualSecret = useMemo(() => twoFactor.secret || "", [twoFactor.secret]);

  const runAction = (method, url, payload = {}) => {
    setProcessing(true);
    setErrors({ code: "", password: "" });

    router[method](url, payload, {
      preserveScroll: true,
      onFinish: () => setProcessing(false),
      onError: (errs) => {
        setErrors({
          code: errs?.code || "",
          password: errs?.password || "",
        });
      },
    });
  };

  return (
    <Layout title="Security">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-start gap-4">
            <div className={cx(
              "flex h-12 w-12 items-center justify-center rounded-2xl",
              twoFactor.enabled ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            )}>
              {twoFactor.enabled ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-extrabold text-slate-900">Multi-factor Authentication</h1>
              <p className="mt-1 text-sm text-slate-600">
                {twoFactor.required
                  ? "Your role requires MFA. Complete setup to continue using the system securely."
                  : "Protect your account by pairing an authenticator app."}
              </p>
              <div className="mt-3 text-xs font-semibold text-slate-500">
                Signed in as {user?.email}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold text-slate-900">Status</div>
              <div className="mt-1 text-sm text-slate-600">
                {twoFactor.enabled
                  ? `Enabled${twoFactor.confirmed_at ? ` on ${new Date(twoFactor.confirmed_at).toLocaleString()}` : ""}`
                  : "Not enabled"}
              </div>
            </div>
            {twoFactor.enabled ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-200">
                Active
              </span>
            ) : (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700 ring-1 ring-amber-200">
                Setup required
              </span>
            )}
          </div>
        </div>

        {!twoFactor.enabled ? (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <KeyRound className="h-5 w-5 text-teal-700" />
              <div className="text-sm font-extrabold text-slate-900">Authenticator setup</div>
            </div>

            {!manualSecret ? (
              <div className="mt-5">
                <p className="text-sm text-slate-600">
                  Generate a setup key, then add it to Google Authenticator, Microsoft Authenticator, Authy, or another TOTP app.
                </p>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => runAction("post", "/security/two-factor/provision")}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Generate setup key
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Manual setup key</div>
                  <div className="mt-2 break-all font-mono text-lg font-bold text-slate-900">{manualSecret}</div>
                </div>

                <div>
                  <label className="text-sm font-extrabold text-slate-900">Enter the 6-digit code from your authenticator app</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm tracking-[0.3em] text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-teal-500/15"
                    placeholder="123456"
                  />
                  {errors.code ? <div className="mt-2 text-xs font-semibold text-rose-700">{errors.code}</div> : null}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => runAction("post", "/security/two-factor/enable", { code })}
                    className="rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700"
                  >
                    Enable MFA
                  </button>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => runAction("post", "/security/two-factor/provision")}
                    className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    Regenerate key
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm font-extrabold text-slate-900">Disable MFA</div>
            <p className="mt-1 text-sm text-slate-600">
              Enter your password to remove the authenticator requirement from this account.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-teal-500/15"
              placeholder="Current password"
            />
            {errors.password ? <div className="mt-2 text-xs font-semibold text-rose-700">{errors.password}</div> : null}
            <button
              type="button"
              disabled={processing}
              onClick={() => runAction("post", "/security/two-factor/disable", { password })}
              className="mt-4 rounded-2xl bg-rose-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-rose-700"
            >
              Disable MFA
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

