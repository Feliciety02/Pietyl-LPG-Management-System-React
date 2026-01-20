import React, { useMemo, useState } from "react";
import ModalShell from "./ModalShell";

function safeNum(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

export default function ThresholdsModal({
  open,
  onClose,
  items = [],
  onSave, // ({ updates: [{ id, reorder_level }] }) => void
  loading = false,
}) {
  const initial = useMemo(() => {
    const m = new Map();
    items.forEach((x) => m.set(x.id, safeNum(x.reorder_level)));
    return m;
  }, [items]);

  const [levels, setLevels] = useState(initial);

  const setLevel = (id, value) => {
    const v = safeNum(value);
    setLevels((prev) => {
      const next = new Map(prev);
      next.set(id, v);
      return next;
    });
  };

  const save = () => {
    const updates = items.map((x) => ({
      id: x.id,
      reorder_level: safeNum(levels.get(x.id)),
    }));
    onSave?.({ updates });
  };

  return (
    <ModalShell
      open={open}
      title="Reorder thresholds"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition"
            disabled={loading}
          >
            Close
          </button>

          <button
            type="button"
            onClick={save}
            className="rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-teal-700 transition focus:outline-none focus:ring-4 focus:ring-teal-500/25"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      }
    >
      <div className="grid gap-3">
        <div className="text-sm text-slate-600">
          Update reorder levels. These thresholds control what appears in low stock alerts.
        </div>

        <div className="rounded-3xl ring-1 ring-slate-200 overflow-hidden">
          <div className="grid grid-cols-12 bg-slate-50 px-4 py-3 text-xs font-extrabold text-slate-600">
            <div className="col-span-7">Item</div>
            <div className="col-span-5 text-right">Reorder level</div>
          </div>

          <div className="divide-y divide-slate-200 bg-white">
            {items.map((x) => (
              <div key={x.id} className="grid grid-cols-12 items-center px-4 py-3">
                <div className="col-span-7 min-w-0">
                  <div className="truncate text-sm font-extrabold text-slate-900">
                    {x.name} <span className="text-slate-500 font-semibold">({x.variant})</span>
                  </div>
                  <div className="text-xs text-slate-500 truncate">{x.sku || "—"}</div>
                </div>

                <div className="col-span-5 flex items-center justify-end gap-2">
                  <input
                    type="number"
                    min="0"
                    value={safeNum(levels.get(x.id))}
                    onChange={(e) => setLevel(x.id, e.target.value)}
                    className="w-28 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 text-right outline-none focus:ring-4 focus:ring-teal-500/15"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}