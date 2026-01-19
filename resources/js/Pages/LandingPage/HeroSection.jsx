import React from "react";
import GlassCard from "../../components/ui/GlassCard";
import Store from "../../../images/store.png";

export default function HeroSection({ onScrollTo }) {
  return (
    <section className="relative overflow-hidden">
      {/* HERO BACKGROUND ONLY (not global) */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <img
          src={Store}
          alt="Store background"
          className="h-full w-full object-cover object-center scale-[1.02] pietyl-bg-float"
        />

        {/* Teal tint overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/75 via-white/45 to-cyan-50/65" />

        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent" />

        {/* Modern animated aurora glows */}
        <div aria-hidden="true" className="absolute inset-0">
          <div className="pietyl-aurora pietyl-aurora-1 absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full blur-3xl" />
          <div className="pietyl-aurora pietyl-aurora-2 absolute top-10 right-[-10rem] h-[34rem] w-[34rem] rounded-full blur-3xl" />
          <div className="pietyl-aurora pietyl-aurora-3 absolute bottom-[-14rem] left-[35%] h-[36rem] w-[36rem] rounded-full blur-3xl" />
          <div className="pietyl-aurora pietyl-aurora-4 absolute top-[35%] left-[60%] h-[28rem] w-[28rem] rounded-full blur-3xl" />
          <div className="pietyl-aurora pietyl-aurora-5 absolute bottom-[-10rem] right-[-12rem] h-[30rem] w-[30rem] rounded-full blur-3xl" />

          <div className="pietyl-glow-4 absolute top-16 left-1/2 -translate-x-1/2 h-64 w-[36rem] rounded-full bg-white/20 blur-3xl" />
        </div>
      </div>

      {/* HERO CONTENT */}
      <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-stretch">
          {/* LEFT: TEXT + CTA */}
          <GlassCard className="p-8 sm:p-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/60 border border-white/70 px-4 py-2 text-xs font-extrabold text-teal-950/80">
              <span className="h-2 w-2 rounded-full bg-teal-600" />
              PIETYL LPG STORE WEBSITE
            </div>

            <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
              your LPG website,
              <span className="block text-teal-700">organized and modern</span>
            </h1>

            <p className="mt-3 text-lg sm:text-xl font-bold text-slate-900">
              product browsing for customers, clean workflows for staff
            </p>

            <p className="mt-4 text-sm text-slate-700/90 leading-relaxed max-w-xl">
              PIETYL helps LPG stores present products and services while keeping operations consistent.
              Show cylinder sizes, accept inquiries, track delivery services, and manage workflows behind the scenes.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onScrollTo?.("products")}
                className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm shadow-teal-600/25 hover:bg-teal-700 transition focus:outline-none focus:ring-4 focus:ring-teal-500/30"
              >
                View products
              </button>

              <button
                type="button"
                onClick={() => onScrollTo?.("contact")}
                className="inline-flex items-center justify-center rounded-xl border border-white/60 bg-white/45 px-5 py-3 text-sm font-extrabold text-teal-900 hover:bg-white/60 transition shadow-sm"
              >
                Contact us
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {[
                "refill and swap",
                "delivery tracking",
                "inventory ready",
                "staff roles",
              ].map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/60 border border-white/70 px-3 py-2 text-xs text-slate-800"
                >
                  <span className="text-teal-800 font-bold">✓</span> {t}
                </span>
              ))}
            </div>
          </GlassCard>

       
        </div>
      </div>
    </section>
  );
}
