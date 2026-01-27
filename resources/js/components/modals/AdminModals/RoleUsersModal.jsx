import React, { useEffect, useMemo, useState } from "react";
import { Search, User, Users } from "lucide-react";
import ModalShell from "../ModalShell";

function safeText(v) {
  return String(v ?? "").trim();
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function MiniRow({ u }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white ring-1 ring-slate-200 px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-2xl bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center">
          <User className="h-4 w-4 text-slate-600" />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800 truncate">
            {u?.name || "Unnamed"}
          </div>
          <div className="text-sm text-slate-600 truncate">
            {u?.email || "—"}
          </div>
        </div>
      </div>

      {u?.last_active_at ? (
        <div className="text-xs text-slate-500 whitespace-nowrap">
          last active {u.last_active_at}
        </div>
      ) : null}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 px-6 py-10 text-center">
      <div className="text-sm font-semibold text-slate-800">No users found</div>
      <div className="mt-1 text-sm text-slate-600">Try a different keyword.</div>
    </div>
  );
}


export default function RoleUsersModal({ open, onClose, role }) {
  const users = role?.users || [];
  const roleLabel = role ? String(role.label || role.name || "role") : "role";

  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    setQ("");
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;

    return users.filter((u) => {
      const name = safeText(u?.name).toLowerCase();
      const email = safeText(u?.email).toLowerCase();
      return name.includes(s) || email.includes(s);
    });
  }, [users, q]);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      layout="compact"
      title="Users in role"
      subtitle={`${roleLabel} (${users.length})`}
      icon={Users}
    >
      <div className="grid gap-3">
        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-2xl bg-white pl-9 pr-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-teal-500/15"
          />
        </div>

        <div className="text-xs text-slate-500">
          showing{" "}
          <span className="font-semibold text-slate-700">{filtered.length}</span>{" "}
          of{" "}
          <span className="font-semibold text-slate-700">{users.length}</span>
        </div>

        <div className="grid gap-2 max-h-[420px] overflow-auto pr-1">
          {filtered.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-4 py-10 text-center">
              <div className="text-sm font-semibold text-slate-800">
                No users found
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Try a different keyword.
              </div>
            </div>
          ) : (
            filtered.map((u, idx) => <MiniRow key={u?.id ?? idx} u={u} />)
          )}
        </div>
      </div>
    </ModalShell>
  );
}
