import React from "react";
import GlassCard from "./GlassCard";

export default function ContactSection() {
  return (
    <div>
      <div className="mb-6">
        <div className="text-xs font-extrabold text-teal-900">CONTACT</div>
        <h2 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">contact us</h2>
        <p className="mt-2 text-sm text-slate-700/90 max-w-3xl">
          Replace placeholders with your real store information.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <GlassCard className="p-7 sm:p-8">
          <div className="text-sm font-extrabold text-slate-900">contact details</div>

          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/55 border border-white/70 p-4">
              <div className="text-xs font-bold text-slate-900">phone</div>
              <div className="mt-1 text-sm font-extrabold text-teal-900">09xx xxx xxxx</div>
              <div className="mt-1 text-xs text-slate-700/90">call or text</div>
            </div>

            <div className="rounded-2xl bg-white/55 border border-white/70 p-4">
              <div className="text-xs font-bold text-slate-900">email</div>
              <div className="mt-1 text-sm font-extrabold text-teal-900">support@pietyl.com</div>
              <div className="mt-1 text-xs text-slate-700/90">business hours</div>
            </div>

            <div className="rounded-2xl bg-white/55 border border-white/70 p-4">
              <div className="text-xs font-bold text-slate-900">hours</div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">Mon to Sat</div>
              <div className="mt-1 text-xs text-slate-700/90">8:00 AM to 6:00 PM</div>
            </div>

            <div className="rounded-2xl bg-white/55 border border-white/70 p-4">
              <div className="text-xs font-bold text-slate-900">location</div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">Your City</div>
              <div className="mt-1 text-xs text-slate-700/90">add full address</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-7 sm:p-8">
          <div className="text-sm font-extrabold text-slate-900">send an inquiry</div>
          <p className="mt-2 text-sm text-slate-700/90 leading-relaxed">
            Connect this form to your backend when ready.
          </p>

          <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-800">name</label>
              <input
                type="text"
                placeholder="your name"
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/30"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-800">mobile number</label>
              <input
                type="text"
                placeholder="09xx xxx xxxx"
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/30"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-800">message</label>
              <textarea
                rows={4}
                placeholder="tell us what you need"
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/30"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm shadow-teal-600/25 hover:bg-teal-700 transition focus:outline-none focus:ring-4 focus:ring-teal-500/30"
            >
              send message
            </button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
