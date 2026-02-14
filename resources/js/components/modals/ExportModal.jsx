import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import {
  Calendar as CalendarIcon,
  Download,
  SlidersHorizontal,
  FileText,
  Layers,
  Clock3,
} from "lucide-react";
import ModalShell from "./ModalShell";
import { useExportAction } from "@/components/Table/ExportContext";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

/* ---------------- helpers ---------------- */

function pad2(n) {
  return String(n).padStart(2, "0");
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function toDateValue(input) {
  if (!input) return null;
  if (input instanceof Date) return startOfDay(input);
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return null;
  return startOfDay(parsed);
}

function clampToToday(d) {
  const today = startOfDay(new Date());
  const x = startOfDay(d);
  return x > today ? today : x;
}

function toISODate(d) {
  if (!d) return "";
  const x = new Date(d);
  return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`;
}

function rangeDays(from, to) {
  if (!from) return 0;
  if (!to) return 1;
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  const diff = Math.round((b - a) / 86400000);
  return diff >= 0 ? diff + 1 : 1;
}

function normalizeFormats(formats) {
  const list = Array.isArray(formats) && formats.length ? formats : ["csv"];
  return list.map((opt) =>
    typeof opt === "string"
      ? { value: opt, label: opt.toUpperCase() }
      : { value: opt.value, label: opt.label || String(opt.value).toUpperCase() }
  );
}

function normalizeOptions(options) {
  const list = Array.isArray(options) ? options : [];
  return list.map((opt) =>
    typeof opt === "string"
      ? { value: opt, label: opt }
      : { value: opt.value, label: opt.label ?? opt.value }
  );
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

function Input({ icon: Icon, left, right, ...props }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-teal-500/30">
      {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}

      {left ? (
        <div className="shrink-0 pr-2 border-r border-slate-200/70 text-xs font-extrabold text-slate-600">
          {left}
        </div>
      ) : null}

      <input
        {...props}
        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
      />

      {right ? (
        <div className="shrink-0 pl-2 border-l border-slate-200/70 text-xs font-extrabold text-slate-600">
          {right}
        </div>
      ) : null}
    </div>
  );
}

function Select({ icon: Icon, children, ...props }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-teal-500/30">
      {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
      <select
        {...props}
        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
      >
        {children}
      </select>
    </div>
  );
}

function Chip({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
    >
      {children}
    </button>
  );
}

function ToggleCard({ checked, label, hint, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full rounded-2xl px-4 py-3 text-left ring-1 transition focus:outline-none focus:ring-4 focus:ring-teal-500/15",
        checked ? "bg-teal-600/10 ring-teal-700/10" : "bg-white ring-slate-200 hover:bg-slate-50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-slate-900">{label}</div>
          {hint ? <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div> : null}
        </div>

        <span
          className={cx(
            "inline-flex items-center rounded-full px-2 py-1 text-[11px] font-extrabold ring-1",
            checked
              ? "bg-teal-600 text-white ring-teal-600"
              : "bg-slate-100 text-slate-700 ring-slate-200"
          )}
        >
          {checked ? "On" : "Off"}
        </span>
      </div>
    </button>
  );
}

function SoftPanel({ title, subtitle, right, children, className = "" }) {
  return (
    <div className={cx("rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm", className)}>
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-slate-900">{title}</div>
            {subtitle ? <div className="mt-1 text-xs text-slate-500">{subtitle}</div> : null}
          </div>

          {right ? <div className="ml-auto">{right}</div> : null}
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- component ---------------- */

export default function ExportModal() {
  const { exportConfig, exportOpen, setExportOpen } = useExportAction();
  const open = Boolean(exportOpen && exportConfig);
  const config = exportConfig || {};

  const today = useMemo(() => startOfDay(new Date()), []);
  const formats = useMemo(() => normalizeFormats(config.formats), [config.formats]);
  const formatFallback = formats[0]?.value || "csv";

  const dateRangeEnabled = config?.dateRange?.enabled ?? true;
  const allowFuture = Boolean(config?.dateRange?.allowFuture);
  const selectFields = useMemo(() => config.selects || [], [config.selects]);

  const [range, setRange] = useState({ from: today, to: today });
  const [format, setFormat] = useState(formatFallback);
  const [selectValues, setSelectValues] = useState({});
  const [includeItems, setIncludeItems] = useState(Boolean(config?.includeItems?.default));
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const defaultFrom = toDateValue(config?.dateRange?.defaultFrom) || today;
    const defaultTo = toDateValue(config?.dateRange?.defaultTo) || defaultFrom || today;
    setRange({ from: defaultFrom, to: defaultTo });

    const defaultFormat =
      config?.defaultFormat && formats.some((f) => f.value === config.defaultFormat)
        ? config.defaultFormat
        : formatFallback;
    setFormat(defaultFormat);

    const nextSelects = {};
    selectFields.forEach((field) => {
      const options = normalizeOptions(field.options);
      const fallback = field.defaultValue ?? options[0]?.value ?? "";
      nextSelects[field.key] = fallback;
    });
    setSelectValues(nextSelects);

    setIncludeItems(Boolean(config?.includeItems?.default));
    setDownloading(false);
    setError("");
  }, [open, config, formats, formatFallback, selectFields, today]);

  const fromDate = dateRangeEnabled
    ? allowFuture
      ? range.from
      : range.from
      ? clampToToday(range.from)
      : null
    : null;

  const toDate = dateRangeEnabled
    ? allowFuture
      ? range.to
      : range.to
      ? clampToToday(range.to)
      : null
    : null;

  const daysSelected = dateRangeEnabled ? rangeDays(fromDate, toDate) : 0;

  const selectRows = useMemo(
    () =>
      selectFields.map((field) => ({
        ...field,
        options: normalizeOptions(field.options),
      })),
    [selectFields]
  );

  const supportsItems =
    config?.includeItems?.enabled &&
    (!config?.includeItems?.formats || config.includeItems.formats.includes(format));
  const effectiveIncludeItems = supportsItems ? includeItems : false;

  const state = useMemo(
    () => ({
      from: dateRangeEnabled ? toISODate(fromDate) : "",
      to: dateRangeEnabled ? toISODate(toDate) : "",
      format,
      includeItems: effectiveIncludeItems,
      selects: selectValues,
    }),
    [dateRangeEnabled, fromDate, toDate, format, effectiveIncludeItems, selectValues]
  );

  const computedFileName = useMemo(() => {
    if (typeof config.fileName === "function") return config.fileName(state);

    const base = String(config?.label || "Export").replace(/\s+/g, "_");
    const ext = format === "pdf" ? "pdf" : format === "csv" ? "csv" : "xlsx";
    if (dateRangeEnabled && state.from) {
      return `${base}_${state.from}_to_${state.to || state.from}.${ext}`;
    }
    return `${base}_${new Date().toISOString().slice(0, 10)}.${ext}`;
  }, [config, state, format, dateRangeEnabled]);

  const canDownload =
    !downloading &&
    !config.disabled &&
    (!dateRangeEnabled || (state.from && state.to)) &&
    (config.endpoint || config.onExport);

  const downloadLabel =
    format === "pdf" ? "Download PDF" : format === "csv" ? "Download CSV" : "Download Excel";

  const handleShortcut = (daysBack) => {
    if (!dateRangeEnabled) return;
    const end = startOfDay(new Date());
    const start = startOfDay(new Date());
    start.setDate(start.getDate() - daysBack);
    setRange({ from: start, to: end });
  };

  const handleToday = () => setRange({ from: today, to: today });

  const handleYesterday = () => {
    const y = startOfDay(new Date());
    y.setDate(y.getDate() - 1);
    setRange({ from: y, to: y });
  };

  const handleExport = async () => {
    if (!canDownload) return;
    setDownloading(true);
    setError("");

    try {
      if (config.onExport) {
        await Promise.resolve(config.onExport(state));
        setExportOpen(false);
        return;
      }

      if (!config.endpoint) throw new Error("No export endpoint configured.");

      const params =
        typeof config.buildParams === "function"
          ? config.buildParams(state)
          : { ...state.selects, from: state.from, to: state.to, format: state.format };

      const response = await axios.get(config.endpoint, { params, responseType: "blob" });

      const blob = new Blob([response.data], {
        type:
          response.headers?.["content-type"] ||
          (format === "csv"
            ? "text/csv"
            : format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = computedFileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setExportOpen(false);
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Unable to export. Please try again.";
      setError(msg);
      setDownloading(false);
    }
  };

  const subtitleText = dateRangeEnabled
    ? fromDate
      ? `${toISODate(fromDate)} to ${toISODate(toDate)} • ${daysSelected} day${daysSelected > 1 ? "s" : ""}`
      : "Pick a date range"
    : "Exports the current view";

  return (
    <ModalShell
      open={open}
      onClose={() => setExportOpen(false)}
      maxWidthClass="max-w-6xl"
      layout="compact"
      title={config.title || "Export sales"}
      subtitle={config.subtitle || subtitleText}
      icon={config.icon || CalendarIcon}
      bodyClassName="max-h-[85vh] overflow-auto"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setExportOpen(false)}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
            disabled={downloading}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={!canDownload}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25",
              !canDownload
                ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                : "bg-teal-600 ring-teal-600 hover:bg-teal-700"
            )}
          >
            {downloading ? "Downloading..." : downloadLabel}
          </button>
        </div>
      }
    >
      <div className="px-6 pb-6 pt-3">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SoftPanel
              title="Date range"
              subtitle={allowFuture ? "Future dates allowed." : "Future dates disabled."}
            >
              <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4 sm:p-6">
                <div className="rdp-polished">
                  <DayPicker
                    mode="range"
                    selected={{ from: fromDate, to: toDate }}
                    onSelect={(next) => {
                      if (!next) return;

                      const nf = next?.from
                        ? allowFuture
                          ? startOfDay(next.from)
                          : clampToToday(next.from)
                        : undefined;

                      const nt = next?.to
                        ? allowFuture
                          ? startOfDay(next.to)
                          : clampToToday(next.to)
                        : undefined;

                      setRange({ from: nf, to: nt });
                    }}
                    disabled={allowFuture ? undefined : { after: today }}
                    numberOfMonths={1}
                    showOutsideDays
                  />
                </div>

                <div className="mt-3 text-xs text-slate-500">
                  Selected{" "}
                  <span className="font-extrabold text-slate-700">{daysSelected}</span>{" "}
                  day{daysSelected > 1 ? "s" : ""}.
                </div>
              </div>
            </SoftPanel>
          </div>

          <div className="lg:col-span-5">
            <SoftPanel
              title="Report options"
              subtitle="Keep it simple, then download."
              right={
                dateRangeEnabled ? (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Chip onClick={handleToday}>Today</Chip>
                    <Chip onClick={handleYesterday}>Yesterday</Chip>
                    <Chip onClick={() => handleShortcut(7)}>Last 7 days</Chip>
                  </div>
                ) : null
              }
            >
              <div className="grid gap-4">
                {selectRows.map((field) => (
                  <Field key={field.key} label={field.label} hint={field.hint}>
                    <Select
                      icon={SlidersHorizontal}
                      value={selectValues[field.key] ?? ""}
                      onChange={(e) =>
                        setSelectValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                    >
                      {field.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ))}

                {formats.length > 1 ? (
                  <Field label="File type" hint="Choose a format to download.">
                    <Select icon={FileText} value={format} onChange={(e) => setFormat(e.target.value)}>
                      {formats.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}

                {supportsItems ? (
                  <ToggleCard
                    checked={includeItems}
                    label={config?.includeItems?.label || "Include item breakdown"}
                    hint={config?.includeItems?.hint || "Adds more detail to the export."}
                    onClick={() => setIncludeItems((v) => !v)}
                  />
                ) : null}

                <Field label="File name" hint="Auto generated file name.">
                  <Input icon={Layers} value={computedFileName} readOnly />
                </Field>

                {error ? (
                  <div className="rounded-2xl bg-rose-600/10 px-4 py-3 text-sm font-semibold text-rose-800 ring-1 ring-rose-700/10">
                    {error}
                  </div>
                ) : null}
              </div>
            </SoftPanel>
          </div>

          <style>{`
            .rdp-polished .rdp {
              --rdp-accent-color: rgb(13 148 136);
              --rdp-accent-background-color: rgba(13, 148, 136, 0.14);
              --rdp-outline: rgba(13, 148, 136, 0.32);
              --rdp-background-color: transparent;
              margin: 0;
            }

            .rdp-polished .rdp-months {
              justify-content: center;
            }

            .rdp-polished .rdp-caption_label {
              font-weight: 900;
              color: rgb(15 23 42);
              font-size: 18px;
              letter-spacing: -0.01em;
            }

            .rdp-polished .rdp-nav_button {
              border-radius: 9999px;
              width: 36px;
              height: 36px;
              color: rgb(13 148 136);
            }
            .rdp-polished .rdp-nav_button svg {
              color: rgb(13 148 136);
              fill: rgb(13 148 136);
            }
            .rdp-polished .rdp-nav_button:hover {
              background-color: rgba(13, 148, 136, 0.10);
            }

            .rdp-polished .rdp-head_cell {
              color: rgb(100 116 139);
              font-weight: 900;
              font-size: 11px;
              letter-spacing: 0.10em;
              text-transform: uppercase;
              padding-bottom: 10px;
            }

            .rdp-polished .rdp-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 10px 10px;
            }

            .rdp-polished .rdp-cell {
              padding: 0;
              text-align: center;
            }

            .rdp-polished .rdp-day {
              padding: 0;
            }

            .rdp-polished .rdp-day_button,
            .rdp-polished .rdp-button {
              width: 44px;
              height: 44px;
              border-radius: 9999px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-weight: 900;
              font-size: 14px;
              line-height: 1;
              color: rgb(15 23 42);
            }

            .rdp-polished .rdp-day_today:not(.rdp-day_selected) .rdp-day_button {
              color: rgb(13 148 136);
            }

            .rdp-polished .rdp-day_selected .rdp-day_button,
            .rdp-polished .rdp-day_range_start .rdp-day_button,
            .rdp-polished .rdp-day_range_end .rdp-day_button {
              background-color: rgb(13 148 136);
              color: white;
            }

            .rdp-polished .rdp-day_range_middle .rdp-day_button {
              background-color: rgba(13, 148, 136, 0.12);
              color: rgb(13 148 136);
            }

            .rdp-polished
              .rdp-day:hover:not(.rdp-day_selected):not(.rdp-day_range_start):not(.rdp-day_range_end)
              .rdp-day_button {
              background-color: rgba(13, 148, 136, 0.10);
              color: rgb(13 148 136);
            }

            .rdp-polished .rdp-day_outside .rdp-day_button {
              color: rgb(148 163 184);
              font-weight: 800;
            }

            .rdp-polished .rdp-day_disabled .rdp-day_button {
              opacity: 0.45;
              cursor: not-allowed;
            }
          `}</style>
        </div>
      </div>
    </ModalShell>
  );
}
