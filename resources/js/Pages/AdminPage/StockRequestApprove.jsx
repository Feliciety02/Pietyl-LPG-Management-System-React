import React, { useMemo, useState } from "react";
import { router, usePage, Link } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import { ClipboardCheck, Building2, FileText, CalendarDays, CheckCircle2, ArrowLeft, Info, Wallet } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function normalizeStatus(status) {
  return String(status || "").toLowerCase().replace(/\s+/g, "_");
}

function moneyPHP(v) {
  const n = Number(v || 0);
  return `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusPill({ status }) {
  const s = normalizeStatus(status);

  const tone =
    s === "approved"
      ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
      : s === "submitted" || s === "draft"
      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
      : s === "receiving"
      ? "bg-sky-600/10 text-sky-900 ring-sky-700/10"
      : s === "received"
      ? "bg-emerald-600/10 text-emerald-900 ring-emerald-700/10"
      : s === "rejected"
      ? "bg-rose-600/10 text-rose-900 ring-rose-700/10"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  const labelMap = {
    submitted: "SUBMITTED",
    draft: "DRAFT",
    approved: "APPROVED",
    receiving: "RECEIVING",
    received: "RECEIVED",
    rejected: "REJECTED",
  };

  const label = labelMap[s] || (status ? String(status).toUpperCase() : "UNKNOWN");

  return (
    <span className={cx("inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold ring-1", tone)}>
      {label}
    </span>
  );
}

function TopCard({ title, subtitle, right }) {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
      <div className="p-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-lg font-extrabold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
        </div>
        {right}
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, right, children }) {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {Icon ? (
            <div className="h-10 w-10 rounded-2xl bg-teal-600/10 ring-1 ring-teal-700/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-teal-700" />
            </div>
          ) : null}
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-slate-900 truncate">{title}</div>
          </div>
        </div>
        {right}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="text-xs font-extrabold text-slate-600">{label}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={cx(
        "w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none",
        "focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15",
        className
      )}
    />
  );
}

function Select({ className = "", ...props }) {
  return (
    <select
      {...props}
      className={cx(
        "w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none",
        "focus:ring-4 focus:ring-teal-500/15 focus:border-teal-500",
        className
      )}
    />
  );
}

function NumberInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      type="number"
      className={cx(
        "w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none",
        "focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15",
        className
      )}
    />
  );
}

export default function StockRequestApprove() {
  const page = usePage();
  const stockRequest = page.props?.stock_request;
  const suppliers = page.props?.suppliers || [];

  const [form, setForm] = useState(() => ({
    supplier_id: stockRequest?.supplier_id ?? "",
    invoice_ref: stockRequest?.supplier_invoice_ref ?? "",
    invoice_date: stockRequest?.supplier_invoice_date ?? "",
    lines: (stockRequest?.items || []).map((item) => ({
      line_id: item.id,
      unit_cost: Number(item.unit_cost || 0),
      approved_qty: Number(item.approved_qty || item.requested_qty || 0),
      requested_qty: Number(item.requested_qty || 0),
      product_name: item.product_name,
      variant_name: item.variant_name,
    })),
  }));

  const totalCost = useMemo(() => {
    return (form.lines || []).reduce(
      (sum, line) => sum + Number(line.unit_cost || 0) * Number(line.approved_qty || 0),
      0
    );
  }, [form.lines]);

  const totals = useMemo(() => {
    const requested = (form.lines || []).reduce((sum, l) => sum + Number(l.requested_qty || 0), 0);
    const approved = (form.lines || []).reduce((sum, l) => sum + Number(l.approved_qty || 0), 0);
    return { requested, approved };
  }, [form.lines]);

  const handleLineChange = (lineId, key, value) => {
    const numeric = Number(value);
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line) => {
        if (line.line_id !== lineId) return line;
        return {
          ...line,
          [key]: Number.isFinite(numeric) ? numeric : 0,
        };
      }),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    router.post(`/dashboard/admin/purchase-requests/${stockRequest.id}/approve`, form, {
      preserveScroll: true,
    });
  };

  if (!stockRequest) {
    return <Layout title="Approve stock request">Request not found.</Layout>;
  }

  const statusNorm = normalizeStatus(stockRequest.status);
  const canApprove = ["draft", "submitted"].includes(statusNorm);

  return (
    <Layout title={`Approve ${stockRequest.request_number}`}>
      <div className="grid gap-6">
        <TopCard
          title={`Approve request · ${stockRequest.request_number}`}
          subtitle={`Requested by ${stockRequest.requested_by || "—"}`}
          right={
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/admin/stock-requests"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition focus:ring-4 focus:ring-teal-500/15"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
              <StatusPill status={stockRequest.status} />
            </div>
          }
        />

        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-6 lg:grid-cols-[1.25fr,0.75fr]">
            <Panel
              title="Approval details"
              icon={ClipboardCheck}
              right={<span className="text-xs text-slate-500">Fill supplier invoice info</span>}
            >
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Supplier" hint="Select the supplier for this purchase.">
                  <Select
                    value={form.supplier_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, supplier_id: e.target.value }))}
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Invoice reference" hint="Invoice number or reference from supplier.">
                  <Input
                    type="text"
                    value={form.invoice_ref}
                    onChange={(e) => setForm((prev) => ({ ...prev, invoice_ref: e.target.value }))}
                    placeholder="Inv. #1234"
                  />
                </Field>

                <Field label="Invoice date" hint="Date shown on the invoice.">
                  <Input
                    type="date"
                    value={form.invoice_date || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, invoice_date: e.target.value }))}
                  />
                </Field>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
                    <Info className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-slate-900">Tip</div>
                    <div className="mt-1 text-xs text-slate-600">
                      If the supplier invoice is not available yet, you can still approve and update the invoice details later.
                    </div>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel
              title="Totals preview"
              icon={Wallet}
              right={<span className="text-xs text-slate-500">Auto calculated</span>}
            >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
              <div className="flex-1 rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
                <div className="text-xs font-extrabold text-slate-600">Approved total cost</div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900 tabular-nums">{moneyPHP(totalCost)}</div>
                <div className="mt-1 text-xs text-slate-500">Based on approved qty × unit cost</div>
              </div>

              <div className="grid w-full max-w-xs flex-shrink-0 gap-3 lg:grid-cols-2 lg:flex-col">
                <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-4">
                  <div className="text-xs font-extrabold text-slate-600">Requested qty</div>
                  <div className="mt-1 text-lg font-extrabold text-slate-900 tabular-nums">{totals.requested}</div>
                </div>

                <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-4">
                  <div className="text-xs font-extrabold text-slate-600">Approved qty</div>
                  <div className="mt-1 text-lg font-extrabold text-slate-900 tabular-nums">{totals.approved}</div>
                </div>
              </div>

              <div className="text-xs text-slate-500 lg:ml-6 lg:self-center">
                Once approved, inventory can start receiving items against this request.
              </div>
            </div>
          </Panel>
          </div>

          <Panel
            title="Request lines"
            icon={Building2}
            right={<span className="text-xs text-slate-500">Edit approved qty and unit cost</span>}
          >
            <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-200">
              <table className="min-w-full text-left bg-white">
                <thead className="bg-slate-50">
                  <tr className="text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3 text-right">Requested</th>
                    <th className="px-4 py-3 text-right">Approved</th>
                    <th className="px-4 py-3 text-right">Unit cost</th>
                    <th className="px-4 py-3 text-right">Line total</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {(stockRequest.items || []).map((item) => {
                    const line = form.lines.find((row) => row.line_id === item.id);
                    const approvedQty = Number(line?.approved_qty ?? item.approved_qty ?? item.requested_qty ?? 0);
                    const unitCost = Number(line?.unit_cost ?? item.unit_cost ?? 0);
                    const lineTotal = approvedQty * unitCost;

                    return (
                      <tr key={`line-${item.id}`} className="align-middle">
                        <td className="px-4 py-4">
                          <div className="text-sm font-extrabold text-slate-900">
                            {item.product_name || "—"}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {item.variant_name ? `Variant: ${item.variant_name}` : "No variant"}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <div className="text-sm font-extrabold text-slate-900 tabular-nums">
                            {Number(item.requested_qty || 0)}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <NumberInput
                            min="0"
                            step="1"
                            value={approvedQty}
                            onChange={(event) => handleLineChange(item.id, "approved_qty", event.target.value)}
                            className="max-w-[140px] ml-auto text-right"
                          />
                        </td>

                        <td className="px-4 py-4 text-right">
                          <NumberInput
                            min="0"
                            step="0.01"
                            value={unitCost}
                            onChange={(event) => handleLineChange(item.id, "unit_cost", event.target.value)}
                            className="max-w-[160px] ml-auto text-right"
                          />
                        </td>

                        <td className="px-4 py-4 text-right">
                          <div className="text-sm font-extrabold text-slate-900 tabular-nums">
                            {moneyPHP(lineTotal)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3">
                <FileText className="h-4 w-4 text-slate-500" />
                <div className="text-sm font-extrabold text-slate-900">Total preview</div>
                <div className="text-sm font-extrabold text-teal-700 tabular-nums">{moneyPHP(totalCost)}</div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3">
                <CalendarDays className="h-4 w-4 text-slate-500" />
                <div className="text-xs text-slate-600">
                  Invoice date: <span className="font-extrabold text-slate-900">{form.invoice_date || "—"}</span>
                </div>
              </div>
            </div>
          </Panel>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!canApprove}
              className={cx(
                "inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold transition focus:outline-none focus:ring-4",
                canApprove
                  ? "bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500/25"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed"
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve request
            </button>

            <div className="text-sm text-slate-500">
              {canApprove ? "After approval, inventory can start receiving." : "This request is already processed."}
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
