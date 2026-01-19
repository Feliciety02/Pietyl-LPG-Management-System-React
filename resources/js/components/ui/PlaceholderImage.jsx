import React from "react";

export default function PlaceholderImage({ label = "IMAGE", className = "" }) {
  return (
    <div
      className={
        "flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 font-extrabold text-xs uppercase tracking-wider " +
        className
      }
    >
      {label}
    </div>
  );
}