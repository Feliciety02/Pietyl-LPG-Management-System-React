import React from "react";
import { Link } from "@inertiajs/react";
import { MoreVertical } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

/* -------------------------------------------
   Table Action Button
------------------------------------------- */

export function TableActionButton({
  as = "button",
  href,
  icon: Icon,
  children,
  tone = "neutral", // neutral | primary | danger
  size = "sm", // sm | xs
  onClick,
  title,
  disabled = false,
  loading = false,
}) {
  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-xl select-none " +
    "transition will-change-transform " +
    "focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/20";

  const sizes = {
    xs: "px-2.5 py-1.5 text-[11px]",
    sm: "px-3 py-2 text-xs",
  };

  const tones = {
    neutral:
      "bg-white text-slate-700 ring-1 ring-slate-200 " +
      "hover:bg-teal-50 hover:ring-teal-200/60 " +
      "active:bg-teal-100/60",
    primary:
      "bg-teal-600 text-white ring-1 ring-teal-600 " +
      "hover:bg-teal-700 hover:ring-teal-700 " +
      "active:bg-teal-800",
    danger:
      "bg-white text-rose-700 ring-1 ring-rose-200 " +
      "hover:bg-rose-50 hover:ring-rose-300 " +
      "active:bg-rose-100/70",
  };

  const state = disabled || loading ? "opacity-50 pointer-events-none" : "";

  const press =
    disabled || loading
      ? ""
      : "hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.99]";

  const className = cx(base, sizes[size], tones[tone], press, state);

  const content = (
    <>
      {Icon ? (
        <Icon className={cx("h-4 w-4 shrink-0", loading && "opacity-0")} />
      ) : null}

      {children ? (
        <span className={cx("leading-none", loading && "opacity-0")}>
          {children}
        </span>
      ) : null}

      {loading ? (
        <span className="absolute h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
    </>
  );

  if (as === "link" && href) {
    return (
      <Link
        href={href}
        title={title}
        className={className}
        aria-disabled={disabled || loading}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled || loading}
      className={className}
    >
      {content}
    </button>
  );
}

/* -------------------------------------------
   Table Action Menu
------------------------------------------- */

export function TableActionMenu({
  onClick,
  disabled = false,
  title = "More actions",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-haspopup="menu"
      className={cx(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl " +
          "bg-white ring-1 ring-slate-200 text-slate-700 transition select-none " +
          "hover:bg-slate-50 hover:ring-slate-300 " +
          "active:bg-slate-100/70 active:scale-[0.99] " +
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/20",
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      <MoreVertical className="h-4 w-4" />
    </button>
  );
}
