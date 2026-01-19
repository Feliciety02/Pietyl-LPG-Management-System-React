// resources/js/components/ui/ModalShell.jsx
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
          <button
            type="button"
            aria-label="Close modal backdrop"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => {
              if (closeOnBackdrop) onClose?.();
            }}
          />

          <motion.div
            className={cx(
              "relative w-full",
              maxWidthClass,
              "rounded-3xl bg-white shadow-[0_26px_80px_-32px_rgba(15,23,42,0.55)] ring-1 ring-slate-900/10 overflow-hidden"
            )}
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.985 }}
            transition={{ duration: 0.18 }}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
