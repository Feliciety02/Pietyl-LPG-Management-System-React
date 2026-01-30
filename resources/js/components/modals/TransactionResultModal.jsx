import React, { useEffect, useMemo } from "react";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function TransactionResultModal({
  open,
  onClose,
  status = "success", // "success" | "error" | "warning"
  title,
  message,
  primaryLabel = "OK",
  onPrimary,
  secondaryLabel,
  onSecondary,
  icon: IconProp,
  autoCloseSeconds = 5,
}) {
  const isSuccess = status === "success";
  const isError = status === "error";

  const Icon = useMemo(() => {
    return IconProp || (isSuccess ? CheckCircle2 : isError ? XCircle : AlertTriangle);
  }, [IconProp, isSuccess, isError]);

  const headerTitle =
    title || (isSuccess ? "Transaction successful" : isError ? "Transaction failed" : "Transaction status");

  const bodyMessage =
    message ||
    (isSuccess
      ? "Your transaction was recorded successfully."
      : isError
        ? "Something went wrong. Please review the details and try again."
        : "Please check the details and continue.");

  const accent = isSuccess ? "text-teal-700" : isError ? "text-rose-700" : "text-amber-700";

  const badgeBg = isSuccess
    ? "bg-teal-600/10 ring-teal-700/10 text-teal-900"
    : isError
      ? "bg-rose-600/10 ring-rose-700/10 text-rose-900"
      : "bg-amber-600/10 ring-amber-700/10 text-amber-900";

  const primaryBtn = isSuccess
    ? "bg-teal-600 text-white ring-teal-600 hover:bg-teal-700"
    : isError
      ? "bg-rose-600 text-white ring-rose-600 hover:bg-rose-700"
      : "bg-amber-600 text-white ring-amber-600 hover:bg-amber-700";

  const progressBg = isSuccess ? "bg-teal-600" : isError ? "bg-rose-600" : "bg-amber-600";

  // Auto close after N seconds whenever modal opens
  useEffect(() => {
    if (!open) return;

    const ms = Math.max(0, Number(autoCloseSeconds || 0)) * 1000;
    if (!ms) return;

    const t = window.setTimeout(() => onClose?.(), ms);
    return () => window.clearTimeout(t);
  }, [open, onClose, autoCloseSeconds]);

  // Escape closes too (optional, still nice)
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Overlay: click anywhere to close before 5 seconds */}
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 animate-[fadeIn_180ms_ease-out]"
        onClick={() => onClose?.()}
        aria-label="Close modal overlay"
      />

      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        {/* Card enters with pop animation */}
        <div className="w-full max-w-md pointer-events-auto rounded-3xl bg-white ring-1 ring-slate-200 shadow-xl overflow-hidden animate-[popIn_220ms_cubic-bezier(.2,.9,.2,1)]">
          {/* Auto close progress bar */}
          <div className="h-1 bg-slate-100">
            <div
              className={cx("h-full", progressBg, "animate-[shrinkWidth_var(--t)_linear_forwards]")}
              style={{ ["--t"]: `${Math.max(0, Number(autoCloseSeconds || 0))}s` }}
            />
          </div>

          <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className={cx("inline-flex items-center justify-center h-10 w-10 rounded-2xl ring-1", badgeBg)}>
                <Icon className={cx("h-5 w-5", accent, "animate-[iconPop_280ms_ease-out]")} />
              </span>

              <div className="min-w-0">
                <div className="text-sm font-extrabold text-slate-800 truncate">{headerTitle}</div>
                <div className="mt-1 text-xs text-slate-500">
                  Auto closes in {Math.max(0, Number(autoCloseSeconds || 0))}s, tap anywhere to close now
                </div>
              </div>
            </div>

            {/* Removed X button as requested */}
          </div>

          <div className="p-5">
            <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4 animate-[fadeUp_220ms_ease-out]">
              <div className="text-sm font-semibold text-slate-700 leading-relaxed">{bodyMessage}</div>
            </div>

            {(secondaryLabel || primaryLabel) ? (
              <div className="mt-5 flex items-center justify-end gap-2 animate-[fadeUp_260ms_ease-out]">
                {secondaryLabel ? (
                  <button
                    type="button"
                    onClick={() => onSecondary?.()}
                    className="inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-extrabold ring-1 ring-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  >
                    {secondaryLabel}
                  </button>
                ) : null}

                {primaryLabel ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (onPrimary) return onPrimary();
                      onClose?.();
                    }}
                    className={cx(
                      "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-extrabold ring-1 transition focus:outline-none focus:ring-4",
                      primaryBtn,
                      isSuccess ? "focus:ring-teal-500/25" : isError ? "focus:ring-rose-500/25" : "focus:ring-amber-500/25"
                    )}
                  >
                    {primaryLabel}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Local keyframes for smooth animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes popIn {
          0% { opacity: 0; transform: translateY(10px) scale(.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes iconPop {
          0% { transform: scale(.7) rotate(-6deg); opacity: 0; }
          60% { transform: scale(1.08) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }

        /* Progress bar shrinks from full width to 0 */
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
