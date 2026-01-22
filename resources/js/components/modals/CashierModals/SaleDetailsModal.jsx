import React, { useMemo } from "react";
import ModalShell from "../ModalShell";
import { FileText } from "lucide-react";

function money(n) {
  const v = Number(n || 0);
  return `₱${v.toLocaleString()}`;
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Pill({ tone = "slate", children }) {
  const styles =
    tone === "teal"
      ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
      : tone === "amber"
      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
      : tone === "rose"
      ? "bg-rose-600/10 text-rose-900 ring-rose-700/10"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1", styles)}>
      {children}
    </span>
  );
}

function KeyRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-sm text-slate-600">{label}</div>
      <div className="text-sm font-extrabold text-slate-900 text-right truncate max-w-[62%]">
        {value || "—"}
      </div>
    </div>
  );
}

export default function SaleDetailsModal({ open, onClose, sale }) {
  if (!sale) return null;

  const subtotal = useMemo(
    () =>
      sale.lines?.reduce(
        (sum, l) => sum + Number(l.unit_price || 0) * Number(l.qty || 0),
        0
      ),
    [sale]
  );

  const discount = Number(sale.discount || 0);
  const total = Math.max(0, subtotal - discount);

  const methodRaw = String(sale.method || "cash").toLowerCase();
  const method =
    methodRaw === "gcash" ? "GCash" : methodRaw === "card" ? "Card" : "Cash";

  const statusRaw = String(sale.status || "paid").toLowerCase();
  const statusLabel =
    statusRaw === "paid" ? "PAID" : statusRaw === "failed" ? "FAILED" : "PENDING";

  const statusTone =
    statusRaw === "paid" ? "teal" : statusRaw === "failed" ? "rose" : "amber";

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-md"
      layout="compact"
      title="Sale details"
      subtitle="Quick receipt view"
      icon={FileText}
      footer={
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-6 py-2.5 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        {/* receipt identity */}
        <div className="text-center">
          <div className="text-xs font-semibold text-slate-500">Receipt number</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900 tracking-tight">
            {sale.ref}
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <Pill tone="slate">{sale.created_at || "—"}</Pill>
            <Pill tone="slate">{method}</Pill>
            <Pill tone={statusTone}>{statusLabel}</Pill>
          </div>
        </div>

        {/* key details */}
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-5">
          <div className="grid gap-3">
            <KeyRow label="Customer" value={sale.customer || "Walk in"} />
            {methodRaw !== "cash" ? (
              <KeyRow label="Reference no." value={sale.payment_ref} />
            ) : null}
          </div>
        </div>

        {/* items */}
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-5">
          <div className="text-xs font-extrabold text-slate-700">Items</div>

          <div className="mt-3 grid gap-2">
            {(sale.lines || []).map((l, i) => {
              const lineTotal = Number(l.unit_price || 0) * Number(l.qty || 0);

              return (
                <div key={i} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-slate-900 truncate">
                      {l.name}{" "}
                      <span className="text-slate-500 font-semibold">
                        ({l.variant})
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {l.qty} × {money(l.unit_price)}
                    </div>
                  </div>

                  <div className="shrink-0 text-sm font-extrabold text-slate-900">
                    {money(lineTotal)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* totals */}
        <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-5">
          <div className="grid gap-2">
            <KeyRow label="Subtotal" value={money(subtotal)} />
            {discount > 0 ? <KeyRow label="Discount" value={money(discount)} /> : null}
            <div className="h-px bg-slate-200 my-1" />
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-extrabold text-slate-700">Total</div>
              <div className="text-lg font-extrabold text-slate-900">{money(total)}</div>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
