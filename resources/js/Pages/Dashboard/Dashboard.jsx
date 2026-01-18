// resources/js/pages/Dashboard/RoleDashboard.jsx
import React from "react";
import { usePage, Link } from "@inertiajs/react";
import Layout from "./Layout";
import { sidebarIconMap } from "@/components/ui/Icons";
import { DASHBOARD_CONFIG } from "./DashboardConfig";

function Card({ children }) {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
      {children}
    </div>
  );
}

export default function RoleDashboard() {
  const { auth } = usePage().props;
  const user = auth?.user;

  const roleKey = user?.role || "admin";
  const config = DASHBOARD_CONFIG[roleKey] || DASHBOARD_CONFIG.admin;

  return (
    <Layout title={config.title}>
      <div className="grid gap-6">

        {/* Hero */}
        <Card>
          <div className="p-6">
            <div className="text-xs font-semibold text-slate-500">
              Welcome back
            </div>
            <div className="mt-1 text-2xl font-extrabold text-slate-900">
              {user?.name}
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Here is what you can work on today.
            </div>
          </div>
        </Card>

        {/* Quick actions */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {config.actions.map((action) => {
            const Icon = sidebarIconMap[action.icon];
            return (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-3xl bg-white p-5 ring-1 ring-slate-200 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-2xl bg-teal-600/10 ring-1 ring-teal-700/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-teal-700" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">
                      {action.label}
                    </div>
                    <div className="text-xs text-slate-600">
                      Open {action.label.toLowerCase()}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </Layout>
  );
}
