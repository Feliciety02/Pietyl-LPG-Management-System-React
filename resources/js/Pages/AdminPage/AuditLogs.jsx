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
import * as XLSX from "xlsx";

import { TableActionButton } from "@/components/Table/ActionTableButton";
import AuditDetailsModal from "@/components/modals/AuditLogModals/AuditDetailsModal";
import ExportRegistrar from "@/components/Table/ExportRegistrar";

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

function formatEntityType(value) {
  const raw = String(value || "");
  if (!raw) return "";
  const normalized = raw.replace(/\//g, "\\");
  const parts = normalized.split("\\");
  return parts[parts.length - 1] || raw;
}

function findLabel(options, value, fallback) {
  const match = options.find(function (opt) {
    return opt.value === value;
  });
  return match ? match.label : fallback;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function collectStrings(value, out, depth) {
  if (value == null || depth > 2) return;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    out.push(String(value));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, out, depth + 1));
    return;
  }
  if (typeof value === "object") {
    Object.values(value).forEach((item) => collectStrings(item, out, depth + 1));
  }
}

function buildRowSearchText(row) {
  const parts = [];
  collectStrings(row, parts, 0);
  return parts.join(" ").toLowerCase();
}

function parseDateString(value) {
  if (!value) return null;
  const normalized = String(value).includes("T") ? String(value) : String(value).replace(/\s+/, "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function formatDateTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())} ${padNumber(
    date.getHours()
  )}:${padNumber(date.getMinutes())}`;
}

function formatFileTimestamp(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}${padNumber(date.getMonth() + 1)}${padNumber(date.getDate())}_${padNumber(
    date.getHours()
  )}${padNumber(date.getMinutes())}`;
}

function sanitizeSheetName(name) {
  const cleaned = String(name || "Audit Logs")
    .replace(/[\[\]\:\*\?\\\/]/g, "")
    .trim();
  return cleaned.substring(0, 31) || "Audit Logs";
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
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

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

function money(value) {
  const v = Number(value || 0);
  return currencyFormatter.format(v);
}

function safeText(value) {
  return String(value ?? "").trim();
}

function Pill({ tone = "slate", children }) {
  const map = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    teal: "bg-teal-600/10 text-teal-900 ring-teal-700/10",
    amber: "bg-amber-600/10 text-amber-900 ring-amber-700/10",
    rose: "bg-rose-600/10 text-rose-900 ring-rose-700/10",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold ring-1",
        map[tone] || map.slate
      )}
    >
      {children}
    </span>
  );
}

function MethodPill({ method }) {
  const m = String(method || "cash").toLowerCase();
  const tone = m === "gcash" ? "teal" : m === "card" ? "slate" : "amber";
  return <Pill tone={tone}>{m.toUpperCase()}</Pill>;
}

function StatusPill({ status }) {
  const s = String(status || "paid").toLowerCase();
  const tone = s === "paid" ? "teal" : s === "failed" ? "rose" : "amber";
  return <Pill tone={tone}>{s.toUpperCase()}</Pill>;
}

function FinanceTypePill({ kind }) {
  const k = String(kind || "").toLowerCase();
  const label = k === "supplier_payment" ? "Supplier Payment" : "Remittance";
  const tone = k === "supplier_payment" ? "teal" : "amber";
  return <Pill tone={tone}>{label}</Pill>;
}

function SaleAvatar({ ref }) {
  const t = safeText(ref);
  const seed = t.replace(/\s+/g, "").slice(-2).toUpperCase() || "TX";

  return (
    <div className="h-9 w-9 rounded-2xl bg-teal-600/10 ring-1 ring-teal-700/10 flex items-center justify-center">
      <span className="text-[11px] font-extrabold text-teal-900">{seed}</span>
    </div>
  );
}

function LineSummary({ lines }) {
  const list = Array.isArray(lines) ? lines : [];
  const count = list.reduce((sum, it) => sum + Number(it?.qty || 0), 0);
  if (!list.length) return <span className="text-xs text-slate-400">No items</span>;

  const first = list[0];
  const name = safeText(first?.name) || "Item";
  const variant = safeText(first?.variant);
  const more = list.length - 1;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-extrabold text-slate-700 truncate max-w-[260px]">
        {name}
        {variant ? <span className="text-slate-500"> - {variant}</span> : null}
      </span>

      {more > 0 ? (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
          +{more} more
        </span>
      ) : null}

      <span className="text-[11px] font-extrabold text-slate-500">Qty {count}</span>
    </div>
  );
}

function normalizeType(type) {
  return String(type || "").toLowerCase().trim();
}

function normalizeDir(dir) {
  return String(dir || "").toLowerCase().trim();
}

function TypePill({ type }) {
  const t = normalizeType(type);

  const tone =
    t === "purchase" || t === "refill"
      ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
      : t === "swap"
      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
      : t === "sale" || t === "delivery"
      ? "bg-slate-100 text-slate-700 ring-slate-200"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  const label =
    t === "purchase"
      ? "Purchase"
      : t === "refill"
      ? "Refill"
      : t === "sale"
      ? "Sale"
      : t === "delivery"
      ? "Delivery"
      : t === "swap"
      ? "Swap"
      : t === "adjustment"
      ? "Adjustment"
      : t === "damage"
      ? "Damage"
      : t === "transfer"
      ? "Transfer"
      : "Movement";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        tone
      )}
    >
      {label}
    </span>
  );
}

function DirectionPill({ dir }) {
  const d = normalizeDir(dir);

  const tone =
    d === "in"
      ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
      : d === "out"
      ? "bg-slate-100 text-slate-700 ring-slate-200"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  const label = d === "in" ? "Inbound" : d === "out" ? "Outbound" : "-";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        tone
      )}
    >
      {label}
    </span>
  );
}

function niceText(v) {
  if (v == null) return "-";
  const s = String(v).trim();
  return s ? s : "-";
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

function CompactDateInput({ ariaLabel, value, onChange }) {
  return (
    <input
      aria-label={ariaLabel}
      type="date"
      value={value ?? ""}
      onChange={function (e) {
        onChange && onChange(e.target.value);
      }}
      className={cx(
        "h-9 min-w-[140px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-800",
        "outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
      )}
    />
  );
}

function DateRangeFilterMinimal({ from, to, onFromChange, onToChange }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-[11px] font-extrabold text-slate-500">From</div>
      <CompactDateInput ariaLabel="From date" value={from} onChange={onFromChange} />
      <div className="text-[11px] font-extrabold text-slate-500">To</div>
      <CompactDateInput ariaLabel="To date" value={to} onChange={onToChange} />
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

  const auditRows = audits && audits.data ? audits.data : [];
  const auditMeta = audits && audits.meta ? audits.meta : null;

  const sales = page.props && page.props.sales ? page.props.sales : null;
  const salesRows = sales && sales.data ? sales.data : [];
  const salesMeta = sales && sales.meta ? sales.meta : null;

  const movements = page.props && page.props.movements ? page.props.movements : null;
  const movementRows = movements && movements.data ? movements.data : [];
  const movementMeta = movements && movements.meta ? movements.meta : null;

  const finance = page.props && page.props.finance ? page.props.finance : null;
  const financeRows = finance && finance.data ? finance.data : [];
  const financeMeta = finance && finance.meta ? finance.meta : null;

  const query = page.props && page.props.filters ? page.props.filters : {};
  const per = Number(query.per || 10);

  const allowedSectors = allowedSectorsForRole(role);

  const [q, setQ] = useState(query.q || "");
  const [event, setEvent] = useState(query.event || "all");
  const [entityType, setEntityType] = useState(query.entity_type || "all");
  const [dateFrom, setDateFrom] = useState(query.from || "");
  const [dateTo, setDateTo] = useState(query.to || "");

  const initialSector = allowedSectors.indexOf(query.sector) >= 0 ? query.sector : defaultSectorForRole(role);
  const [sector, setSector] = useState(initialSector);
  const mode = useMemo(() => {
    if (sector === "sales") return "sales";
    if (sector === "inventory") return "inventory";
    if (sector === "finance") return "finance";
    return "audit";
  }, [sector]);

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
    inventory: { event: "stock_movement.create", entity_type: "StockMovement" },
    finance: { event: "all", entity_type: "all" },
  };

  const eventOptions = [
    { value: "all", label: "All events" },
    { value: "auth.login", label: "Login" },
    { value: "auth.logout", label: "Logout" },
    { value: "auth.login_failed", label: "Login failed" },
    { value: "user.create", label: "User created" },
    { value: "user.update", label: "User updated" },
    { value: "user.delete", label: "User deleted" },
    { value: "role.update", label: "Role updated" },
    { value: "employee.update", label: "Employee updated" },
    { value: "sale.create", label: "Sale created" },
    { value: "sale.update", label: "Sale updated" },
    { value: "delivery.update", label: "Delivery updated" },
    { value: "stock_movement.create", label: "Stock movement created" },
    { value: "inventory_balance.update", label: "Inventory balance updated" },
    { value: "purchase.create", label: "Purchase created" },
    { value: "restock_request.create", label: "Restock request created" },
    { value: "payment.create", label: "Payment created" },
    { value: "remittance.cash.recorded", label: "Remittance cash recorded" },
    { value: "remittance.noncash_transactions.verified", label: "Remittance cashless verified" },
    { value: "remittance.daily.finalized", label: "Daily close finalized" },
    { value: "remittance.daily.reopen", label: "Daily close reopened" },
  ];

  const entityOptions = [
    { value: "all", label: "All entities" },
    { value: "User", label: "User" },
    { value: "Role", label: "Role" },
    { value: "UserRole", label: "User Role" },
    { value: "Employee", label: "Employee" },
    { value: "Customer", label: "Customer" },
    { value: "Sale", label: "Sale" },
    { value: "SaleItem", label: "Sale Item" },
    { value: "Delivery", label: "Delivery" },
    { value: "StockMovement", label: "Stock Movement" },
    { value: "InventoryBalance", label: "Inventory Balance" },
    { value: "Purchase", label: "Purchase" },
    { value: "PurchaseItem", label: "Purchase Item" },
    { value: "RestockRequest", label: "Restock Request" },
    { value: "RestockRequestItem", label: "Restock Request Item" },
    { value: "Product", label: "Product" },
    { value: "ProductVariant", label: "Product Variant" },
    { value: "Supplier", label: "Supplier" },
    { value: "Payment", label: "Payment" },
    { value: "PaymentMethod", label: "Payment Method" },
    { value: "Receipt", label: "Receipt" },
    { value: "Remittance", label: "Remittance" },
    { value: "DailyClose", label: "Daily Close" },
    { value: "LedgerEntry", label: "Ledger Entry" },
    { value: "LedgerLine", label: "Ledger Line" },
  ];

  function pushQuery(patch) {
    const base = {
      q: q,
      event: event,
      entity_type: entityType,
      per: per,
      sector: sector,
      from: dateFrom || undefined,
      to: dateTo || undefined,
    };
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

  function handleDateFrom(value) {
    setDateFrom(value);
    pushQuery({ from: value || undefined, page: 1 });
  }

  function handleDateTo(value) {
    setDateTo(value);
    pushQuery({ to: value || undefined, page: 1 });
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

  const auditFilters = [
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
  ];

  const activeFilters = mode === "audit" ? auditFilters : [];

  const loading = Boolean(page.props && page.props.loading);

  const fillerRows = useMemo(
    function () {
      const list = [];
      for (let i = 0; i < per; i += 1) list.push({ id: "__filler__" + i, __filler: true });
      return list;
    },
    [per]
  );

  const auditColumns = useMemo(
    function () {
      return [
        {
          key: "when",
          label: "When",
          render: function (a) {
            if (a && a.__filler) return <SkeletonLine w="w-24" />;
            return <div className="text-sm font-semibold text-slate-900">{a.created_at}</div>;
          },
          exportValue: function (a) {
            if (!a || a.__filler) return "";
            const parsed = parseDateString(a.created_at);
            return parsed || a.created_at || "";
          },
          excelType: "datetime",
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
          exportValue: function (a) {
            if (!a || a.__filler) return "";
            const name = a.actor_name || "System";
            const roleLabel = titleCase(a.actor_role || "system");
            return roleLabel ? `${name} (${roleLabel})` : name;
          },
        },
        {
          key: "event",
          label: "Event",
          render: function (a) {
            if (a && a.__filler) return <SkeletonPill w="w-28" />;
            return <TonePill tone={eventTone(a.event)} label={a.event} />;
          },
          exportValue: function (a) {
            if (!a || a.__filler) return "";
            return String(a.event || "").replace(/\s+/g, " ").trim();
          },
        },
        {
          key: "entity",
          label: "Entity",
          render: function (a) {
            if (a && a.__filler) return <SkeletonLine w="w-28" />;
            const entityName = formatEntityType(a.entity_type);
            return (
              <div className="text-sm text-slate-700">
                {entityName}
                {a.entity_id ? <span className="text-slate-400"> #{a.entity_id}</span> : null}
              </div>
            );
          },
          exportValue: function (a) {
            if (!a || a.__filler) return "";
            const parts = [];
            const entityName = formatEntityType(a.entity_type);
            if (entityName) parts.push(entityName);
            if (a.entity_id) parts.push(`#${a.entity_id}`);
            return parts.join(" ");
          },
        },
        {
          key: "message",
          label: "Details",
          render: function (a) {
            if (a && a.__filler) return <SkeletonLine w="w-48" />;
            return <div className="text-sm text-slate-700">{a.message || "—"}</div>;
          },
          exportValue: function (a) {
            if (!a || a.__filler) return "—";
            return String(a.message || "—").trim();
          },
        },
      ];
    },
    []
  );

  const salesColumns = useMemo(
    function () {
      return [
        {
          key: "sale",
          label: "Sale",
          render: function (x) {
            if (x && x.__filler) {
              return (
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-2xl bg-slate-100 ring-1 ring-slate-200" />
                  <div className="space-y-2">
                    <SkeletonLine w="w-32" />
                    <SkeletonLine w="w-48" />
                  </div>
                </div>
              );
            }

            return (
              <div className="flex items-start gap-3">
                <SaleAvatar ref={x.ref} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-extrabold text-slate-900">{x.ref}</div>
                    <StatusPill status={x.status} />
                    <MethodPill method={x.method} />
                  </div>

                  <div className="mt-1 flex flex-col gap-1">
                    <div className="text-xs text-slate-500">
                      <span className="font-extrabold text-slate-700">{x.customer || "Walk in"}</span>
                      <span className="mx-2 text-slate-300">|</span>
                      <span className="text-slate-600">{x.created_at || "Not available"}</span>
                      {x.cashier_name ? (
                        <>
                          <span className="mx-2 text-slate-300">|</span>
                          <span className="text-slate-600">Cashier {x.cashier_name}</span>
                        </>
                      ) : null}
                    </div>

                    <LineSummary lines={x.lines} />
                  </div>
                </div>
              </div>
            );
          },
          exportValue: function (x) {
            if (!x || x.__filler) return "";
            const parts = [
              safeText(x.ref),
              safeText(x.customer),
              safeText(x.status).toUpperCase(),
              safeText(x.method).toUpperCase(),
              safeText(x.created_at),
              safeText(x.cashier_name) ? `Cashier ${safeText(x.cashier_name)}` : "",
            ].filter(Boolean);
            return parts.join(" | ");
          },
        },
        {
          key: "total",
          label: "Total",
          render: function (x) {
            if (x && x.__filler) return <SkeletonLine w="w-20" />;
            return (
              <div className="flex justify-start">
                <span className="inline-flex items-center rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                  <span className="text-[11px] font-extrabold text-slate-600 mr-2">Total</span>
                  <span className="text-[11px] font-extrabold text-slate-900">{money(x.total)}</span>
                </span>
              </div>
            );
          },
          exportValue: function (x) {
            if (!x || x.__filler) return "";
            return x.total ?? 0;
          },
        },
      ];
    },
    []
  );

  const movementColumns = useMemo(
    function () {
      return [
        {
          key: "item",
          label: "Item",
          render: function (x) {
            if (x && x.__filler) {
              return (
                <div className="space-y-2">
                  <SkeletonLine w="w-40" />
                  <SkeletonLine w="w-24" />
                </div>
              );
            }

            return (
              <div className="min-w-0">
                <div className="font-extrabold text-slate-900 truncate">
                  {niceText(x.product_name)}{" "}
                  {x.variant ? <span className="text-slate-500 font-semibold">({x.variant})</span> : null}
                </div>
                <div className="mt-1 text-xs text-slate-500 truncate">
                  {x.reference_id ? (
                    <>
                      Ref <span className="font-semibold text-slate-700">{x.reference_id}</span>
                    </>
                  ) : (
                    "Ref -"
                  )}
                </div>
              </div>
            );
          },
          exportValue: function (x) {
            if (!x || x.__filler) return "";
            const name = [safeText(x.product_name), safeText(x.variant)].filter(Boolean).join(" ");
            const ref = x.reference_id ? `Ref ${x.reference_id}` : "";
            return [name, ref].filter(Boolean).join(" - ");
          },
        },
        {
          key: "type",
          label: "Type",
          render: function (x) {
            if (x && x.__filler) return <SkeletonPill w="w-20" />;
            return <TypePill type={x.type} />;
          },
          exportValue: function (x) {
            if (!x || x.__filler) return "";
            return safeText(x.type);
          },
        },
        {
          key: "flow",
          label: "Flow",
          render: function (x) {
            if (x && x.__filler) return <SkeletonPill w="w-16" />;
            return <DirectionPill dir={x.direction} />;
          },
          exportValue: function (x) {
            if (!x || x.__filler) return "";
            return safeText(x.direction);
          },
        },
        {
          key: "qty",
          label: "Qty",
          render: function (x) {
            if (x && x.__filler) return <SkeletonLine w="w-10" />;
            return <span className="text-sm font-extrabold text-slate-900">{Number(x.qty || 0)}</span>;
          },
          exportValue: function (x) {
            if (!x || x.__filler) return "";
            return x.qty ?? 0;
          },
        },
        {
          key: "actor",
          label: "By",
          render: function (x) {
            if (x && x.__filler) return <SkeletonLine w="w-24" />;
            return <span className="text-sm text-slate-700">{niceText(x.actor_name)}</span>;
          },
          exportValue: function (x) {
            if (!x || x.__filler) return "";
            return safeText(x.actor_name);
          },
        },
        {
          key: "when",
          label: "Occurred",
          render: function (x) {
            if (x && x.__filler) return <SkeletonLine w="w-28" />;
            return <span className="text-sm text-slate-700">{niceText(x.occurred_at)}</span>;
          },
          exportValue: function (x) {
            if (!x || x.__filler) return "";
            return safeText(x.occurred_at);
          },
        },
      ];
    },
    []
  );

  const financeColumns = useMemo(
    function () {
      return [
        {
          key: "activity",
          label: "Activity",
          render: function (x) {
            if (x && x.__filler) {
              return (
                <div className="space-y-2">
                  <SkeletonLine w="w-40" />
                  <SkeletonLine w="w-24" />
                </div>
              );
            }

            const isSupplier = String(x.kind || "") === "supplier_payment";
            const title = isSupplier ? safeText(x.supplier_name) || "Supplier payment" : "Remittance log";
            const ref = isSupplier
              ? safeText(x.source_ref) || safeText(x.reference)
              : safeText(x.business_date);
            const detail = safeText(x.message) || (ref ? `Ref ${ref}` : safeText(x.event));

            return (
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <FinanceTypePill kind={x.kind} />
                  <div className="font-extrabold text-slate-900 truncate">{title}</div>
                </div>
                <div className="mt-1 text-xs text-slate-500 truncate">
                  {detail || "-"}
                </div>
              </div>
            );
          },
          exportValue: function (x) {
            if (!x || x.__filler) return "";
            const parts = [
              safeText(x.kind),
              safeText(x.supplier_name),
              safeText(x.source_ref),
              safeText(x.reference),
              safeText(x.business_date),
              safeText(x.message),
            ].filter(Boolean);
            return parts.join(" | ");
          },
        },
        {
          key: "amount",
          label: "Amount",
          render: function (x) {
            if (x && x.__filler) return <SkeletonLine w="w-20" />;
            return (
              <div className="text-sm font-extrabold text-slate-900">
                {x.amount != null ? money(x.amount) : "-"}
              </div>
            );
          },
          exportValue: function (x) {
            if (!x || x.__filler) return "";
            return x.amount ?? "";
          },
        },
        {
          key: "actor",
          label: "By",
          render: function (x) {
            if (x && x.__filler) return <SkeletonLine w="w-24" />;
            return <span className="text-sm text-slate-700">{safeText(x.actor_name) || "-"}</span>;
          },
          exportValue: function (x) {
            if (!x || x.__filler) return "";
            return safeText(x.actor_name);
          },
        },
        {
          key: "when",
          label: "When",
          render: function (x) {
            if (x && x.__filler) return <SkeletonLine w="w-28" />;
            return <span className="text-sm text-slate-700">{safeText(x.created_at) || "-"}</span>;
          },
          exportValue: function (x) {
            if (!x || x.__filler) return "";
            return safeText(x.created_at);
          },
        },
      ];
    },
    []
  );

  const activeColumns =
    mode === "sales"
      ? salesColumns
      : mode === "inventory"
      ? movementColumns
      : mode === "finance"
      ? financeColumns
      : auditColumns;
  const activeRows =
    mode === "sales"
      ? salesRows
      : mode === "inventory"
      ? movementRows
      : mode === "finance"
      ? financeRows
      : auditRows;
  const activeMeta =
    mode === "sales"
      ? salesMeta
      : mode === "inventory"
      ? movementMeta
      : mode === "finance"
      ? financeMeta
      : auditMeta;

  const activeEmptyTitle =
    mode === "sales"
      ? "No POS sales found"
      : mode === "inventory"
      ? "No inventory movements found"
      : mode === "finance"
      ? "No finance activity found"
      : "No audit logs found";

  const activeEmptyHint =
    mode === "sales"
      ? "Completed POS sales will appear here."
      : mode === "inventory"
      ? "Inventory movements will appear here."
      : mode === "finance"
      ? "Supplier payments and remittance logs will appear here."
      : "Try a different search or filter.";

  const searchPlaceholder =
    mode === "sales"
      ? "Search sale number or customer..."
      : mode === "inventory"
      ? "Search product or reference..."
      : mode === "finance"
      ? "Search supplier, reference, or remittance..."
      : "Search actor, event, entity, or details...";

  const tableRows = loading ? fillerRows : activeRows;

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeAudit, setActiveAudit] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const canExport = !loading && activeRows.length > 0;

  function openDetails(a) {
    setActiveAudit(a || null);
    setDetailsOpen(true);
  }

  function closeDetails() {
    setDetailsOpen(false);
    setActiveAudit(null);
  }

  useEffect(
    function () {
      if (mode === "audit") return;
      setDetailsOpen(false);
      setActiveAudit(null);
    },
    [mode]
  );

  function getFilteredRows(sourceRows) {
    const normalizedQuery = String(q || "").trim().toLowerCase();
    return (sourceRows || [])
      .filter(function (row) {
        return row && !row.__filler;
      })
      .filter(function (row) {
        if (!normalizedQuery) return true;
        return buildRowSearchText(row).includes(normalizedQuery);
      });
  }

  function exportCurrentTab() {
    if (!canExport) {
      window.alert("No records to export for this tab.");
      return;
    }

    if (isExporting) return;

    const filteredRows = getFilteredRows(activeRows);
    if (filteredRows.length === 0) {
      window.alert("No records match the current search or filters.");
      return;
    }

    const sectorLabel = findLabel(sectorTabs, sector, titleCase(sector));
    const now = new Date();
    const exportBaseLabel =
      mode === "sales" ? "POS Sales" : mode === "inventory" ? "Inventory Movements" : "Audit Logs";
    const titleText = mode === "audit" ? `Audit Logs - ${sectorLabel}` : exportBaseLabel;
    const rangeText =
      dateFrom || dateTo
        ? ` | Range: ${dateFrom || "Any"} to ${dateTo || "Any"}`
        : "";
    const metaText = `Exported on: ${formatDateTime(now)}${rangeText}`;
    const fileTimestamp = formatFileTimestamp(now);
    const sheetName = sanitizeSheetName(mode === "audit" ? sectorLabel : exportBaseLabel);
    const fileSlug = slugify(mode === "audit" ? sectorLabel : exportBaseLabel) || slugify(sector) || "tab";
    const exportPrefix =
      mode === "audit" ? "AuditLogs" : mode === "sales" ? "POSSales" : "InventoryMovements";

    setIsExporting(true);

    try {
      const columnCount = activeColumns.length;
      const headers = activeColumns.map(function (col) {
        return col.label;
      });

      const dataRows = filteredRows.map(function (row) {
        return activeColumns.map(function (col) {
          const raw = col.exportValue ? col.exportValue(row) : row[col.key];
          return raw == null ? "" : raw;
        });
      });

      const padRow = function (text) {
        const rest = Array(columnCount).fill("");
        rest[0] = text;
        return rest;
      };

      const sheetMatrix = [
        padRow(titleText),
        padRow(metaText),
        Array(columnCount).fill(""),
        headers,
        ...dataRows,
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(sheetMatrix);
      worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: columnCount - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: columnCount - 1 } },
      ];

      const thinBorder = { style: "thin", color: { rgb: "CBD5F5" } };

      const titleCell = worksheet[XLSX.utils.encode_cell({ r: 0, c: 0 })];
      if (titleCell) {
        titleCell.s = {
          font: { bold: true, sz: 16, color: { rgb: "0F172A" } },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }

      const metaCell = worksheet[XLSX.utils.encode_cell({ r: 1, c: 0 })];
      if (metaCell) {
        metaCell.s = {
          font: { sz: 12, color: { rgb: "475569" } },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }

      const headerRowIndex = 3;
      for (let colIndex = 0; colIndex < columnCount; colIndex += 1) {
        const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: colIndex });
        const cell = worksheet[cellRef];
        if (!cell) continue;
        cell.s = {
          font: { bold: true, color: { rgb: "0F172A" } },
          alignment: { horizontal: "center", vertical: "center" },
          fill: { fgColor: { rgb: "F1F5F9" } },
          border: {
            top: thinBorder,
            bottom: thinBorder,
            left: thinBorder,
            right: thinBorder,
          },
        };
      }

      const dataStartRow = headerRowIndex + 1;
      for (let rowIndex = dataStartRow; rowIndex < sheetMatrix.length; rowIndex += 1) {
        for (let colIndex = 0; colIndex < columnCount; colIndex += 1) {
          const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
          const cell = worksheet[cellRef];
          if (!cell) continue;

          cell.s = {
            font: { color: { rgb: "0F172A" } },
            alignment: { vertical: "top", wrapText: true },
            border: {
              top: thinBorder,
              bottom: thinBorder,
              left: thinBorder,
              right: thinBorder,
            },
          };

          const colMeta = activeColumns[colIndex];
          if (colMeta && colMeta.excelType === "datetime") {
            if (cell.v instanceof Date) {
              cell.t = "d";
              cell.z = "yyyy-mm-dd hh:mm";
            } else {
              const parsed = parseDateString(cell.v);
              if (parsed) {
                cell.v = parsed;
                cell.t = "d";
                cell.z = "yyyy-mm-dd hh:mm";
              }
            }
          }
        }
      }

      worksheet["!cols"] = activeColumns.map(function (col, colIndex) {
        const headerLen = String(col.label || "").length;
        const dataLengths = dataRows.map(function (row) {
          const value = row[colIndex];
          if (value instanceof Date) return 20;
          return String(value || "").length;
        });
        const maxLen = Math.max(headerLen, ...dataLengths);
        const width = Math.min(Math.max(maxLen + 6, 12), 30);
        return { wch: width };
      });

      worksheet["!freeze"] = { ySplit: 4 };

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([buffer], { type: "application/octet-stream" });
      const exportName = `${exportPrefix}_${fileSlug || "tab"}_${fileTimestamp || formatFileTimestamp(new Date())}.xlsx`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = exportName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      window.alert("Unable to generate the Excel export. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  const exportConfig = useMemo(
    () => ({
      label: isExporting ? "Exporting..." : "Export",
      title: "Export audit logs",
      subtitle: "Exports the current filtered view.",
      formats: ["xlsx"],
      defaultFormat: "xlsx",
      dateRange: { enabled: false },
      disabled: !canExport || isExporting,
      onExport: () => exportCurrentTab(),
    }),
    [canExport, isExporting, exportCurrentTab]
  );

  return (
    <Layout title="Audit Logs">
      <div className="grid gap-6">
        <ExportRegistrar config={exportConfig} />
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
          placeholder={searchPlaceholder}
          rightSlot={
            <div className="flex flex-wrap items-center gap-3">
              <DateRangeFilterMinimal
                from={dateFrom}
                to={dateTo}
                onFromChange={handleDateFrom}
                onToChange={handleDateTo}
              />
            </div>
          }
          filters={activeFilters}
        />

        <DataTable
          columns={activeColumns}
          rows={tableRows}
          loading={loading}
          searchQuery={q}
          emptyTitle={activeEmptyTitle}
          emptyHint={activeEmptyHint}
          renderActions={
            mode === "audit"
              ? function (a) {
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
                }
              : null
          }
        />

        <DataTablePagination
          meta={activeMeta}
          perPage={per}
          onPerPage={function (n) {
            pushQuery({ per: n, page: 1 });
          }}
          onPrev={function () {
            if (activeMeta && activeMeta.current_page > 1) {
              pushQuery({ page: activeMeta.current_page - 1 });
            }
          }}
          onNext={function () {
            if (activeMeta && activeMeta.current_page < activeMeta.last_page) {
              pushQuery({ page: activeMeta.current_page + 1 });
            }
          }}
          disablePrev={!activeMeta || activeMeta.current_page <= 1}
          disableNext={!activeMeta || activeMeta.current_page >= activeMeta.last_page}
        />
      </div>

      <AuditDetailsModal open={detailsOpen} audit={activeAudit} onClose={closeDetails} />
    </Layout>
  );
}
