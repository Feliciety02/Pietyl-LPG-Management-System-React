import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CheckCircle2, CreditCard, RotateCcw } from "lucide-react";
import TableHeaderCell from "@/components/Table/TableHeaderCell";
import { TableActionButton } from "@/components/Table/ActionTableButton";
import ModalShell from "../ModalShell";
import KpiCard from "@/components/ui/KpiCard";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function money(value) {
  if (value === null || value === undefined || value === "") return "--";
  const n = Number(String(value).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });
}

function formatTime(value) {
  if (!value) return "--";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return String(value);
  }
}

export default function CashlessVerificationModal({
  open,
  onClose,
  row,
  onVerified,
}) {
  const [transactions, setTransactions] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setTransactions([]);
      setSelectedIds([]);
      setError("");
      setLoading(false);
      setSaving(false);
      return;
    }

    if (!row?.business_date || !row?.cashier_user_id) {
      setTransactions([]);
      return;
    }

    setLoading(true);
    setError("");

    axios
      .get("/dashboard/accountant/remittances/cashless-transactions", {
        params: {
          business_date: row.business_date,
          cashier_user_id: row.cashier_user_id,
        },
      })
      .then(({ data }) => {
        const list = Array.isArray(data?.transactions) ? data.transactions : [];
        const normalized = list
          .map((t) => ({
            id: t.id,
            paid_at: t.paid_at || t.created_at || "",
            method_name: t.method_name || t.payment_method || "Cashless",
            amount: Number.isFinite(Number(t.amount)) ? Number(t.amount) : 0,
            reference: t.reference || t.reference_number || t.receipt_number || "",
            verified: Boolean(t.verified || t.is_verified),
            is_cashless: t.is_cashless !== false,
          }))
          .filter((t) => t.id && t.is_cashless);

        setTransactions(normalized);
      })
      .catch((err) => {
        const msg = err?.response?.data?.message;
        setError(msg || "Unable to load cashless transactions.");
        setTransactions([]);
      })
      .finally(() => setLoading(false));
  }, [open, row?.business_date, row?.cashier_user_id]);

  useEffect(() => {
    if (!open) return;
    setSelectedIds([]);
  }, [open, row?.business_date, row?.cashier_user_id]);

  const pendingRows = useMemo(
    () => transactions.filter((t) => !t.verified),
    [transactions]
  );
  const verifiedRows = useMemo(
    () => transactions.filter((t) => t.verified),
    [transactions]
  );
  const pendingIdSet = useMemo(() => new Set(pendingRows.map((t) => t.id)), [pendingRows]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedTotal = useMemo(
    () =>
      pendingRows.reduce((sum, t) => (selectedSet.has(t.id) ? sum + Number(t.amount || 0) : sum), 0),
    [pendingRows, selectedSet]
  );

  const verifiedTotal = useMemo(
    () => verifiedRows.reduce((sum, t) => sum + Number(t.amount || 0), 0),
    [verifiedRows]
  );

  const allPendingSelected = pendingRows.length > 0 && pendingRows.every((t) => selectedSet.has(t.id));

  const toggleSelect = (id) => {
    if (!pendingIdSet.has(id)) return;
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (pendingRows.length === 0) return;
    setSelectedIds(pendingRows.map((t) => t.id));
  };

  const handleClearAll = () => setSelectedIds([]);

  const handleVerify = async () => {
    if (selectedIds.length === 0 || saving) return;
    setSaving(true);
    setError("");

    try {
      await axios.post("/dashboard/accountant/remittances/cashless-transactions/verify", {
        business_date: row.business_date,
        cashier_user_id: row.cashier_user_id,
        verified_transaction_ids: selectedIds,
      });

      setTransactions((prev) =>
        prev.map((txn) =>
          selectedSet.has(txn.id) ? { ...txn, verified: true } : txn
        )
      );
      setSelectedIds([]);
      onVerified?.();
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(msg || "Unable to verify cashless transactions.");
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="text-xs text-slate-500">
        {pendingRows.length === 0
          ? "No pending transactions."
          : allPendingSelected
          ? "All pending transactions are selected."
          : "Select pending transactions to verify."}
      </div>
      <div className="flex items-center gap-2">
        <TableActionButton onClick={onClose} title="Close">
          Close
        </TableActionButton>
        <TableActionButton
          tone="primary"
          icon={CheckCircle2}
          onClick={handleVerify}
          loading={saving}
          disabled={selectedIds.length === 0 || saving}
          title="Verify selected cashless transactions"
        >
          {saving ? "Verifying..." : "Verify selected"}
        </TableActionButton>
      </div>
    </div>
  );

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Cashless verification"
      subtitle="Check pending cashless transactions before finalizing."
      icon={CreditCard}
      maxWidthClass="max-w-5xl"
      layout="compact"
      footer={footer}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <div className="text-sm font-extrabold text-slate-900">
            {row?.cashier_name || "Cashier"}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {row?.business_date || "--"}
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end flex-wrap">
          <TableActionButton
            icon={CheckCircle2}
            tone="primary"
            onClick={handleSelectAll}
            disabled={!pendingRows.length || allPendingSelected || saving}
            title="Select all pending transactions"
          >
            Select all
          </TableActionButton>
          <TableActionButton
            icon={RotateCcw}
            onClick={handleClearAll}
            disabled={!selectedIds.length || saving}
            title="Clear selections"
          >
            Clear
          </TableActionButton>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <KpiCard label="Expected cashless" value={money(row?.expected_noncash_total)} />
        <KpiCard label="Verified total" value={money(verifiedTotal)} />
        <KpiCard label="Pending" value={String(pendingRows.length)} />
        <KpiCard label="Selected total" value={money(selectedTotal)} />
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl bg-rose-500/5 ring-1 ring-rose-700/10 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <TableHeaderCell label="Time" className="px-5 py-3" />
              <TableHeaderCell label="Method" className="px-5 py-3" />
              <TableHeaderCell label="Amount" className="px-5 py-3" contentClassName="justify-end" />
              <TableHeaderCell label="Reference" className="px-5 py-3" />
              <TableHeaderCell label="Action" className="px-5 py-3" contentClassName="justify-end" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                  Loading transactions...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                  Nothing to verify.
                </td>
              </tr>
            ) : (
              transactions.map((txn) => {
                const isPending = !txn.verified;
                const isSelected = isPending ? selectedSet.has(txn.id) : false;
                const rowClass = cx(
                  isSelected && "bg-teal-600/5",
                  txn.verified && "bg-slate-50"
                );

                return (
                  <tr key={txn.id} className={rowClass}>
                    <td className="px-5 py-4 text-sm font-extrabold text-slate-900 whitespace-nowrap">
                      {formatTime(txn.paid_at)}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {txn.method_name || "Cashless"}
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-extrabold text-slate-900 whitespace-nowrap tabular-nums">
                      {money(txn.amount)}
                    </td>
                    <td className="px-5 py-4">
                      {txn.reference ? (
                        <span className="font-mono text-sm text-slate-900">{txn.reference}</span>
                      ) : (
                        <span className="text-sm text-slate-400">--</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      {txn.verified ? (
                        <TableActionButton icon={CheckCircle2} tone="primary" disabled>
                          Verified
                        </TableActionButton>
                      ) : isSelected ? (
                        <TableActionButton
                          icon={RotateCcw}
                          onClick={() => toggleSelect(txn.id)}
                          disabled={saving}
                        >
                          Clear
                        </TableActionButton>
                      ) : (
                        <TableActionButton
                          icon={CheckCircle2}
                          tone="primary"
                          onClick={() => toggleSelect(txn.id)}
                          disabled={saving}
                        >
                          Check
                        </TableActionButton>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </ModalShell>
  );
}
