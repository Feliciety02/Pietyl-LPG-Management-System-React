import React from "react";
import { SkeletonLine, SkeletonPill } from "@/components/ui/Skeleton";
import { PurchaseStatusPill } from "./purchaseStatus";

function niceText(value, fallback = "—") {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

export function createPurchaseColumns({ loading }) {
  return [
    {
      key: "ref",
      label: "Reference",
      render: (row) =>
        row?.__filler ? (
          <SkeletonLine w="w-28" />
        ) : (
          <div className="font-extrabold text-slate-900">{niceText(row?.reference_no ?? row?.request_number ?? "Reference")}</div>
        ),
    },
    {
      key: "supplier",
      label: "Supplier",
      render: (row) =>
        row?.__filler ? (
          <SkeletonLine w="w-40" />
        ) : (
          <div className="text-sm text-slate-800">{niceText(row?.supplier_name)}</div>
        ),
    },
    {
      key: "item",
      label: "Item",
      render: (row) => {
        if (row?.__filler) {
          return <SkeletonLine w="w-36" />;
        }

        const product = row?.product_name;
        const variant = row?.variant ?? row?.variant_name;
        const itemsCount = Number(row?.items_count ?? 0);

        if (product) {
          return (
            <div className="font-semibold text-slate-900">
              {product}
              {variant ? <span className="text-slate-500"> ({variant})</span> : null}
            </div>
          );
        }

        if (itemsCount > 0) {
          return (
            <div className="font-semibold text-slate-900">
              {itemsCount} item{itemsCount === 1 ? "" : "s"}
            </div>
          );
        }

        return <span className="text-sm text-slate-700">{niceText(row?.notes ?? row?.location)}</span>;
      },
    },
    {
      key: "qty",
      label: "Ordered",
      render: (row) =>
        row?.__filler ? (
          <SkeletonLine w="w-10" />
        ) : (
          <span className="text-sm font-extrabold text-slate-900">{niceText(row?.qty ?? row?.expected_qty)}</span>
        ),
    },
    {
      key: "received",
      label: "Received",
      render: (row) =>
        row?.__filler ? (
          <SkeletonLine w="w-10" />
        ) : (
          <span className="text-sm text-slate-700">{niceText(row?.received_qty ?? row?.received_qty_total)}</span>
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (row?.__filler ? <SkeletonPill w="w-28" /> : <PurchaseStatusPill status={row?.status} />),
    },
    {
      key: "date",
      label: "Created",
      render: (row) =>
        row?.__filler ? (
          <SkeletonLine w="w-28" />
        ) : (
          <span className="text-sm text-slate-700">{niceText(row?.created_at ?? row?.submitted_at)}</span>
        ),
    },
  ];
}

export function createPurchaseFillerRows(perPage) {
  return Array.from({ length: perPage }).map((_, index) => ({
    id: `__filler__${index}`,
    __filler: true,
  }));
}
