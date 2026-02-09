import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, StickyNote } from "lucide-react";
import ModalShell from "../ModalShell";
import { PurchaseSummary, niceText } from "@/components/modals/InventoryModals/PurchaseSummary";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function SoftBox({ title, children }) {
  return (
    <div className="rounded-3xl bg-slate-50/70 ring-1 ring-slate-200/70 p-4">
      <div className="text-sm font-extrabold text-slate-900">{title}</div>
      <div className="mt-3 grid gap-3">{children}</div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/70 ring-1 ring-slate-200/70 px-4 py-3">
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900 whitespace-pre-wrap">{value}</div>
    </div>
  );
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

function Textarea({ icon: Icon, ...props }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-teal-500/30">
      {Icon ? <Icon className="mt-0.5 h-4 w-4 text-slate-500" /> : null}
      <textarea
        {...props}
        className="w-full resize-none bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}

const REJECTION_REASONS = [
  { value: "pricing_mismatch", label: "Pricing discrepancy" },
  { value: "missing_documents", label: "Missing documents" },
  { value: "duplicate_request", label: "Duplicate request" },
  { value: "supplier_unavailable", label: "Supplier unavailable" },
  { value: "detail_mismatch", label: "Requested details don’t match" },
  { value: "manual_review", label: "Needs additional manual review" },
  { value: "other", label: "Other (specify)" },
];

export default function SubmittedActionModal({
  open,
  onClose,
  purchase,
  loading = false,
  onApprove,
  onReject,
  action = "review", // "approve" | "reject" | "review"
}) {
  const p = purchase || null;

  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedReason("");
    setCustomReason("");
  }, [open]);

  const isApprove = action === "approve";
  const isReject = action === "reject";

  const canApprove = useMemo(
    () => !loading && Boolean(onApprove) && Boolean(p?.id),
    [loading, onApprove, p]
  );

  const reasonLabel = useMemo(() => {
    if (!selectedReason) return "";
    const entry = REJECTION_REASONS.find((item) => item.value === selectedReason);
    return entry?.label || "";
  }, [selectedReason]);

  const resolvedReason = selectedReason === "other" ? customReason.trim() : reasonLabel;

  const canReject = useMemo(
    () => !loading && Boolean(onReject) && Boolean(p?.id) && Boolean(resolvedReason),
    [loading, onReject, p, resolvedReason]
  );

  const handleApprove = () => {
    if (!canApprove) return;
    onApprove?.(p);
  };

  const handleReject = () => {
    if (!canReject) return;
    onReject?.(p, resolvedReason);
  };

  const title = isApprove ? "Approve request" : isReject ? "Reject request" : "Review request";
  const subtitle = isApprove
    ? "Confirm approval to move this request forward."
    : isReject
    ? "Provide or select a reason for rejection."
    : "Approve or reject this request.";

  const Icon = isReject ? XCircle : CheckCircle2;

  const meta = useMemo(() => {
    if (!p) return null;

    const ref = niceText(p.reference_no);
    const supplier = niceText(p.supplier_name);

    const item = [
      niceText(p.product_name),
      p.variant ? `(${String(p.variant).trim()})` : "",
    ]
      .filter(Boolean)
      .join(" ");

    return {
      ref,
      supplier,
      item,
    };
  }, [p]);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      layout="compact"
      title={title}
      subtitle={subtitle}
      icon={Icon}
      maxWidthClass="max-w-2xl"
      bodyClassName="p-4"
      footerClassName="p-4 pt-0"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 focus:ring-4 focus:ring-teal-500/15 disabled:opacity-60"
          >
            Cancel
          </button>

          {isReject ? (
            <button
              type="button"
              onClick={handleReject}
              disabled={!canReject}
              className={cx(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold ring-1 transition focus:outline-none focus:ring-4",
                !canReject
                  ? "bg-slate-300 text-white ring-slate-300 cursor-not-allowed"
                  : "bg-rose-600 text-white ring-rose-600 hover:bg-rose-700 focus:ring-rose-500/25"
              )}
            >
              <XCircle className="h-4 w-4" />
              {loading ? "Processing..." : "Reject"}
            </button>
          ) : null}

          {isApprove ? (
            <button
              type="button"
              onClick={handleApprove}
              disabled={!canApprove}
              className={cx(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white ring-1 transition focus:outline-none focus:ring-4",
                !canApprove
                  ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                  : "bg-teal-600 ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25"
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              {loading ? "Processing..." : "Approve"}
            </button>
          ) : null}
        </div>
      }
    >
      {!p ? (
        <div className="rounded-3xl bg-slate-50/70 ring-1 ring-slate-200/70 p-7 text-center">
          <div className="text-base font-extrabold text-slate-900">No request selected</div>
          <div className="mt-2 text-sm text-slate-600">Pick a purchase row and open this modal again.</div>
        </div>
      ) : (
        <div className="grid gap-4">
          <PurchaseSummary purchase={p} />

          <div className="grid gap-4 lg:grid-cols-2">
            <SoftBox title="Request summary">
              <MiniStat label="Reference" value={meta?.ref || "—"} />
              <MiniStat label="Supplier" value={meta?.supplier || "—"} />
              <MiniStat label="Item" value={meta?.item || "—"} />
            </SoftBox>

            <SoftBox title={isReject ? "Rejection reason" : "Approval"}>
              {isReject ? (
                <>
                  <Field label="Reason" hint="Required to reject a request.">
                    <select
                      value={selectedReason}
                      onChange={(event) => setSelectedReason(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15"
                    >
                      <option value="">Select a reason</option>
                      {REJECTION_REASONS.map((reasonOption) => (
                        <option key={reasonOption.value} value={reasonOption.value}>
                          {reasonOption.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  {selectedReason === "other" ? (
                    <Field label="Custom reason" hint="Describe the issue in detail.">
                      <Textarea
                        icon={StickyNote}
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        rows={4}
                        placeholder="Explain why this request is being rejected"
                      />
                    </Field>
                  ) : null}

                  {resolvedReason ? (
                    <div className="rounded-3xl bg-white/70 ring-1 ring-slate-200/70 p-4">
                      <div className="text-xs font-semibold text-slate-600">Preview</div>
                      <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">
                        {resolvedReason.length > 180 ? `${resolvedReason.slice(0, 180)}…` : resolvedReason}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3xl bg-white/60 ring-1 ring-slate-200/60 p-4">
                      <div className="text-sm font-semibold text-slate-700">No reason yet</div>
                      <div className="mt-1 text-xs text-slate-500">Select a reason to enable Reject.</div>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-3xl bg-white/70 ring-1 ring-slate-200/70 p-4">
                  <div className="text-xs font-semibold text-slate-600">No comments needed</div>
                  <div className="mt-2 text-sm text-slate-700">
                    Approving will move this request to the next step.
                  </div>
                </div>
              )}
            </SoftBox>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
