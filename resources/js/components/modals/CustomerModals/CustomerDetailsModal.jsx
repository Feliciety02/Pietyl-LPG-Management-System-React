
import React, { useMemo, useState } from "react";
import { Link } from "@inertiajs/react";
import { UserRound, Phone, MapPin, Copy, History } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function money(n) {
  const v = Number(n || 0);
  return `₱${v.toLocaleString()}`;
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

export default function CustomerDetailsModal({
  open,
  onClose,
  customer,
  isAdmin = false,
  posHref = "/dashboard/cashier/new-sale",
}) {
  const [copied, setCopied] = useState(false);

  if (!customer) return null;

  const canCopy = Boolean(customer.phone);

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
      purchases: Number(customer.purchases || 0),
      totalSpent: Number(customer.total_spent || 0),
      lastPurchase: customer.last_purchase_at || "—",
    };
  }, [customer]);

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

          {!isAdmin ? (
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
      <div className="grid gap-4">
        <div className="text-center">
          <div className="text-lg font-extrabold text-slate-900">{customer.name}</div>
          <div className="mt-1 text-xs text-slate-500">Customer ID {customer.id}</div>
        </div>

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-5 grid gap-4">
          <Item
            icon={Phone}
            label="Mobile"
            value={customer.phone || "No phone"}
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
                  title="Copy number"
                >
                  <span className="inline-flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    {copied ? "Copied" : "Copy"}
                  </span>
                </button>
              ) : null
            }
          />

          <Item icon={MapPin} label="Address" value={customer.address || "No address"} />
        </div>

        <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-5">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
            <History className="h-4 w-4 text-slate-500" />
            Purchase summary
          </div>

          <div className="mt-3 grid gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Purchases</span>
              <span className="font-extrabold text-slate-900">{summary.purchases}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Total spent</span>
              <span className="font-extrabold text-slate-900">{money(summary.totalSpent)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Last purchase</span>
              <span className="font-extrabold text-slate-900">{summary.lastPurchase}</span>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}