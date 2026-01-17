import React from "react";
import GlassCard from "./GlassCard";

export default function ServicesSection() {
  const services = [
    {
      title: "refill and swap",
      desc: "Track refill, swap, deposit, and returns with consistent records.",
      bullets: ["deposit tracking", "return history", "customer notes"],
    },
    {
      title: "delivery operations",
      desc: "Manage coverage zones, rider assignment, and delivery status updates.",
      bullets: ["delivery zones", "status updates", "rider assignment"],
    },
    {
      title: "inventory and reporting",
      desc: "Know what is available, what is moving, and what needs replenishment.",
      bullets: ["stock counts", "movement logs", "low stock readiness"],
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs font-extrabold text-teal-900">SERVICES</div>
        <h2 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">what we offer</h2>
        <p className="mt-2 text-sm text-slate-700/90 max-w-3xl">
          Designed for LPG store workflows. Everything stays consistent across staff shifts.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {services.map((s) => (
          <GlassCard key={s.title} className="p-7">
            <div className="text-sm font-extrabold text-slate-900">{s.title}</div>
            <p className="mt-2 text-sm text-slate-700/90 leading-relaxed">{s.desc}</p>
            <div className="mt-4 flex flex-col gap-2">
              {s.bullets.map((b) => (
                <div key={b} className="text-xs text-slate-700/90">
                  <span className="text-teal-800 font-bold">✓</span> {b}
                </div>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <GlassCard className="p-7 sm:p-8">
          <div className="text-sm font-extrabold text-slate-900">brands are configurable</div>
          <p className="mt-2 text-sm text-slate-700/90 leading-relaxed">
            Add brands your store carries such as Petron Gasul, Phoenix Super LPG, Solane, or local suppliers.
            These are configurable catalog entries, not an affiliation.
          </p>
        </GlassCard>

        <GlassCard className="p-7 sm:p-8">
          <div className="text-sm font-extrabold text-slate-900">roles and audit logs</div>
          <p className="mt-2 text-sm text-slate-700/90 leading-relaxed">
            Employee linked accounts, role based screens, and clean records for accountability.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
