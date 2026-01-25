import React, { useState } from "react";

export default function ConfirmDeliveryModal({ open, onClose, item, onSubmit }) {
  if (!open || !item) return null;

  const [received, setReceived] = useState(item.qty || 0);
  const [damaged, setDamaged] = useState(0);
  const [missing, setMissing] = useState(0);
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
        <div className="text-lg font-extrabold text-slate-900">
          Confirm delivery
        </div>

        <div className="mt-1 text-sm text-slate-600">
          {item.product_name} ({item.variant})
        </div>

        <div className="mt-6 grid gap-4">
          <input
            type="number"
            className="w-full rounded-xl border px-4 py-2"
            value={received}
            onChange={(e) => setReceived(e.target.value)}
            placeholder="Received qty"
          />

          <input
            type="number"
            className="w-full rounded-xl border px-4 py-2"
            value={damaged}
            onChange={(e) => setDamaged(e.target.value)}
            placeholder="Damaged qty"
          />

          <input
            type="number"
            className="w-full rounded-xl border px-4 py-2"
            value={missing}
            onChange={(e) => setMissing(e.target.value)}
            placeholder="Missing qty"
          />

          <textarea
            className="w-full rounded-xl border px-4 py-2"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600"
          >
            Cancel
          </button>

          <button
            onClick={() =>
              onSubmit({
                received_qty: received,
                damaged_qty: damaged,
                missing_qty: missing,
                notes,
              })
            }
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700"
          >
            Confirm & update stock
          </button>
        </div>
      </div>
    </div>
  );
}
