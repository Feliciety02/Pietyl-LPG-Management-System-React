import React, { useEffect, useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import { UserPlus, X, Phone, MapPin, StickyNote } from "lucide-react";
import ModalShell from "./ModalShell";

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

export default function AddCustomerModal({
  open,
  onClose,
  postTo = "/dashboard/cashier/customers",
  onCreated,
  defaults,
}) {
  const [name, setName] = useState(defaults?.name || "");
  const [phone, setPhone] = useState(defaults?.phone || "");
  const [address, setAddress] = useState(defaults?.address || "");
  const [notes, setNotes] = useState(defaults?.notes || "");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(defaults?.name || "");
    setPhone(defaults?.phone || "");
    setAddress(defaults?.address || "");
    setNotes(defaults?.notes || "");
    setLocalError("");
    setSubmitting(false);
  }, [open, defaults]);

  const phoneClean = useMemo(() => String(phone || "").replace(/\s+/g, ""), [phone]);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!phoneClean.trim()) return false;
    return true;
  }, [name, phoneClean]);

  const validate = () => {
    if (!name.trim()) return "Full name is required.";
    if (!phoneClean.trim()) return "Mobile number is required.";
    if (!/^(\+?63|0)\d{10}$/.test(phoneClean)) {
      return "Mobile number looks invalid. Use 09XXXXXXXXX or +63XXXXXXXXXX.";
    }
    return "";
  };

  const submit = () => {
    const err = validate();
    if (err) {
      setLocalError(err);
      return;
    }

    setSubmitting(true);
    setLocalError("");

    router.post(
      postTo,
      {
        name: name.trim(),
        phone: phoneClean,
        address: address.trim(),
        notes: notes.trim(),
      },
      {
        preserveScroll: true,
        onFinish: () => setSubmitting(false),
        onSuccess: (page) => {
          onClose?.();

          // If your backend returns created customer in props, you can pass it back to POS
          const created = page?.props?.created_customer || null;
          onCreated?.(created);
        },
        onError: (errors) => {
          const first =
            errors?.phone ||
            errors?.name ||
            errors?.address ||
            errors?.notes ||
            "Unable to create customer. Please check inputs.";
          setLocalError(String(first));
        },
      }
    );
  };

  return (
    <ModalShell open={open} onClose={onClose} maxWidthClass="max-w-lg">
      <div className="p-6 border-b border-slate-200 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl bg-teal-600/10 ring-1 ring-teal-700/10 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-teal-700" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-extrabold text-slate-900 truncate">Add customer</div>
              <div className="text-xs text-slate-600">
                Quick create for POS and delivery orders.
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-2xl bg-white p-2 ring-1 ring-slate-200 hover:bg-slate-50"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-slate-600" />
        </button>
      </div>

      <div className="p-6 grid gap-4">
        {localError ? (
          <div className="rounded-2xl bg-rose-600/10 ring-1 ring-rose-700/10 px-4 py-3 text-sm font-semibold text-rose-900">
            {localError}
          </div>
        ) : null}

        <Field label="Full name" hint="Use the customer’s legal or commonly used name.">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Juan Dela Cruz"
            autoFocus
          />
        </Field>

        <Field label="Mobile number" hint="Used for lookup and delivery contact.">
          <Input
            icon={Phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09XXXXXXXXX"
            inputMode="tel"
          />
        </Field>

        <Field label="Address" hint="Optional. Keep it short for fast entry.">
          <Input
            icon={MapPin}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Barangay, City"
          />
        </Field>

        <Field label="Notes" hint="Optional. Landmark or delivery instructions.">
          <Textarea
            icon={StickyNote}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Landmark, gate color, directions..."
          />
        </Field>
      </div>

      <div className="p-6 pt-0 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
          disabled={submitting}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit || submitting}
          className={cx(
            "rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25",
            !canSubmit || submitting
              ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
              : "bg-teal-600 ring-teal-600 hover:bg-teal-700"
          )}
        >
          {submitting ? "Saving..." : "Create customer"}
        </button>
      </div>
    </ModalShell>
  );
}
