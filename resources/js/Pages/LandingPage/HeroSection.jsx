import React from "react";
import { Link } from "@inertiajs/react";
import GlassCard from "../../components/ui/GlassCard";

export default function HeroSection({ onScrollTo }) {
  return (
    <div className="grid lg:grid-cols-2 gap-8 items-stretch">
      <GlassCard className="p-8 sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/60 border border-white/70 px-4 py-2 text-xs font-bold text-teal-950/80">
          <span className="h-2 w-2 rounded-full bg-teal-600" />
          PIETYL LPG STORE WEBSITE
        </div>

        <h1 className="mt-5 text-5xl font-extrabold tracking-tight text-slate-900">
          your LPG website, organized and modern
        </h1>

        <p className="mt-3 text-xl font-bold text-slate-900">
          product browsing for customers, clean workflows for staff
        </p>

        <p className="mt-4 text-sm text-slate-700/90 leading-relaxed max-w-xl">
          PIETYL helps LPG stores present products and services while keeping operations consistent.
          You can show cylinder sizes, accept inquiries, track delivery services, and manage store workflows behind the scenes.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onScrollTo("products")}
            className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm shadow-teal-600/25 hover:bg-teal-700 transition focus:outline-none focus:ring-4 focus:ring-teal-500/30"
          >
            View products
          </button>

          <button
            type="button"
            onClick={() => onScrollTo("contact")}
            className="inline-flex items-center justify-center rounded-xl border border-white/60 bg-white/45 px-5 py-3 text-sm font-extrabold text-teal-900 hover:bg-white/60 transition shadow-sm"
          >
            Contact us
          </button>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/60 border border-white/70 px-3 py-2 text-xs text-slate-800">
            <span className="text-teal-800 font-bold">✓</span> refill and swap
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/60 border border-white/70 px-3 py-2 text-xs text-slate-800">
            <span className="text-teal-800 font-bold">✓</span> delivery tracking
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/60 border border-white/70 px-3 py-2 text-xs text-slate-800">
            <span className="text-teal-800 font-bold">✓</span> inventory ready
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/60 border border-white/70 px-3 py-2 text-xs text-slate-800">
            <span className="text-teal-800 font-bold">✓</span> staff roles
          </span>
        </div>
      </GlassCard>

      <GlassCard className="p-8 sm:p-10">
        <div className="text-sm font-extrabold text-slate-900">Featured today</div>
        <p className="mt-2 text-sm text-slate-700/90 leading-relaxed">
          Highlight your best sellers and services on the homepage. These are sample feature tiles you can connect to real data later.
        </p>

        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/55 border border-white/70 p-4">
            <div className="text-sm font-extrabold text-slate-900">11 kg cylinder</div>
            <div className="mt-1 text-xs text-slate-700/90">household standard</div>
          </div>
          <div className="rounded-2xl bg-white/55 border border-white/70 p-4">
            <div className="text-sm font-extrabold text-slate-900">2.7 kg cylinder</div>
            <div className="mt-1 text-xs text-slate-700/90">portable refill</div>
          </div>
          <div className="rounded-2xl bg-white/55 border border-white/70 p-4">
            <div className="text-sm font-extrabold text-slate-900">delivery service</div>
            <div className="mt-1 text-xs text-slate-700/90">coverage and notes</div>
          </div>
          <div className="rounded-2xl bg-white/55 border border-white/70 p-4">
            <div className="text-sm font-extrabold text-slate-900">accessories</div>
            <div className="mt-1 text-xs text-slate-700/90">regulators and hoses</div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
