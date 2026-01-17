import React from "react";
import GlassCard from "./GlassCard";

export default function FeaturedProductsSection({ onScrollTo }) {
  const items = [
    { title: "LPG Cylinder 11 kg", tag: "Most common", desc: "Refill, swap, or delivery." },
    { title: "LPG Cylinder 5 kg", tag: "Quick pickup", desc: "Mid size option for households." },
    { title: "LPG Cylinder 2.7 kg", tag: "Portable", desc: "Compact and convenient refill." },
    { title: "Regulator", tag: "Accessory", desc: "Safety and replacement accessory." },
    { title: "Hose and clamps", tag: "Accessory", desc: "For installation and replacement." },
  ];

  return (
    <div>
      <div className="flex items-end justify-between gap-6 mb-6">
        <div>
          <div className="text-xs font-extrabold text-teal-900">FEATURED</div>
          <h2 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">products</h2>
          <p className="mt-2 text-sm text-slate-700/90 max-w-3xl">
            Sample product cards. Replace names and prices with your store catalog later.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onScrollTo("contact")}
          className="text-sm font-extrabold text-teal-900 hover:text-teal-950 transition"
        >
          request pricing
        </button>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory">
        {items.map((p) => (
          <div key={p.title} className="min-w-[280px] sm:min-w-[340px] snap-start">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-extrabold text-slate-900">{p.title}</div>
                <span className="text-xs font-bold text-teal-900 bg-white/60 border border-white/70 rounded-full px-3 py-1">
                  {p.tag}
                </span>
              </div>

              <p className="mt-3 text-xs text-slate-700/90 leading-relaxed">{p.desc}</p>

              <div className="mt-5 rounded-xl bg-white/55 border border-white/70 p-4">
                <div className="text-xs text-slate-700/90">sample price</div>
                <div className="text-lg font-extrabold text-slate-900">₱ 00.00</div>
                <div className="mt-1 text-xs text-slate-700/90">final depends on store rate</div>
              </div>

              <button
                type="button"
                onClick={() => onScrollTo("contact")}
                className="mt-5 w-full inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm shadow-teal-600/25 hover:bg-teal-700 transition focus:outline-none focus:ring-4 focus:ring-teal-500/30"
              >
                inquire
              </button>
            </GlassCard>
          </div>
        ))}
      </div>
    </div>
  );
}
