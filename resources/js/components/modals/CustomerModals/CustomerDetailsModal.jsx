import React, { useMemo, useState } from "react";
import { Link } from "@inertiajs/react";
import { UserRound, Phone, MapPin, Copy, History, Mail, Tag, StickyNote } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function money(n) {
  const v = Number(n || 0);
  return `₱${v.toLocaleString()}`;
}

function InfoRow({ icon: Icon, label, value, action, badge }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        {Icon ? <Icon className="mt-0.5 h-4 w-4 text-slate-500" /> : null}
        <div className="min-w-0 space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 min-w-0">
            <span className="truncate">{value || "�"}</span>
            {badge}
          </div>
        </div>
      </div>
      {action}
    </div>
  );
}

export default function CustomerDetailsModal({
  open,
  onClose,
  customer,
  isAdmin = false,
  posHref = "/dashboard/cashier/new-sale",
}) {
  const [copied, setCopied] = useState(false);

  const canCopy = Boolean(customer?.phone);

  const copyPhone = async () => {
    if (!canCopy) return;
    try {
      await navigator.clipboard.writeText(String(customer.phone));
      setCopied(true);
      setTimeout(() => setCopied(false), 900);
    } catch {
      setCopied(false);
    }
  };

  const summary = useMemo(() => {
    return {
      purchases: Number(customer?.purchases || 0),
      totalSpent: Number(customer?.total_spent || 0),
      lastPurchase: customer?.last_purchase_at || "—",
    };
  }, [customer]);
  const addressValue = customer?.full_address || customer?.address || "No address";
  const emailValue = customer?.email || "No email";
  const notesValue = customer?.notes;
  const typeLabel = customer?.customer_type
    ? customer.customer_type.replace(/_/g, " ")
    : null;
  const typeBadge = customer?.customer_type ? (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-800 ring-1 ring-slate-200">
      {customer.customer_type.replace(/_/g, " ").toUpperCase()}
    </span>
  ) : null;
  const copyAction = canCopy ? (
    <button
      type="button"
      onClick={copyPhone}
      className={cx(
        "rounded-2xl px-3 py-2 text-xs font-extrabold ring-1 transition",
        copied
          ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
          : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"
      )}
      title="Copy number"
    >
      <span className="inline-flex items-center gap-2">
        <Copy className="h-4 w-4" />
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  ) : null;


  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-md"
      layout="compact"
      title="Customer"
      subtitle="Quick view"
      icon={UserRound}
      footer={
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-5 py-2.5 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Close
          </button>

          {!isAdmin && customer?.id ? (
            <Link
              href={`${posHref}?customer_id=${customer.id}`}
              className="rounded-2xl bg-teal-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/25"
            >
              Use in POS
            </Link>
          ) : null}
        </div>
      }
    >
      {!customer ? (
        <div className="grid gap-4">
          <div className="text-center">
            <div className="h-6 w-40 mx-auto rounded bg-slate-200/80 animate-pulse" />
            <div className="mt-2 h-4 w-28 mx-auto rounded bg-slate-200/80 animate-pulse" />
          </div>

          <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-5 grid gap-4">
            <div className="h-12 rounded bg-slate-200/80 animate-pulse" />
            <div className="h-12 rounded bg-slate-200/80 animate-pulse" />
          </div>

          <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-5">
            <div className="h-4 w-32 rounded bg-slate-200/80 animate-pulse" />
            <div className="mt-3 grid gap-2">
              <div className="h-4 w-full rounded bg-slate-200/80 animate-pulse" />
              <div className="h-4 w-full rounded bg-slate-200/80 animate-pulse" />
              <div className="h-4 w-full rounded bg-slate-200/80 animate-pulse" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="text-center">
            <div className="text-lg font-extrabold text-slate-900">{customer.name}</div>
            <div className="mt-1 text-xs text-slate-500">Customer ID {customer.id}</div>
          </div>

          <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-5">
            <div className="grid gap-3">
              <InfoRow
                icon={Phone}
                label="Mobile"
                value={customer.phone || "No phone"}
                action={copyAction}
              />
              <InfoRow icon={Mail} label="Email" value={emailValue} />
              <InfoRow icon={MapPin} label="Address" value={addressValue} />
              {typeLabel ? (
                <InfoRow icon={Tag} label="Customer type" value={typeLabel} badge={typeBadge} />
              ) : null}
              {notesValue ? <InfoRow icon={StickyNote} label="Notes" value={notesValue} /> : null}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
              <History className="h-4 w-4 text-slate-500" />
              Purchase snapshot
            </div>

            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                <span>Purchases</span>
                <span>{summary.purchases}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                <span>Total spent</span>
                <span>{money(summary.totalSpent)}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                <span>Last purchase</span>
                <span>{summary.lastPurchase}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
