import React, { useEffect, useMemo, useState } from "react";
import { KeyRound, Search, Check, X } from "lucide-react";
import ModalShell from "../ModalShell";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function groupPermissions(list) {
  const groups = {};
  list.forEach((p) => {
    const name = String(p?.name || p || "");
    const [group = "general"] = name.split(".");
    if (!groups[group]) groups[group] = [];
    groups[group].push(name);
  });
  return groups;
}

export default function RolePermissionsModal({
  open,
  onClose,
  role,
  permissions = [],
  onSubmit,
  loading = false,
}) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (!open) return;
    const initial = Array.isArray(role?.permissions) ? role.permissions : [];
    setSelected(initial);
    setQ("");
  }, [open, role]);

  const allNames = useMemo(
    () => permissions.map((p) => (typeof p === "string" ? p : p.name)).filter(Boolean),
    [permissions]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return allNames;
    return allNames.filter((name) => name.toLowerCase().includes(s));
  }, [allNames, q]);

  const grouped = useMemo(() => groupPermissions(filtered), [filtered]);

  const toggle = (name) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const selectAllFiltered = () => {
    const next = new Set(selected);
    filtered.forEach((name) => next.add(name));
    setSelected(Array.from(next));
  };

  const clearAllFiltered = () => {
    const remove = new Set(filtered);
    setSelected((prev) => prev.filter((name) => !remove.has(name)));
  };

  const canSubmit = Boolean(role?.id) && !loading;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit?.({ permissions: selected });
  };

  const roleLabel = role ? String(role.label || role.name || "role") : "role";

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      layout="compact"
      title="Manage permissions"
      subtitle={`Role: ${roleLabel}`}
      icon={KeyRound}
      footer={
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-slate-500">
            Selected {selected.length} of {allNames.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="rounded-2xl bg-teal-600 px-4 py-2 text-sm font-extrabold text-white ring-1 ring-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/25 disabled:bg-slate-300 disabled:ring-slate-300 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save permissions"}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search permissions..."
              className="w-full rounded-2xl bg-white pl-9 pr-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
            />
          </div>

          <button
            type="button"
            onClick={selectAllFiltered}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <Check className="h-4 w-4 text-teal-600" />
            Select filtered
          </button>

          <button
            type="button"
            onClick={clearAllFiltered}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <X className="h-4 w-4 text-rose-600" />
            Clear filtered
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-4 py-8 text-center">
            <div className="text-sm font-extrabold text-slate-800">
              No permissions found
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Try a different keyword.
            </div>
          </div>
        ) : (
          <div className="grid gap-4 max-h-[420px] overflow-auto pr-1">
            {Object.keys(grouped)
              .sort()
              .map((group) => (
                <div key={group} className="rounded-2xl bg-white ring-1 ring-slate-200 p-4">
                  <div className="text-xs font-extrabold text-slate-500 uppercase">
                    {group}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {grouped[group].sort().map((name) => {
                      const checked = selected.includes(name);
                      return (
                        <label
                          key={name}
                          className={cx(
                            "flex items-center gap-3 rounded-2xl px-3 py-2 ring-1 transition cursor-pointer",
                            checked
                              ? "bg-teal-600/10 ring-teal-600/20"
                              : "bg-white ring-slate-200 hover:bg-slate-50"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(name)}
                            className="h-4 w-4 accent-teal-600"
                          />
                          <span className="text-sm font-semibold text-slate-800">
                            {name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
