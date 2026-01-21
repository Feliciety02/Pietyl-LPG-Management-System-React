import React, { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function ModalShell({
  open,
  onClose,
  children,

  maxWidthClass = "max-w-md",
  closeOnBackdrop = true,
  closeOnEsc = true,

  layout = "default", // default | login | compact

  showAccent = true,
  accentClass = "from-teal-500 via-cyan-500 to-emerald-500",

  header,
  title,
  subtitle,
  icon: Icon,
  showClose = true,

  bodyClassName,
  footer,
  footerClassName,
}) {
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e) {
      if (!closeOnEsc) return;
      if (e.key === "Escape") onClose?.();
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, closeOnEsc]);

  const shouldRenderHeader = useMemo(() => {
    if (layout === "login") return true;
    if (header) return true;
    if (title || subtitle || Icon) return true;
    return false;
  }, [layout, header, title, subtitle, Icon]);

  const resolvedHeaderPad = useMemo(() => {
    if (!shouldRenderHeader) return "";
    if (layout === "compact") return "p-6 pb-0";
    return "p-8 pb-0";
  }, [layout, shouldRenderHeader]);

  const resolvedBodyClass = useMemo(() => {
    if (bodyClassName) return bodyClassName;

    if (layout === "compact") {
      return shouldRenderHeader ? "p-6" : "p-6 pt-4";
    }

    if (layout === "login") {
      return "p-8";
    }

    return shouldRenderHeader ? "p-8" : "p-6";
  }, [bodyClassName, layout, shouldRenderHeader]);

  const resolvedFooterClass = useMemo(() => {
    if (footerClassName) return footerClassName;
    if (layout === "compact") return "px-6 pb-6 pt-0";
    return "px-8 pb-8 pt-0";
  }, [footerClassName, layout]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          {/* BACKDROP (must be behind the panel) */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (!closeOnBackdrop) return;
              if (e.target === e.currentTarget) onClose?.();
            }}
          />

          {/* PANEL */}
          <motion.div
            className={cx(
              "relative z-10 w-full",
              maxWidthClass,
              "rounded-3xl bg-white shadow-[0_26px_80px_-32px_rgba(15,23,42,0.55)] ring-1 ring-slate-900/10 overflow-hidden"
            )}
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.985 }}
            transition={{ duration: 0.18 }}
          >
            {showAccent ? (
              <div className={cx("h-1.5 w-full bg-gradient-to-r", accentClass)} />
            ) : null}

            {shouldRenderHeader ? (
              <div className={resolvedHeaderPad}>
                {header ? (
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">{header}</div>

                    {showClose ? (
                      <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-slate-900/10 text-slate-700 hover:bg-slate-50 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        {Icon ? (
                          <div className="h-10 w-10 rounded-2xl bg-teal-600/10 ring-1 ring-teal-700/10 text-teal-700 flex items-center justify-center">
                            <Icon className="h-5 w-5" />
                          </div>
                        ) : null}

                        <div className="min-w-0">
                          {title ? (
                            <div className="text-base font-extrabold text-slate-900 truncate">
                              {title}
                            </div>
                          ) : null}
                          {subtitle ? (
                            <div className="mt-0.5 text-xs text-slate-600/80">
                              {subtitle}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {showClose ? (
                      <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-slate-900/10 text-slate-700 hover:bg-slate-50 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            ) : showClose ? (
              <div className={layout === "compact" ? "p-4 pb-0" : "p-6 pb-0"}>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-slate-900/10 text-slate-700 hover:bg-slate-50 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}

            <div className={resolvedBodyClass}>{children}</div>

            {footer ? <div className={resolvedFooterClass}>{footer}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
