import React, { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function titleCase(s = "") {
  return String(s || "")
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function TonePill({ tone, label }) {
  const map = {
    info: "bg-slate-100 text-slate-700 ring-slate-200",
    success: "bg-teal-600/10 text-teal-900 ring-teal-700/10",
    warning: "bg-amber-500/10 text-amber-900 ring-amber-700/10",
    danger: "bg-rose-500/10 text-rose-900 ring-rose-700/10",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        map[tone] || map.info
      )}
    >
      {label}
    </span>
  );
}

function eventTone(event = "") {
  const e = String(event || "").toLowerCase();

  if (e.includes("delete")) return "danger";
  if (e.includes("disable") || e.includes("failed") || e.includes("blocked")) return "warning";
  if (e.includes("create") || e.includes("login") || e.includes("enable")) return "success";

  return "info";
}

function TopCard({ title, subtitle, right }) {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
      <div className="p-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-lg font-extrabold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
        </div>
        {right}
      </div>
    </div>
  );
}

export default function AuditLogs() {
  const page = usePage();

  /*
    Expected Inertia props from backend:
    audits: {
      data: [{
        id,
        created_at,
        actor_name,
        actor_role,
        event,          // e.g. "user.login", "employee.update", "inventory.adjust"
        entity_type,    // e.g. "User", "Employee", "Sale", "Delivery"
        entity_id,
        message,        // short description
        ip_address,
        user_agent
      }],
      meta,
      links
    }
    filters: { q, event, entity_type, date_from, date_to, page, per }
  */

  // DEV ONLY – sample logs for UI development
  const SAMPLE_AUDITS = {
    data: [
      {
        id: 1001,
        created_at: "2026-01-19 09:12",
        actor_name: "Maria Santos",
        actor_role: "admin",
        event: "user.login",
        entity_type: "User",
        entity_id: 1,
        message: "User logged in successfully",
        ip_address: "127.0.0.1",
        user_agent: "Chrome",
      },
      {
        id: 1002,
        created_at: "2026-01-19 10:03",
        actor_name: "Maria Santos",
        actor_role: "admin",
        event: "employee.update",
        entity_type: "Employee",
        entity_id: 6,
        message: "Employee status set to resigned",
        ip_address: "127.0.0.1",
        user_agent: "Chrome",
      },
      {
        id: 1003,
        created_at: "2026-01-19 11:18",
        actor_name: "Juan Dela Cruz",
        actor_role: "cashier",
        event: "sale.create",
        entity_type: "Sale",
        entity_id: 412,
        message: "Recorded a sale (walk in)",
        ip_address: "127.0.0.1",
        user_agent: "Chrome",
      },
      {
        id: 1004,
        created_at: "2026-01-19 12:40",
        actor_name: "Ana Reyes",
        actor_role: "accountant",
        event: "remittance.verify",
        entity_type: "Remittance",
        entity_id: 55,
        message: "Remittance verified",
        ip_address: "127.0.0.1",
        user_agent: "Chrome",
      },
      {
        id: 1005,
        created_at: "2026-01-19 13:22",
        actor_name: "Maria Santos",
        actor_role: "admin",
        event: "user.disable",
        entity_type: "User",
        entity_id: 9,
        message: "Disabled user account",
        ip_address: "127.0.0.1",
        user_agent: "Chrome",
      },
    ],
    meta: {
      current_page: 1,
      last_page: 1,
      from: 1,
      to: 5,
      total: 5,
    },
  };

  const audits =
    page.props?.audits ??
    (import.meta.env.DEV ? SAMPLE_AUDITS : { data: [], meta: null });

  const rows = audits?.data || [];
  const meta = audits?.meta || null;

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const eventInitial = query?.event || "all";
  const entityInitial = query?.entity_type || "all";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [event, setEvent] = useState(eventInitial);
  const [entityType, setEntityType] = useState(entityInitial);

  const eventOptions = [
    { value: "all", label: "All events" },
    { value: "user.login", label: "User login" },
    { value: "user.create", label: "User created" },
    { value: "user.disable", label: "User disabled" },
    { value: "employee.update", label: "Employee updated" },
    { value: "sale.create", label: "Sale created" },
    { value: "delivery.update", label: "Delivery updated" },
    { value: "inventory.adjust", label: "Inventory adjusted" },
    { value: "remittance.verify", label: "Remittance verified" },
  ];

  const entityOptions = [
    { value: "all", label: "All entities" },
    { value: "User", label: "User" },
    { value: "Employee", label: "Employee" },
    { value: "Sale", label: "Sale" },
    { value: "Delivery", label: "Delivery" },
    { value: "Inventory", label: "Inventory" },
    { value: "Remittance", label: "Remittance" },
  ];

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/admin/audit",
      { q, event, entity_type: entityType, per: perInitial, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const handleSearch = (value) => {
    setQ(value);
    pushQuery({ q: value, page: 1 });
  };

  const handleEvent = (value) => {
    setEvent(value);
    pushQuery({ event: value, page: 1 });
  };

  const handleEntity = (value) => {
    setEntityType(value);
    pushQuery({ entity_type: value, page: 1 });
  };

  const handlePerPage = (n) => pushQuery({ per: n, page: 1 });
  const handlePrev = () => meta && meta.current_page > 1 && pushQuery({ page: meta.current_page - 1 });
  const handleNext = () => meta && meta.current_page < meta.last_page && pushQuery({ page: meta.current_page + 1 });

  const loading = Boolean(page.props?.loading);
  const fillerRows = useMemo(
    () => Array.from({ length: perInitial }).map((_, i) => ({ id: `__filler__${i}`, __filler: true })),
    [perInitial]
  );

  const tableRows = loading ? fillerRows : rows;

  const columns = useMemo(
    () => [
      {
        key: "when",
        label: "When",
        render: (a) =>
          a?.__filler ? (
            <SkeletonLine w="w-24" />
          ) : (
            <div className="text-sm font-semibold text-slate-900">{a.created_at}</div>
          ),
      },
      {
        key: "actor",
        label: "Actor",
        render: (a) =>
          a?.__filler ? (
            <SkeletonLine w="w-36" />
          ) : (
            <div>
              <div className="font-extrabold text-slate-900">{a.actor_name || "System"}</div>
              <div className="text-xs text-slate-500">{titleCase(a.actor_role || "system")}</div>
            </div>
          ),
      },
      {
        key: "event",
        label: "Event",
        render: (a) =>
          a?.__filler ? (
            <SkeletonPill w="w-24" />
          ) : (
            <TonePill tone={eventTone(a.event)} label={a.event} />
          ),
      },
      {
        key: "entity",
        label: "Entity",
        render: (a) =>
          a?.__filler ? (
            <SkeletonLine w="w-28" />
          ) : (
            <div className="text-sm text-slate-700">
              {a.entity_type}
              {a.entity_id ? <span className="text-slate-400"> #{a.entity_id}</span> : null}
            </div>
          ),
      },
      {
        key: "message",
        label: "Details",
        render: (a) =>
          a?.__filler ? (
            <SkeletonLine w="w-48" />
          ) : (
            <div className="text-sm text-slate-700">{a.message || "-"}</div>
          ),
      },
    ],
    []
  );

  return (
    <Layout title="Audit Logs">
      <div className="grid gap-6">
        <TopCard
          title="Audit Logs"
          subtitle="Read only system activity for accountability and investigation."
          right={
            <div className="inline-flex items-center gap-2 rounded-2xl bg-teal-600/10 px-3 py-2 ring-1 ring-teal-700/10">
              <ShieldCheck className="h-4 w-4 text-teal-700" />
              <div className="text-xs font-extrabold text-teal-900">Read only</div>
            </div>
          }
        />

        <DataTableFilters
          q={q}
          onQ={handleSearch}
          placeholder="Search actor, event, entity, or details..."
          filters={[
            { key: "event", value: event, onChange: handleEvent, options: eventOptions },
            { key: "entity_type", value: entityType, onChange: handleEntity, options: entityOptions },
          ]}
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          emptyTitle="No audit logs found"
          emptyHint="Try a different search or filter."
          renderActions={(a) =>
            a?.__filler ? (
              <SkeletonButton w="w-20" />
            ) : (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                  title="View details (optional modal later)"
                  onClick={() => {
                    // Optional later: open a modal with full JSON payload
                    // Keep audit logs read-only
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Details
                </button>
              </div>
            )
          }
        />

        <DataTablePagination
          meta={meta}
          perPage={perInitial}
          onPerPage={handlePerPage}
          onPrev={handlePrev}
          onNext={handleNext}
          disablePrev={!meta || meta.current_page <= 1}
          disableNext={!meta || meta.current_page >= meta.last_page}
        />
      </div>
    </Layout>
  );
}