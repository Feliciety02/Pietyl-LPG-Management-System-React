// resources/js/pages/Dashboard/RoleDashboard.jsx
import React, { useMemo } from "react";
import { usePage, Link } from "@inertiajs/react";
import Layout from "./Layout";
import { sidebarIconMap } from "@/components/ui/Icons";
import { DASHBOARD_CONFIG } from "./DashboardConfig";

function Card({ children }) {
  return <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">{children}</div>;
}

function StatCard({ Icon, label, value, hint }) {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900">{value}</div>
          <div className="mt-1 text-xs text-slate-500">{hint}</div>
        </div>
        <div className="h-11 w-11 rounded-2xl bg-teal-600/10 ring-1 ring-teal-700/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-teal-700" />
        </div>
      </div>
    </div>
  );
}

function Panel({ title, right, children }) {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="text-sm font-extrabold text-slate-900">{title}</div>
        {right}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function RoleDashboard() {
  const { auth, overview } = usePage().props;
  const user = auth?.user;

  const roleKey = user?.role || "admin";
  const config = DASHBOARD_CONFIG[roleKey] || DASHBOARD_CONFIG.admin;

  // overview is optional backend payload like:
  // overview: { sales_today: "₱0", pending_deliveries: 3, low_stock: 2, ... }
  const values = overview || {};

  const heroLine = useMemo(() => {
    const map = {
      admin: "Monitor sales, inventory risk, and staff access today.",
      cashier: "Record sales quickly and keep payments clean.",
      accountant: "Verify remittances and keep summaries accurate.",
      rider: "Finish assigned deliveries and update statuses on time.",
      inventory_manager: "Track movements and prevent low stock outages.",
    };
    return map[roleKey] || "Here is what you can work on today.";
  }, [roleKey]);

  return (
    <Layout title={config.title}>
      <div className="grid gap-6">
        {/* Hero */}
        <Card>
          <div className="p-6">
            <div className="text-xs font-semibold text-slate-500">Welcome back</div>
            <div className="mt-1 text-2xl font-extrabold text-slate-900">{user?.name}</div>
            <div className="mt-2 text-sm text-slate-600">{heroLine}</div>
          </div>
        </Card>

        {/* Overview */}
        {config.overview?.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {config.overview.map((k) => {
              const Icon = sidebarIconMap[k.icon] || sidebarIconMap.overview;
              const val = values?.[k.valueKey] ?? "—";
              return <StatCard key={k.valueKey} Icon={Icon} label={k.label} value={val} hint={k.hint} />;
            })}
          </div>
        ) : null}

       
        {/* Activity */}
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <Panel
              title="Today focus"
              right={<span className="text-xs text-slate-500">Role based guidance</span>}
            >
              <div className="grid gap-3 md:grid-cols-2">
                {config.actions.slice(0, 4).map((a) => (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="rounded-3xl bg-teal-50 p-4 ring-1 ring-teal-700/10 hover:bg-teal-100/50 transition"
                  >
                    <div className="text-sm font-extrabold text-slate-900">{a.label}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      Go to {a.label.toLowerCase()} and complete your top tasks.
                    </div>
                  </Link>
                ))}
              </div>
            </Panel>
          </div>

          <Panel title={config.activityTitle || "Recent activity"}>
            <div className="space-y-3">
              {(config.activity || []).map((x) => (
                <div key={x.title} className="rounded-2xl bg-white ring-1 ring-slate-200 p-4">
                  <div className="text-sm font-extrabold text-slate-900">{x.title}</div>
                  <div className="mt-1 text-xs text-slate-500">{x.meta}</div>
                </div>
              ))}
              {!config.activity?.length ? (
                <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
                  <div className="text-sm font-extrabold text-slate-900">No activity yet</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Once actions are recorded, updates will show here.
                  </div>
                </div>
              ) : null}
            </div>
          </Panel>
        </div>
      </div>
    </Layout>
  );
}
