import React, { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import ModalShell from "../ModalShell";
import { Field, Textarea } from "../FormFields";
import { PurchaseSummary } from "@/components/modals/InventoryModals/PurchaseSummary";

export default function FinanceCloseModal({ open, onClose, purchase, loading = false, onClosePurchase }) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setNotes("");
  }, [open]);

  const handleClose = () => {
    if (loading) return;
    onClosePurchase?.(purchase, notes.trim() || null);
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Close purchase"
      subtitle="Finance can close the record once every obligation is settled."
      icon={CheckCircle2}
      maxWidthClass="max-w-lg"
      bodyClassName="grid gap-4"
      footerClassName="px-6 pb-6 pt-0"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">Next: closed</span>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-500/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Close purchase
          </button>
        </div>
      }
    >
      <PurchaseSummary purchase={purchase} />

      <Field label="Closing notes" hint="Optional closing memo">
        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          placeholder="Optional closing memo"
        />
      </Field>
    </ModalShell>
  );
}
