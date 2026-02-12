import React from "react";
import { MapPin, Phone, Navigation, Clock } from "lucide-react";
import {
  Section,
  InfoRow,
  StatusPill,
  ActionBtn,
  EmptyState,
  mapsEmbedUrl,
  mapsOpenUrl,
} from "./DeliveryShared";

export default function Step1CustomerInfo({
  delivery,
  address,
  confirmed,
  onConfirmOnTheWay,
}) {
  if (!delivery) {
    return (
      <EmptyState
        title="Select a customer"
        desc="Choose a delivery on the left to start the stepper flow."
      />
    );
  }

  return (
    <Section
      title="Customer information"
      subtitle="Confirm customer details and mark On The Way."
      right={<StatusPill status={delivery.status} />}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <InfoRow icon={Phone} label="Phone" value={delivery.customer_phone || "No phone provided"} />
        <InfoRow icon={MapPin} label="Address" value={delivery.address || "No address provided"} />
        <InfoRow icon={Clock} label="Scheduled" value={delivery.scheduled_at || "Scheduled"} />
        <InfoRow icon={MapPin} label="Landmark" value={delivery.landmark || "-"} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {address ? (
          <a
            href={mapsOpenUrl(address)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition"
          >
            <Navigation className="h-4 w-4" />
            Open Maps
          </a>
        ) : null}

        {delivery.customer_phone ? (
          <a
            href={`tel:${delivery.customer_phone}`}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition"
          >
            <Phone className="h-4 w-4" />
            Call
          </a>
        ) : null}
      </div>

      <div className="mt-4">
        {address ? (
          <div className="overflow-hidden rounded-3xl ring-1 ring-slate-200">
            <iframe
              title="Delivery map"
              src={mapsEmbedUrl(address)}
              width="100%"
              height="260"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block"
            />
          </div>
        ) : (
          <EmptyState title="No address available" desc="This delivery has no address to show." />
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-600">
          Confirm you are leaving for this delivery.
        </div>
        <ActionBtn tone="primary" disabled={confirmed} onClick={onConfirmOnTheWay} icon={Navigation}>
          {confirmed ? "On the way confirmed" : "On the way"}
        </ActionBtn>
      </div>
    </Section>
  );
}
