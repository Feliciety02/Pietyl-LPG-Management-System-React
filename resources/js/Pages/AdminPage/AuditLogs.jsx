import React, { useEffect, useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";

import {
  ShieldCheck,
  Eye,
  KeyRound,
  Users,
  ShoppingCart,
  Boxes,
  Banknote,
} from "lucide-react";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

import { TableActionButton } from "@/components/Table/ActionTableButton";
import AuditDetailsModal from "@/components/modals/AuditLogModals/AuditDetailsModal";

function cx() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join(" ");
}

function titleCase(s) {
  return String(s || "")
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

function TonePill(props) {
  const tone = props.tone;
  const label = props.label;

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

function eventTone(event) {
  const e = String(event || "").toLowerCase();

  if (e.indexOf("delete") >= 0) return "danger";
  if (e.indexOf("disable") >= 0 || e.indexOf("failed") >= 0 || e.indexOf("blocked") >= 0) return "warning";
  if (e.indexOf("create") >= 0 || e.indexOf("login") >= 0 || e.indexOf("enable") >= 0) return "success";

  return "info";
}

function TopCard(props) {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
      <div className="p-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-lg font-extrabold text-slate-900">{props.title}</div>
          <div className="mt-1 text-sm text-slate-600">{props.subtitle}</div>
        </div>
        {props.right}
      </div>
    </div>
  );
}

function Tabs({ tabs, value, onChange }) {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
      <div className="p-3 flex flex-wrap gap-2">
        {tabs.map(function (t) {
          const active = t.value === value;

          return (
            <button
              key={t.value}
              type="button"
              onClick={function () {
                onChange(t.value);
              }}
              className={cx(
                "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold ring-1 transition",
                active
                  ? "bg-teal-600 text-white ring-teal-600 hover:bg-teal-700"
                  : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"
              )}
            >
              {t.Icon ? (
                <t.Icon className={cx("h-4 w-4", active ? "text-white" : "text-slate-600")} />
              ) : null}
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function roleFromPage(page) {
  const fromAuth = page?.props?.auth?.user?.role;
  if (fromAuth) return String(fromAuth);

  const fromUser = page?.props?.user?.role;
  if (fromUser) return String(fromUser);

  return "admin";
}

function auditBasePathForRole(role) {
  const r = String(role || "").toLowerCase();

  if (r === "admin") return "/dashboard/admin/audit";
  if (r === "accountant") return "/dashboard/accountant/audit";
  if (r === "cashier") return "/dashboard/cashier/audit";
  if (r === "inventory_manager") return "/dashboard/inventory/audit";
  if (r === "rider") return "/dashboard/rider/audit";

  return "/dashboard/admin/audit";
}

function allowedSectorsForRole(role) {
  const r = String(role || "").toLowerCase();

  if (r === "admin") return ["all", "access", "people", "sales", "inventory", "finance"];

  if (r === "accountant") return ["finance", "sales"];
  if (r === "cashier") return ["sales"];
  if (r === "inventory_manager") return ["inventory"];
  if (r === "rider") return ["sales"];

  return ["all"];
}

function defaultSectorForRole(role) {
  const r = String(role || "").toLowerCase();

  if (r === "accountant") return "finance";
  if (r === "cashier") return "sales";
  if (r === "inventory_manager") return "inventory";
  if (r === "rider") return "sales";

  return "all";
}

export default function AuditLogs() {
  const page = usePage();

  const role = roleFromPage(page);
  const basePath = auditBasePathForRole(role);

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
    ],
    meta: { current_page: 1, last_page: 1, total: 3 },
  };

  const audits =
    page.props && page.props.audits
      ? page.props.audits
      : import.meta.env.DEV
      ? SAMPLE_AUDITS
      : { data: [], meta: null };

  const rows = audits && audits.data ? audits.data : [];
  const meta = audits && audits.meta ? audits.meta : null;

  const query = page.props && page.props.filters ? page.props.filters : {};
  const per = Number(query.per || 10);

  const allowedSectors = allowedSectorsForRole(role);

  const [q, setQ] = useState(query.q || "");
  const [event, setEvent] = useState(query.event || "all");
  const [entityType, setEntityType] = useState(query.entity_type || "all");

  const initialSector = allowedSectors.indexOf(query.sector) >= 0 ? query.sector : defaultSectorForRole(role);
  const [sector, setSector] = useState(initialSector);

  const allSectorTabs = [
    { value: "all", label: "All", Icon: ShieldCheck },
    { value: "access", label: "Access", Icon: KeyRound },
    { value: "people", label: "People", Icon: Users },
    { value: "sales", label: "Sales", Icon: ShoppingCart },
    { value: "inventory", label: "Inventory", Icon: Boxes },
    { value: "finance", label: "Finance", Icon: Banknote },
  ];

  const sectorTabs = allSectorTabs.filter(function (t) {
    return allowedSectors.indexOf(t.value) >= 0;
  });

  const sectorPresets = {
    all: { event: "all", entity_type: "all" },

    access: { event: "all", entity_type: "User" },
    people: { event: "all", entity_type: "Employee" },

    sales: { event: "sale.create", entity_type: "Sale" },
    inventory: { event: "inventory.adjust", entity_type: "Inventory" },
    finance: { event: "remittance.verify", entity_type: "Remittance" },
  };

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

  function pushQuery(patch) {
    const base = { q: q, event: event, entity_type: entityType, per: per, sector: sector };
    const nextParams = Object.assign({}, base, patch || {});

    router.get(basePath, nextParams, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    });
  }

  function applySector(nextSector) {
    const preset = sectorPresets[nextSector] || sectorPresets.all;

    setSector(nextSector);
    setEvent(preset.event);
    setEntityType(preset.entity_type);

    pushQuery({
      sector: nextSector,
      event: preset.event,
      entity_type: preset.entity_type,
      page: 1,
    });
  }

  useEffect(
    function () {
      if (allowedSectors.indexOf(sector) >= 0) return;

      const fallback = defaultSectorForRole(role);
      const preset = sectorPresets[fallback] || sectorPresets.all;

      setSector(fallback);
      setEvent(preset.event);
      setEntityType(preset.entity_type);

      pushQuery({
        sector: fallback,
        event: preset.event,
        entity_type: preset.entity_type,
        page: 1,
      });
    },
    [role]
  );

  const loading = Boolean(page.props && page.props.loading);

  const fillerRows = useMemo(
    function () {
      const list = [];
      for (let i = 0; i < per; i += 1) list.push({ id: "__filler__" + i, __filler: true });
      return list;
    },
    [per]
  );

  const tableRows = loading ? fillerRows : rows;

  const columns = useMemo(
    function () {
      return [
        {
          key: "when",
          label: "When",
          render: function (a) {
            if (a && a.__filler) return <SkeletonLine w="w-24" />;
            return <div className="text-sm font-semibold text-slate-900">{a.created_at}</div>;
          },
        },
        {
          key: "actor",
          label: "Actor",
          render: function (a) {
            if (a && a.__filler) return <SkeletonLine w="w-36" />;
            return (
              <div>
                <div className="font-extrabold text-slate-900">{a.actor_name || "System"}</div>
                <div className="text-xs text-slate-500">{titleCase(a.actor_role || "system")}</div>
              </div>
            );
          },
        },
        {
          key: "event",
          label: "Event",
          render: function (a) {
            if (a && a.__filler) return <SkeletonPill w="w-28" />;
            return <TonePill tone={eventTone(a.event)} label={a.event} />;
          },
        },
        {
          key: "entity",
          label: "Entity",
          render: function (a) {
            if (a && a.__filler) return <SkeletonLine w="w-28" />;
            return (
              <div className="text-sm text-slate-700">
                {a.entity_type}
                {a.entity_id ? <span className="text-slate-400"> #{a.entity_id}</span> : null}
              </div>
            );
          },
        },
        {
          key: "message",
          label: "Details",
          render: function (a) {
            if (a && a.__filler) return <SkeletonLine w="w-48" />;
            return <div className="text-sm text-slate-700">{a.message || "—"}</div>;
          },
        },
      ];
    },
    []
  );

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeAudit, setActiveAudit] = useState(null);

  function openDetails(a) {
    setActiveAudit(a || null);
    setDetailsOpen(true);
  }

  function closeDetails() {
    setDetailsOpen(false);
    setActiveAudit(null);
  }

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

        <Tabs tabs={sectorTabs} value={sector} onChange={applySector} />

        <DataTableFilters
          q={q}
          onQ={setQ}
          onQDebounced={function (v) {
            pushQuery({ q: v, page: 1 });
          }}
          placeholder="Search actor, event, entity, or details..."
          filters={[
            {
              key: "event",
              value: event,
              onChange: function (v) {
                setEvent(v);
                setSector(allowedSectors.indexOf("all") >= 0 ? "all" : defaultSectorForRole(role));
                pushQuery({
                  event: v,
                  sector: allowedSectors.indexOf("all") >= 0 ? "all" : defaultSectorForRole(role),
                  page: 1,
                });
              },
              options: eventOptions,
            },
            {
              key: "entity_type",
              value: entityType,
              onChange: function (v) {
                setEntityType(v);
                setSector(allowedSectors.indexOf("all") >= 0 ? "all" : defaultSectorForRole(role));
                pushQuery({
                  entity_type: v,
                  sector: allowedSectors.indexOf("all") >= 0 ? "all" : defaultSectorForRole(role),
                  page: 1,
                });
              },
              options: entityOptions,
            },
          ]}
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          searchQuery={q}
          emptyTitle="No audit logs found"
          emptyHint="Try a different search or filter."
          renderActions={function (a) {
            if (a && a.__filler) {
              return (
                <div className="flex items-center justify-end gap-2">
                  <SkeletonButton w="w-20" />
                </div>
              );
            }

            return (
              <div className="flex items-center justify-end gap-2">
                <TableActionButton
                  icon={Eye}
                  title="View details"
                  onClick={function () {
                    openDetails(a);
                  }}
                >
                  View
                </TableActionButton>
              </div>
            );
          }}
        />

        <DataTablePagination
          meta={meta}
          perPage={per}
          onPerPage={function (n) {
            pushQuery({ per: n, page: 1 });
          }}
          onPrev={function () {
            if (meta && meta.current_page > 1) pushQuery({ page: meta.current_page - 1 });
          }}
          onNext={function () {
            if (meta && meta.current_page < meta.last_page) pushQuery({ page: meta.current_page + 1 });
          }}
          disablePrev={!meta || meta.current_page <= 1}
          disableNext={!meta || meta.current_page >= meta.last_page}
        />
      </div>

      <AuditDetailsModal open={detailsOpen} audit={activeAudit} onClose={closeDetails} />
    </Layout>
  );
}
