import React from "react";
import GlassCard from "../../components/ui/GlassCard";
import PlaceholderImage from "../../components/ui/PlaceholderImage";

export default function CategoriesSection({ onScrollTo }) {
  const categories = [
    { title: "Cylinders", desc: "Available sizes and variants for households and business use.", go: "products", label: "CYLINDERS" },
    { title: "Refill and Swap", desc: "Refill, swap, deposits, and returns with consistent records.", go: "services", label: "REFILL" },
    { title: "Delivery", desc: "Coverage zones, rider assignment, and status tracking.", go: "services", label: "DELIVERY" },
    { title: "Accessories", desc: "Regulators, hoses, and essential installation items.", go: "products", label: "ACCESSORIES" },
  ];

  return (
    <section id="categories" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-50 via-white to-teal-50/60" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent" />

      <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
        {/* centered header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-white/70 border border-white/80 px-4 py-2 text-xs font-extrabold tracking-[0.18em] text-teal-900">
            SHOP BY
          </div>

          <h2 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            categories
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-700/90 leading-relaxed">
            Browse common LPG items and workflows with quick access to the sections you need.
          </p>

        </div>

        {/* cards */}
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((c) => (
            <button
              key={c.title}
              type="button"
              onClick={() => onScrollTo?.(c.go)}
              className="text-left rounded-3xl focus:outline-none focus:ring-4 focus:ring-teal-500/25"
            >
              <GlassCard className="p-6 sm:p-7 overflow-hidden group hover:-translate-y-0.5 transition-transform">
                {/* image */}
                <div className="relative rounded-2xl overflow-hidden border border-white/70 bg-white/40">
                  <PlaceholderImage
                    label={c.label}
                    className="h-28 w-full"
                  />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-teal-500/10 via-transparent to-cyan-500/10" />
                </div>

                {/* content */}
                <div className="mt-4">
                  <div className="text-base font-extrabold tracking-tight text-slate-900">
                    {c.title}
                  </div>
                  <p className="mt-2 text-sm text-slate-700/90 leading-relaxed">
                    {c.desc}
                  </p>

                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-teal-900">
                    explore
                    <span className="transition-transform group-hover:translate-x-0.5">→</span>
                  </div>
                </div>
              </GlassCard>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
