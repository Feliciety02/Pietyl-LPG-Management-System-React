import React, { useMemo } from "react";
import { Link, usePage } from "@inertiajs/react";
import DashboardShell from "../../components/layouts/DashboardShell";
import GlassCard from "../../components/ui/GlassCard";
import HeaderLogo from "@images/Header_Logo.png";


function SideLink({ href, label, active }) {
  return (
    <Link
      href={href}
      className={[
        "block rounded-2xl px-3 py-2.5 text-sm font-extrabold transition border",
        active
          ? "bg-white/75 border-white/80 text-slate-900"
          : "bg-transparent border-transparent text-slate-700/90 hover:bg-white/60 hover:border-white/70",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function CashierLayout({ title = "Cashier", subtitle, children }) {
  const { url, props } = usePage();
  const user = props?.auth?.user;

  const tabs = useMemo(
    () => [
      { label: "Dashboard", href: "/dashboard/cashier" },
      { label: "New sale", href: "/dashboard/cashier/new-sale" },
      { label: "Transactions", href: "/dashboard/cashier/transactions" },
      { label: "Refill and swap", href: "/dashboard/cashier/refill-swap" },
      { label: "Customers", href: "/dashboard/cashier/customers" },
      { label: "Payments", href: "/dashboard/cashier/payments" },
    ],
    []
  );

  const sidebar = (
    <GlassCard className="p-5">
      <div className="flex items-center gap-3">
        <img src={HeaderLogo} alt="PIETYL" className="h-9 w-auto" />
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-slate-900">PIETYL</div>
          <div className="text-xs text-slate-600/80">Cashier</div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white/60 border border-white/75 p-3">
        <div className="text-xs font-extrabold text-slate-900 truncate">
          {user?.email || "Signed in"}
        </div>
        <div className="mt-1 text-xs text-slate-700/80">Shift tools</div>
      </div>

      <div className="mt-4 space-y-2">
        {tabs.map((t) => (
          <SideLink key={t.href} href={t.href} label={t.label} active={url === t.href} />
        ))}
      </div>

      <div className="mt-5">
        <form method="post" action="/logout">
          <input type="hidden" name="_token" value={props?.csrf_token || ""} />
          <button
            type="submit"
            className="w-full rounded-2xl bg-white/70 border border-white/80 px-4 py-2.5 text-sm font-extrabold text-slate-900 hover:bg-white transition focus:outline-none focus:ring-4 focus:ring-teal-500/25"
          >
            Sign out
          </button>
        </form>
      </div>
    </GlassCard>
  );

  return (
    <DashboardShell sidebar={sidebar} title={title} subtitle={subtitle}>
      {children}
    </DashboardShell>
  );
}
