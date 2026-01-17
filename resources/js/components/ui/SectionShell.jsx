import React from "react";

const BG = {
  products: "bg-gradient-to-br from-white via-teal-50/60 to-cyan-50/70",
  categories: "bg-gradient-to-br from-slate-50 via-white to-teal-50/70",
  services: "bg-gradient-to-br from-cyan-50/60 via-white to-teal-50/60",
  about: "bg-gradient-to-br from-white via-slate-50 to-cyan-50/50",
  contact: "bg-gradient-to-br from-teal-50/70 via-white to-slate-50",
};

export default function SectionShell({
  id,
  variant = "hero",
  children,
  className = "",
}) {
  return (
    <section id={id} className={`relative ${BG[variant]} ${className}`}>
      <div className="max-w-6xl mx-auto px-6 py-14">{children}</div>
    </section>
  );
}
