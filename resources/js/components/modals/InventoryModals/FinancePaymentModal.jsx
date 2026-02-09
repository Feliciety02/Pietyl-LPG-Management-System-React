import React, { useEffect, useMemo, useState } from "react";
import ModalShell from "../ModalShell";
import { PurchaseSummary } from "@/components/modals/InventoryModals/PurchaseSummary";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function sanitizeAmount(value) {
  const n = Number(String(value || "").replace(/,/g, ""));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function formatMoney(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ---------- compact primitives ---------- */

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="text-xs font-extrabold text-slate-700">{label}</div>
      {hint ? <div className="text-[11px] text-slate-500">{hint}</div> : null}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Input({ prefix, ...props }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-1.5 focus-within:ring-4 focus-within:ring-teal-500/15">
      {prefix ? (
        <span className="text-sm font-extrabold text-slate-600">{prefix}</span>
      ) : null}
      <input
        {...props}
        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
      />
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-1.5 focus-within:ring-4 focus-within:ring-teal-500/15">
      <select
        value={value}
        onChange={onChange}
        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-3">
      <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500 uppercase">
        {title}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank transfer" },
];

export default function FinancePaymentModal({
  open,
  onClose,
  payable,
  purchase,
  loading = false,
  onPay,
}) {
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const defaultAmount = useMemo(() => {
    const candidates = [
      purchase?.net_amount,
      payable?.net_amount,
      payable?.amount,
      purchase?.grand_total,
      purchase?.total_cost,
    ];
    for (const v of candidates) {
      const n = sanitizeAmount(v);
      if (n > 0) return n;
    }
    return 0;
  }, [purchase, payable]);

  useEffect(() => {
    if (!open) return;

    setAmount(defaultAmount ? String(defaultAmount) : "");

    // 👇 auto-reference from delivery confirmation
    setReference(
      purchase?.delivery_reference ||
      purchase?.supplier_reference ||
      ""
    );

    setPaymentMethod("cash");
  }, [open, defaultAmount, purchase]);

  const netAmount = sanitizeAmount(amount) || defaultAmount;
  const canPay = !loading && netAmount > 0 && (purchase?.id || payable?.id);

  const handlePay = () => {
    if (!canPay) return;
    onPay?.(purchase, {
      amount: netAmount,
      reference: reference.trim() || null,
      payment_method: paymentMethod,
    });
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      layout="compact"
      title="Record payment"
      subtitle="Fast, clean finance entry."
      maxWidthClass="max-w-6xl"
      footerClassName="px-6 pb-3 pt-0"
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-2xl bg-white px-4 py-1.5 text-sm font-semibold ring-1 ring-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handlePay}
            disabled={!canPay}
            className={cx(
              "rounded-2xl px-4 py-1.5 text-sm font-semibold text-white ring-1",
              canPay ? "bg-teal-600 ring-teal-600" : "bg-slate-300 ring-slate-300"
            )}
          >
            {loading ? "Processing..." : "Record payment"}
          </button>
        </div>
      }
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="grid gap-3">
          <PurchaseSummary purchase={purchase} />
          <SectionCard title="Payable snapshot">
            <div className="flex justify-between text-sm">
              <span>Net payable</span>
              <span className="font-semibold">₱ {formatMoney(defaultAmount)}</span>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Payment details">
          <div className="grid gap-2.5">
            <Field label="Amount">
              <Input
                prefix="₱"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </Field>

            <Field label="Payment method">
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                options={PAYMENT_METHOD_OPTIONS}
              />
            </Field>

            <Field label="Reference">
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Auto-filled from delivery"
              />
            </Field>
          </div>
        </SectionCard>
      </div>
    </ModalShell>
  );
}
