import React, { useEffect, useMemo, useState } from "react";
import { Pencil, UserRound, Phone, Mail, MapPin } from "lucide-react";
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

export default function EditSupplierModal({
  open,
  onClose,
  supplier,
  onSubmit,
  loading = false,
}) {
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(supplier?.name || "");
    setContactName(supplier?.contact_name || "");
    setPhone(supplier?.phone || "");
    setEmail(supplier?.email || "");
    setAddress(supplier?.address || "");
    setNotes(supplier?.notes || "");
    setLocalError("");
  }, [open, supplier]);

  const canSubmit = useMemo(() => {
    if (!supplier?.id) return false;
    if (!name.trim()) return false;
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) return false;
    return true;
  }, [supplier, name, email]);

  const submit = () => {
    if (!canSubmit || loading) return;

    if (!name.trim()) {
      setLocalError("Supplier name is required.");
      return;
    }

    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setLocalError("Email looks invalid.");
      return;
    }

    setLocalError("");
    onSubmit?.({
      name: name.trim(),
      contact_name: contactName.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
    });
  };

  if (!supplier) return null;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-lg"
      layout="compact"
      title="Edit supplier"
      subtitle="Update supplier details"
      icon={Pencil}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || loading}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25",
              !canSubmit || loading
                ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                : "bg-teal-600 ring-teal-600 hover:bg-teal-700"
            )}
          >
            {loading ? "Saving..." : "Save changes"}
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

        <Field label="Supplier name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Petron LPG Supply"
            autoFocus
          />
        </Field>

        <Field label="Contact person (optional)">
          <Input
            icon={UserRound}
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Ramon Cruz"
          />
        </Field>

        <Field label="Phone (optional)">
          <Input
            icon={Phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09XXXXXXXXX"
            inputMode="tel"
          />
        </Field>

        <Field label="Email (optional)">
          <Input
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="supplier@email.com"
            inputMode="email"
          />
        </Field>

        <Field label="Address (optional)">
          <Input
            icon={MapPin}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="City, Barangay..."
          />
        </Field>

        <Field label="Notes (optional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions, terms, or reminders..."
            rows={3}
            className="w-full rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500/40"
          />
        </Field>
      </div>
    </ModalShell>
  );
}
