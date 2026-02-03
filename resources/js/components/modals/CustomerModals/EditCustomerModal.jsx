
import React, { useEffect, useMemo, useState } from "react";
import { UserRound, Phone, MapPin, StickyNote } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="text-xs font-extrabold text-slate-700">{label}</div>
      {hint ? <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div> : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Input({ icon: Icon, ...props }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-teal-500/30">
      {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
      <input
        {...props}
        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}

function Textarea({ icon: Icon, ...props }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-teal-500/30">
      <div className="flex items-start gap-2">
        {Icon ? <Icon className="mt-0.5 h-4 w-4 text-slate-500" /> : null}
        <textarea
          {...props}
          className="min-h-[88px] w-full resize-none bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

export default function EditCustomerModal({ open, onClose, customer, onSave }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [localError, setLocalError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(customer?.name || "");
    setPhone(customer?.phone || "");
    setAddress(customer?.address || "");
    setNotes(customer?.notes || "");
    setLocalError("");
    setSaving(false);
  }, [open, customer]);

  const phoneClean = useMemo(() => String(phone || "").replace(/\s+/g, ""), [phone]);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (phoneClean && !/^(\+?63|0)\d{10}$/.test(phoneClean)) return false;
    return true;
  }, [name, phoneClean]);

  const submit = async () => {
    if (!name.trim()) {
      setLocalError("Full name is required.");
      return;
    }
    if (phoneClean && !/^(\+?63|0)\d{10}$/.test(phoneClean)) {
      setLocalError("Mobile number looks invalid. Use 09XXXXXXXXX or +63XXXXXXXXXX.");
      return;
    }

    setLocalError("");
    setSaving(true);

    try {
      await onSave?.({
        name: name.trim(),
        phone: phoneClean || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!customer) return null;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-lg"
      layout="compact"
      title="Edit customer"
      subtitle="Update contact details for POS and delivery"
      icon={UserRound}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || saving}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25",
              !canSubmit || saving
                ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                : "bg-teal-600 ring-teal-600 hover:bg-teal-700"
            )}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        {localError ? (
          <div className="rounded-2xl bg-rose-600/10 ring-1 ring-rose-700/10 px-4 py-3 text-sm font-semibold text-rose-900">
            {localError}
          </div>
        ) : null}

        <Field label="Full name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Juan Dela Cruz"
            autoFocus
          />
        </Field>

        <Field label="Mobile number" hint="Optional, but recommended for delivery contact.">
          <Input
            icon={Phone}
            value={phone}
            onKeyDown={allowPhoneKeyDown}
            onChange={(e) => setPhone(digitsOnly(e.target.value))}
            placeholder="09XXXXXXXXX"
            inputMode="numeric"
            maxLength={11}
          />

        </Field>

        <Field label="Address">
          <Input
            icon={MapPin}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Barangay, City"
          />
        </Field>

        <Field label="Notes" hint="Optional, internal notes only.">
          <Textarea
            icon={StickyNote}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Landmark, delivery instructions..."
          />
        </Field>
      </div>
    </ModalShell>
  );
}