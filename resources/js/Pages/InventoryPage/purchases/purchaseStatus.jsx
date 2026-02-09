// resources/js/Pages/InventoryPage/purchases/purchaseStatus.js

import React from "react";

/*
  This file must mirror App\Enums\PurchaseStatus (backend) after normalization.

  Canonical COD flow (normalized):
  draft -> submitted -> receiving -> received -> paid -> completed -> closed

  Role transitions (normalized):
  admin: submitted -> receiving | rejected
  inventory_manager: receiving -> received | discrepancy_reported
                     received -> discrepancy_reported
                     paid -> completed
  accountant: received -> paid
              discrepancy_reported -> paid
  finance: completed -> closed
*/

export const PurchaseAction = {
  APPROVE: "approve",
  REJECT: "reject",
  ARRIVAL: "arrival",
  PAYMENT: "payment",
  COMPLETE: "complete",
  CLOSE: "close",
};

const DEFAULT_TONE = "bg-slate-100 text-slate-700 ring-slate-200";

const STATUS_CONFIG = {
  draft: {
    label: "DRAFT",
    tone: "bg-slate-100 text-slate-700 ring-slate-200",
    actions: {},
    transitions: ["submitted"],
    info: "Draft purchase request.",
  },

  submitted: {
    label: "AWAITING APPROVAL",
    tone: "bg-amber-600/10 text-amber-900 ring-amber-700/10",
    actions: {
      admin: [PurchaseAction.APPROVE, PurchaseAction.REJECT],
    },
    transitions: ["receiving", "rejected"],
    info: "Admin must approve or reject.",
  },

  receiving: {
    label: "RECEIVING",
    tone: "bg-sky-600/10 text-sky-900 ring-sky-700/10",
    actions: {
      inventory_manager: [PurchaseAction.ARRIVAL],
    },
    transitions: ["received", "discrepancy_reported"],
    info: "Inventory confirms arrival.",
  },

  received: {
    label: "RECEIVED",
    tone: "bg-emerald-600/10 text-emerald-900 ring-emerald-700/10",
    actions: {
      accountant: [PurchaseAction.PAYMENT],
    },
    transitions: ["paid", "discrepancy_reported"],
    info: "Accountant records supplier payment.",
  },

  discrepancy_reported: {
    label: "DISCREPANCY REPORTED",
    tone: "bg-rose-600/10 text-rose-900 ring-rose-700/10",
    actions: {
      accountant: [PurchaseAction.PAYMENT],
    },
    transitions: ["paid"],
    info: "Discrepancy logged. Accountant can still pay after adjustment.",
  },

  paid: {
    label: "PAID",
    tone: "bg-emerald-600/10 text-emerald-900 ring-emerald-700/10",
    actions: {
      inventory_manager: [PurchaseAction.COMPLETE],
    },
    transitions: ["completed"],
    info: "Inventory completes after payment is recorded.",
  },

  completed: {
    label: "COMPLETED",
    tone: "bg-emerald-600/10 text-emerald-900 ring-emerald-700/10",
    actions: {
      finance: [PurchaseAction.CLOSE],
    },
    transitions: ["closed"],
    info: "Finance closes the record.",
  },

  closed: {
    label: "CLOSED",
    tone: "bg-slate-900/10 text-slate-900 ring-slate-900/10",
    actions: {},
    transitions: [],
    info: "Closed. No further actions.",
  },

  rejected: {
    label: "REJECTED",
    tone: "bg-rose-600/10 text-rose-900 ring-rose-700/10",
    actions: {},
    transitions: [],
    info: "Rejected. No further actions.",
  },
};

export const STATUS_DISPLAY_ORDER = [
  "draft",
  "submitted",
  "receiving",
  "received",
  "discrepancy_reported",
  "paid",
  "completed",
  "closed",
  "rejected",
];

/*
  Legacy raw DB values normalization.
  Must match App\Enums\PurchaseStatus::LEGACY_STATUS_MAP behavior.
*/
const LEGACY_STATUS_MAP = {
  pending: "submitted",
  awaiting_confirmation: "submitted",
  approved: "receiving",
  payable_open: "receiving",
  delivered: "received",
};

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function normalizeRole(role) {
  if (!role) return "";
  const normalized = normalizeKey(role);
  if (normalized === "system_admin" || normalized === "super_admin") return "admin";
  return normalized;
}

export function normalizeRoleKey(role) {
  const r = String(role || "").trim();
  return r || "admin";
}

export function normalizePurchaseStatus(status) {
  if (status == null) return "";
  const normalized = normalizeKey(status);
  return LEGACY_STATUS_MAP[normalized] || normalized;
}

function getStatusMeta(status) {
  const key = normalizePurchaseStatus(status);
  return STATUS_CONFIG[key] || null;
}

export function getPurchaseStatusTone(status) {
  return getStatusMeta(status)?.tone ?? DEFAULT_TONE;
}

export function getPurchaseStatusLabel(status) {
  const meta = getStatusMeta(status);
  if (meta?.label) return meta.label;
  if (status == null || status === "") return "UNKNOWN";
  return String(status).toUpperCase();
}

export function getPurchaseStatusInfo(status) {
  return getStatusMeta(status)?.info || "";
}

export function getPurchaseStatusActionsForRole(status, role) {
  const meta = getStatusMeta(status);
  if (!meta?.actions) return [];
  const normalizedRole = normalizeRole(role);
  return meta.actions[normalizedRole] ?? [];
}

export function PurchaseStatusPill({ status }) {
  const tone = getPurchaseStatusTone(status);
  const label = getPurchaseStatusLabel(status) || "UNKNOWN";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 ${tone}`}>
      {label}
    </span>
  );
}

export const PURCHASE_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...STATUS_DISPLAY_ORDER.map((status) => ({
    value: status,
    label: getPurchaseStatusLabel(status),
  })),
];
