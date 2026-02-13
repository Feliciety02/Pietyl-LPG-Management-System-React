import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import {
  X,
  Calendar as CalendarIcon,
  Download,
  CheckCircle2,
  FileText,
} from "lucide-react";
import ModalShell from "../ModalShell";

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

function formatRangeLabel(from, to) {
  if (!from && !to) return "No dates selected";
  if (from && !to) return toISODate(from);
  return `${toISODate(from)} to ${toISODate(to)}`;
}

/* ---------------- UI primitives (match your modal style) ---------------- */

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
      <select
        {...props}
        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
      >
        {children}
      </select>
    </div>
  );
}

function Input({ ...props }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-3 py-2.5">
      <input
        {...props}
        className="w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none"
      />
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

function RangePill({ from, to }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 ring-1 ring-slate-200">
      <FileText className="h-4 w-4 text-slate-600" />
      <span className="text-xs font-extrabold text-slate-900">
        {formatRangeLabel(from, to)}
      </span>
    </div>
  );
}

/* ---------------- Page ---------------- */

export default function PrintSalesModal({
  open,
  onClose,
  defaultStatus = "paid",
  onDownloaded,
  exportUrl = "/dashboard/cashier/sales/export",
  defaultFormat = "xlsx",
  formats = ["xlsx", "csv"],
}) {
  const today = useMemo(() => startOfDay(new Date()), []);

  const [range, setRange] = useState({ from: today, to: today });
  const [status, setStatus] = useState(defaultStatus);
  const [format, setFormat] = useState(defaultFormat);
  const [includeItems, setIncludeItems] = useState(true);

  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setDownloading(false);
    setStatus(defaultStatus);
    setRange({ from: today, to: today });
    setFormat(defaultFormat);
    setIncludeItems(true);
  }, [open, defaultStatus, defaultFormat, today]);

  const from = range?.from ? clampToToday(range.from) : null;
  const to = range?.to ? clampToToday(range.to) : null;

  const daysSelected = rangeDays(from, to);
  const formatOptions = Array.isArray(formats) && formats.length ? formats : ["xlsx"];
  const activeFormat = formatOptions.includes(format) ? format : formatOptions[0];
  const supportsItems = activeFormat === "xlsx";

  const fileName = useMemo(() => {
    const a = from ? toISODate(from) : "start";
    const b = to ? toISODate(to) : a;
    const ext = activeFormat === "csv" ? "csv" : "xlsx";
    return `Sales_${a}_to_${b}.${ext}`;
  }, [from, to, activeFormat]);

  const canDownload = Boolean(from) && Boolean(to) && !downloading;
  const downloadLabel = activeFormat === "csv" ? "Download CSV" : "Download Excel";

  const handleShortcut = (daysBack) => {
    const d = startOfDay(new Date());
    d.setDate(d.getDate() - daysBack);
    setRange({ from: d, to: startOfDay(new Date()) });
  };

  const downloadReport = async () => {
    if (!canDownload) return;

    setDownloading(true);
    setError("");

    try {
      const params = {
        from_date: toISODate(from),
        to_date: toISODate(to),
        status_scope: status,
        include_items: supportsItems && includeItems ? 1 : 0,
        format: activeFormat,
      };

      const res = await axios.get(exportUrl, {
        params,
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type:
          res.headers?.["content-type"] ||
          (activeFormat === "csv"
            ? "text/csv"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      onDownloaded?.(params);
      onClose?.();
    } catch (e) {
      const message =
        e?.response?.data?.message || "Unable to download report. Please try again.";
      setError(message);
      setDownloading(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      layout="compact"
      maxWidthClass="max-w-6xl"
      title="Export sales"
      subtitle="Pick a business date range, then download a report."
      icon={CalendarIcon}
      bodyClassName="max-h-[85vh] overflow-auto"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {from ? (
              <span>
                Selected{" "}
                <span className="font-extrabold text-slate-700">{daysSelected}</span>{" "}
                day{daysSelected > 1 ? "s" : ""}.
              </span>
            ) : (
              "Select a date range to continue."
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>

            <button
              type="button"
              onClick={downloadReport}
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
        <div className="grid gap-6 lg:grid-cols-12">
          {/* LEFT */}
          <SoftCard className="lg:col-span-7">
            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-slate-900">Pick dates</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Select a start date and end date. Future dates are disabled.
                  </div>

                  {/* quick chips under title */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Chip onClick={() => handleShortcut(0)}>Today</Chip>
                    <Chip onClick={() => handleShortcut(1)}>Yesterday</Chip>
                    <Chip onClick={() => handleShortcut(7)}>Last 7 days</Chip>
                  </div>
                </div>
              </div>

              {/* calendar */}
              <div className="mt-5 rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4 sm:p-5">
                <div className="rdp-teal">
                  <DayPicker
                    mode="range"
                    selected={{ from, to }}
                    onSelect={(next) => {
                      if (!next) return;
                      const nf = next?.from ? clampToToday(next.from) : undefined;
                      const nt = next?.to ? clampToToday(next.to) : undefined;
                      setRange({ from: nf, to: nt });
                    }}
                    disabled={{ after: today }}
                    numberOfMonths={1}
                    showOutsideDays
                  />
                </div>

                {/* range pill below the calendar to remove dead space */}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Tip: use quick chips for faster ranges.
                  </div>
                  <RangePill from={from} to={to} />
                </div>
              </div>
            </div>
          </SoftCard>

          {/* RIGHT */}
          <SoftCard className="lg:col-span-5">
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

              <div className="mt-5 grid gap-4">
                <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
                  <div className="text-xs font-extrabold text-slate-600">Selected range</div>
                  <div className="mt-1 text-base font-extrabold text-slate-900 tabular-nums">
                    {from ? toISODate(from) : "—"}{" "}
                    <span className="text-slate-400">to</span>{" "}
                    {to ? toISODate(to) : "—"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {from ? `${daysSelected} day${daysSelected > 1 ? "s" : ""} selected` : "Select a start date"}
                  </div>
                </div>

                <Field label="Sales to include" hint="Most cashiers print Paid only.">
                  <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="paid">Paid only</option>
                    <option value="all">All status</option>
                    <option value="pending">Pending only</option>
                    <option value="failed">Failed only</option>
                  </Select>
                </Field>

                {formatOptions.length > 1 ? (
                  <Field label="File type" hint="Choose CSV for imports or Excel for formatting.">
                    <Select value={format} onChange={(e) => setFormat(e.target.value)}>
                      {formatOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt === "csv" ? "CSV (.csv)" : "Excel (.xlsx)"}
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
                          Include item breakdown
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          Adds a second sheet with items per sale.
                        </div>
                      </div>
                    </div>
                  </button>
                ) : null}

                <Field label="File name" hint="You can rename this before downloading.">
                  <Input value={fileName} readOnly />
                </Field>
              </div>
            </div>
          </SoftCard>
        </div>

        {/* teal theme for DayPicker */}
        <style>{`
          .rdp-teal .rdp {
            --rdp-accent-color: rgb(13 148 136);
            --rdp-accent-background-color: rgba(13, 148, 136, 0.12);
            --rdp-outline: rgba(13, 148, 136, 0.35);
            --rdp-background-color: transparent;
            margin: 0;
          }

          .rdp-teal .rdp-months {
            justify-content: center;
          }

          .rdp-teal .rdp-caption_label {
            font-weight: 800;
            color: rgb(15 23 42);
            font-size: 16px;
          }

          .rdp-teal .rdp-nav_button {
            border-radius: 14px;
          }

          .rdp-teal .rdp-day {
            border-radius: 9999px;
            font-weight: 800;
          }

          .rdp-teal .rdp-day_selected,
          .rdp-teal .rdp-day_range_start,
          .rdp-teal .rdp-day_range_end {
            color: white;
          }

          .rdp-teal .rdp-day_range_middle {
            border-radius: 9999px;
          }

          /* make the calendar feel less cramped */
          .rdp-teal .rdp-table {
            width: 100%;
          }
        `}</style>
      </div>
    </ModalShell>
  );
}
