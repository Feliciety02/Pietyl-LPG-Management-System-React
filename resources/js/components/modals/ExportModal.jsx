import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import { Calendar as CalendarIcon, Download, CheckCircle2, X } from "lucide-react";
import ModalShell from "./ModalShell";
import { useExportAction } from "@/components/Table/ExportContext";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

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

function SoftCard({ className = "", children }) {
  return (
    <div className={cx("rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm", className)}>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="text-xs font-extrabold text-slate-700">{label}</div>
      {hint ? <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div> : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Select({ children, ...props }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2.5 focus-within:ring-teal-500/30">
      <select {...props} className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none">
        {children}
      </select>
    </div>
  );
}

function Input({ ...props }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-3 py-2.5">
      <input {...props} className="w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none" />
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
  const selectRows = selectFields.map((field) => ({
    ...field,
    options: normalizeOptions(field.options),
  }));

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
    if (typeof config.fileName === "function") {
      return config.fileName(state);
    }

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
    const d = startOfDay(new Date());
    d.setDate(d.getDate() - daysBack);
    setRange({ from: d, to: startOfDay(new Date()) });
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

      if (!config.endpoint) {
        throw new Error("No export endpoint configured.");
      }

      const params =
        typeof config.buildParams === "function"
          ? config.buildParams(state)
          : { ...state.selects, from: state.from, to: state.to, format: state.format };

      const response = await axios.get(config.endpoint, {
        params,
        responseType: "blob",
      });

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

  return (
    <ModalShell
      open={open}
      onClose={() => setExportOpen(false)}
      layout="compact"
      maxWidthClass="max-w-6xl"
      title={config.title || "Export"}
      subtitle={config.subtitle || "Pick a range, then export."}
      icon={config.icon || CalendarIcon}
      bodyClassName="max-h-[85vh] overflow-auto"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {dateRangeEnabled ? (
              fromDate ? (
                <span>
                  Selected{" "}
                  <span className="font-extrabold text-slate-700">{daysSelected}</span>{" "}
                  day{daysSelected > 1 ? "s" : ""}.
                </span>
              ) : (
                "Select a date range to continue."
              )
            ) : (
              "Ready to export the current view."
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setExportOpen(false)}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={!canDownload}
              className={cx(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 transition focus:outline-none focus:ring-4",
                !canDownload
                  ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                  : "bg-teal-600 ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25"
              )}
            >
              <Download className="h-4 w-4" />
              {downloading ? "Downloading..." : downloadLabel}
            </button>
          </div>
        </div>
      }
    >
      <div className="px-1 sm:px-2">
        <div className={cx("grid gap-6", dateRangeEnabled ? "lg:grid-cols-12" : "")}>
          {dateRangeEnabled ? (
            <SoftCard className="lg:col-span-7">
              <div className="p-5 sm:p-6">
                <div className="space-y-3">
                  <div className="text-sm font-extrabold text-slate-900">Pick dates</div>
                  <div className="text-xs text-slate-500">
                    Select a start date and end date.{" "}
                    {allowFuture ? "Future dates are allowed." : "Future dates are disabled."}
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <Chip onClick={() => handleShortcut(0)}>Today</Chip>
                    <Chip onClick={() => handleShortcut(1)}>Yesterday</Chip>
                    <Chip onClick={() => handleShortcut(7)}>Last 7 days</Chip>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl bg-slate-50/80 ring-1 ring-slate-200/80 p-4 sm:p-6">
                  <div className="rdp-teal">
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
                    Tip: use quick chips for faster ranges.
                  </div>
                </div>
              </div>
            </SoftCard>
          ) : null}

          <SoftCard className={dateRangeEnabled ? "lg:col-span-5" : ""}>
            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-slate-900">Report options</div>
                  <div className="mt-1 text-xs text-slate-500">Keep it simple, then export.</div>
                </div>

                <div className="shrink-0 inline-flex items-center gap-2 rounded-2xl bg-teal-600/10 px-3 py-2 ring-1 ring-teal-700/10">
                  <CheckCircle2 className="h-4 w-4 text-teal-700" />
                  <span className="text-xs font-extrabold text-teal-900">Ready</span>
                </div>
              </div>

              {error ? (
                <div className="mt-4 rounded-2xl bg-rose-600/10 px-4 py-3 text-sm font-semibold text-rose-800 ring-1 ring-rose-700/10">
                  {error}
                </div>
              ) : null}

              <div className="mt-6 grid gap-5">
                {dateRangeEnabled ? (
                  <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
                    <div className="text-xs font-extrabold text-slate-600">Selected range</div>
                    <div className="mt-1 text-base font-extrabold text-slate-900 tabular-nums">
                      {fromDate ? toISODate(fromDate) : "--"}{" "}
                      <span className="text-slate-400">to</span>{" "}
                      {toDate ? toISODate(toDate) : "--"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {fromDate
                        ? `${daysSelected} day${daysSelected > 1 ? "s" : ""} selected`
                        : "Select a start date"}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
                    <div className="text-xs font-extrabold text-slate-600">Scope</div>
                    <div className="mt-1 text-sm font-extrabold text-slate-900">Current filters</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Uses the active filters on this page.
                    </div>
                  </div>
                )}

                {selectRows.map((field) => (
                  <Field key={field.key} label={field.label} hint={field.hint}>
                    <Select
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
                  <Field label="File type">
                    <Select value={format} onChange={(e) => setFormat(e.target.value)}>
                      {formats.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}

                {supportsItems ? (
                  <button
                    type="button"
                    onClick={() => setIncludeItems((v) => !v)}
                    className={cx(
                      "w-full rounded-3xl px-4 py-4 text-left ring-1 transition focus:outline-none focus:ring-4 focus:ring-teal-500/15",
                      includeItems
                        ? "bg-teal-600/10 ring-teal-700/10"
                        : "bg-white ring-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cx(
                          "mt-0.5 h-5 w-5 rounded-md ring-1 flex items-center justify-center",
                          includeItems ? "bg-teal-600 ring-teal-600" : "bg-white ring-slate-300"
                        )}
                      >
                        <div
                          className={cx(
                            "h-2.5 w-2.5 rounded-sm",
                            includeItems ? "bg-white" : "bg-transparent"
                          )}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-slate-900">
                          {config?.includeItems?.label || "Include item breakdown"}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {config?.includeItems?.hint || "Adds more detail to the export."}
                        </div>
                      </div>
                    </div>
                  </button>
                ) : null}

                <Field label="File name" hint="You can rename this before downloading.">
                  <Input value={computedFileName} readOnly />
                </Field>
              </div>
            </div>
          </SoftCard>
        </div>

        <style>{`
          .rdp-teal .rdp {
            --rdp-accent-color: rgb(13 148 136);
            --rdp-accent-background-color: rgba(13, 148, 136, 0.16);
            --rdp-outline: rgba(13, 148, 136, 0.45);
            --rdp-background-color: transparent;
            margin: 0;
          }

          .rdp-teal .rdp-months {
            justify-content: center;
            gap: 0;
          }

          .rdp-teal .rdp-caption_label {
            font-weight: 800;
            color: rgb(15 23 42);
            font-size: 16px;
          }

          .rdp-teal .rdp-nav_button {
            border-radius: 12px;
            color: rgb(15 118 110);
          }

          .rdp-teal .rdp-nav_button:hover {
            background-color: rgba(13, 148, 136, 0.12);
          }

          .rdp-teal .rdp-head_cell {
            color: rgb(15 118 110);
            font-weight: 700;
            font-size: 11px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }

          .rdp-teal .rdp-day {
            border-radius: 9999px;
            font-weight: 700;
          }

          .rdp-teal .rdp-day_today:not(.rdp-day_selected) {
            color: rgb(13 148 136);
            font-weight: 800;
          }

          .rdp-teal .rdp-day_selected,
          .rdp-teal .rdp-day_range_start,
          .rdp-teal .rdp-day_range_end {
            background-color: rgb(13 148 136);
            color: white;
          }

          .rdp-teal .rdp-day_range_middle {
            background-color: rgba(13, 148, 136, 0.18);
            color: rgb(15 118 110);
            border-radius: 9999px;
          }

          .rdp-teal .rdp-day:hover:not(.rdp-day_selected):not(.rdp-day_range_start):not(.rdp-day_range_end) {
            background-color: rgba(13, 148, 136, 0.12);
            color: rgb(15 118 110);
          }

          .rdp-teal .rdp-table {
            width: 100%;
          }
        `}</style>
      </div>
    </ModalShell>
  );
}
