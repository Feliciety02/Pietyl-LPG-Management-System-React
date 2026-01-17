import React from "react";
import GlassCard from "./GlassCard";

export default function CategoriesSection({ onScrollTo }) {
  const categories = [
    { title: "Cylinders", desc: "sizes and variants", go: "products" },
    { title: "Refill and Swap", desc: "transactions and returns", go: "services" },
    { title: "Delivery", desc: "coverage and riders", go: "services" },
    { title: "Accessories", desc: "regulators and hoses", go: "products" },
  ];

  return (
    <div>
      <div className="flex items-end justify-between gap-6 mb-6">
        <div>
          <div className="text-xs font-extrabold text-teal-900">SHOP BY</div>
          <h2 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">categories</h2>
        </div>
        <button
          type="button"
          onClick={() => onScrollTo("products")}
          className="text-sm font-extrabold text-teal-900 hover:text-teal-950 transition"
        >
          view all
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {categories.map((c) => (
          <button key={c.title} type="button" onClick={() => onScrollTo(c.go)} className="text-left">
            <GlassCard className="p-6 hover:bg-white/30 transition">
              <div className="text-sm font-extrabold text-slate-900">{c.title}</div>
              <div className="mt-2 text-xs text-slate-700/90">{c.desc}</div>
              <div className="mt-4 text-xs font-extrabold text-teal-900">explore</div>
            </GlassCard>
          </button>
        ))}
      </div>
    </div>
  );
}
