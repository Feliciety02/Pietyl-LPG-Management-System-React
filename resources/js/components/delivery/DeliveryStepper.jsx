import React from "react";
import { Check } from "lucide-react";
import { cx } from "./DeliveryShared";

export default function DeliveryStepper({
  steps = [],
  activeStep = 0,
  maxAccessibleStep = 0,
  onStepChange,
  onBack,
  onNext,
  onFinish,
  nextDisabled,
  finishDisabled,
  stepError,
  hideControls = false,
}) {
  const total = steps.length;
  const isLast = activeStep === total - 1;

  function canGoTo(index) {
    return index <= maxAccessibleStep;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {steps.map((step, idx) => {
            const isActive = idx === activeStep;
            const isComplete = Boolean(step.isComplete);
            const clickable = canGoTo(idx);

            return (
              <button
                key={step.key || idx}
                type="button"
                onClick={() => clickable && onStepChange?.(idx)}
                disabled={!clickable}
                className={cx(
                  "flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold ring-1 transition whitespace-nowrap",
                  isActive
                    ? "bg-teal-600 text-white ring-teal-600"
                    : isComplete
                    ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                    : "bg-white text-slate-500 ring-slate-200",
                  !clickable && !isActive ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50"
                )}
              >
                <span
                  className={cx(
                    "inline-flex h-6 w-6 items-center justify-center rounded-xl text-[11px] font-extrabold ring-1",
                    isActive
                      ? "bg-white/20 text-white ring-white/30"
                      : isComplete
                      ? "bg-emerald-600 text-white ring-emerald-600/20"
                      : "bg-white text-slate-600 ring-slate-200"
                  )}
                >
                  {isComplete ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                </span>
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>{steps[activeStep]?.content}</div>

      {!hideControls ? (
        <>
          {stepError ? (
            <div className="rounded-2xl bg-rose-50 ring-1 ring-rose-200 px-4 py-3 text-sm font-semibold text-rose-700">
              {stepError}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <div>
              {activeStep > 0 ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Back
                </button>
              ) : null}
            </div>

            <div>
              {!isLast ? (
                <button
                  type="button"
                  onClick={onNext}
                  disabled={nextDisabled}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold ring-1 transition",
                    nextDisabled
                      ? "bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed"
                      : "bg-teal-600 text-white ring-teal-600 hover:bg-teal-700"
                  )}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onFinish}
                  disabled={finishDisabled}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold ring-1 transition",
                    finishDisabled
                      ? "bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed"
                      : "bg-emerald-600 text-white ring-emerald-600 hover:bg-emerald-700"
                  )}
                >
                  Finish
                </button>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
