  import React, { useEffect, useMemo, useState } from "react";
  import { router, usePage } from "@inertiajs/react";
  import Layout from "../Dashboard/Layout";
  import TableHeaderCell from "@/components/Table/TableHeaderCell";


  function cx(...classes) {
    return classes.filter(Boolean).join(" ");
  }

  function StatusBadge({ status }) {
    const s = (status || "").toLowerCase();
    const tone =
      s === "receiving"
        ? "bg-sky-600/10 text-sky-900 ring-sky-700/10"
        : s === "received"
        ? "bg-emerald-600/10 text-emerald-900 ring-emerald-700/10"
        : s === "approved"
        ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
        : s === "payable_open"
        ? "bg-cyan-600/10 text-cyan-900 ring-cyan-700/10"
        : "bg-slate-100 text-slate-700 ring-slate-200";
    return (
      <span className={cx("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1", tone)}>
        {status?.toUpperCase() || "UNKNOWN"}
      </span>
    );
  }

  export default function ReceiveStockRequest() {
    const page = usePage();
    const stockRequest = page.props?.stock_request;

    const [lines, setLines] = useState([]);

    useEffect(() => {
      setLines(
        (stockRequest?.items || []).map((item) => ({
          line_id: item.id,
          received_qty_increment: 0,
          remaining_qty: item.remaining_qty ?? Math.max(0, item.approved_qty - item.received_qty),
        }))
      );
    }, [stockRequest?.items]);

    const hasPositiveQty = useMemo(() => lines.some((line) => (line.received_qty_increment || 0) > 0), [lines]);

    const handleLineChange = (lineId, value) => {
      setLines((prev) =>
        prev.map((line) =>
          line.line_id === lineId
            ? { ...line, received_qty_increment: Math.max(0, parseFloat(value) || 0) }
            : line
        )
      );
    };

    const handleSubmit = (event) => {
      event.preventDefault();
      router.post(
        `/dashboard/inventory/stock-requests/${stockRequest.id}/receive`,
        { lines },
        { preserveScroll: true }
      );
    };

    if (!stockRequest) {
      return <Layout title="Receive stock">Request not found.</Layout>;
    }

    const fullyReceived = stockRequest.status === "received" || stockRequest.status === "payable_open";

    return (
      <Layout title={`Receive ${stockRequest.request_number}`}>
        <div className="space-y-6">
          <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-lg font-extrabold text-slate-900">{stockRequest.request_number}</div>
                <div className="text-sm text-slate-600">Supplier: {stockRequest.supplier_name || "—"}</div>
                <div className="text-sm text-slate-500">
                  Invoice: {stockRequest.supplier_invoice_ref || "—"} · {stockRequest.supplier_invoice_date || "—"}
                </div>
              </div>
              <StatusBadge status={stockRequest.status} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                <div className="text-xs font-semibold uppercase text-slate-400">Expected qty</div>
                <div className="text-lg font-extrabold text-slate-900">{stockRequest.expected_qty}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                <div className="text-xs font-semibold uppercase text-slate-400">Received qty</div>
                <div className="text-lg font-extrabold text-slate-900">{stockRequest.received_qty}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                <div className="text-xs font-semibold uppercase text-slate-400">Received cost</div>
                <div className="text-lg font-extrabold text-slate-900">
                  ₱{Number(stockRequest.received_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Items</div>
                  <div className="text-xs text-slate-400">Update quantities to receive</div>
                </div>
                <div className="text-xs text-slate-500">
                  Remaining total: {stockRequest.expected_qty - stockRequest.received_qty}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-700">
                  <thead className="text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <TableHeaderCell label="Product" className="px-3 py-2" />
                      <TableHeaderCell label="Requested" className="px-3 py-2" />
                      <TableHeaderCell label="Approved" className="px-3 py-2" />
                      <TableHeaderCell label="Received" className="px-3 py-2" />
                      <TableHeaderCell label="Remaining" className="px-3 py-2" />
                      <TableHeaderCell label="Receive now" className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stockRequest.items.map((item) => (
                      <tr key={`receive-${item.id}`}>
                        <td className="px-3 py-2">{item.product_name}</td>
                        <td className="px-3 py-2">{item.requested_qty}</td>
                        <td className="px-3 py-2">{item.approved_qty}</td>
                        <td className="px-3 py-2">{item.received_qty}</td>
                        <td className="px-3 py-2">{item.remaining_qty}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            disabled={fullyReceived}
                            value={
                              lines.find((line) => line.line_id === item.id)?.received_qty_increment ?? 0
                            }
                            onChange={(event) => handleLineChange(item.id, event.target.value)}
                            className="w-full rounded-2xl border border-slate-200 px-2 py-1 text-xs text-slate-900 disabled:cursor-not-allowed"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {!fullyReceived && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={!hasPositiveQty}
                  className="inline-flex items-center justify-center rounded-2xl bg-teal-600 px-6 py-2 text-sm font-extrabold text-white disabled:opacity-50"
                >
                  Save receipt
                </button>
                <span className="text-sm text-slate-500">
                  Enter the quantities you have on hand before saving.
                </span>
              </div>
            )}
          </form>
        </div>
      </Layout>
    );
  }
