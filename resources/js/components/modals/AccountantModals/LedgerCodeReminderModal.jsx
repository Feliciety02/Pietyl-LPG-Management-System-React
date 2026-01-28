import React from "react";
import { Info, Wallet, Landmark, ReceiptText, TrendingUp } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function CodePill({ code }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200">
      {String(code || "N/A")}
    </span>
  );
}

function ItemCard({ code, title, hint, Icon }) {
  return (
    <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CodePill code={code} />
            <div className="text-xs font-extrabold text-slate-800">{title}</div>
          </div>
          <div className="mt-2 text-xs text-slate-600 leading-relaxed">{hint}</div>
        </div>

        <div className="h-9 w-9 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
          <Icon className="h-4 w-4 text-slate-600" />
        </div>
      </div>
    </div>
  );
}

export function LedgerCodeReminderModal({ open, onClose }) {
  const items = [
    { code: "1010", title: "Cash on Hand", hint: "Physical cash in the store", Icon: Wallet },
    { code: "1020", title: "Cash in Bank", hint: "Deposited funds in bank", Icon: Landmark },
    { code: "2010", title: "Turnover Receivable", hint: "Expected cash not yet turned over", Icon: ReceiptText },
    { code: "4010", title: "Sales Revenue", hint: "Income earned from sales", Icon: TrendingUp },
  ];

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      layout="compact"
      title="GL codes"
      subtitle="Quick reminder for the common accounts used in this ledger"
      icon={Info}
      
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <ItemCard key={it.code} {...it} />
        ))}
      </div>

      <div className="mt-4 rounded-3xl bg-white ring-1 ring-slate-200 p-4">
        <div className="text-xs font-extrabold text-slate-800">Keep it consistent</div>
        <div className="mt-1 text-xs text-slate-600 leading-relaxed">
          These codes keep reports clean and comparable. You can add more later for expenses, payables, and inventory.
        </div>
      </div>
    </ModalShell>
  );
}

export default LedgerCodeReminderModal;
