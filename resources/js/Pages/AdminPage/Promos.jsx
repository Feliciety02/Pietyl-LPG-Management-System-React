import React, { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { TableActionButton } from "@/components/Table/ActionTableButton";

import { BadgeDollarSign, Pencil, Archive, RotateCcw, ShieldCheck } from "lucide-react";

import PromoUpsertModal from "@/components/modals/PromoModals/PromoUpsertModal";
import ConfirmDiscontinuePromoModal from "@/components/modals/PromoModals/ConfirmDiscontinuePromoModal";
import ConfirmRestorePromoModal from "@/components/modals/PromoModals/ConfirmRestorePromoModal";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
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

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatValue(promo) {
  if (!promo) return "-";
  const value = Number(promo.value || 0);
  if (promo.discount_type === "percent") {
    return `${value.toFixed(2)}%`;
  }
  return currencyFormatter.format(value);
}

function StatusPill({ active }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        active
          ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
          : "bg-slate-100 text-slate-700 ring-slate-200"
      )}
    >
      {active ? "ACTIVE" : "DISCONTINUED"}
    </span>
  );
}

function KindPill({ kind }) {
  const label = kind === "voucher" ? "VOUCHER" : "PROMO";
  const tone =
    kind === "voucher"
      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
      : "bg-teal-600/10 text-teal-900 ring-teal-700/10";

  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1", tone)}>
      {label}
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

function ManagerPinCard({ pinSet, onSave }) {
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSave = pin.length >= 4 && pin === pinConfirm;

  const handleSave = () => {
    if (!canSave) return;
    setSubmitting(true);
    setError("");
    onSave?.(
      pin,
      pinConfirm,
      () => {
        setSubmitting(false);
        setPin("");
        setPinConfirm("");
      },
      (message) => {
        setError(message || "Unable to update manager PIN.");
        setSubmitting(false);
      }
    );
  };

  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
      <div className="px-6 py-5 border-b border-slate-200">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-extrabold text-slate-900">Manager PIN</div>
            <div className="mt-1 text-xs text-slate-500">
              Required for manual discounts in POS.
            </div>
          </div>
          <span
            className={cx(
              "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold ring-1",
              pinSet
                ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
                : "bg-slate-100 text-slate-700 ring-slate-200"
            )}
          >
            {pinSet ? "PIN SET" : "NOT SET"}
          </span>
        </div>
      </div>
      <div className="p-6 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-xs font-extrabold text-slate-700">New PIN (4-8 digits)</div>
            <input
              type="password"
              inputMode="numeric"
              pattern="\\d*"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
              placeholder="Enter new PIN"
            />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-700">Confirm PIN</div>
            <input
              type="password"
              inputMode="numeric"
              pattern="\\d*"
              value={pinConfirm}
              onChange={(e) => setPinConfirm(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
              placeholder="Re-enter PIN"
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl bg-rose-50 ring-1 ring-rose-200 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Use numbers only. Updating the PIN will invalidate the previous one.
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || submitting}
            className={cx(
              "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-extrabold ring-1 transition",
              !canSave || submitting
                ? "bg-slate-200 text-slate-500 ring-slate-200 cursor-not-allowed"
                : "bg-teal-600 text-white ring-teal-600 hover:bg-teal-700"
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            {submitting ? "Saving..." : "Save PIN"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Promos() {
  const page = usePage();
  const rawPromos = page.props?.promos ?? { data: [], meta: null };
  const { data: rows, meta } = normalizePaginator(rawPromos);
  const filters = page.props?.filters || {};
  const discountSettings = page.props?.discount_settings || {};

  const [q, setQ] = useState(filters?.q || "");
  const [status, setStatus] = useState(filters?.status || "active");
  const [kind, setKind] = useState(filters?.kind || "all");
  const perInitial = Number(filters?.per ?? 10) || 10;

  const pushQuery = (patch = {}) => {
    router.get(
      "/dashboard/admin/promos",
      {
        q,
        status,
        kind,
        per: perInitial,
        page: filters?.page || 1,
        ...patch,
      },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const statusTabs = [
    { value: "active", label: "Active" },
    { value: "discontinued", label: "Discontinued" },
    { value: "all", label: "All" },
  ];

  const kindOptions = [
    { value: "all", label: "All kinds" },
    { value: "promo", label: "Promos" },
    { value: "voucher", label: "Vouchers" },
  ];

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

  const [activePromo, setActivePromo] = useState(null);
  const [upsertOpen, setUpsertOpen] = useState(false);
  const [discontinueOpen, setDiscontinueOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);

  const openCreate = () => {
    setActivePromo(null);
    setUpsertOpen(true);
  };

  const openEdit = (promo) => {
    setActivePromo(promo);
    setUpsertOpen(true);
  };

  const openDiscontinue = (promo) => {
    setActivePromo(promo);
    setDiscontinueOpen(true);
  };

  const openRestore = (promo) => {
    setActivePromo(promo);
    setRestoreOpen(true);
  };

  const handleUpsert = (payload) => {
    if (activePromo?.id) {
      router.put(`/dashboard/admin/promos/${activePromo.id}`, payload, {
        preserveScroll: true,
        onSuccess: () => {
          setUpsertOpen(false);
          setActivePromo(null);
        },
      });
      return;
    }

    router.post("/dashboard/admin/promos", payload, {
      preserveScroll: true,
      onSuccess: () => {
        setUpsertOpen(false);
        setActivePromo(null);
      },
    });
  };

  const confirmDiscontinue = () => {
    if (!activePromo?.id) return;
    router.post(`/dashboard/admin/promos/${activePromo.id}/discontinue`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        setDiscontinueOpen(false);
        setActivePromo(null);
        setStatus("discontinued");
        pushQuery({ status: "discontinued", page: 1 });
      },
    });
  };

  const confirmRestore = () => {
    if (!activePromo?.id) return;
    router.put(`/dashboard/admin/promos/${activePromo.id}/restore`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        setRestoreOpen(false);
        setActivePromo(null);
        setStatus("active");
        pushQuery({ status: "active", page: 1 });
      },
    });
  };

  const columns = useMemo(
    () => [
      {
        key: "code",
        label: "Code",
        render: (p) => (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-teal-600/10 ring-1 ring-teal-700/10 flex items-center justify-center">
              <BadgeDollarSign className="h-4 w-4 text-teal-700" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-slate-900">{p?.code || "-"}</div>
              <div className="text-xs text-slate-500 truncate">{p?.name || "No label"}</div>
            </div>
          </div>
        ),
      },
      {
        key: "kind",
        label: "Kind",
        render: (p) => <KindPill kind={p?.kind} />,
      },
      {
        key: "value",
        label: "Discount",
        render: (p) => (
          <div className="text-sm font-semibold text-slate-800">
            {formatValue(p)} {p?.discount_type === "percent" ? "off" : ""}
          </div>
        ),
      },
      {
        key: "usage",
        label: "Usage",
        render: (p) => {
          const limit = p?.usage_limit;
          return (
            <div className="text-xs text-slate-700 font-semibold">
              {p?.times_redeemed ?? 0} / {limit ? limit : "Unlimited"}
            </div>
          );
        },
      },
      {
        key: "validity",
        label: "Validity",
        render: (p) => {
          const start = p?.starts_at;
          const end = p?.expires_at;
          if (!start && !end) return <span className="text-xs text-slate-500">No expiry</span>;
          if (start && end) return <span className="text-xs text-slate-700">{start} - {end}</span>;
          if (start) return <span className="text-xs text-slate-700">From {start}</span>;
          return <span className="text-xs text-slate-700">Until {end}</span>;
        },
      },
      {
        key: "status",
        label: "Status",
        render: (p) => <StatusPill active={Boolean(p?.is_active)} />,
      },
    ],
    []
  );

  const handleSavePin = (pin, confirmPin, onSuccess, onError) => {
    router.post(
      "/dashboard/admin/promos/manager-pin",
      { manager_pin: pin, manager_pin_confirmation: confirmPin },
      {
        preserveScroll: true,
        onSuccess: () => onSuccess?.(),
        onError: (errs) => {
          const msg = Array.isArray(errs?.manager_pin)
            ? errs.manager_pin[0]
            : errs?.manager_pin || errs?.message;
          onError?.(msg);
        },
      }
    );
  };

  return (
    <Layout title="Promos & Vouchers">
      <div className="grid gap-6">
        <TopCard
          title="Promos & vouchers"
          subtitle="Create promo codes, manage usage limits, and control discount validity."
          right={
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25"
            >
              <BadgeDollarSign className="h-4 w-4" />
              New Code
            </button>
          }
        />

        <ManagerPinCard
          pinSet={Boolean(discountSettings.manager_pin_set)}
          onSave={handleSavePin}
        />

        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-4 justify-between">
          <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-slate-50 p-1 ring-1 ring-slate-200">
            {statusTabs.map((tab) => {
              const active = tab.value === status;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    setStatus(tab.value);
                    pushQuery({ status: tab.value, page: 1 });
                  }}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition",
                    active
                      ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                      : "text-slate-600 hover:text-slate-800"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <DataTableFilters
            variant="inline"
            containerClass="w-full md:w-auto"
            q={q}
            onQ={setQ}
            onQDebounced={(v) => pushQuery({ q: v, page: 1 })}
            placeholder="Search code or name..."
            filters={[
              {
                key: "kind",
                value: kind,
                onChange: (v) => {
                  setKind(v);
                  pushQuery({ kind: v, page: 1 });
                },
                options: kindOptions,
              },
            ]}
          />
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          searchQuery={q}
          emptyTitle="No promos found"
          emptyHint="Create a new promo or adjust your filters."
          renderActions={(p) => (
            <div className="flex items-center justify-end gap-2">
              <TableActionButton
                icon={Pencil}
                onClick={() => openEdit(p)}
                title="Edit promo"
              >
                Edit
              </TableActionButton>

              {p?.is_active ? (
                <TableActionButton
                  tone="danger"
                  icon={Archive}
                  onClick={() => openDiscontinue(p)}
                  title="Discontinue promo"
                >
                  Discontinue
                </TableActionButton>
              ) : (
                <TableActionButton
                  icon={RotateCcw}
                  onClick={() => openRestore(p)}
                  title="Restore promo"
                >
                  Restore
                </TableActionButton>
              )}
            </div>
          )}
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
      </div>

      <PromoUpsertModal
        open={upsertOpen}
        onClose={() => setUpsertOpen(false)}
        promo={activePromo}
        onSubmit={handleUpsert}
      />

      <ConfirmDiscontinuePromoModal
        open={discontinueOpen}
        onClose={() => setDiscontinueOpen(false)}
        promo={activePromo}
        onConfirm={confirmDiscontinue}
      />

      <ConfirmRestorePromoModal
        open={restoreOpen}
        onClose={() => setRestoreOpen(false)}
        promo={activePromo}
        onConfirm={confirmRestore}
      />
    </Layout>
  );
}
