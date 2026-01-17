import React from "react";
import { Building2, Target, Eye, ShieldCheck } from "lucide-react";
import GlassCard from "../../components/ui/GlassCard";

function StatBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-white/80 px-3 py-1.5 text-[11px] font-extrabold tracking-wide text-slate-800">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-teal-600/10 border border-teal-600/15">
        <Building2 className="h-3.5 w-3.5 text-teal-700" />
      </span>
      LPG OPERATIONS PLATFORM
    </div>
  );
}

function CardTitle({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/65 border border-white/80">
        <Icon className="h-4.5 w-4.5 text-teal-700" />
      </span>
      {label}
    </div>
  );
}

export default function AboutSection() {
  return (
    <section id="about" className="relative overflow-hidden">
      {/* calm, centered background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-50 via-white to-teal-50/60" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent" />

      <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
        {/* centered header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-white/70 border border-white/80 px-4 py-2 text-xs font-extrabold tracking-[0.18em] text-teal-900">
            ABOUT US
          </div>

          <h2 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            built for LPG stores,
            <span className="block text-teal-900">designed for clarity</span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-700/90 leading-relaxed">
            PIETYL supports local LPG businesses with clear processes, faster service, and reliable records that
            help teams operate with confidence.
          </p>

          <div className="mt-6 flex justify-center">
            <StatBadge />
          </div>
        </div>

        {/* centered cards */}
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <GlassCard className="p-7 sm:p-8 text-center hover:-translate-y-0.5 transition-transform">
            <div className="flex justify-center">
              <CardTitle icon={Target} label="Mission" />
            </div>
            <p className="mt-3 text-sm text-slate-700/90 leading-relaxed">
              Simplify daily LPG store operations through practical tools that staff can use consistently.
            </p>
          </GlassCard>

          <GlassCard className="p-7 sm:p-8 text-center hover:-translate-y-0.5 transition-transform">
            <div className="flex justify-center">
              <CardTitle icon={Eye} label="Vision" />
            </div>
            <p className="mt-3 text-sm text-slate-700/90 leading-relaxed">
              Enable scalable operations for single stores today and multiple branches in the future.
            </p>
          </GlassCard>

          <GlassCard className="p-7 sm:p-8 text-center hover:-translate-y-0.5 transition-transform">
            <div className="flex justify-center">
              <CardTitle icon={ShieldCheck} label="Values" />
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {["Clarity", "Accountability", "Consistency"].map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center rounded-full bg-white/70 border border-white/80 px-3 py-1.5 text-xs font-semibold text-slate-800"
                >
                  {v}
                </span>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
