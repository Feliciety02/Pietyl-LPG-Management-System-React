import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import ModalShell from "@/components/modals/ModalShell";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";

import { Eye, Wallet, AlertTriangle, ReceiptText } from "lucide-react";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";

import { TableActionButton } from "@/components/Table/ActionTableButton";
import FinancePaymentModal from "@/components/modals/InventoryModals/FinancePaymentModal";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Tabs({ tabs, value, onChange }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-slate-50 p-1 ring-1 ring-slate-200">
      {tabs.map((t) => {
        const active = t.value === value;

        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={cx(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition",
              active
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "text-slate-600 hover:text-slate-800"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function normalizePaginator(p) {
  const x = p || {};
  const data = Array.isArray(x.data) ? x.data : [];
  const meta =
    x.meta && typeof x.meta === "object"
      ? x.meta
      : x.current_page != null || x.last_page != null
      ? x
      : null;

  return { data, meta };
}

const PESO_FORMATTER = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function parseNumericValue(value) {
  if (value == null || value === "") return null;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

function formatPesoDisplay(value) {
  const numeric = parseNumericValue(value);
  if (numeric == null) return "—";
  return PESO_FORMATTER.format(numeric);
}

function normalizeStatus(status) {
  return String(status || "").toLowerCase().replace(/\s+/g, "_");
}

function StatusPill({ status }) {
  const s = normalizeStatus(status);

  const tone =
    s === "unpaid"
      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
      : s === "paid"
      ? "bg-emerald-600/10 text-emerald-900 ring-emerald-700/10"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  const labelMap = {
    unpaid: "UNPAID",
    paid: "PAID",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        tone
      )}
    >
      {labelMap[s] || (status ? String(status).toUpperCase() : "UNKNOWN")}
    </span>
  );
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

function KpiCard({ icon: Icon, label, value, hint, tone = "teal" }) {
  const toneBox =
    tone === "amber"
      ? "bg-amber-600/10 ring-amber-700/10"
      : tone === "emerald"
      ? "bg-emerald-600/10 ring-emerald-700/10"
      : "bg-teal-600/10 ring-teal-700/10";

  const toneIcon =
    tone === "amber"
      ? "text-amber-800"
      : tone === "emerald"
      ? "text-emerald-800"
      : "text-teal-700";

  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900 tabular-nums">
            {value}
          </div>
          {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
        </div>
        <div className={cx("h-11 w-11 rounded-2xl ring-1 flex items-center justify-center", toneBox)}>
          <Icon className={cx("h-5 w-5", toneIcon)} />
        </div>
      </div>
    </div>
  );
}

export default function Payables() {
  const page = usePage();

  const rawPayables = page.props?.payables ?? { data: [], meta: null };
  const { data: rows, meta } = normalizePaginator(rawPayables);

  const filters = page.props?.filters ?? { status: "all", q: "" };
  const summary = page.props?.summary ?? { total_unpaid_amount: 0, count_unpaid: 0 };

  const qInitial = filters?.q || "";
  const statusInitial = filters?.status || "all";
  const perInitial = Number(filters?.per || meta?.per_page || 10) || 10;

  const [q, setQ] = useState(qInitial);
  const [status, setStatus] = useState(statusInitial);

  const [paymentTarget, setPaymentTarget] = useState(null);

  const [viewTarget, setViewTarget] = useState(null);
  const [viewDetail, setViewDetail] = useState(null);
  const [viewError, setViewError] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [modalLoading, setModalLoading] = useState(false);

  const loading = Boolean(page.props?.loading);

  const buildQueryPayload = (patch = {}) => {
    const finalStatus = patch.status ?? status;

    return {
      q,
      status: finalStatus,
      per: patch.per ?? perInitial,
      ...patch,
    };
  };

  const pushQuery = (patch = {}) => {
    router.get("/dashboard/accountant/payables", buildQueryPayload(patch), {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    });
  };

  const refreshPayables = () => {
    router.reload({ preserveScroll: true, preserveState: true });
  };

  const openPaymentModal = (row) => {
    setPaymentTarget(row);
  };

  const closePaymentModal = () => {
    setPaymentTarget(null);
  };

  const fetchPayableDetail = (id) => {
    if (!id) return;
    setDetailLoading(true);
    setViewError(null);

    axios
      .get(`/dashboard/accountant/payables/${id}`, {
        headers: { Accept: "application/json" },
      })
      .then((response) => {
        setViewDetail(response.data);
      })
      .catch((error) => {
        const message =
          error?.response?.data?.message ||
          error?.response?.statusText ||
          error?.message ||
          "Unable to load payable details.";
        setViewError(message);
      })
      .finally(() => {
        setDetailLoading(false);
      });
  };

  const openViewModal = (row) => {
    setViewTarget(row);
    setViewDetail(null);
    setViewError(null);
    fetchPayableDetail(row?.id);
  };

  const closeViewModal = () => {
    setViewTarget(null);
    setViewDetail(null);
    setViewError(null);
    setDetailLoading(false);
  };

  const refreshViewDetail = () => {
    if (!viewTarget?.id) return;
    fetchPayableDetail(viewTarget.id);
  };

  const handleRecordPayment = (_purchase, payload) => {
    if (!paymentTarget?.id) return;
    setModalLoading(true);

    router
      .post(
        `/dashboard/accountant/payables/${paymentTarget.id}/pay`,
        {
          payment_method: payload?.payment_method || "cash",
          bank_ref: payload?.reference || null,
          paid_amount: payload?.amount ?? null,
        },
        {
          preserveScroll: true,
          preserveState: true,
          onSuccess: () => {
            closePaymentModal();
            refreshPayables();
          },
          onFinish: () => setModalLoading(false),
        }
      )
      .catch(() => setModalLoading(false));
  };

  const statusTabs = [
    { value: "all", label: "All" },
    { value: "unpaid", label: "Unpaid" },
    { value: "paid", label: "Paid" },
  ];

  const activeStatusTab = statusTabs.some((t) => t.value === status) ? status : "all";

  const handlePrev = () => {
    if (!meta) return;
    if ((meta.current_page || 1) <= 1) return;
    pushQuery({ page: (meta.current_page || 1) - 1 });
  };

  const handleNext = () => {
    if (!meta) return;
    if ((meta.current_page || 1) >= (meta.last_page || 1)) return;
    pushQuery({ page: (meta.current_page || 1) + 1 });
  };

  const fillerRows = useMemo(() => {
    return Array.from({ length: perInitial }).map((_, i) => ({
      id: `__filler__${i}`,
      __filler: true,
    }));
  }, [perInitial]);

  const tableRows = loading ? fillerRows : rows;

  const unpaidCount = Number(summary.count_unpaid || 0);
  const unpaidAmount = Number(summary.total_unpaid_amount || 0);
  const damageAdjustment = Number(summary.damage_adjustment || 0);

  const countTone = unpaidCount > 0 ? "amber" : "teal";
  const amountTone = unpaidAmount > 0 ? "amber" : "teal";
  const damageTone = damageAdjustment > 0 ? "amber" : "teal";

  const columns = useMemo(
    () => [
      {
        key: "supplier",
        label: "Supplier",
        render: (row) =>
          row?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-40" />
              <SkeletonLine w="w-28" />
            </div>
          ) : (
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-slate-900 truncate">
                {row.supplier_name || "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500 truncate">{row.source_ref || "—"}</div>
            </div>
          ),
      },
      {
        key: "item",
        label: "Item",
        render: (row) =>
          row?.__filler ? (
            <SkeletonLine w="w-32" />
          ) : row?.purchase ? (
            <div className="text-sm text-slate-800">
              {row.purchase.product_name || "N/A"}
              {row.purchase.variant ? <span className="text-slate-500"> ({row.purchase.variant})</span> : null}
            </div>
          ) : (
            <div className="text-sm text-slate-500">N/A</div>
          ),
      },
      {
        key: "amount",
        label: "Amount",
        render: (row) =>
          row?.__filler ? (
            <SkeletonLine w="w-24" />
          ) : (
            <div className="text-sm font-extrabold text-slate-900 tabular-nums">
              {formatPesoDisplay(row.amount)}
            </div>
          ),
      },
      {
        key: "damage_reduction",
        label: "Damage adjustment",
        render: (row) =>
          row?.__filler ? (
            <SkeletonLine w="w-24" />
          ) : Number(row.damage_reduction || 0) > 0 ? (
            <div className="space-y-1">
              <div className="text-sm font-extrabold text-amber-900 tabular-nums">
                {formatPesoDisplay(row.damage_reduction)}
              </div>
              <div className="text-[11px] text-amber-600">
                {Number(row.damaged_qty || 0).toFixed(2)} units
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">—</div>
          ),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => (row?.__filler ? <SkeletonPill w="w-20" /> : <StatusPill status={row.status} />),
      },
      {
        key: "created_at",
        label: "Created",
        render: (row) =>
          row?.__filler ? <SkeletonLine w="w-28" /> : <div className="text-sm text-slate-600">{row.created_at || "—"}</div>,
      },
    ],
    []
  );

  return (
    <Layout title="Supplier payables">
      <div className="grid gap-6">
        <TopCard
          title="Supplier payables"
          subtitle="Review unpaid supplier balances and record supplier payments."
          right={
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">
              Tap a row to open actions
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <KpiCard icon={AlertTriangle} label="Unpaid count" value={String(unpaidCount)} hint="Payables still open" tone={countTone} />
          <KpiCard icon={Wallet} label="Unpaid amount" value={PESO_FORMATTER.format(unpaidAmount)} hint="Total outstanding balance" tone={amountTone} />
          {damageAdjustment > 0 ? (
            <KpiCard icon={ReceiptText} label="Damage reduction" value={PESO_FORMATTER.format(damageAdjustment)} hint="Adjust payment for damaged goods" tone={damageTone} />
          ) : null}
        </div>

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-4 justify-between">
          <Tabs
            tabs={statusTabs}
            value={activeStatusTab}
            onChange={(v) => {
              setStatus(v);
              pushQuery({ status: v, page: 1 });
            }}
          />

          <DataTableFilters
            variant="inline"
            containerClass="w-full md:w-auto"
            q={q}
            onQ={setQ}
            onQDebounced={(v) => pushQuery({ q: v, page: 1 })}
            placeholder="Search supplier or reference..."
            filters={[]}
          />
        </div>

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          searchQuery={q}
          emptyTitle="No payables found"
          emptyHint="Payables appear after purchases are received."
          rowKey={(row) => (row?.__filler ? row.id : `payable_${row.id}`)}
          renderActions={(row) =>
            row?.__filler ? (
              <div className="flex items-center justify-end gap-2">
                <SkeletonButton w="w-28" />
              </div>
            ) : (() => {
              const canPay = normalizeStatus(row.status) === "unpaid";

              return (
                <div className="flex items-center justify-end gap-2">
                  <TableActionButton icon={Eye} onClick={() => openViewModal(row)} title="View payable">
                    View
                  </TableActionButton>

                  {canPay ? (
                    <TableActionButton
                      icon={Wallet}
                      tone="primary"
                      onClick={() => openPaymentModal(row)}
                      title="Pay supplier"
                    >
                      Pay
                    </TableActionButton>
                  ) : null}
                </div>
              );
            })()
          }
        />

        <DataTablePagination
          meta={meta}
          perPage={perInitial}
          onPerPage={(n) => pushQuery({ per: n, page: 1 })}
          onPrev={handlePrev}
          onNext={handleNext}
          disablePrev={!meta || (meta.current_page || 1) <= 1}
          disableNext={!meta || (meta.current_page || 1) >= (meta.last_page || 1)}
        />

        {/* Payment modal */}
   <FinancePaymentModal
  open={Boolean(paymentTarget)}
  onClose={() => setPaymentTarget(null)}
  loading={modalLoading}
  payable={paymentTarget}
  purchase={paymentTarget?.purchase}
  onPay={handleRecordPayment}
/>


        <PayableViewModal
          open={Boolean(viewTarget)}
          onClose={closeViewModal}
          payable={viewTarget}
          detail={viewDetail}
          loading={detailLoading}
          error={viewError}
          onRefresh={refreshViewDetail}
        />
      </div>
    </Layout>
  );
}

const LEDGER_ACTION_LABELS = {
  created: "Payable created",
  deduction_applied: "Damage adjustment",
  payment_recorded: "Payment recorded",
  note_added: "Note added",
};

function PayableViewModal({ open, onClose, payable, detail, loading = false, error, onRefresh }) {
  const detailData = detail?.payable;
  const data = detailData ?? payable;
  const ledgerEntries = detailData?.ledger ?? payable?.ledger ?? [];
  const sortedLedger = [...ledgerEntries].sort((a, b) => {
    const first = new Date(a.created_at || 0).getTime();
    const second = new Date(b.created_at || 0).getTime();
    return second - first;
  });

  const [note, setNote] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);

  useEffect(() => {
    if (!open) setNote("");
  }, [open]);

  if (loading && !data) {
    return (
      <ModalShell
        open={open}
        onClose={onClose}
        title="Payable"
        subtitle="Loading..."
        icon={Wallet}
        layout="compact"
        maxWidthClass="max-w-2xl"
      >
        <div className="rounded-3xl bg-slate-50/70 ring-1 ring-slate-200/70 p-6 text-center text-slate-500">
          Loading payable details…
        </div>
      </ModalShell>
    );
  }

  if (!data) return null;

  const supplierName = data.supplier?.name ?? data.supplier_name ?? "—";
  const summaryAmount = Number(data.amount ?? 0);
  const summaryGross = Number(data.gross_amount ?? 0);
  const summaryDeduction = Number(data.deductions_total ?? 0);
  const purchase = data.purchase;

  const getLedgerLabel = (action) => LEDGER_ACTION_LABELS[action] ?? action?.replace(/_/g, " ") ?? "Activity";

  const getLedgerMessage = (entry) => {
    if (!entry) return "Recorded.";
    const meta = entry.meta ?? entry.payload ?? {};
    const noteMessage = entry.note ?? meta.note;
    if (noteMessage) return noteMessage;

    const paymentAmount = entry.amount ?? meta.paid_amount ?? meta.net_amount ?? 0;
    const paymentMethod = meta.payment_method ? ` via ${meta.payment_method}` : "";
    const referenceValue = entry.reference ?? meta.reference ?? meta.bank_ref ?? meta.supplier_reference_no;
    const referenceLabel = referenceValue ? ` (${referenceValue})` : "";

    if (entry.entry_type === "payment_recorded" || meta.paid_amount) {
      return `Payment recorded: ${formatPesoDisplay(paymentAmount)}${paymentMethod}${referenceLabel}`;
    }

    if (meta.net_amount || meta.gross_amount) {
      return `Gross ${formatPesoDisplay(meta.gross_amount ?? 0)} · Net ${formatPesoDisplay(meta.net_amount ?? 0)}`;
    }

    if (meta.deductions_total) {
      return `${formatPesoDisplay(meta.deductions_total)} damage deduction applied`;
    }

    return referenceLabel ? `Ref ${referenceValue}` : "Recorded.";
  };

  const handleAddNote = () => {
    if (!data?.id) return;
    const trimmed = note.trim();
    if (!trimmed || noteLoading) return;

    setNoteLoading(true);
    router
      .post(
        `/dashboard/accountant/payables/${data.id}/notes`,
        { note: trimmed },
        {
          preserveState: true,
          preserveScroll: true,
          onSuccess: () => {
            setNote("");
            onRefresh?.();
          },
          onFinish: () => setNoteLoading(false),
        }
      )
      .catch(() => setNoteLoading(false));
  };

  const infoRows = [
    { label: "Delivered qty", value: purchase?.delivered_qty ?? "—" },
    { label: "Damaged qty", value: purchase?.damaged_qty ?? "—" },
    { label: "Missing qty", value: purchase?.missing_qty ?? "—" },
    { label: "Damage category", value: purchase?.damage_category ?? "—" },
    { label: "Damage reason", value: purchase?.damage_reason ?? "—" },
    { label: "Received at", value: purchase?.received_at ?? "—" },
  ];

  const referenceRows = [
    { label: "Supplier ref", value: purchase?.supplier_reference_no ?? "—" },
    { label: "Delivery ref", value: purchase?.delivery_reference_no ?? "—" },
  ];

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      layout="compact"
      maxWidthClass="max-w-5xl"
      title={data.source_ref || "Payable"}
      subtitle={`Supplier: ${supplierName}`}
      icon={Wallet}
    >
      <div className="grid gap-4">
        {error ? (
          <div className="rounded-2xl bg-rose-50 ring-1 ring-rose-200 p-4 text-sm font-semibold text-rose-900">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Amount</div>
              <StatusPill status={data.status} />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {formatPesoDisplay(summaryAmount)}
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <div>
                Gross: <span className="font-semibold text-slate-700">{formatPesoDisplay(summaryGross)}</span>
              </div>
              <div>
                Deductions: <span className="font-semibold text-slate-700">{formatPesoDisplay(summaryDeduction)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-4 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Quantities</div>
            <div className="grid gap-2">
              {infoRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm text-slate-600">
                  <span className="text-xs font-semibold text-slate-500">{row.label}</span>
                  <span className="font-semibold text-slate-800">{row.value ?? "—"}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-4 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">References</div>
            <div className="grid gap-2">
              {referenceRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm text-slate-600">
                  <span className="text-xs font-semibold text-slate-500">{row.label}</span>
                  <span className="font-semibold text-slate-800">{row.value ?? "—"}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-500">Created {data.created_at || "—"}</div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ledger</div>
              <button type="button" onClick={onRefresh} className="text-xs font-semibold text-slate-500 hover:text-slate-700" disabled={loading}>
                Refresh
              </button>
            </div>

            <div className="space-y-3">
              {sortedLedger.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-3 text-xs font-semibold text-slate-500">
                  No ledger entries yet.
                </div>
              ) : (
                sortedLedger.map((entry) => (
                  <div key={`${entry.created_at}-${entry.action}`} className="rounded-2xl bg-slate-50/70 p-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>{getLedgerLabel(entry.action)}</span>
                      <span>{entry.created_at ? new Date(entry.created_at).toLocaleString() : "—"}</span>
                    </div>
                    <div className="mt-1 text-sm text-slate-700">{getLedgerMessage(entry)}</div>
                    {entry.actor?.name ? <div className="mt-1 text-[11px] text-slate-500">By {entry.actor.name}</div> : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-4 space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Accountant note</div>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-slate-200/80 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
              placeholder="Verified invoice vs received quantity..."
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleAddNote}
                disabled={!note.trim() || noteLoading}
                className={cx(
                  "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white transition focus:outline-none focus:ring-4",
                  !note.trim() || noteLoading
                    ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                    : "bg-teal-600 ring-teal-600 hover:bg-teal-700 focus:ring-teal-500/25"
                )}
              >
                {noteLoading ? "Saving..." : "Save note"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
