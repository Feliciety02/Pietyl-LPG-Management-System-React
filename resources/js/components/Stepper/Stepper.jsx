import React, { useState } from "react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const STATE_STYLES = {
  complete: {
    bubble: "bg-teal-600 text-white ring-teal-600/20",
    line: "bg-teal-200",
  },
  active: {
    bubble: "bg-teal-600 text-white ring-teal-600/20",
    line: "bg-teal-200",
  },
  upcoming: {
    bubble: "bg-white text-teal-700 ring-teal-200",
    line: "bg-teal-200",
  },
  neutral: {
    bubble: "bg-white text-teal-700 ring-teal-200",
    line: "bg-teal-200",
  },
};

export default function Stepper({
  steps = [],
  className = "",
  activeIndex,
  onStepChange,
}) {
  const [internalIndex, setInternalIndex] = useState(0);
  const count = steps.length;
  const isControlled = Number.isFinite(activeIndex);
  const currentIndex = isControlled ? activeIndex : internalIndex;
  const safeIndex = count === 0 ? 0 : Math.min(Math.max(currentIndex, 0), count - 1);

  function setIndex(next) {
    if (next < 0 || next >= count) return;
    if (onStepChange) {
      onStepChange(next);
    }
    if (!isControlled) {
      setInternalIndex(next);
    }
  }

  if (count === 0) return null;

  return (
    <div className={cx("space-y-4", className)}>
      {count > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          {steps.map((step, index) => {
            const state =
              index < safeIndex ? "complete" : index === safeIndex ? "active" : "upcoming";
            const styles = STATE_STYLES[state] || STATE_STYLES.neutral;
            const isActive = index === safeIndex;

            return (
              <button
                key={step.key ?? index}
                type="button"
                onClick={() => setIndex(index)}
                className={cx(
                  "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold ring-1 transition",
                  isActive
                    ? "bg-teal-700 text-white ring-teal-700"
                    : index < safeIndex
                    ? "bg-teal-50 text-teal-800 ring-teal-200 hover:bg-teal-100"
                    : "bg-white text-teal-700 ring-teal-200 hover:bg-teal-50"
                )}
              >
                <span
                  className={cx(
                    "flex h-6 w-6 items-center justify-center rounded-xl text-[11px] font-extrabold ring-1",
                    styles.bubble
                  )}
                >
                  {index + 1}
                </span>
                <span className="truncate">{step.label || `Step ${index + 1}`}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div>{steps[safeIndex]?.content}</div>

      {count > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIndex(safeIndex - 1)}
            disabled={safeIndex === 0}
            className={cx(
              "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold ring-1 transition",
              safeIndex === 0
                ? "bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed"
                : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
            )}
          >
            Back
          </button>
          <div className="text-xs font-extrabold text-slate-500">
            Step {safeIndex + 1} of {count}
          </div>
          <button
            type="button"
            onClick={() => setIndex(safeIndex + 1)}
            disabled={safeIndex >= count - 1}
            className={cx(
              "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold ring-1 transition",
              safeIndex >= count - 1
                ? "bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed"
                : "bg-teal-600 text-white ring-teal-700/10 hover:bg-teal-700"
            )}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
