// resources/js/pages/Inventory/StockCounts.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";
import { Boxes, CheckCircle2, ClipboardCheck } from "lucide-react";
import { SkeletonLine, SkeletonPill, SkeletonButton } from "@/components/ui/Skeleton";
import RecountStockModal from "@/components/modals/StockCountModals/RecountStockModal";
import SubmitStockCountModal from "@/components/modals/StockCountModals/SubmitStockCountModal";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
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

function CountPill({ label, value, tone = "slate" }) {
  const cls =
    tone === "teal"
      ? "bg-teal-600/10 text-teal-900 ring-teal-700/10"
      : tone === "amber"
      ? "bg-amber-600/10 text-amber-900 ring-amber-700/10"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1",
        cls
      )}
    >
      {label} {value}
    </span>
  );
}

export default function StockCounts() {
  const page = usePage();
  const roleKey = page.props?.auth?.user?.role || "inventory_manager";
  const isAdmin = roleKey === "admin";

  /*
    Expected Inertia props from backend:
    stock_counts: {
      data: [{
        id,
        sku,
        product_name,
        variant,
        filled_qty,
        total_qty,
        last_counted_at,
        updated_by
      }],
      meta,
      links
    }
    filters: { q, status, page, per }
  */

  const SAMPLE_STOCK = {
    data: [
      {
        id: 1,
        sku: "LPG-11KG",
        product_name: "LPG Cylinder",
        variant: "11kg",
        filled_qty: 24,
        total_qty: 24,
        last_counted_at: "Today 09:45 AM",
        updated_by: "Inventory Manager",
      },
      {
        id: 2,
        sku: "LPG-22KG",
        product_name: "LPG Cylinder",
        variant: "22kg",
        filled_qty: 9,
        total_qty: 9,
        last_counted_at: "Yesterday 04:10 PM",
        updated_by: "Inventory Manager",
      },
      {
        id: 3,
        sku: "LPG-50KG",
        product_name: "LPG Cylinder",
        variant: "50kg",
        filled_qty: 3,
        total_qty: 3,
        last_counted_at: "Jan 17 11:02 AM",
        updated_by: "Inventory Manager",
      },
    ],
    meta: {
      current_page: 1,
      last_page: 1,
      from: 1,
      to: 3,
      total: 3,
    },
  };

  
  const stock = page.props?.stock_counts ?? { data: [], meta: null };

  const rows = stock?.data || [];
  const meta = stock?.meta || null;

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [tab, setTab] = useState(isAdmin ? "approval" : "uncounted");

  useEffect(() => {
    setTab((prev) => (isAdmin ? "approval" : prev === "approval" ? "uncounted" : prev));
  }, [isAdmin]);

  const [open, setOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);

  const [filledEdit, setFilledEdit] = useState("");
  const [reason, setReason] = useState("");

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/inventory/counts",
      { q, per: perInitial, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const handlePerPage = (n) => pushQuery({ per: n, page: 1 });
  const handlePrev = () =>
    meta && meta.current_page > 1 && pushQuery({ page: meta.current_page - 1 });
  const handleNext = () =>
    meta && meta.current_page < meta.last_page && pushQuery({ page: meta.current_page + 1 });

  const loading = Boolean(page.props?.loading);

  const fillerRows = useMemo(
    () =>
      Array.from({ length: perInitial }).map((_, i) => ({
        id: `__filler__${i}`,
        __filler: true,
      })),
    [perInitial]
  );

  const tableRows = loading ? fillerRows : rows;
  const visibleRows = useMemo(() => {
    if (loading) return tableRows;
    if (isAdmin) {
      return tableRows.filter((x) => x.latest_status === "submitted");
    }
    if (tab === "counted") {
      return tableRows.filter((x) => x.latest_status === "submitted");
    }
    if (tab === "approved") {
      return tableRows.filter((x) => x.latest_status === "approved");
    }
    return tableRows.filter((x) => !x.latest_status || x.latest_status === "rejected");
  }, [tableRows, loading, tab, isAdmin]);

  const openAdjust = (row) => {
    setActiveRow(row);
    setFilledEdit(String(row?.filled_qty ?? ""));
    setReason("");
    setOpen(true);
  };

  const closeAdjust = () => {
    setOpen(false);
    setActiveRow(null);
  };

  const openReview = (row) => {
    setActiveRow(row);
    setReviewOpen(true);
  };

  const doSubmitAdjust = () => {
    if (!activeRow) return;

    const payload = {
      filled_qty: Number(filledEdit || 0),
      reason: reason.trim(),
    };

    if (payload.reason.length < 3) {
      setSubmitError("Reason must be at least 3 characters.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    router.post(`/dashboard/inventory/counts/${activeRow.id}/submit`, payload, {
      preserveScroll: true,
      onSuccess: () => {
        closeAdjust();
        setSubmitError("");
      },
      onError: (errors) => {
        setSubmitError(
          errors?.reason ||
            errors?.filled_qty ||
            "Failed to submit stock count."
        );
      },
      onFinish: () => setSubmitting(false),
    });
  };

  const reviewAction = (action, note) => {
    if (!activeRow?.latest_count_id) return;
    router.post(
      `/dashboard/inventory/counts/${activeRow.latest_count_id}/review`,
      { action, note },
      {
        preserveScroll: true,
        onSuccess: () => {
          setReviewOpen(false);
          setActiveRow(null);
        },
      }
    );
  };

  const nonAdminColumns = useMemo(
    () => [
      {
        key: "item",
        label: "Item",
        render: (x) =>
          x?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-44" />
              <SkeletonLine w="w-28" />
            </div>
          ) : (
            <div>
              <div className="font-extrabold text-slate-900">
                {x.product_name}
              </div>
              <div className="text-xs text-slate-500">{x.sku || "—"}</div>
            </div>
          ),
      },
      {
        key: "location",
        label: "Location",
        render: (x) =>
          x?.__filler ? (
            <SkeletonLine w="w-24" />
          ) : (
            <span className="text-sm text-slate-700">{x.location_name || "—"}</span>
          ),
      },
      {
        key: "counts",
        label: "System",
        render: (x) =>
          x?.__filler ? (
            <SkeletonPill w="w-24" />
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <CountPill
                label="FILLED"
                value={Number(x.filled_qty ?? x.total_qty ?? 0)}
                tone="amber"
              />
            </div>
          ),
      },
      {
        key: "counted",
        label: "Counted",
        render: (x) =>
          x?.__filler ? (
            <SkeletonPill w="w-24" />
          ) : !x.latest_count_id ? (
            <div className="flex flex-wrap items-center gap-2">
              <CountPill label="COUNTED" value={0} tone="amber" />
              <span className="text-xs font-extrabold text-slate-700">Variance 0</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <CountPill
                label="COUNTED"
                value={
                  x.counted_qty ?? Number(x.counted_filled ?? 0)
                }
                tone="amber"
              />
              <span
                className={cx(
                  "text-xs font-extrabold",
                  Number(x.variance_qty || 0) === 0 ? "text-slate-700" : "text-amber-700"
                )}
                title="Counted total minus system total"
              >
                Variance {Number(x.variance_qty || 0) >= 0 ? "+" : ""}
                {x.variance_qty ?? 0}
              </span>
            </div>
          ),
      },
      {
        key: "status",
        label: "Status",
        render: (x) =>
          x?.__filler ? (
            <SkeletonPill w="w-20" />
          ) : (
            <CountPill
              label={
                x.latest_status === "approved"
                  ? "APPROVED"
                  : x.latest_status === "submitted"
                  ? "PENDING APPROVAL"
                  : "NOT COUNTED"
              }
              value=""
              tone={x.latest_status === "approved" ? "teal" : x.latest_status === "submitted" ? "amber" : "slate"}
            />
          ),
      },
      {
        key: "submitted",
        label: "Submitted",
        render: (x) =>
          x?.__filler ? (
            <SkeletonLine w="w-28" />
          ) : (
            <div className="text-sm text-slate-700">
              <div className="font-semibold text-slate-800">{x.submitted_at || "—"}</div>
              <div className="text-xs text-slate-500">{x.submitted_by ? `by ${x.submitted_by}` : ""}</div>
            </div>
          ),
      },
      {
        key: "last",
        label: "Last updated",
        render: (x) =>
          x?.__filler ? (
            <SkeletonLine w="w-28" />
          ) : (
            <div className="text-sm text-slate-700">
              <div className="font-semibold text-slate-800">{x.last_counted_at || "—"}</div>
              <div className="text-xs text-slate-500">
                {x.updated_by ? `by ${x.updated_by}` : ""}
              </div>
            </div>
          ),
      },
    ],
    []
  );

  const adminColumns = useMemo(
    () => [
      {
        key: "item",
        label: "Item",
        render: (x) =>
          x?.__filler ? (
            <div className="space-y-2">
              <SkeletonLine w="w-44" />
              <SkeletonLine w="w-28" />
            </div>
          ) : (
            <div>
              <div className="font-extrabold text-slate-900">{x.product_name}</div>
              <div className="text-xs text-slate-500">{x.sku || "â€”"}</div>
            </div>
          ),
      },
      {
        key: "location",
        label: "Location",
        render: (x) =>
          x?.__filler ? (
            <SkeletonLine w="w-24" />
          ) : (
            <span className="text-sm text-slate-700">{x.location_name || "â€”"}</span>
          ),
      },
      {
        key: "counted",
        label: "Counted",
        render: (x) =>
          x?.__filler ? (
            <SkeletonPill w="w-24" />
          ) : (
            <CountPill label="COUNTED" value={x.counted_qty ?? 0} tone="teal" />
          ),
      },
      {
        key: "system",
        label: "System",
        render: (x) =>
          x?.__filler ? (
            <SkeletonPill w="w-24" />
          ) : (
            <CountPill
              label="SYSTEM"
              value={
                x.system_qty ?? Number(x.system_filled ?? x.filled_qty ?? 0)
              }
              tone="slate"
            />
          ),
      },
      {
        key: "variance",
        label: "Variance",
        render: (x) =>
          x?.__filler ? (
            <SkeletonLine w="w-16" />
          ) : (
            <span
              className={cx(
                "text-xs font-extrabold",
                Number(x.variance_qty || 0) === 0 ? "text-slate-700" : "text-amber-700"
              )}
            >
              {Number(x.variance_qty || 0) >= 0 ? "+" : ""}
              {x.variance_qty ?? 0}
            </span>
          ),
      },
      {
        key: "submitted_by",
        label: "Submitted by",
        render: (x) =>
          x?.__filler ? (
            <SkeletonLine w="w-24" />
          ) : (
            <div className="text-sm text-slate-700 font-semibold">{x.submitted_by || "â€”"}</div>
          ),
      },
      {
        key: "submitted_at",
        label: "Submitted at",
        render: (x) =>
          x?.__filler ? (
            <SkeletonLine w="w-28" />
          ) : (
            <div className="text-sm text-slate-700 font-semibold">{x.submitted_at || "â€”"}</div>
          ),
      },
    ],
    []
  );

  const columns = isAdmin ? adminColumns : nonAdminColumns;

  return (
    <Layout title="Stock Counts">
      <div className="grid gap-6">
        <TopCard
          title="Stock Counts"
          subtitle={
            isAdmin
              ? "Review submitted counts and approve or reject."
              : "Submit physical counts for review."
          }
        />

        <DataTableFilters
          q={q}
          onQ={setQ}
          onQDebounced={(value) => pushQuery({ q: value, page: 1 })}
          placeholder="Search product name or SKU..."
          filters={[]}
        />

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <button
              type="button"
              onClick={() => setTab("approval")}
              className={cx(
                "rounded-2xl px-4 py-2 text-sm font-extrabold ring-1 transition",
                tab === "approval"
                  ? "bg-teal-600 text-white ring-teal-600"
                  : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"
              )}
            >
              Approval
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setTab("uncounted")}
                className={cx(
                  "rounded-2xl px-4 py-2 text-sm font-extrabold ring-1 transition",
                  tab === "uncounted"
                    ? "bg-teal-600 text-white ring-teal-600"
                    : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"
                )}
              >
                Not counted
              </button>
              <button
                type="button"
                onClick={() => setTab("counted")}
                className={cx(
                  "rounded-2xl px-4 py-2 text-sm font-extrabold ring-1 transition",
                  tab === "counted"
                    ? "bg-teal-600 text-white ring-teal-600"
                    : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"
                )}
              >
                Counted (Pending Approval)
              </button>
              <button
                type="button"
                onClick={() => setTab("approved")}
                className={cx(
                  "rounded-2xl px-4 py-2 text-sm font-extrabold ring-1 transition",
                  tab === "approved"
                    ? "bg-teal-600 text-white ring-teal-600"
                    : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"
                )}
              >
                Approved
              </button>
            </>
          )}
        </div>

        <DataTable
          columns={columns}
          rows={visibleRows}
          loading={loading}
          searchQuery={q}
          emptyTitle="No stock items found"
          emptyHint="If this is new, add products in Admin then come back here."
          renderActions={(x) =>
            x?.__filler ? (
              <SkeletonButton w="w-24" />
            ) : (
              <div className="flex items-center justify-end gap-2">
                {!isAdmin ? (
                  tab === "uncounted" ? (
                    <button
                      type="button"
                      onClick={() => openAdjust(x)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                      title="Count stocks"
                    >
                      <ClipboardCheck className="h-4 w-4 text-slate-600" />
                      Count stocks
                    </button>
                  ) : null
                ) : tab === "approval" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => openReview(x)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-teal-700"
                      title="Approve"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => openReview(x)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                      title="Reject"
                    >
                      Reject
                    </button>
                  </>
                ) : null}

                <Link
                  href={
                    isAdmin
                      ? `/dashboard/inventory/audit?entity_type=StockMovement&q=${encodeURIComponent(
                          x.latest_movement_id || ""
                        )}`
                      : `/dashboard/inventory/movements?q=${encodeURIComponent(x.sku || "")}`
                  }
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                  title={isAdmin ? "View audit logs" : "View related movements"}
                >
                  <Boxes className="h-4 w-4 text-slate-600" />
                  {isAdmin ? "Audit Logs" : "Movements"}
                </Link>
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

        <RecountStockModal
          open={open}
          onClose={closeAdjust}
          onSubmit={doSubmitAdjust}
          item={activeRow}
          items={rows.filter((x) => !x.__filler)}
          onPickItem={(id) => {
            const picked = rows.find((x) => String(x.id) === String(id));
            if (!picked) return;
            setActiveRow(picked);
            setFilledEdit(String(picked?.filled_qty ?? ""));
            setReason("");
          }}
          filled={filledEdit}
          reason={reason}
          setFilled={setFilledEdit}
          setReason={setReason}
          submitting={submitting}
          error={submitError}
          title="Submit stock count"
          subtitle="Submit your physical count for admin review."
          submitLabel="Submit count"
        />

        <SubmitStockCountModal
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          item={activeRow}
          onApprove={(note) => reviewAction("approve", note)}
          onReject={(note) => reviewAction("reject", note)}
          loading={false}
        />
      </div>
    </Layout>
  );
}
