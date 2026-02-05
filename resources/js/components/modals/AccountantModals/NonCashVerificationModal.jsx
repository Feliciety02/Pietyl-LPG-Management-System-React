import React, { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  ClipboardCopy,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

function money(v) {
  const n = Number(String(v ?? 0).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });
}

function safeText(v) {
  return String(v ?? "").trim();
}

function formatTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}

/* -------------------------------------------------------------------------- */
/* Small UI blocks                                                             */
/* -------------------------------------------------------------------------- */

function Badge({ tone = "slate", children }) {
  const map = {
    slate: "bg-slate-100 text-slate-700",
    teal: "bg-teal-600/10 text-teal-900",
    amber: "bg-amber-600/10 text-amber-900",
  };

  return (
    <span
      className={cx(
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold",
        map[tone] || map.slate
      )}
    >
      {children}
    </span>
  );
}

function Stat({ label, value, tone = "slate" }) {
  return (
    <div
      className={cx(
        "rounded-2xl px-3 py-2 ring-1",
        tone === "teal"
          ? "bg-teal-600/10 ring-teal-700/10"
          : tone === "amber"
          ? "bg-amber-600/10 ring-amber-700/10"
          : "bg-white ring-slate-200"
      )}
    >
      <div className="text-[10px] font-extrabold text-slate-500">{label}</div>
      <div className="mt-0.5 text-sm font-extrabold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function CopyRef({ value, copied, onCopy }) {
  if (!value) return <Badge tone="amber">Missing reference</Badge>;

  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-slate-800"
    >
      <span className="font-mono">{value}</span>
      <ClipboardCopy className="h-4 w-4" />
      {copied && <span className="text-teal-300">Copied</span>}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export default function NonCashVerificationModal({
  open,
  onClose,
  onSubmit,
  row,
  transactions = [],
  loading = false,
}) {
  const [local, setLocal] = useState([]);
  const [initial, setInitial] = useState({});
  const [noteOpen, setNoteOpen] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!open) return;

    const src = transactions.length ? transactions : row?.transactions || [];

    const normalized = src.map((t) => ({
      id: t.id ?? t.transaction_id,
      transaction_id: t.id ?? t.transaction_id,
      method: t.method_name,
      amount: Number(t.amount || 0),
      reference: t.reference_number || "",
      paid_at: t.paid_at || t.created_at,
      verified: Boolean(t.is_verified),
      note: t.note || "",
    }));

    setLocal(normalized);

    setInitial(
      normalized.reduce((a, t) => {
        a[t.id] = { verified: t.verified };
        return a;
      }, {})
    );

    setNoteOpen(
      normalized.reduce((a, t) => {
        if (!t.reference || safeText(t.note)) a[t.id] = true;
        return a;
      }, {})
    );

    setCopiedId(null);
  }, [open, transactions, row]);

  const toConfirm = local.filter((t) => !t.verified);
  const confirmed = local.filter((t) => t.verified);

  const missingRefs = toConfirm.filter(
    (t) => !t.reference && safeText(t.note).length < 3
  ).length;

  const changedVerified = local.filter(
    (t) => t.verified && !initial[t.id]?.verified
  );

  const changedUnverified = local.filter(
    (t) => !t.verified && initial[t.id]?.verified
  );

  const invalidSave = local.some(
    (t) => t.verified && !t.reference && safeText(t.note).length < 3
  );

  const canSave =
    !loading &&
    (changedVerified.length || changedUnverified.length) &&
    !invalidSave;

  const handleSubmit = () => {
    if (!canSave) return;
    onSubmit?.({
      verified: changedVerified.map((t) => ({
        transaction_id: t.transaction_id,
        note: safeText(t.note) || null,
      })),
      unverified: changedUnverified.map((t) => ({
        transaction_id: t.transaction_id,
      })),
    });
  };

  const toggleVerify = (txn) => {
    if (!txn.reference && !safeText(txn.note)) {
      setNoteOpen((p) => ({ ...p, [txn.id]: true }));
    }
    setLocal((p) =>
      p.map((x) => (x.id === txn.id ? { ...x, verified: !x.verified } : x))
    );
  };

  const copy = (v, id) => {
    navigator.clipboard?.writeText(v).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    });
  };

  /* ---------------------------------------------------------------------- */

  const Header = () => {
    const ok = !missingRefs && toConfirm.length === 0;

    return (
      <div
        className={cx(
          "rounded-3xl ring-1 p-4",
          ok
            ? "bg-teal-600/10 ring-teal-700/10"
            : "bg-amber-600/10 ring-amber-700/10"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
              {ok ? (
                <CheckCircle2 className="h-5 w-5 text-teal-700" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-700" />
              )}
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900">
                {ok ? "All non-cash payments matched" : "Review non-cash payments"}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Match references or add notes before confirming.
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <Stat label="Business date" value={row?.business_date || "—"} />
            <Stat label="Cashier" value={row?.cashier_name || "—"} />
            <Stat
              label="Non-cash total"
              value={money(row?.noncash_total)}
              tone={missingRefs ? "amber" : "teal"}
            />
          </div>
        </div>
      </div>
    );
  };

  const Table = ({ title, rows }) => (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="text-sm font-extrabold text-slate-900">{title}</div>
      </div>

      <table className="w-full">
        <tbody className="divide-y divide-slate-200">
          {rows.length ? (
            rows.map((t) => (
              <React.Fragment key={t.id}>
                <tr>
                  <td className="px-4 py-4 text-sm font-semibold">
                    {formatTime(t.paid_at)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-extrabold">{t.method}</div>
                    {!t.reference && <Badge tone="amber">Needs reference</Badge>}
                  </td>
                  <td className="px-4 py-4 font-extrabold">
                    {money(t.amount)}
                  </td>
                  <td className="px-4 py-4">
                    <CopyRef
                      value={t.reference}
                      copied={copiedId === t.id}
                      onCopy={() => copy(t.reference, t.id)}
                    />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => toggleVerify(t)}
                      disabled={loading}
                      className={cx(
                        "rounded-xl px-3 py-1.5 text-xs font-extrabold",
                        t.verified
                          ? "bg-white ring-1 ring-slate-200"
                          : "bg-teal-600 text-white hover:bg-teal-700"
                      )}
                    >
                      {t.verified ? "Undo" : "Confirm"}
                    </button>
                  </td>
                </tr>

                {noteOpen[t.id] && (
                  <tr className="bg-slate-50">
                    <td />
                    <td colSpan={3} className="px-4 pb-4">
                      <div className="text-[11px] font-extrabold text-slate-600">
                        Note
                      </div>
                      <textarea
                        value={t.note}
                        onChange={(e) =>
                          setLocal((p) =>
                            p.map((x) =>
                              x.id === t.id
                                ? { ...x, note: e.target.value }
                                : x
                            )
                          )
                        }
                        rows={2}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-teal-500/25"
                      />
                    </td>
                    <td />
                  </tr>
                )}
              </React.Fragment>
            ))
          ) : (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-12 text-center text-sm text-slate-500"
              >
                Nothing here
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-[94vw]"
      layout="compact"
      title="Confirm non-cash payments"
      subtitle="Verify GCash or bank references before confirming."
      icon={ShieldCheck}
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="h-4 w-4" />
            All actions are logged
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold ring-1 ring-slate-200"
            >
              Close
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSave}
              className={cx(
                "rounded-2xl px-4 py-2 text-sm font-extrabold text-white",
                canSave ? "bg-teal-600 hover:bg-teal-700" : "bg-slate-300"
              )}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid gap-4">
        <Header />
        <div className="grid gap-4 lg:grid-cols-2">
          <Table title="To confirm" rows={toConfirm} />
          <Table title="Confirmed" rows={confirmed} />
        </div>
      </div>
    </ModalShell>
  );
}
