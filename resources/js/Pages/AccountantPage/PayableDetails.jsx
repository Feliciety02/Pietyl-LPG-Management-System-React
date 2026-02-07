import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

export default function PayableDetails() {
  const page = usePage();
  const payable = page.props?.payable;

  const [form, setForm] = useState({
    payment_method: "",
    bank_ref: "",
    paid_amount: payable?.amount ?? 0,
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    router.post(
      `/dashboard/accountant/payables/${payable.id}/pay`,
      form,
      { preserveScroll: true }
    );
  };

  if (!payable) {
    return <Layout title="Payable">Payable not found.</Layout>;
  }

  return (
    <Layout title={`Pay ${payable.source_ref}`}>
      <div className="space-y-6">
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-6 space-y-4">
          <div className="text-sm uppercase tracking-[0.3em] text-slate-500">Payable details</div>
          <div className="text-lg font-extrabold text-slate-900">
            ₱{Number(payable.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-slate-500">
            Supplier: {payable.supplier?.name || "—"}
          </div>
          <div className="text-sm text-slate-500">Source: {payable.source_ref}</div>
          <div className="text-sm text-slate-500">Status: {payable.status?.toUpperCase()}</div>
        </div>

        {payable.status === "unpaid" ? (
          <form className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-6 space-y-4" onSubmit={handleSubmit}>
            <div className="text-sm uppercase tracking-[0.3em] text-slate-500">Record payment</div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm font-semibold text-slate-600">
                Payment method
                <input
                  type="text"
                  value={form.payment_method}
                  onChange={(event) => setForm((prev) => ({ ...prev, payment_method: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  placeholder="e.g. Bank transfer"
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-600">
                Bank reference
                <input
                  type="text"
                  value={form.bank_ref}
                  onChange={(event) => setForm((prev) => ({ ...prev, bank_ref: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-600">
                Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.paid_amount}
                  onChange={(event) => setForm((prev) => ({ ...prev, paid_amount: Number(event.target.value) }))}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </label>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-teal-600 px-6 py-2 text-sm font-extrabold text-white hover:bg-teal-700"
            >
              Mark as paid
            </button>
          </form>
        ) : (
          <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-6 text-sm text-slate-500">
            This payable has been settled.
          </div>
        )}
      </div>
    </Layout>
  );
}
