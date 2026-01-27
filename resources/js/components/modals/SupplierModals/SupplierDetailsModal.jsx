import React, { useState } from "react";
import { Building2, UserRound, Phone, Mail, MapPin, Copy } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Item({ icon: Icon, label, value, right }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2 min-w-0">
        <Icon className="mt-0.5 h-4 w-4 text-slate-500" />
        <div className="min-w-0">
          <div className="text-xs text-slate-500">{label}</div>
          <div className="text-sm font-extrabold text-slate-900 truncate">{value || "—"}</div>
        </div>
      </div>
      {right}
    </div>
  );
}

export default function SupplierDetailsModal({
  open,
  onClose,
  supplier,
}) {
  const [copied, setCopied] = useState(false);

  if (!supplier) return null;

  const canCopy = Boolean(supplier?.phone);

  const copyPhone = async () => {
    if (!canCopy) return;
    try {
      await navigator.clipboard.writeText(String(supplier.phone));
      setCopied(true);
      setTimeout(() => setCopied(false), 900);
    } catch {
      setCopied(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-md"
      layout="compact"
      title="Supplier"
      subtitle="Quick view"
      icon={Building2}
      footer={
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-5 py-2.5 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="text-center">
          <div className="text-lg font-extrabold text-slate-900">{supplier.name}</div>
          <div className="mt-1 text-xs text-slate-500">Supplier ID {supplier.id}</div>
        </div>

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-5 grid gap-4">
          <Item icon={UserRound} label="Contact" value={supplier.contact_name || "No contact"} />
          <Item
            icon={Phone}
            label="Phone"
            value={supplier.phone || "No phone"}
            right={
              canCopy ? (
                <button
                  type="button"
                  onClick={copyPhone}
                  className={cx(
                    "rounded-2xl px-3 py-2 text-xs font-extrabold ring-1 transition",
                    copied
                      ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
                      : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"
                  )}
                  title="Copy phone"
                >
                  <span className="inline-flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    {copied ? "Copied" : "Copy"}
                  </span>
                </button>
              ) : null
            }
          />
          <Item icon={Mail} label="Email" value={supplier.email || "—"} />
          <Item icon={MapPin} label="Address" value={supplier.address || "—"} />
        </div>
      </div>
    </ModalShell>
  );
}
