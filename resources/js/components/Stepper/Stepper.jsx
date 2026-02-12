import React from "react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const STATE_STYLES = {
  complete: {
    bubble: "bg-emerald-600 text-white ring-emerald-600/20",
    line: "bg-emerald-200",
  },
  active: {
    bubble: "bg-teal-600 text-white ring-teal-600/20",
    line: "bg-teal-200",
  },
  upcoming: {
    bubble: "bg-white text-slate-700 ring-slate-200",
    line: "bg-slate-200",
  },
  neutral: {
    bubble: "bg-white text-slate-700 ring-slate-200",
    line: "bg-slate-200",
  },
};

export default function Stepper({ steps = [], className = "" }) {
  return (
    <div className={cx("space-y-6", className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const state = step.state || "neutral";
        const styles = STATE_STYLES[state] || STATE_STYLES.neutral;

        return (
          <div key={step.key ?? index} className="flex items-stretch gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cx(
                  "flex h-9 w-9 items-center justify-center rounded-2xl text-xs font-extrabold ring-1",
                  styles.bubble
                )}
              >
                {index + 1}
              </div>
              {!isLast ? <div className={cx("mt-2 w-px flex-1", styles.line)} /> : null}
            </div>

            <div className="min-w-0 flex-1">
              {step.label ? (
                <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                  {step.label}
                </div>
              ) : null}
              {step.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
