import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, ClipboardCheck, Hash, User, Clock, MapPin } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeInt(v) {
  const n = Number(String(v ?? "").trim());
  if (!Number.isFinite(n)) return 0;
  return Math.trunc(n);
}

function niceText(v) {
  const s = String(v ?? "").trim();
  return s ? s : "—";
}

function Field({ label, hint, children }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-extrabold text-slate-700">{label}</div>
      {hint ? <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div> : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function InputShell({ icon: Icon, children, className = "" }) {
  return (
    <div
      className={cx(
        "w-full rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5",
        "focus-within:ring-teal-500/30",
        className
      )}
    >
      <div className="flex items-start gap-2">
        {Icon ? <Icon className="mt-0.5 h-4 w-4 text-slate-500 shrink-0" /> : null}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

function StatTile({ label, value, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-50 ring-slate-200 text-slate-900",
    teal: "bg-teal-50 ring-teal-700/10 text-teal-950",
    rose: "bg-rose-50 ring-rose-700/10 text-rose-950",
  };

  return (
    <div className={cx("rounded-2xl ring-1 px-4 py-3", tones[tone] || tones.slate)}>
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-extrabold tabular-nums">{value}</div>
    </div>
  );
}

function varianceTone(n) {
  if (n === 0) return "slate";
  return n > 0 ? "teal" : "rose";
}

export default function SubmitStockCountModal({
  open,
  onClose,
  item,
  onApprove,
  onReject,
  loading = false,
}) {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setNote("");
  }, [open]);

  const productName = niceText(item?.product_name || item?.name || "Item");
  const variant = niceText(item?.variant);
  const sku = niceText(item?.sku);
  const location = niceText(item?.location_name);

  const systemQty = safeInt(item?.system_qty);
  const countedQty = safeInt(item?.counted_qty);
  const varianceQty = safeInt(item?.variance_qty ?? countedQty - systemQty);

  const submittedBy = niceText(item?.submitted_by);
  const submittedAt = niceText(item?.submitted_at);

  const tone = useMemo(() => varianceTone(varianceQty), [varianceQty]);

  const submitApprove = () => onApprove?.(note.trim() || null);
  const submitReject = () => onReject?.(note.trim() || null);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      layout="compact"
      title="Submit stock count"
      subtitle="Confirm the recount details before approving or rejecting."
      icon={ClipboardCheck}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submitReject}
            className={cx(
              "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4",
              loading
                ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                : "bg-rose-600 ring-rose-600 hover:bg-rose-700 focus:ring-rose-500/25"
            )}
            disabled={loading}
          >
            <XCircle className="h-4 w-4" />
            Reject
          </button>

          <button
            type="button"
            onClick={submitApprove}
            className={cx(
              "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4",
              loading
                ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                : "bg-teal-600 ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25"
            )}
            disabled={loading}
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        {/* Header card */}
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-2xl bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center shrink-0">
                <ClipboardCheck className="h-5 w-5 text-slate-700" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-xs font-extrabold text-slate-500">Submission</div>
                <div className="mt-1 text-sm font-extrabold text-slate-900 truncate">
                  {productName}{" "}
                  {variant !== "—" ? <span className="text-slate-500 font-semibold">({variant})</span> : null}
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <div className="inline-flex items-center gap-2 text-xs text-slate-600 min-w-0">
                    <Hash className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="truncate">
                      SKU <span className="font-semibold text-slate-700">{sku}</span>
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 text-xs text-slate-600 min-w-0">
                    <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="truncate">
                      <span className="font-semibold text-slate-700">{location}</span>
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 text-xs text-slate-600 min-w-0">
                    <User className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="truncate">
                      <span className="font-semibold text-slate-700">{submittedBy}</span>
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 text-xs text-slate-600 min-w-0 sm:col-span-3">
                    <Clock className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="truncate">{submittedAt}</span>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block">
                <StatTile label="Variance" value={varianceQty} tone={tone} />
              </div>
            </div>
          </div>
        </div>

        {/* Two-column: numbers + note */}
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7 rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
            <div className="p-5">
              <div className="text-xs font-extrabold text-slate-700">Count summary</div>

              <div className="mt-3 grid grid-cols-3 gap-3">
                <StatTile label="System" value={systemQty} />
                <StatTile label="Counted" value={countedQty} />
                <StatTile label="Variance" value={varianceQty} tone={tone} />
              </div>

              <div className="mt-3 text-[11px] text-slate-500">
                Variance is computed as counted minus system.
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
            <div className="p-5">
              <Field label="Review note" hint="Optional, but useful for audit comments">
                <InputShell icon={ClipboardCheck}>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={5}
                    className="w-full resize-none bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                    placeholder="Add a short note if needed..."
                    disabled={loading}
                  />
                </InputShell>
              </Field>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
