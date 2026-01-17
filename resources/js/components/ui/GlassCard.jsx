import React from "react";

export default function GlassCard({ children, className = "" }) {
  return (
    <div
      className={
        "relative rounded-2xl border border-white/60 bg-white/22 backdrop-blur-2xl backdrop-saturate-150 " +
        "shadow-[0_18px_55px_-28px_rgba(15,23,42,0.45)] overflow-hidden " +
        className
      }
    >
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent" />
      <div aria-hidden="true" className="absolute inset-0 ring-1 ring-teal-500/10 rounded-2xl" />
      <div className="relative">{children}</div>
    </div>
  );
}
