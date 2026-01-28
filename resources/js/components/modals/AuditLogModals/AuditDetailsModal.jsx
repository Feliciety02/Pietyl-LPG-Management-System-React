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

function toneFromEvent(event = "") {
  const e = String(event || "").toLowerCase();
  if (e.includes("delete") || e.includes("remove")) return "danger";
  if (e.includes("disable") || e.includes("deny") || e.includes("failed") || e.includes("blocked")) return "warning";
  if (e.includes("create") || e.includes("approve") || e.includes("enable") || e.includes("login")) return "success";
  return "info";
}

function ToneBadge({ tone = "info", label }) {
  const map = {
    info: "bg-slate-100 text-slate-800 ring-slate-200",
    success: "bg-teal-50 text-teal-900 ring-teal-100",
    warning: "bg-amber-50 text-amber-900 ring-amber-100",
    danger: "bg-rose-50 text-rose-900 ring-rose-100",
  };

  return (
    <span className={cx("inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold ring-1", map[tone] || map.info)}>
      {label}
    </span>
  );
}

function Pair({ label, value }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 px-4 py-3">
      <div className="text-[11px] font-extrabold text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900 break-words">
        {value || "—"}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-white ring-1 ring-slate-200 px-4 py-3">
      <div className="text-[12px] font-extrabold text-slate-600">{label}</div>
      <div className="text-[12px] font-semibold text-slate-900 text-right break-words max-w-[70%]">
        {value || "—"}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-3">
      <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-4">
        <div className="h-5 w-44 rounded bg-slate-200/80 animate-pulse" />
        <div className="mt-3 h-4 w-3/4 rounded bg-slate-200/80 animate-pulse" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="h-16 rounded-2xl bg-slate-200/80 animate-pulse" />
        <div className="h-16 rounded-2xl bg-slate-200/80 animate-pulse" />
        <div className="h-16 rounded-2xl bg-slate-200/80 animate-pulse" />
        <div className="h-16 rounded-2xl bg-slate-200/80 animate-pulse" />
      </div>
    </div>
  );
}

export default function AuditDetailsModal({ open, onClose, audit }) {
  const [techOpen, setTechOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTechOpen(false);
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
    const eventRaw = safeText(audit?.event);
    const event = titleCase(eventRaw) || "Activity";
    const tone = toneFromEvent(eventRaw);

    const who = safeText(audit?.actor_name) || "System";
    const role = titleCase(safeText(audit?.actor_role) || "system");

    const when = safeText(audit?.created_at) || "Not available";

    const type = safeText(audit?.entity_type) || "Record";
    const entityId = safeText(audit?.entity_id);
    const record = entityId ? `${type} #${entityId}` : type;

    const message =
      safeText(audit?.message) ||
      `${who} performed ${event.toLowerCase()} on ${record}.`;

    const logId = safeText(audit?.id) ? String(audit.id) : "";
    const ip = safeText(audit?.ip_address) || "";
    const device = safeText(audit?.user_agent) || "";

    return { event, tone, who, role, when, record, message, logId, ip, device };
  }, [audit]);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-4xl"
      layout="compact"
      title="Activity log"
      subtitle="Simple for everyone, with optional technical details"
      icon={ShieldCheck}

    >
      {!audit ? (
        <Skeleton />
      ) : (
        <div className="grid gap-4">
          <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <ToneBadge tone={ui.tone} label={ui.event} />
              <span className="text-[11px] font-semibold text-slate-600">{ui.when}</span>
            </div>

            <div className="mt-3 text-base font-extrabold text-slate-900">
              {ui.message}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Pair label="Who" value={ui.who} />
            <Pair label="When" value={ui.when} />
            <Pair label="What" value={ui.event} />
            <Pair label="Affected" value={ui.record} />
          </div>

          <div className="rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setTechOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 focus:ring-4 focus:ring-teal-500/15"
            >
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-slate-900">Technical details</div>
                <div className="mt-0.5 text-[11px] text-slate-500">Only needed for troubleshooting</div>
              </div>
              <div className="shrink-0 rounded-2xl bg-white p-2 text-slate-700 ring-1 ring-slate-200">
                {techOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>

            {techOpen ? (
              <div className="px-4 pb-4 grid gap-2">
                <Row label="Role at the time" value={ui.role} />
                <Row label="Log ID" value={ui.logId} />
                <Row label="IP address" value={ui.ip} />
                <Row label="Device info" value={ui.device} />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </ModalShell>
  );
}
