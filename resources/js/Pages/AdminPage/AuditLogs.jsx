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
  Download,
} from "lucide-react";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";
import * as XLSX from "xlsx";

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
            return (
              <div className="text-sm text-slate-700">
                {a.entity_type}
                {a.entity_id ? <span className="text-slate-400"> #{a.entity_id}</span> : null}
              </div>
            );
          },
          exportValue: function (a) {
            if (!a || a.__filler) return "";
            const parts = [];
            if (a.entity_type) parts.push(a.entity_type);
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

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeAudit, setActiveAudit] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const canExport = !loading && rows.length > 0;

  function openDetails(a) {
    setActiveAudit(a || null);
    setDetailsOpen(true);
  }

  function closeDetails() {
    setDetailsOpen(false);
    setActiveAudit(null);
  }

  function getFilteredRows() {
    const normalizedQuery = String(q || "").trim().toLowerCase();
    return rows
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
      window.alert("No audit logs to export for this tab.");
      return;
    }

    if (isExporting) return;

    const activeRows = getFilteredRows();
    if (activeRows.length === 0) {
      window.alert("No audit logs match the current search or filters.");
      return;
    }

    const sectorLabel = findLabel(sectorTabs, sector, titleCase(sector));
    const now = new Date();
    const titleText = `Audit Logs — ${sectorLabel}`;
    const metaText = `Exported on: ${formatDateTime(now)}`;
    const fileTimestamp = formatFileTimestamp(now);
    const sheetName = sanitizeSheetName(sectorLabel);
    const fileSlug = slugify(sectorLabel) || slugify(sector) || "tab";

    setIsExporting(true);

    try {
      const columnCount = columns.length;
      const headers = columns.map(function (col) {
        return col.label;
      });

      const dataRows = activeRows.map(function (row) {
        return columns.map(function (col) {
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

          const colMeta = columns[colIndex];
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

      worksheet["!cols"] = columns.map(function (col, colIndex) {
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
      const exportName = `AuditLogs_${fileSlug || "tab"}_${fileTimestamp || formatFileTimestamp(new Date())}.xlsx`;
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
          rightSlot={
            <button
              type="button"
              onClick={exportCurrentTab}
              disabled={!canExport || isExporting}
              className={cx(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/25 focus-visible:ring-offset-1",
                isExporting || !canExport
                  ? "bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed"
                  : "bg-teal-600 text-white ring-teal-600 hover:bg-teal-700 active:bg-teal-800"
              )}
            >
              <Download className={cx("h-4 w-4", isExporting ? "text-slate-400" : "text-white")} />
              {isExporting ? "Exporting…" : "Export Excel"}
            </button>
          }
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
