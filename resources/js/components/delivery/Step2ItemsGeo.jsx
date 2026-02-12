import React from "react";
import { MapPin, Clock, Package, RefreshCcw } from "lucide-react";
import { Section, EmptyState, formatDateTime, cx } from "./DeliveryShared";

export default function Step2ItemsGeo({
  items = [],
  geo,
  capturedAt,
  geoBusy,
  geoError,
  onCaptureLocation,
  onSetTimeNow,
}) {
  return (
    <Section
      title="Delivered items and location"
      subtitle="Items are read-only. Location and time are captured automatically."
      right={
        <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
          <Clock className="h-4 w-4 text-slate-500" />
          <div className="text-xs font-extrabold text-slate-700">
            {capturedAt ? formatDateTime(capturedAt) : "No timestamp"}
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {items.length ? (
          items.map((item, idx) => (
            <div
              key={item.key || idx}
              className="flex items-center justify-between gap-3 rounded-3xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-slate-900 truncate">
                  {item.name}
                </div>
                <div className="mt-1 text-xs text-slate-500">Quantity</div>
              </div>
              <div className="text-sm font-extrabold text-slate-900">
                {item.delivered_qty}x
              </div>
            </div>
          ))
        ) : (
          <EmptyState title="No items" desc="No delivery items found." />
        )}
      </div>

      <div className="mt-4 rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
          <MapPin className="h-4 w-4 text-slate-500" />
          Geolocation
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onCaptureLocation}
            disabled={geoBusy}
            className={cx(
              "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold ring-1 transition",
              geoBusy
                ? "bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed"
                : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
            )}
          >
            <MapPin className="h-4 w-4" />
            {geoBusy ? "Capturing..." : "Capture location"}
          </button>

          <button
            type="button"
            onClick={onSetTimeNow}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Set time now
          </button>
        </div>

        <div className="mt-3 grid gap-1 text-xs text-slate-600">
          <div>Lat: {geo?.lat || "-"}</div>
          <div>Lng: {geo?.lng || "-"}</div>
          <div>Time: {capturedAt ? formatDateTime(capturedAt) : "-"}</div>
        </div>

        {geoError ? (
          <div className="mt-2 text-xs font-semibold text-amber-700">{geoError}</div>
        ) : null}
      </div>

      <div className="mt-4 text-xs text-slate-600 flex items-center gap-2">
        <Package className="h-4 w-4 text-slate-400" />
        Items are locked to avoid mismatches.
      </div>
    </Section>
  );
}
