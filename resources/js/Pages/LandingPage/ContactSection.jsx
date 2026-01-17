import React, { useId, useMemo, useState } from "react";
import GlassCard from "../../components/ui/GlassCard";

function InfoTile({ label, value, sub, tone = "teal" }) {
  const valueClass =
    tone === "teal" ? "text-teal-900" : "text-slate-900";

  return (
    <div className="rounded-2xl bg-white/55 border border-white/70 p-4">
      <div className="text-xs font-bold text-slate-900">{label}</div>
      <div className={`mt-1 text-sm font-extrabold ${valueClass}`}>{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-700/90">{sub}</div> : null}
    </div>
  );
}

export default function ContactSection() {
  const nameId = useId();
  const mobileId = useId();
  const messageId = useId();

  const [form, setForm] = useState({ name: "", mobile: "", message: "" });
  const [touched, setTouched] = useState({ name: false, mobile: false, message: false });
  const [status, setStatus] = useState("idle");

  const errors = useMemo(() => {
    const next = { name: "", mobile: "", message: "" };

    if (!form.name.trim()) next.name = "please enter your name";

    const mobileClean = form.mobile.replace(/\s+/g, "");
    if (!mobileClean) next.mobile = "please enter your mobile number";
    if (mobileClean && !/^09\d{9}$/.test(mobileClean)) next.mobile = "use a valid PH number (starts with 09)";

    if (!form.message.trim()) next.message = "please add a short message";
    if (form.message.trim() && form.message.trim().length < 10) next.message = "message is too short";

    return next;
  }, [form]);

  const hasErrors = Boolean(errors.name || errors.mobile || errors.message);

  function updateField(key) {
    return (e) => {
      const value = e.target.value;
      setForm((p) => ({ ...p, [key]: value }));
      if (status === "success") setStatus("idle");
    };
  }

  function onBlur(key) {
    return () => setTouched((p) => ({ ...p, [key]: true }));
  }

  function onSubmit(e) {
    e.preventDefault();
    setTouched({ name: true, mobile: true, message: true });
    if (hasErrors) return;

    setStatus("success");
    setForm({ name: "", mobile: "", message: "" });
    setTouched({ name: false, mobile: false, message: false });
  }

  return (
    <section id="contact" className="relative">
      {/* UNIFORM CONTAINER like HeroSection */}
      <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
        <div className="mb-6">
          <h2 className="mt-2 text-4xl font-extrabold tracking-tight text-teal-900 tracking-wide">CONTACT US</h2>
          <p className="mt-2 text-sm text-slate-700/90 max-w-3xl">
            Replace placeholders with your real store information.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-stretch">
          <GlassCard className="p-7 sm:p-8">
            <div className="text-sm font-extrabold text-slate-900">contact details</div>

            <div className="mt-5 grid sm:grid-cols-2 gap-3">
              <InfoTile label="phone" value="09xx xxx xxxx" sub="call or text" tone="teal" />
              <InfoTile label="email" value="support@pietyl.com" sub="business hours" tone="teal" />
              <InfoTile label="hours" value="Mon to Sat" sub="8:00 AM to 6:00 PM" tone="slate" />
              <InfoTile label="location" value="Your City" sub="add full address" tone="slate" />
            </div>
          </GlassCard>

          <GlassCard className="p-7 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-extrabold text-slate-900">send an inquiry</div>
                <p className="mt-2 text-sm text-slate-700/90 leading-relaxed">
                  Connect this form to your backend when ready.
                </p>
              </div>

              {status === "success" ? (
                <div className="shrink-0 rounded-2xl bg-white/60 border border-white/70 px-3 py-2">
                  <div className="text-xs font-extrabold text-teal-900">sent</div>
                  <div className="text-xs text-slate-700/90">we&apos;ll get back to you</div>
                </div>
              ) : null}
            </div>

            <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
              <div className="space-y-1">
                <label htmlFor={nameId} className="block text-sm font-semibold text-slate-800">
                  name
                </label>
                <input
                  id={nameId}
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={updateField("name")}
                  onBlur={onBlur("name")}
                  placeholder="your name"
                  className={[
                    "w-full rounded-xl border bg-white/70 px-3 py-2.5 text-sm outline-none",
                    touched.name && errors.name
                      ? "border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20"
                      : "border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/30",
                  ].join(" ")}
                />
                {touched.name && errors.name ? (
                  <p className="text-xs font-semibold text-rose-700/90">{errors.name}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <label htmlFor={mobileId} className="block text-sm font-semibold text-slate-800">
                  mobile number
                </label>
                <input
                  id={mobileId}
                  name="mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={form.mobile}
                  onChange={updateField("mobile")}
                  onBlur={onBlur("mobile")}
                  placeholder="09xxxxxxxxx"
                  className={[
                    "w-full rounded-xl border bg-white/70 px-3 py-2.5 text-sm outline-none",
                    touched.mobile && errors.mobile
                      ? "border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20"
                      : "border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/30",
                  ].join(" ")}
                />
                {touched.mobile && errors.mobile ? (
                  <p className="text-xs font-semibold text-rose-700/90">{errors.mobile}</p>
                ) : (
                  <p className="text-xs text-slate-700/80">format: 11 digits, starts with 09</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor={messageId} className="block text-sm font-semibold text-slate-800">
                  message
                </label>
                <textarea
                  id={messageId}
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={updateField("message")}
                  onBlur={onBlur("message")}
                  placeholder="tell us what you need"
                  className={[
                    "w-full resize-none rounded-xl border bg-white/70 px-3 py-2.5 text-sm outline-none",
                    touched.message && errors.message
                      ? "border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20"
                      : "border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/30",
                  ].join(" ")}
                />
                <div className="flex items-center justify-between gap-3">
                  {touched.message && errors.message ? (
                    <p className="text-xs font-semibold text-rose-700/90">{errors.message}</p>
                  ) : (
                    <p className="text-xs text-slate-700/80">give us a bit of detail so we can help faster</p>
                  )}
                  <p className="text-xs text-slate-700/70">{form.message.trim().length}/500</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={status === "success"}
                className={[
                  "w-full inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition focus:outline-none focus:ring-4",
                  status === "success"
                    ? "bg-teal-600/70 shadow-teal-600/15 cursor-default"
                    : "bg-teal-600 shadow-teal-600/25 hover:bg-teal-700 focus:ring-teal-500/30",
                ].join(" ")}
              >
                {status === "success" ? "message sent" : "send message"}
              </button>
            </form>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
