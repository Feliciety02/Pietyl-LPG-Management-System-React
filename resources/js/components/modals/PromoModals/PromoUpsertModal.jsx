import React, { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, CalendarDays, Percent, Tag, Hash } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
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

function Input({ icon: Icon, left, right, ...props }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-teal-500/30">
      {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
      {left ? (
        <div className="shrink-0 pr-2 border-r border-slate-200/70 text-xs font-extrabold text-slate-600">
          {left}
        </div>
      ) : null}
      <input
        {...props}
        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
      />
      {right ? (
        <div className="shrink-0 pl-2 border-l border-slate-200/70 text-xs font-extrabold text-slate-600">
          {right}
        </div>
      ) : null}
    </div>
  );
}

function Select({ icon: Icon, children, ...props }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-teal-500/30">
      {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
      <select
        {...props}
        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
      >
        {children}
      </select>
    </div>
  );
}

function decimalOnly(value) {
  const s = String(value || "").replace(/[^\d.]/g, "");
  const parts = s.split(".");
  if (parts.length <= 1) return s;
  return `${parts[0]}.${parts.slice(1).join("")}`;
}

function digitsOnly(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function sanitizeCode(value = "") {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/(^-|-$)/g, "");
}

function generateCodeFromLabel(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const normalized = raw
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
  const words = normalized.split(/\s+/).filter(Boolean);
  let base = "";
  if (words.length === 1) {
    base = words[0].slice(0, 3);
  } else {
    base = words.map((w) => w[0]).join("").slice(0, 6);
  }
  if (!base) base = "CODE";
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) % 10000;
  }
  const suffix = String(hash).padStart(4, "0");
  return `${base}-${suffix}`.slice(0, 50);
}

const KIND_OPTIONS = [
  { value: "promo", label: "Promo" },
  { value: "voucher", label: "Voucher" },
];

const TYPE_OPTIONS = [
  { value: "percent", label: "Percent" },
  { value: "amount", label: "Amount" },
];

export default function PromoUpsertModal({
  open,
  onClose,
  promo,
  onSubmit,
  loading = false,
}) {
  const isEdit = Boolean(promo?.id);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState("promo");
  const [discountType, setDiscountType] = useState("percent");
  const [value, setValue] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [autoCode, setAutoCode] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (promo) {
      setCode(promo.code || "");
      setName(promo.name || "");
      setKind(promo.kind || "promo");
      setDiscountType(promo.discount_type || "percent");
      setValue(String(promo.value ?? ""));
      setUsageLimit(promo.usage_limit ? String(promo.usage_limit) : "");
      setStartsAt(promo.starts_at || "");
      setExpiresAt(promo.expires_at || "");
      setAutoCode(false);
    } else {
      setCode("");
      setName("");
      setKind("promo");
      setDiscountType("percent");
      setValue("");
      setUsageLimit("");
      setStartsAt("");
      setExpiresAt("");
      setAutoCode(true);
    }
  }, [open, promo]);

  const handleCodeChange = (event) => {
    const next = event.target.value;
    const cleaned = sanitizeCode(next);
    setCode(cleaned);
    if (cleaned) {
      setAutoCode(false);
      return;
    }
    setAutoCode(true);
    if (name.trim()) {
      setCode(generateCodeFromLabel(name));
    }
  };

  const handleNameChange = (event) => {
    const next = event.target.value;
    setName(next);
    if (autoCode) {
      setCode(generateCodeFromLabel(next));
    }
  };

  const codeClean = useMemo(() => sanitizeCode(code), [code]);
  const valueClean = useMemo(() => decimalOnly(value), [value]);
  const limitClean = useMemo(() => digitsOnly(usageLimit), [usageLimit]);

  const valueNumber = Number(String(valueClean || "").replace(/,/g, ""));

  const dateOk = !startsAt || !expiresAt || expiresAt >= startsAt;
  const valueOk =
    Number.isFinite(valueNumber) &&
    valueNumber > 0 &&
    (discountType !== "percent" || valueNumber <= 100);

  const canSubmit =
    codeClean &&
    kind &&
    discountType &&
    valueOk &&
    dateOk &&
    !loading;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit?.({
      code: codeClean,
      name: name.trim() || null,
      kind,
      discount_type: discountType,
      value: String(valueClean || "").trim(),
      usage_limit: limitClean ? Number(limitClean) : null,
      starts_at: startsAt || null,
      expires_at: expiresAt || null,
    });
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-lg"
      layout="compact"
      title={isEdit ? "Edit promo or voucher" : "Create promo or voucher"}
      subtitle={isEdit ? "Update discount details and limits." : "Add a new discount code for POS."}
      icon={BadgeDollarSign}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25",
              !canSubmit
                ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                : "bg-teal-600 ring-teal-600 hover:bg-teal-700"
            )}
          >
            {loading ? "Saving..." : isEdit ? "Save changes" : "Create code"}
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code" hint="Uppercase letters, numbers, and dashes only.">
            <Input
              icon={Tag}
              value={codeClean}
              onChange={handleCodeChange}
              placeholder="LPG10"
            />
          </Field>
          <Field label="Label / name" hint="Shown on POS after validation.">
            <Input
              icon={BadgeDollarSign}
              value={name}
              onChange={handleNameChange}
              placeholder="Holiday promo"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kind">
            <Select icon={BadgeDollarSign} value={kind} onChange={(e) => setKind(e.target.value)}>
              {KIND_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Discount type">
            <Select icon={Percent} value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Value">
            <Input
              icon={discountType === "percent" ? Percent : Hash}
              value={valueClean}
              onChange={(e) => setValue(e.target.value)}
              placeholder={discountType === "percent" ? "10" : "100"}
              right={discountType === "percent" ? "%" : "PHP"}
              inputMode="decimal"
            />
            {!valueOk ? (
              <div className="mt-1 text-[11px] font-semibold text-rose-700">
                {discountType === "percent"
                  ? "Percent must be between 0 and 100."
                  : "Enter a positive amount."}
              </div>
            ) : null}
          </Field>
          <Field label="Usage limit" hint="Leave empty for unlimited.">
            <Input
              icon={Hash}
              value={limitClean}
              onChange={(e) => setUsageLimit(e.target.value)}
              placeholder="100"
              inputMode="numeric"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date" hint="Leave empty to start immediately.">
            <Input
              icon={CalendarDays}
              type="date"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </Field>
          <Field label="Expiry date" hint="Leave empty for no expiry.">
            <Input
              icon={CalendarDays}
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            {!dateOk ? (
              <div className="mt-1 text-[11px] font-semibold text-rose-700">
                Expiry must be on or after the start date.
              </div>
            ) : null}
          </Field>
        </div>
      </div>
    </ModalShell>
  );
}
