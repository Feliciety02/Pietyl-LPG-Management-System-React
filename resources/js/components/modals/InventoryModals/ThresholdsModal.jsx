// resources/js/components/modals/ThresholdsModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import ModalShell from "../ModalShell";
import { Search, Save, RotateCcw } from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function diffCount(levels, initial) {
  let c = 0;
  for (const k in levels) {
    if (levels[k] !== initial[k]) c += 1;
  }
  return c;
}

export default function ThresholdsModal({
  open,
  onClose,
  items = [],
  onSave,
  loading = false,
}) {
  const [q, setQ] = useState("");
  const [levels, setLevels] = useState({});
  const [initial, setInitial] = useState({});

  useEffect(() => {
    if (!open) return;

    const init = {};
    items.forEach((x) => {
      init[x.id] = safeNum(x.reorder_level);
    });

    setInitial(init);
    setLevels(init);
    setQ("");
  }, [open, items]);

  const changed = useMemo(() => diffCount(levels, initial), [levels, initial]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;

    return items.filter((x) => {
      const hay = `${x.name || ""} ${x.variant || ""} ${x.sku || ""} ${x.supplier_name || ""}`.toLowerCase();
      return hay.includes(term);
    });
  }, [items, q]);

  const setLevel = (id, value) => {
    const v = Math.max(0, safeNum(value));
    setLevels((p) => ({ ...p, [id]: v }));
  };

  const resetAll = () => setLevels(initial);

  const save = () => {
    const updates = [];
    for (const k in levels) {
      if (levels[k] !== initial[k]) {
        updates.push({ id: Number(k), reorder_level: levels[k] });
      }
    }
    onSave?.({ updates });
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-4xl"
      title="Reorder thresholds"
      subtitle="Set when the system should warn you about low stock."
      bodyClassName="p-6"
      footerClassName="p-6 pt-0"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Tip: start small and adjust weekly based on sales and deliveries.
          </div>

          <button
            type="button"
            onClick={save}
            disabled={loading || changed === 0}
            className={cx(
              "inline-flex items-center gap-2 rounded-2xl px-5 py-2 text-sm font-extrabold text-white focus:outline-none focus:ring-4",
              changed === 0 || loading
                ? "bg-slate-300 ring-slate-300 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700 ring-teal-600 focus:ring-teal-500/25"
            )}
          >
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : "Save changes"}
          </button>
        </div>
      }
    >
      {/* top controls */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200">
            {changed} change{changed === 1 ? "" : "s"}
          </div>

          <button
            type="button"
            onClick={resetAll}
            disabled={loading || changed === 0}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4 text-slate-600" />
            Reset
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-72 bg-transparent text-sm outline-none placeholder:text-slate-400"
            placeholder="Search item, SKU, supplier..."
          />
        </div>
      </div>

      {/* table */}
      <div className="mt-4 rounded-3xl ring-1 ring-slate-200 overflow-hidden">
        <div className="sticky top-0 z-10 grid grid-cols-12 bg-slate-50 px-4 py-3 text-xs font-extrabold text-slate-600 ring-1 ring-slate-200">
          <div className="col-span-8">Item</div>
          <div className="col-span-4 text-right">Alert below</div>
        </div>

        <div className="h-[52vh] overflow-y-auto no-scrollbar divide-y divide-slate-200 bg-white">
          {filtered.map((x) => {
            const current = safeNum(x.current_qty);
            const level = safeNum(levels[x.id]);

            return (
              <div key={x.id} className="grid grid-cols-12 items-center px-4 py-3 hover:bg-slate-50">
                <div className="col-span-8">
                  <div className="font-extrabold text-slate-900 truncate">
                    {x.name} <span className="text-slate-500">({x.variant})</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Stock {current} • {x.sku || "—"}
                  </div>
                </div>

                <div className="col-span-4 flex justify-end">
                  <input
                    type="number"
                    min="0"
                    value={level}
                    onChange={(e) => setLevel(x.id, e.target.value)}
                    className="w-28 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-extrabold text-right focus:ring-4 focus:ring-teal-500/15"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ModalShell>
  );
}
