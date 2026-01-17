import React from "react";
import GlassCard from "./GlassCard";

export default function AboutSection() {
  return (
    <div>
      <div className="mb-6">
        <div className="text-xs font-extrabold text-teal-900">ABOUT</div>
        <h2 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">about PIETYL</h2>
        <p className="mt-2 text-sm text-slate-700/90 max-w-3xl">
          Built for local LPG businesses. Focused on clarity, speed, and reliable records.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <GlassCard className="p-7">
          <div className="text-sm font-extrabold text-slate-900">mission</div>
          <p className="mt-2 text-sm text-slate-700/90 leading-relaxed">
            Make LPG store operations cleaner and faster with tools staff can actually use.
          </p>
        </GlassCard>

        <GlassCard className="p-7">
          <div className="text-sm font-extrabold text-slate-900">vision</div>
          <p className="mt-2 text-sm text-slate-700/90 leading-relaxed">
            A scalable platform for single stores and future branches.
          </p>
        </GlassCard>

        <GlassCard className="p-7">
          <div className="text-sm font-extrabold text-slate-900">values</div>
          <div className="mt-3 text-sm text-slate-700/90">clarity</div>
          <div className="text-sm text-slate-700/90">accountability</div>
          <div className="text-sm text-slate-700/90">consistency</div>
        </GlassCard>
      </div>
    </div>
  );
}
