import React, { useEffect, useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import AdminPasswordConfirmModal from "@/components/modals/AdminModals/AdminPasswordConfirmModal";
import {
  ShieldCheck,
  BadgeCheck,
  CalendarDays,
  Percent,
  Info,
} from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function SectionCard({ title, subtitle, right, children }) {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
      <div className="px-6 py-5 border-b border-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-slate-900">{title}</div>
            {subtitle ? <div className="mt-1 text-xs text-slate-500">{subtitle}</div> : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-extrabold ring-1",
        active
          ? "bg-teal-600/10 text-teal-900 ring-teal-600/20"
          : "bg-slate-100 text-slate-700 ring-slate-200"
      )}
    >
      <span
        className={cx(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-teal-600" : "bg-slate-400"
        )}
      />
      {active ? "VAT Active" : "VAT Inactive"}
    </span>
  );
}

function Toggle({ checked, onChange, disabled, label, hint }) {
  return (
    <div className={cx("rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4", disabled && "opacity-70")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-slate-900">{label}</div>
          {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
        </div>

        <button
          type="button"
          onClick={() => !disabled && onChange?.(!checked)}
          disabled={disabled}
          className={cx(
            "relative inline-flex h-8 w-14 items-center rounded-full ring-1 transition focus:outline-none focus:ring-4",
            checked
              ? "bg-teal-600 ring-teal-600 focus:ring-teal-500/25"
              : "bg-white ring-slate-200 hover:bg-slate-50 focus:ring-teal-500/15",
            disabled && "cursor-not-allowed"
          )}
          aria-pressed={checked}
        >
          <span
            className={cx(
              "inline-block h-7 w-7 transform rounded-full bg-white shadow-sm transition",
              checked ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>
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

function Input({ icon: Icon, className = "", ...props }) {
  return (
    <div
      className={cx(
        "flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5",
        "transition focus-within:ring-2 focus-within:ring-teal-500/25",
        className
      )}
    >
      {Icon ? <Icon className="h-4 w-4 text-slate-500 shrink-0" /> : null}
      <input
        {...props}
        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
      />
    </div>
  );
}

function Select({ icon: Icon, className = "", children, ...props }) {
  return (
    <div
      className={cx(
        "flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5",
        "transition focus-within:ring-2 focus-within:ring-teal-500/25",
        className
      )}
    >
      {Icon ? <Icon className="h-4 w-4 text-slate-500 shrink-0" /> : null}
      <select
        {...props}
        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
      >
        {children}
      </select>
    </div>
  );
}

function PrimaryButton({ disabled, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold ring-1 transition focus:outline-none focus:ring-4",
        disabled
          ? "bg-slate-200 text-slate-500 ring-slate-200 cursor-not-allowed"
          : "bg-teal-600 text-white ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25"
      )}
    >
      {children}
    </button>
  );
}

function InlineHint({ tone = "slate", icon: Icon = Info, children }) {
  const tones = {
    slate: "bg-slate-50 text-slate-700 ring-slate-200",
    teal: "bg-teal-600/10 text-teal-950 ring-teal-700/10",
    amber: "bg-amber-600/10 text-amber-950 ring-amber-700/10",
    rose: "bg-rose-600/10 text-rose-950 ring-rose-700/10",
  };

  return (
    <div className={cx("rounded-3xl p-4 ring-1", tones[tone] || tones.slate)}>
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-slate-600" />
        </div>
        <div className="text-xs leading-relaxed font-semibold">{children}</div>
      </div>
    </div>
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

  const handleFieldChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const canSave = useMemo(() => {
    if (form.vat_registered) {
      return Boolean(form.vat_rate) && Boolean(form.vat_effective_date);
    }
    return true;
  }, [form.vat_registered, form.vat_rate, form.vat_effective_date]);

  const statusHint = useMemo(() => {
    if (!form.vat_registered) return "Sales are treated as non VAT."
    const effective = form.vat_effective_date;
    if (!effective) return "Set an effective date to start applying VAT to new sales.";
    if (shared.vat_active) return `VAT applies to sales on or after ${effective}.`;
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
    router.post("/dashboard/admin/settings/vat", pendingPayload, {
      preserveScroll: true,
      onSuccess: () => setConfirmOpen(false),
      onError: (errors) => setModalError(errors?.message || "Unable to save VAT settings."),
      onFinish: () => setSubmitting(false),
    });
  };

  const globalError = page.props?.flash?.error || page.props?.errors?.message;

  const summaryText = useMemo(() => {
    if (shared.vat_active) {
      return `VAT is currently applying to sales. Current rate ${(shared.vat_rate * 100).toFixed(2)}%.`;
    }
    if (form.vat_registered) {
      return `VAT will apply once the business date reaches ${form.vat_effective_date || "the effective date"}.`;
    }
    return "VAT is turned off. Sales are treated as VAT exempt.";
  }, [shared.vat_active, shared.vat_rate, form.vat_registered, form.vat_effective_date]);

  return (
    <Layout title="VAT Settings">
      <div className="grid gap-6">
        <SectionCard
          title="VAT registration"
          subtitle="Enable VAT then set the rate and effective date. VAT only applies once the effective date is reached."
          right={<StatusBadge active={Boolean(shared.vat_active)} />}
        >
          {globalError ? (
            <div className="rounded-3xl bg-rose-50 ring-1 ring-rose-500/30 px-5 py-4 text-sm font-semibold text-rose-900">
              {globalError}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <Toggle
              checked={form.vat_registered}
              onChange={(next) => handleFieldChange("vat_registered", next)}
              label={form.vat_registered ? "VAT enabled" : "VAT disabled"}
              hint={statusHint}
            />

            <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center shrink-0">
                  <BadgeCheck className="h-5 w-5 text-teal-700" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-slate-900">Pricing mode</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Only VAT inclusive pricing is supported right now.
                  </div>

                  <div className="mt-3">
                    <Select
                      icon={ShieldCheck}
                      value={form.vat_mode}
                      onChange={(e) => handleFieldChange("vat_mode", e.target.value)}
                      disabled
                    >
                      <option value="inclusive">VAT inclusive pricing</option>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <InlineHint tone={form.vat_registered ? "teal" : "slate"}>
              {summaryText}
            </InlineHint>
          </div>
        </SectionCard>

        <SectionCard
          title="VAT parameters"
          subtitle="These values control how VAT applies to sales."
          right={<ShieldCheck className="h-5 w-5 text-teal-600" />}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="VAT rate"
              hint="Enter a decimal. Example 0.12 for 12%."
            >
              <Input
                icon={Percent}
                type="number"
                min="0"
                step="0.01"
                value={form.vat_rate}
                onChange={(e) => handleFieldChange("vat_rate", e.target.value)}
                disabled={!form.vat_registered}
                placeholder="0.12"
              />
              {!form.vat_registered ? (
                <div className="mt-2 text-[11px] text-slate-500">
                  Enable VAT to edit the rate.
                </div>
              ) : null}
            </Field>

            <Field
              label="Effective date"
              hint="VAT will apply to sales on or after this date."
            >
              <Input
                icon={CalendarDays}
                type="date"
                value={form.vat_effective_date}
                onChange={(e) => handleFieldChange("vat_effective_date", e.target.value)}
                disabled={!form.vat_registered}
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-500">
              {summaryText}
            </div>

            <PrimaryButton disabled={!canSave || submitting} onClick={handleSave}>
              {submitting ? "Saving..." : "Save settings"}
            </PrimaryButton>
          </div>

          {modalError ? (
            <div className="mt-4 rounded-3xl bg-rose-50 ring-1 ring-rose-500/30 px-5 py-4 text-sm font-semibold text-rose-900">
              {modalError}
            </div>
          ) : null}
        </SectionCard>
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
