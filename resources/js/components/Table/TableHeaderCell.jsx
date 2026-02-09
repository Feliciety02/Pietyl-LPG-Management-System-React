import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function TableHeaderCell({
  label = "",
  children,
  sortable = false,
  sortKey,
  activeSortKey,
  sortDir,
  onSort,
  className = "",
  buttonClassName = "",
  iconClassName = "",
  contentClassName = "",
  ariaLabel,
  ...rest
}) {
  const interactive = Boolean(sortable && sortKey && typeof onSort === "function");
  const isActive = interactive && activeSortKey === sortKey;
  const direction = isActive ? sortDir : null;

  const inner = (
    <span className={cx("flex items-center gap-1.5 justify-between", contentClassName)}>
      <span className="truncate font-semibold">{children ?? label}</span>
      {sortable && (
        <span
          className={cx(
            "flex flex-col leading-none transition",
            isActive ? "opacity-100 text-slate-700" : "opacity-40",
            iconClassName
          )}
        >
          <ChevronUp
            className={cx(
              "h-3 w-3",
              direction === "asc" && "opacity-100 text-slate-700",
              direction !== "asc" && "opacity-40"
            )}
          />
          <ChevronDown
            className={cx(
              "h-3 w-3 -mt-1",
              direction === "desc" && "opacity-100 text-slate-700",
              direction !== "desc" && "opacity-40"
            )}
          />
        </span>
      )}
    </span>
  );

  const handleClick = () => {
    if (!interactive) return;
    onSort(sortKey);
  };

  return (
    <th
      {...rest}
      className={cx(
        "px-4 py-3 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500",
        className
      )}
    >
      {interactive ? (
        <button
          type="button"
          onClick={handleClick}
          aria-label={ariaLabel || label}
          className={cx(
            "flex w-full items-center justify-between text-left focus:outline-none transition",
            buttonClassName,
            interactive ? "cursor-pointer text-slate-500 hover:text-slate-800" : ""
          )}
        >
          {inner}
        </button>
      ) : (
        <div className="flex w-full items-center justify-between text-slate-500">{inner}</div>
      )}
    </th>
  );
}
