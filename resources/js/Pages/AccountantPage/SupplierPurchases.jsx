import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Layout from "../Dashboard/Layout";
import { Download } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const tabs = [
  { key: "pending", label: "Commitments" },
  { key: "posted", label: "Posted purchases" },
];

function StatusBadge({ status }) {
  const tone =
    status === "pending"
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : status === "posted"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={cx("inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold ring-1", tone)}>
      {status.toUpperCase()}
    </span>
  );
}

export default function SupplierPurchases() {
  const page = usePage();
  const commitments = page.props?.commitments ?? [];
  const currentStatus = page.props?.status ?? "pending";
  const [active, setActive] = useState(currentStatus);

  const changeTab = (key) => {
    setActive(key);
    router.get("/dashboard/accountant/supplier-purchases", { status: key }, { preserveState: true, preserveScroll: true });
  };

  const exportCsv = () => {
    router.get("/dashboard/accountant/supplier-purchases/export", { status: active });
  };

  return (
    <Layout title="Supplier purchases">
      <div className="grid gap-6">
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-extrabold text-slate-900">Supplier purchases</div>
            <div className="text-sm text-slate-500">Monitor pending commitments and posted payments.</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => changeTab(tab.key)}
                className={cx(
                  "rounded-2xl px-4 py-2 text-sm font-extrabold",
                  active === tab.key
                    ? "bg-teal-600 text-white ring-1 ring-teal-600"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                )}
              >
                {tab.label}
              </button>
            ))}
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white"
            >
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </div>
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3">PR</th>
                  <th className="px-3 py-3">Supplier</th>
                  <th className="px-3 py-3">Estimated</th>
                  <th className="px-3 py-3">Final</th>
                  <th className="px-3 py-3">Requested by</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Dates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commitments.map((commitment) => (
                  <tr key={commitment.id} className="hover:bg-slate-50 transition">
                    <td className="px-3 py-3 font-semibold text-slate-900">{commitment.pr_number}</td>
                    <td className="px-3 py-3">{commitment.supplier?.name ?? "—"}</td>
                    <td className="px-3 py-3">?{Number(commitment.amount_estimated ?? 0).toFixed(2)}</td>
                    <td className="px-3 py-3">?{Number(commitment.amount_final ?? 0).toFixed(2)}</td>
                    <td className="px-3 py-3">{commitment.requested_by?.name ?? "—"}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={commitment.status} />
                    </td>
                    <td className="px-3 py-3 space-y-1 text-xs text-slate-500">
                      <div>Requested at {commitment.requested_at ?? "—"}</div>
                      <div>Posted at {commitment.posted_at ?? "—"}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {commitments.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-center text-sm text-slate-500">
              {active === "pending" ? "No pending commitments." : "No posted purchases yet."}
            </div>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
