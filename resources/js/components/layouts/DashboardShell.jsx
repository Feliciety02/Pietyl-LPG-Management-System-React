import React from "react";
import GlassCard from "../components/ui/GlassCard";

export default function DashboardShell({ sidebar, title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/60">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          <aside className="lg:sticky lg:top-6 h-fit">{sidebar}</aside>

          <main>
            <GlassCard className="p-6 sm:p-8">
              <div className="mb-6">
                <div className="text-xs font-extrabold tracking-[0.18em] text-teal-900">
                  DASHBOARD
                </div>
                <div className="mt-2 text-2xl font-extrabold text-slate-900">
                  {title}
                </div>
                {subtitle ? (
                  <div className="mt-1 text-sm text-slate-700/80">{subtitle}</div>
                ) : null}
              </div>

              {children}
            </GlassCard>
          </main>
        </div>
      </div>
    </div>
  );
}
