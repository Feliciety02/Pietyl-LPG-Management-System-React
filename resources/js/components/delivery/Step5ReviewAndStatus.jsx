import React from "react";
import { MapPin, Clock, Camera, PenLine, Package, UserX2 } from "lucide-react";
import { Section, InfoRow, StatusPill, formatDateTime, cx } from "./DeliveryShared";

export default function Step5ReviewAndStatus({
  delivery,
  items,
  geo,
  capturedAt,
  photoPreview,
  signatureData,
  customerAvailable,
  absenceReason,
  absenceOther,
  status,
  onStatusChange,
  readOnly = false,
}) {
  const absenceText =
    customerAvailable === "no"
      ? absenceReason === "Others"
        ? absenceOther
        : absenceReason
      : "";

  return (
    <Section
      title="Review and final status"
      subtitle="Check the summary before finishing the delivery."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <InfoRow icon={MapPin} label="Customer" value={delivery?.customer_name || "-"} />
        <InfoRow icon={MapPin} label="Address" value={delivery?.address || "-"} />
        <InfoRow icon={Clock} label="Geolocation" value={geo?.lat && geo?.lng ? `${geo.lat}, ${geo.lng}` : "-"} />
        <InfoRow icon={Clock} label="Timestamp" value={capturedAt ? formatDateTime(capturedAt) : "-"} />
      </div>

      <div className="mt-4">
        <div className="text-xs font-extrabold text-slate-700">Delivered items</div>
        <div className="mt-2 space-y-2">
          {items.length ? (
            items.map((item, idx) => (
              <div
                key={item.key || idx}
                className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-3 py-2"
              >
                <div className="text-sm font-semibold text-slate-900 truncate">{item.name}</div>
                <div className="text-sm font-extrabold text-slate-900">{item.delivered_qty}x</div>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500">No items</div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
            <Camera className="h-4 w-4 text-slate-500" />
            Proof photo
          </div>
          <div className="mt-3 h-36 w-full overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
            {photoPreview ? (
              <img src={photoPreview} alt="Proof" className="h-full w-full object-cover" />
            ) : (
              <div className="text-xs text-slate-500">No photo</div>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
            {customerAvailable === "yes" ? (
              <PenLine className="h-4 w-4 text-slate-500" />
            ) : (
              <UserX2 className="h-4 w-4 text-slate-500" />
            )}
            {customerAvailable === "yes" ? "Signature" : "Absence reason"}
          </div>
          <div className="mt-3 h-36 w-full overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
            {customerAvailable === "yes" && signatureData ? (
              <img src={signatureData} alt="Signature" className="h-full w-full object-contain" />
            ) : customerAvailable === "no" && absenceText ? (
              <div className="text-xs font-semibold text-slate-700 text-center px-2">
                {absenceText}
              </div>
            ) : (
              <div className="text-xs text-slate-500">No data</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
          <Package className="h-4 w-4 text-slate-500" />
          Final status
        </div>

        {readOnly ? (
          <div className="mt-3">
            <StatusPill status={status} />
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {["delivered", "failed"].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onStatusChange?.(opt)}
                className={cx(
                  "rounded-2xl px-4 py-2 text-xs font-extrabold ring-1 transition",
                  status === opt
                    ? opt === "delivered"
                      ? "bg-emerald-600 text-white ring-emerald-600"
                      : "bg-rose-600 text-white ring-rose-600"
                    : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                )}
              >
                {opt === "delivered" ? "Delivered" : "Failed"}
              </button>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
