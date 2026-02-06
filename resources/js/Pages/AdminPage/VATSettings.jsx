import React, { useEffect, useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import AdminPasswordConfirmModal from "@/components/modals/AdminModals/AdminPasswordConfirmModal";
import { ShieldCheck } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function StatusBadge({ active }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold ring-1",
        active ? "bg-teal-600/10 text-teal-900 ring-teal-600/20" : "bg-slate-100 text-slate-600 ring-slate-200"
      )}
    >
      {active ? "VAT Enabled" : "VAT Disabled"}
    </span>
  );
}

export default function VATSettings() {
  const page = usePage();
  const shared = page.props?.vat_settings || {};

  const [form, setForm] = useState({
    vat_registered: Boolean(shared.vat_registered),
    vat_rate: shared.vat_rate ?? 0.12,
    vat_effective_date: shared.vat_effective_date || "",
    vat_mode: shared.vat_mode || "inclusive",
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [modalError, setModalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm({
      vat_registered: Boolean(shared.vat_registered),
      vat_rate: shared.vat_rate ?? 0.12,
      vat_effective_date: shared.vat_effective_date || "",
      vat_mode: shared.vat_mode || "inclusive",
    });
  }, [shared.vat_registered, shared.vat_rate, shared.vat_effective_date, shared.vat_mode]);

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggle = () => {
    setForm((prev) => ({
      ...prev,
      vat_registered: !prev.vat_registered,
    }));
  };

  const canSave = useMemo(() => {
    if (form.vat_registered) {
      return Boolean(form.vat_rate) && Boolean(form.vat_effective_date);
    }
    return true;
  }, [form.vat_registered, form.vat_rate, form.vat_effective_date]);

  const statusHint = useMemo(() => {
    if (!form.vat_registered) {
      return "Sales are currently treated as non-VAT.";
    }
    const effective = form.vat_effective_date;
    if (!effective) return "Set the effective date to start applying VAT to new sales.";
    if (shared.vat_active) {
      return `VAT applies to sales on or after ${effective}.`;
    }
    return `VAT becomes active on ${effective}.`;
  }, [form.vat_registered, form.vat_effective_date, shared.vat_active]);

  const handleSave = () => {
    setPendingPayload({
      vat_registered: form.vat_registered ? 1 : 0,
      vat_rate: form.vat_registered ? Number(form.vat_rate) : 0,
      vat_effective_date: form.vat_registered ? form.vat_effective_date : null,
      vat_mode: form.vat_mode,
    });
    setModalError("");
    setConfirmOpen(true);
  };

  const handleConfirmed = () => {
    if (!pendingPayload) return;

    setSubmitting(true);
    router.post(
      "/dashboard/admin/settings/vat",
      pendingPayload,
      {
        preserveScroll: true,
        onSuccess: () => setConfirmOpen(false),
        onError: (errors) => {
          setModalError(errors?.message || "Unable to save VAT settings.");
        },
        onFinish: () => setSubmitting(false),
      }
    );
  };

  const globalError = page.props?.flash?.error || page.props?.errors?.message;

  return (
    <Layout title="VAT Settings">
      <div className="grid gap-6">
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-extrabold text-slate-900">VAT registration</div>
                <div className="mt-1 text-sm text-slate-500">
                  Toggle VAT registration for the company. VAT calculations only occur when this feature is enabled and the effective date is reached.
                </div>
              </div>
              <StatusBadge active={shared.vat_active} />
            </div>
            {globalError ? (
              <div className="rounded-2xl bg-rose-50 ring-1 ring-rose-500/30 px-4 py-3 text-sm font-semibold text-rose-800">
                {globalError}
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs font-extrabold text-slate-500">VAT registered</div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.vat_registered}
                    onChange={handleToggle}
                    className="sr-only"
                  />
                  <span
                    className={cx(
                      "h-7 w-14 rounded-full transition",
                      form.vat_registered ? "bg-teal-600" : "bg-slate-200"
                    )}
                  >
                    <span
                      className={cx(
                        "block h-7 w-7 rounded-full bg-white shadow-sm transition",
                        form.vat_registered ? "translate-x-7" : "translate-x-0"
                      )}
                    />
                  </span>
                  <div className="text-sm font-extrabold text-slate-700">
                    {form.vat_registered ? "VAT calculations enabled" : "VAT disabled"}
                  </div>
                </label>
                <div className="text-xs text-slate-500">{statusHint}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-extrabold text-slate-500">Current mode</div>
                <div className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                  {form.vat_mode === "inclusive" ? "VAT-inclusive pricing" : "Custom mode"}
                </div>
                <div className="text-[11px] text-slate-500">
                  Only VAT-inclusive pricing is supported right now.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-extrabold text-slate-900">VAT parameters</div>
                <div className="text-xs text-slate-500">These values control how VAT applies to sales.</div>
              </div>
              <ShieldCheck className="h-5 w-5 text-teal-600" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {form.vat_registered ? (
                <label className="grid gap-2 text-xs font-extrabold text-slate-500">
                  VAT rate (%)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.vat_rate}
                    onChange={(event) => handleFieldChange('vat_rate', event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25"
                  />
                </label>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                  VAT calculations stay hidden while registration is disabled.
                </div>
              )}

              <label className="grid gap-2 text-xs font-extrabold text-slate-500">
                Effective date
                <input
                  type="date"
                  value={form.vat_effective_date}
                  onChange={(event) => handleFieldChange('vat_effective_date', event.target.value)}
                  disabled={!form.vat_registered}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25"
                />
              </label>
            </div>

            <div className="text-xs text-slate-500">
              VAT will only apply to sales that occur on or after the effective date.
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[11px] text-slate-500">
                {shared.vat_active
                  ? `VAT is currently applying to sales. Current rate: ${(shared.vat_rate * 100).toFixed(2)}%.`
                  : form.vat_registered
                  ? `VAT will apply once the business date reaches ${form.vat_effective_date || "the effective date"}.`
                  : "VAT is turned off; sales are treated as VAT-exempt."}
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave || submitting}
                className={cx(
                  "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold ring-1 transition",
                  !canSave || submitting
                    ? "bg-slate-200 text-slate-500 ring-slate-200 cursor-not-allowed"
                    : "bg-teal-600 text-white ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25"
                )}
              >
                {submitting ? "Saving..." : "Save settings"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AdminPasswordConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirmed={handleConfirmed}
        error={modalError}
      />
    </Layout>
  );
}
