import React from "react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function SkeletonLine({ w = "w-28", h = "h-3", rounded = "rounded-full", className = "" }) {
  return (
    <div
      className={cx(
        h,
        w,
        rounded,
        "bg-slate-200/80 animate-pulse",
        className
      )}
    />
  );
}

export function SkeletonPill({ w = "w-20", h = "h-8", className = "" }) {
  return (
    <div
      className={cx(
        h,
        w,
        "rounded-full bg-slate-200/80 animate-pulse",
        className
      )}
    />
  );
}

export function SkeletonButton({ w = "w-24", h = "h-9", className = "" }) {
  return (
    <div
      className={cx(
        h,
        w,
        "rounded-2xl bg-slate-200/80 animate-pulse",
        className
      )}
    />
  );
}
