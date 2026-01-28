import React, { useEffect, useMemo, useState } from "react";
import ModalShell from "../ModalShell";
import { ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeText(v) {
  return String(v ?? "").trim();
}

function titleCase(s = "") {
  return String(s || "")
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatWhen(v) {
  const t = safeText(v);
  if (!t) return "Not available";
  return t;
}

function toneFromEvent(event = "") {
  const e = String(event || "").toLowerCase();
  if (e.includes("delete") || e.includes("remove")) return "danger";
  if (e.includes("disable") || e.includes("failed") || e.includes("blocked") || e.includes("deny")) return "warning";
  if (e.includes("create") || e.includes("login") || e.includes("enable") || e.includes("approved")) return "success";
  return "info";
}

function TonePill({ tone = "info", label }) {
  const map = {
    info: "bg-slate-100 text-slate-700 ring-slate-200",
    success: "bg-teal-600/10 text-teal-900 ring-teal-700/10",
    warning: "bg-amber-500/10 text-amber-900 ring-amber-700/10",
    danger: "bg-rose-500/10 text-rose-900 ring-rose-700/10",
  };

  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1", map[tone] || map.info)}>
      {label}
    </span>
  );
}

function MetaPill({ label, tone = "slate" }) {
  const tones = {
    slate: "bg-white text-slate-700 ring-slate-200",
    teal: "bg-teal-50 text-teal-900 ring-teal-100",
    amber: "bg-amber-50 text-amber-900 ring-amber-100",
    rose: "bg-rose-50 text-rose-900 ring-rose-100",
  };

  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1", tones[tone] || tones.slate)}>
      {label}
    </span>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="grid gap-2">
      <div>
        <div className="text-xs font-extrabold text-slate-700">{label}</div>
        {hint ? <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div> : null}
      </div>
      {children}
    </div>
  );
}

function ValueBox({ children }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 break-words">
      {children}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-3">
      <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-6 w-24 rounded-full bg-slate-200/80 animate-pulse" />
          <div className="h-6 w-32 rounded-full bg-slate-200/80 animate-pulse" />
          <div className="h-6 w-20 rounded-full bg-slate-200/80 animate-pulse" />
        </div>
        <div className="mt-3 h-4 w-72 rounded bg-slate-200/80 animate-pulse" />
        <div className="mt-2 h-4 w-56 rounded bg-slate-200/80 animate-pulse" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-20 rounded-2xl bg-slate-200/80 animate-pulse" />
        <div className="h-20 rounded-2xl bg-slate-200/80 animate-pulse" />
        <div className="h-20 rounded-2xl bg-slate-200/80 animate-pulse" />
        <div className="h-20 rounded-2xl bg-slate-200/80 animate-pulse" />
      </div>
    </div>
  );
}

export default function AuditDetailsModal({ open, onClose, audit }) {
  const [showTechnical, setShowTechnical] = useState(false);

  useEffect(() => {
    if (!open) return;
    setShowTechnical(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const ui = useMemo(() => {
    const event = safeText(audit?.event) || "Activity";
    const tone = toneFromEvent(event);

    const actorName = safeText(audit?.actor_name) || "System";
    const actorRole = titleCase(safeText(audit?.actor_role) || "system");

    const entityType = safeText(audit?.entity_type) || "Record";
    const entityId = safeText(audit?.entity_id) ? String(audit.entity_id) : "";

    const when = formatWhen(audit?.created_at);
    const message = safeText(audit?.message) || "No additional details were recorded.";

    const id = safeText(audit?.id) ? String(audit.id) : "";

    const ip = safeText(audit?.ip_address) || "Not available";
    const ua = safeText(audit?.user_agent) || "Not available";

    const actorLine = `${actorName} · ${actorRole}`;
    const recordLine = entityId ? `${entityType} #${entityId}` : entityType;

    return { event, tone, actorName, actorRole, entityType, entityId, when, message, id, ip, ua, actorLine, recordLine };
  }, [audit]);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-xl"
      layout="compact"
      title="Audit details"
      subtitle="A clear, read only record for review"
      icon={ShieldCheck}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
          >
            Close
          </button>
        </div>
      }
    >
      {!audit ? (
        <Skeleton />
      ) : (
        <div className="grid gap-4">
          <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <TonePill tone={ui.tone} label={titleCase(ui.event) || "Activity"} />
              <MetaPill label={ui.when} />
              {ui.id ? <MetaPill label={`Log ${ui.id}`} /> : null}
              <MetaPill label="Read only" tone="teal" />
            </div>

            <div className="mt-3 text-sm font-semibold text-slate-900">{ui.message}</div>

            <div className="mt-2 text-xs text-slate-600">
              <span className="font-extrabold text-slate-800">{ui.actorName}</span>{" "}
              <span className="text-slate-500">made a change on</span>{" "}
              <span className="font-extrabold text-slate-800">{ui.recordLine}</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Who did this" hint="The user or system that performed the action.">
              <ValueBox>{ui.actorName}</ValueBox>
            </Field>

            <Field label="Role" hint="The permission level at the time of the action.">
              <ValueBox>{ui.actorRole}</ValueBox>
            </Field>

            <Field label="What was affected" hint="The record that was changed.">
              <ValueBox>{ui.entityType}</ValueBox>
            </Field>

            <Field label="Record ID" hint="Helpful when searching or matching records.">
              <ValueBox>{ui.entityId ? String(ui.entityId) : "Not available"}</ValueBox>
            </Field>

            <Field label="Action" hint="The activity that was recorded.">
              <ValueBox>{ui.event || "Not available"}</ValueBox>
            </Field>

            <Field label="When it happened" hint="The timestamp saved by the system.">
              <ValueBox>{ui.when}</ValueBox>
            </Field>
          </div>

          <div className="rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowTechnical((v) => !v)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
            >
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-slate-900">Technical details</div>
                <div className="mt-0.5 text-[11px] text-slate-500">For IT checks and troubleshooting</div>
              </div>
              <div className="shrink-0 rounded-2xl bg-white p-2 text-slate-700 ring-1 ring-slate-200">
                {showTechnical ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>

            {showTechnical ? (
              <div className="px-4 pb-4 grid gap-4 sm:grid-cols-2">
                <Field label="IP address" hint="Where the request came from.">
                  <ValueBox>{ui.ip}</ValueBox>
                </Field>

                <Field label="Device info" hint="Browser and device signature.">
                  <ValueBox>{ui.ua}</ValueBox>
                </Field>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </ModalShell>
  );
}
