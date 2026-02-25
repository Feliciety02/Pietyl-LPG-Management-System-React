import React, { useState } from "react";
import { Check } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Stepper({
  steps = [],
  className = "",
  activeIndex,
  onStepChange,
  maxAccessibleIndex,
}) {
  const [internalIndex, setInternalIndex] = useState(0);
  const count = steps.length;
  const isControlled = Number.isFinite(activeIndex);
  const currentIndex = isControlled ? activeIndex : internalIndex;
  const safeIndex = count === 0 ? 0 : Math.min(Math.max(currentIndex, 0), count - 1);
  const maxAccessible = Number.isFinite(maxAccessibleIndex)
    ? Math.min(Math.max(maxAccessibleIndex, 0), count - 1)
    : safeIndex;

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
  const progressPct = count <= 1 ? 0 : (safeIndex / (count - 1)) * 100;

  return (
    <div className={cx("flex flex-col gap-5", className)}>
      <div className="sticky top-0 z-20 bg-slate-100/80 pb-3 backdrop-blur">
        <div className="relative px-2">
          <div className="absolute left-6 right-6 top-5 h-1 rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-teal-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-start justify-between gap-4 overflow-x-auto pb-2">
            {steps.map((step, index) => {
              const isActive = index === safeIndex;
              const isComplete = index < safeIndex;
              const isLocked = index > maxAccessible;

              return (
                <button
                  key={step.key ?? index}
                  type="button"
                  onClick={() => setIndex(index)}
                  disabled={isLocked}
                  className={cx(
                    "flex min-w-[120px] flex-col items-center gap-2 text-center transition",
                    isLocked ? "cursor-not-allowed opacity-50" : "hover:opacity-90"
                  )}
                >
                  <span
                    className={cx(
                      "flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-extrabold ring-2 transition",
                      isActive
                        ? "bg-teal-600 text-white ring-teal-300"
                        : isComplete
                        ? "bg-emerald-600 text-white ring-emerald-200"
                        : "bg-white text-slate-500 ring-slate-300"
                    )}
                  >
                    {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Step {index + 1}
                  </span>
                  <span
                    className={cx(
                      "text-xs font-extrabold",
                      isActive ? "text-teal-800" : "text-slate-600"
                    )}
                  >
                    {step.label || `Step ${index + 1}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-4">
        {steps[safeIndex]?.content}
      </div>

      {count > 1 ? (
        <div className="sticky bottom-0 z-20 bg-slate-100/80 pt-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200 shadow-sm">
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
        </div>
      ) : null}
    </div>
  );
}
