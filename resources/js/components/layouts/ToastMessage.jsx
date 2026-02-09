import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePage } from "@inertiajs/react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

const TONE_STYLES = {
  success: {
    icon: CheckCircle2,
    ring: "ring-emerald-300 border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  error: {
    icon: XCircle,
    ring: "ring-rose-300 border-rose-200 bg-rose-50 text-rose-900",
  },
  warning: {
    icon: Info,
    ring: "ring-amber-300 border-amber-200 bg-amber-50 text-amber-900",
  },
  info: {
    icon: Info,
    ring: "ring-slate-300 border-slate-200 bg-white text-slate-900",
  },
};

function extractErrorMessage(errors) {
  if (!errors) return "";
  if (typeof errors === "string") return errors;
  if (Array.isArray(errors) && errors.length) return String(errors[0]);
  if (typeof errors.message === "string" && errors.message) return errors.message;

  const entries = typeof errors === "object" ? Object.values(errors) : [];
  for (const entry of entries) {
    if (!entry) continue;
    if (typeof entry === "string") return entry;
    if (Array.isArray(entry) && entry.length) return String(entry[0]);
  }

  return "";
}

export default function ToastMessage() {
  const page = usePage();
  const flash = page.props?.flash || {};
  const errorMessage = useMemo(() => extractErrorMessage(page.props?.errors), [page.props?.errors]);

  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const pushToast = useCallback(
    (type, message) => {
      if (!message) return;
      const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      setToasts((prev) => [...prev, { id, type, message }]);

      timers.current[id] = setTimeout(() => {
        removeToast(id);
      }, 5200);
    },
    [removeToast]
  );

  useEffect(() => {
    if (flash.success) pushToast("success", flash.success);
    if (flash.error) pushToast("error", flash.error);
    if (flash.warning) pushToast("warning", flash.warning);
    if (flash.info) pushToast("info", flash.info);
  }, [flash.success, flash.error, flash.info, flash.warning, pushToast]);

  useEffect(() => {
    if (errorMessage) {
      pushToast("error", errorMessage);
    }
  }, [errorMessage, pushToast]);

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach((timeoutId) => clearTimeout(timeoutId));
      timers.current = {};
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-end px-4 py-6 sm:px-6">
      <div className="flex w-full max-w-sm flex-col items-end gap-3">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const meta = TONE_STYLES[toast.type] || TONE_STYLES.info;
            const Icon = meta.icon;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }}
                className={`pointer-events-auto w-full rounded-2xl border px-4 py-3 shadow-lg transition ${meta.ring}`}
                role="status"
                aria-live="polite"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 text-sm font-semibold leading-relaxed text-slate-900">
                    {toast.message}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeToast(toast.id)}
                    className="ml-auto text-slate-400 hover:text-slate-600 focus:text-slate-600 focus:outline-none"
                    aria-label="Dismiss notification"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
