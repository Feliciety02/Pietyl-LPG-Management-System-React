import React, { useState } from "react";
import axios from "axios";
import ModalShell from "../ModalShell";
import { posIcons } from "@/components/ui/Icons";
import { Printer } from "lucide-react";


function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function ReprintReceiptModal({
  open,
  onClose,
  sale,
  onReprint,
  basePath = "/dashboard/cashier/sales",
}) {
  if (!sale) return null;

  const [loading, setLoading] = useState(false);
  const ReceiptIcon = posIcons.receipt || Printer;

  const confirm = async () => {
    if (!sale?.id) return;
    setLoading(true);
    try {
      const trimmedBase = String(basePath || "/dashboard/cashier/sales").replace(/\/+$/, "");
      const { data } = await axios.post(`${trimmedBase}/${sale.id}/receipt/reprint`);
      if (typeof onReprint === "function") {
        onReprint(data);
      }
      // open printable page in a new tab for archival/printing
      try {
        window.open(`${trimmedBase}/${sale.id}/receipt/print`, "_blank");
      } catch (err) {
        // ignore popup errors
      }
    } catch (e) {
      // fallback to alert on error
      alert(`Failed to load receipt: ${e?.message || String(e)}`);
    } finally {
      setLoading(false);
      onClose?.();
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-md"
      layout="compact"
      title="Reprint receipt"
      subtitle="Generate a copy of the original receipt"
      icon={ReceiptIcon}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={confirm}
            disabled={loading}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1",
              "bg-slate-800 ring-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-500/25",
              loading ? "opacity-70 cursor-wait" : ""
            )}
          >
            {loading ? "Loading..." : "Reprint"}
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
          <div className="text-xs font-extrabold text-slate-500">
            Reference number
          </div>
          <div className="mt-1 text-base font-extrabold text-slate-900">
            {sale.ref}
          </div>
        </div>

        <div className="text-xs text-slate-500 leading-relaxed">
          This will print the same receipt details as the original transaction.
          No changes will be made to the sale record.
        </div>
      </div>
    </ModalShell>
  );
}
