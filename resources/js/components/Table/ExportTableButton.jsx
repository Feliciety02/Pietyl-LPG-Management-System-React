import React from "react";
import { Download } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const SIZE_CLASSES = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

const VARIANT_CLASSES = {
  outline:
    "border border-slate-200 bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 focus:ring-teal-500/15",
  teal:
    "border border-teal-600 bg-teal-600 text-white ring-1 ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25",
};

export default function ExportTableButton({
  href,
  onClick,
  children,
  className = "",
  size = "md",
  disabled = false,
  variant = "outline",
  icon: Icon = Download,
  showIcon = false,
  ...rest
}) {
  const Element = href ? "a" : "button";
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.outline;
  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  const sharedProps = {
    className: cx(
      "inline-flex items-center gap-2 rounded-2xl font-extrabold transition focus:outline-none focus:ring-4",
      variantClass,
      sizeClass,
      disabled &&
        (variant === "teal"
          ? "cursor-not-allowed opacity-60"
          : "cursor-not-allowed opacity-60 hover:bg-white"),
      className
    ),
    onClick: (event) => {
      if (disabled) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    },
    "aria-disabled": disabled || undefined,
    ...rest,
  };

  if (href) {
    return (
      <Element href={href} {...sharedProps}>
        {showIcon && Icon ? (
          <Icon className={cx(iconClass, variant === "teal" ? "text-white" : "text-slate-600")} />
        ) : null}
        {children}
      </Element>
    );
  }

  return (
    <Element type="button" {...sharedProps}>
      {showIcon && Icon ? (
        <Icon className={cx(iconClass, variant === "teal" ? "text-white" : "text-slate-600")} />
      ) : null}
      {children}
    </Element>
  );
}
