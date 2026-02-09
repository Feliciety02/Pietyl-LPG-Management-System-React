import React from "react";

export function Field({ label, hint, required = false, children }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="text-xs font-extrabold text-slate-700">{label}</div>
        {required ? <div className="text-[11px] font-semibold text-slate-400">required</div> : null}
      </div>
      {hint ? <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div> : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function Textarea({ className = "", ...props }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-teal-500/30">
      <textarea
        {...props}
        className={`w-full resize-y bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 ${className}`}
      />
    </div>
  );
}

export function Input({ className = "", ...props }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-teal-500/30">
      <input
        {...props}
        className={`w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 ${className}`}
      />
    </div>
  );
}
