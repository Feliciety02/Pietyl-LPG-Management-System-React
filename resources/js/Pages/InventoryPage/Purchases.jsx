// resources/js/pages/Inventory/Purchases.jsx
import React, { useMemo, useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import axios from "axios";
import Layout from "../Dashboard/Layout";

import DataTable from "@/components/Table/DataTable";
import DataTableFilters from "@/components/Table/DataTableFilters";
import DataTablePagination from "@/components/Table/DataTablePagination";

import ViewPurchaseModal from "@/components/modals/InventoryModals/ViewPurchaseModal";
import RequestRestockModal from "@/components/modals/InventoryModals/RequestRestockModal";
import SubmittedActionModal from "@/components/modals/InventoryModals/SubmittedActionModal";
import DeliveryArrivalModal from "@/components/modals/InventoryModals/DeliveryArrivalModal";

import { TableActionButton } from "@/components/Table/ActionTableButton";
import { SkeletonButton } from "@/components/ui/Skeleton";

import {
  CheckCircle2,
  FileText,
  PlusCircle,
  Truck,
  XCircle,
  CreditCard,
  Zap,
} from "lucide-react";

import { createPurchaseColumns, createPurchaseFillerRows } from "./purchases/purchaseTableConfig";
import {
  PurchaseAction,
  getPurchaseStatusActionsForRole,
  getPurchaseStatusInfo,
  normalizePurchaseStatus,
  normalizeRoleKey,
  PURCHASE_STATUS_OPTIONS,
} from "@/Pages/InventoryPage/purchases/purchaseStatus";

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

export default function Purchases() {
  const page = usePage();
  const { auth } = page.props;
  const user = auth?.user;

  const canAutoGenerate = page.props?.canAutoGenerate ?? false;
  const myRequests = page.props?.myRequests ?? [];
  const [isGenerating, setIsGenerating] = useState(false);

  const rawRoleKey = user?.role || user?.role_name || "";
  const roleKey = normalizeRoleKey(rawRoleKey);

  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const permissionSet = useMemo(() => new Set(permissions), [permissions]);
  const can = (perm) => !perm || permissionSet.has(perm);

  const isInventoryManager = roleKey === "inventory_manager";
  const isAdmin = roleKey === "admin";
  const isAccountant = roleKey === "accountant";
  const isFinance = roleKey === "finance";

  const canCreatePurchase = can("inventory.purchases.create") && isInventoryManager;
  const canApprovePurchase = can("inventory.purchases.approve") && isAdmin;

  const purchases = page.props?.purchases ?? { data: [], meta: null };
  const rows = purchases?.data || [];
  const meta = purchases?.meta || null;

  const query = page.props?.filters || {};
  const qInitial = query?.q || "";
  const statusInitial = query?.status || "all";
  const perInitial = Number(query?.per || 10);

  const [q, setQ] = useState(qInitial);
  const [status, setStatus] = useState(statusInitial);

  const statusOptions = PURCHASE_STATUS_OPTIONS;

  const pushQuery = (patch) => {
    router.get(
      "/dashboard/inventory/purchases",
      { q, status, per: perInitial, ...patch },
      { preserveScroll: true, preserveState: true, replace: true }
    );
  };

  const handleStatus = (v) => {
    setStatus(v);
    pushQuery({ status: v, page: 1 });
  };

  const handlePerPage = (n) => pushQuery({ per: n, page: 1 });
  const handlePrev = () => meta && meta.current_page > 1 && pushQuery({ page: meta.current_page - 1 });
  const handleNext = () => meta && meta.current_page < meta.last_page && pushQuery({ page: meta.current_page + 1 });

  const loading = Boolean(page.props?.loading);

  const fillerRows = useMemo(() => createPurchaseFillerRows(perInitial), [perInitial]);
  const tableRows = loading ? fillerRows : rows;
  const columns = useMemo(() => createPurchaseColumns({ loading }), [loading]);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  const [orderModalOpen, setOrderModalOpen] = useState(false);

  const [submittedTarget, setSubmittedTarget] = useState(null);
  const [submittedAction, setSubmittedAction] = useState(null);

  const [deliveryTarget, setDeliveryTarget] = useState(null);
  const [closeTarget, setCloseTarget] = useState(null);

  const [deliveryError, setDeliveryError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  const postOptions = { preserveScroll: true, preserveState: true };

  const refreshPurchases = () => {
    router.reload({ preserveScroll: true, preserveState: true });
  };

  const openView = (row) => {
    if (!row || row.__filler) return;
    setViewItem(row);
    setViewOpen(true);
  };

  const closeView = () => {
    setViewOpen(false);
    setViewItem(null);
  };

  const openNewPurchaseModal = () => setOrderModalOpen(true);
  const closeNewPurchaseModal = () => setOrderModalOpen(false);

  const closeSubmittedModal = () => {
    setSubmittedTarget(null);
    setSubmittedAction(null);
  };

  const openApproveModal = (row) => {
    if (!row || row.__filler) return;
    setSubmittedTarget(row);
    setSubmittedAction("approve");
  };

  const openRejectModal = (row) => {
    if (!row || row.__filler) return;
    setSubmittedTarget(row);
    setSubmittedAction("reject");
  };

  const openDeliveryModal = (row) => {
    if (!row || row.__filler) return;
    setDeliveryError("");
    setDeliveryTarget(row);
  };

  const closeDeliveryModal = () => {
    setDeliveryTarget(null);
    setDeliveryError("");
  };

  const openCloseModal = (row) => {
    if (!row || row.__filler) return;
    setCloseTarget(row);
  };

  const handleApproveSubmit = (purchase) => {
    if (!purchase?.id) return;
    setModalLoading(true);

    router
      .post(
        `/dashboard/inventory/purchases/${purchase.id}/approve`,
        {},
        {
          ...postOptions,
          onSuccess: () => {
            closeSubmittedModal();
            refreshPurchases();
          },
        }
      )
      .finally(() => setModalLoading(false));
  };

  const handleRejectSubmit = (purchase, reason) => {
    if (!purchase?.id) return;
    setModalLoading(true);

    router
      .post(
        `/dashboard/inventory/purchases/${purchase.id}/reject`,
        { reason },
        {
          ...postOptions,
          onSuccess: () => {
            closeSubmittedModal();
            refreshPurchases();
          },
        }
      )
      .finally(() => setModalLoading(false));
  };

  const handleMarkDelivered = (purchase, payload) => {
    if (!purchase?.id) return Promise.resolve();

    setModalLoading(true);
    setDeliveryError("");

    const body = payload && typeof payload === "object" ? payload : {};

    return axios
      .post(`/dashboard/inventory/purchases/${purchase.id}/mark-delivered`, body)
      .then(() => {
        closeDeliveryModal();
        refreshPurchases();
      })
      .catch((error) => {
        const message =
          error?.response?.data?.message ||
          error?.response?.statusText ||
          error?.message ||
          "Unable to confirm delivery.";
        setDeliveryError(message);
        throw error;
      })
      .finally(() => setModalLoading(false));
  };

  const handleCompletePurchase = (purchase) => {
    if (!purchase?.id) return;
    if (!window.confirm("Mark this purchase as completed?")) return;

    setModalLoading(true);

    router
      .post(`/dashboard/inventory/purchases/${purchase.id}/complete`, {}, {
        ...postOptions,
        onSuccess: () => {
          refreshPurchases();
        },
      })
      .finally(() => setModalLoading(false));
  };

  const handleClosePurchase = (purchase, notes) => {
    if (!purchase?.id) return;
    setModalLoading(true);

    router
      .post(`/dashboard/inventory/purchases/${purchase.id}/close`, { notes }, {
        ...postOptions,
        onSuccess: () => {
          setCloseTarget(null);
          refreshPurchases();
        },
      })
      .finally(() => setModalLoading(false));
  };

  const handleNewPurchaseSubmit = (payload) => {
    if (!payload) return;

    router.post("/dashboard/inventory/purchases", payload, {
      ...postOptions,
      onSuccess: () => closeNewPurchaseModal(),
    });
  };

  const topCardTitle = canApprovePurchase
    ? "Purchase Requests"
    : isInventoryManager
    ? "Purchase Requests"
    : isAccountant
    ? "Purchases for COD Payment"
    : isFinance
    ? "Purchases for Closing"
    : "Purchases";

  const topCardSubtitle = canApprovePurchase
    ? "Approve or reject submitted restock requests."
    : isInventoryManager
    ? "Create restock requests and confirm deliveries."
    : isAccountant
    ? "Record COD payments after receiving."
    : isFinance
    ? "Close completed purchases."
    : "Review purchases.";

  const topCardRight = canCreatePurchase ? (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          if (!confirm('Generate purchase requests for all low stock items?')) return;
          setIsGenerating(true);
          router.post('/dashboard/inventory/auto-purchase-requests', {}, {
            onSuccess: () => setIsGenerating(false),
            onError: () => setIsGenerating(false),
          });
        }}
        disabled={isGenerating}
        title="Auto-Generate (force-shown for testing)"
        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold transition ${
          isGenerating
            ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
            : 'bg-teal-600 text-white hover:bg-teal-700 focus:ring-4 focus:ring-teal-500/25'
        }`}
      >
        <Zap className="h-4 w-4" />
        {isGenerating ? 'Generating...' : 'Auto-Generate'}
      </button>
      <button
        type="button"
        onClick={openNewPurchaseModal}
        className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 focus:ring-4 focus:ring-teal-500/25"
      >
        <PlusCircle className="h-4 w-4" />
        Request Restock
      </button>
    </div>
  ) : null;


  return (
    <Layout title="Purchases">
      <div className="grid gap-6">
        <TopCard title={topCardTitle} subtitle={topCardSubtitle} right={topCardRight} />

        <DataTableFilters
          q={q}
          onQ={setQ}
          onQDebounced={(v) => pushQuery({ q: v, page: 1 })}
          placeholder="Search reference, supplier, product..."
          filters={[
            {
              key: "status",
              value: status,
              onChange: handleStatus,
              options: statusOptions,
            },
          ]}
        />

        <DataTable
          columns={columns}
          rows={tableRows}
          loading={loading}
          searchQuery={q}
          emptyTitle="No purchases found"
          emptyHint="Create a restock request to start."
          renderActions={(row) =>
            row?.__filler ? (
              <SkeletonButton w="w-28" />
            ) : (
              (() => {
                const statusKey = normalizePurchaseStatus(row?.status);
                const allowedActions = getPurchaseStatusActionsForRole(statusKey, roleKey);
                const statusInfo = getPurchaseStatusInfo(statusKey, roleKey);

                const canUseAction = (action) => allowedActions.includes(action);
                const completeAllowed = canUseAction(PurchaseAction.COMPLETE);
                const showCompleteButton =
                  roleKey === "inventory_manager" && ["received", "paid"].includes(statusKey);
                const actionButtons = [];

                actionButtons.push(
                  <TableActionButton
                    key="view"
                    icon={FileText}
                    onClick={() => openView(row)}
                    title="View purchase"
                    size="sm"
                  >
                    View
                  </TableActionButton>
                );

                if (canUseAction(PurchaseAction.APPROVE)) {
                  actionButtons.push(
                    <TableActionButton
                      key="approve"
                      icon={CheckCircle2}
                      tone="primary"
                      onClick={() => openApproveModal(row)}
                      title="Approve request"
                    >
                      Approve
                    </TableActionButton>
                  );
                }

                if (canUseAction(PurchaseAction.REJECT)) {
                  actionButtons.push(
                    <TableActionButton
                      key="reject"
                      icon={XCircle}
                      tone="danger"
                      onClick={() => openRejectModal(row)}
                      title="Reject request"
                    >
                      Reject
                    </TableActionButton>
                  );
                }

                if (canUseAction(PurchaseAction.ARRIVAL)) {
                  actionButtons.push(
                    <TableActionButton
                      key="arrival"
                      icon={Truck}
                      onClick={() => openDeliveryModal(row)}
                      title="Confirm arrival"
                    >
                      Delivered
                    </TableActionButton>
                  );
                }

                if (showCompleteButton) {
                  actionButtons.push(
                    <TableActionButton
                      key="complete"
                      icon={CheckCircle2}
                      tone="primary"
                      onClick={completeAllowed ? () => handleCompletePurchase(row) : undefined}
                      title="Complete purchase"
                      disabled={!completeAllowed}
                    >
                      Complete
                    </TableActionButton>
                  );
                }

                if (canUseAction(PurchaseAction.CLOSE)) {
                  actionButtons.push(
                    <TableActionButton
                      key="close"
                      icon={CreditCard}
                      onClick={() => openCloseModal(row)}
                      title="Close purchase"
                    >
                      Close
                    </TableActionButton>
                  );
                }

                return (
                  <div className="flex items-center justify-end gap-3">
                    {statusInfo ? <span className="text-xs text-slate-500">{statusInfo}</span> : null}
                    <div className="flex items-center gap-2">{actionButtons}</div>
                  </div>
                );
              })()
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

        <RequestRestockModal
          open={orderModalOpen}
          onClose={closeNewPurchaseModal}
          products={page.props?.products ?? []}
          suppliers={page.props?.suppliersByProduct ?? {}}
          mode="purchase"
          onSubmit={handleNewPurchaseSubmit}
          loading={loading}
        />

        <ViewPurchaseModal open={viewOpen} onClose={closeView} purchase={viewItem} />

        <SubmittedActionModal
          open={Boolean(submittedTarget)}
          loading={modalLoading}
          onClose={closeSubmittedModal}
          purchase={submittedTarget}
          onApprove={handleApproveSubmit}
          onReject={handleRejectSubmit}
          action={submittedAction}
        />

        <DeliveryArrivalModal
          open={Boolean(deliveryTarget)}
          loading={modalLoading}
          onClose={closeDeliveryModal}
          purchase={deliveryTarget}
          onConfirm={handleMarkDelivered}
          error={deliveryError}
        />

      </div>
    </Layout>
  );
}
