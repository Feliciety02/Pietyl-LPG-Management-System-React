  import React, { useEffect, useMemo, useState } from "react";
  import { Truck, PackageCheck, AlertTriangle, Hash, StickyNote, Tag } from "lucide-react";
  import ModalShell from "../ModalShell";
  import { PurchaseSummary } from "@/components/modals/InventoryModals/PurchaseSummary";

  function cx(...classes) {
    return classes.filter(Boolean).join(" ");
  }

  /* ---------------- helpers ---------------- */

  function decimalOnly(v) {
    const s = String(v || "").replace(/[^\d.]/g, "");
    const parts = s.split(".");
    if (parts.length <= 1) return s;
    return `${parts[0]}.${parts.slice(1).join("")}`;
  }

  function allowDecimalKeyDown(e) {
    const k = e.key;

    const allowed =
      k === "Backspace" ||
      k === "Delete" ||
      k === "Tab" ||
      k === "Enter" ||
      k === "Escape" ||
      k === "ArrowLeft" ||
      k === "ArrowRight" ||
      k === "Home" ||
      k === "End";

    if (allowed) return;
    if (e.ctrlKey || e.metaKey) return;

    if (k === ".") {
      if (String(e.currentTarget.value || "").includes(".")) e.preventDefault();
      return;
    }

    if (!/^\d$/.test(k)) e.preventDefault();
  }

  function sanitizeNumber(value) {
    const n = Number(String(value || "").replace(/,/g, ""));
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }

  /* ---------------- UI primitives ---------------- */

  function Field({ label, hint, children }) {
    return (
      <div>
        <div className="text-xs font-extrabold text-slate-700">{label}</div>
        {hint ? <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div> : null}
        <div className="mt-2">{children}</div>
      </div>
    );
  }

  function Input({ icon: Icon, children, className = "", ...props }) {
    return (
      <div className={cx("flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2 focus-within:ring-teal-500/30", className)}>
        {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
        {children ? (
          children
        ) : (
          <input
            {...props}
            className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
          />
        )}
      </div>
    );
  }

  function Textarea({ icon: Icon, rows = 2, ...props }) {
    return (
      <div className="flex items-start gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2 focus-within:ring-teal-500/30">
        {Icon ? <Icon className="mt-0.5 h-4 w-4 text-slate-500" /> : null}
        <textarea
          {...props}
          rows={rows}
          className="w-full resize-none bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
    );
  }

  function Select({ icon: Icon, value, onChange, disabled, options }) {
    return (
      <div className={cx(
        "flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2 focus-within:ring-teal-500/30",
        disabled ? "opacity-60" : ""
      )}>
        {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
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

  /* ---------------- dropdown values ---------------- */
  /*
    dropdown "not working" usually means:
    1) options have missing value, so React cannot control it
    2) key duplicates
    3) select is disabled because damaged === 0
    This version fixes #1 and #2 by giving every option a real value.
  */

  const DAMAGE_CATEGORY_OPTIONS = [
    { value: "", label: "Select category" },
    { value: "lpg", label: "LPG" },
    { value: "hose", label: "Hose" },
    { value: "stove", label: "Stove" },
    { value: "accessories", label: "Accessories" },
  ];

  const DAMAGE_TYPE_OPTIONS = [
    { value: "", label: "Select damage type" },
    { value: "leak", label: "Leak detected" },
    { value: "cracked", label: "Cracked or broken" },
    { value: "bent", label: "Bent or deformed" },
    { value: "missing_parts", label: "Missing parts" },
    { value: "rust", label: "Rust or corrosion" },
    { value: "burn_damage", label: "Burn or heat damage" },
    { value: "loose_fitting", label: "Loose fitting" },
    { value: "other", label: "Other" },
  ];

  /* ---------------- component ---------------- */

  export default function DeliveryArrivalModal({
    open,
    onClose,
    purchase,
    onConfirm,
    loading = false,
    error,
  }) {
    const [deliveredQty, setDeliveredQty] = useState("");
    const [damagedQty, setDamagedQty] = useState("");

    const [damageCategory, setDamageCategory] = useState("");
    const [damageType, setDamageType] = useState("");
    const [damageNotes, setDamageNotes] = useState("");

    const [supplierReference, setSupplierReference] = useState("");
    const [deliveryReference, setDeliveryReference] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => {
      if (!open) return;

      setDeliveredQty("");
      setDamagedQty("");

      setDamageCategory("");
      setDamageType("");
      setDamageNotes("");

      setSupplierReference("");
      setDeliveryReference("");
      setNotes("");
    }, [open]);

    const deliveredClean = useMemo(() => decimalOnly(deliveredQty), [deliveredQty]);
    const damagedClean = useMemo(() => decimalOnly(damagedQty), [damagedQty]);

    const delivered = useMemo(() => sanitizeNumber(deliveredClean), [deliveredClean]);
    const damaged = useMemo(() => sanitizeNumber(damagedClean), [damagedClean]);

    const needsDamageDetails = damaged > 0;

    useEffect(() => {
      if (needsDamageDetails) return;
      setDamageCategory("");
      setDamageType("");
      setDamageNotes("");
    }, [needsDamageDetails]);

    const canConfirm = useMemo(() => {
      if (loading) return false;
      if (!onConfirm || !purchase?.id) return false;

      if (delivered <= 0) return false;
      if (!supplierReference.trim()) return false;
      if (damaged > delivered) return false;

      if (needsDamageDetails) {
        if (!damageCategory) return false;
        if (!damageType) return false;
        if (damageType === "other" && !damageNotes.trim()) return false;
      }

      return true;
    }, [
      loading,
      onConfirm,
      purchase,
      delivered,
      damaged,
      supplierReference,
      needsDamageDetails,
      damageCategory,
      damageType,
      damageNotes,
    ]);

    const submit = async () => {
      if (!canConfirm) return;

      const typeLabel = DAMAGE_TYPE_OPTIONS.find((o) => o.value === damageType)?.label;
      const finalDamageReason =
        !needsDamageDetails ? null : damageType === "other" ? damageNotes.trim() : typeLabel || damageType;

      await onConfirm?.(purchase, {
        delivered_qty: delivered,
        damaged_qty: damaged,
        damage_category: needsDamageDetails ? damageCategory : null,
        damage_reason: finalDamageReason,
        supplier_reference: supplierReference.trim(),
        delivery_reference: deliveryReference.trim() || null,
        notes: notes.trim() || null,
      });
    };

    return (
      <ModalShell
        open={open}
        onClose={onClose}
        layout="compact"
        maxWidthClass="max-w-6xl"
        title="Confirm arrival"
        subtitle="Fast, clean delivery entry."
        icon={Truck}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={submit}
              disabled={!canConfirm}
              className={cx(
                "rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25",
                !canConfirm
                  ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                  : "bg-teal-600 ring-teal-600 hover:bg-teal-700"
              )}
            >
              {loading ? "Processing..." : "Mark as delivered"}
            </button>
          </div>
        }
      >
        <div className="grid gap-3">
          <PurchaseSummary purchase={purchase} />

          {error ? (
            <div className="rounded-2xl bg-rose-50 ring-1 ring-rose-200 px-4 py-3 text-sm font-semibold text-rose-900">
              {error}
            </div>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-3">
            {/* 1: Quantities */}
            <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-4">
              <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500 uppercase">Quantities</div>
              <div className="mt-3 grid gap-3">
                <Field label="Delivered" hint="Required">
                  <Input
                    icon={PackageCheck}
                    value={deliveredClean}
                    onKeyDown={allowDecimalKeyDown}
                    onChange={(e) => setDeliveredQty(decimalOnly(e.target.value))}
                    placeholder="0"
                    inputMode="decimal"
                  />
                </Field>

                <Field label="Damaged" hint="Optional">
                  <Input
                    icon={AlertTriangle}
                    value={damagedClean}
                    onKeyDown={allowDecimalKeyDown}
                    onChange={(e) => setDamagedQty(decimalOnly(e.target.value))}
                    placeholder="0"
                    inputMode="decimal"
                  />
                </Field>

                {damaged > delivered && delivered > 0 ? (
                  <div className="rounded-2xl bg-rose-50 ring-1 ring-rose-200 px-3 py-2 text-xs font-semibold text-rose-900">
                    Damaged cannot exceed delivered.
                  </div>
                ) : null}
              </div>
            </div>

            {/* 2: References */}
            <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-4">
              <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500 uppercase">References</div>
              <div className="mt-3 grid gap-3">
                <Field label="Supplier reference" hint="Required">
                  <Input
                    icon={Hash}
                    value={supplierReference}
                    onChange={(e) => setSupplierReference(e.target.value)}
                    placeholder="Receipt or reference number"
                  />
                </Field>

                <Field label="Delivery reference" hint="Optional">
                  <Input
                    icon={Hash}
                    value={deliveryReference}
                    onChange={(e) => setDeliveryReference(e.target.value)}
                    placeholder="Delivery reference"
                  />
                </Field>
              </div>
            </div>

            {/* 3: Damage + Notes */}
            <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-extrabold tracking-[0.22em] text-slate-500 uppercase">Damage + notes</div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Dropdown unlocks when damaged is above zero.
                  </div>
                </div>

                <span
                  className={cx(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
                    needsDamageDetails
                      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
                      : "bg-slate-100 text-slate-700 ring-slate-200"
                  )}
                >
                  {needsDamageDetails ? "REQUIRED" : "OPTIONAL"}
                </span>
              </div>

              <div className="mt-3 grid gap-3">
                <Field label="Damage category" hint={needsDamageDetails ? "Required" : "Disabled"}>
                  <Select
                    icon={Tag}
                    value={damageCategory}
                    onChange={(e) => setDamageCategory(e.target.value)}
                    disabled={!needsDamageDetails}
                    options={DAMAGE_CATEGORY_OPTIONS}
                  />
                </Field>

                <Field label="Damage type" hint={needsDamageDetails ? "Required" : "Disabled"}>
                  <Select
                    icon={AlertTriangle}
                    value={damageType}
                    onChange={(e) => setDamageType(e.target.value)}
                    disabled={!needsDamageDetails}
                    options={DAMAGE_TYPE_OPTIONS}
                  />
                </Field>

                {needsDamageDetails && damageType === "other" ? (
                  <Field label="Other damage details" hint="Required when type is Other">
                    <Textarea
                      icon={StickyNote}
                      value={damageNotes}
                      onChange={(e) => setDamageNotes(e.target.value)}
                      rows={2}
                      placeholder="Describe the damage"
                    />
                  </Field>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </ModalShell>
    );
  }
