import React, { useMemo } from "react";
import { usePage, Link } from "@inertiajs/react";
import Layout from "./Layout";
import { DASHBOARD_CONFIG } from "./DashboardConfig";

function Card({ children }) {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm">
      {children}
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
  const { auth } = usePage().props;
  const user = auth?.user;
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const permissionSet = useMemo(() => new Set(permissions), [permissions]);
  const can = (perm) => !perm || permissionSet.has(perm);

  const roleKey = user?.role || "admin";
  const config = DASHBOARD_CONFIG[roleKey] || DASHBOARD_CONFIG.admin;
  const actions = useMemo(
    () => (config.actions || []).filter((a) => can(a.permission)),
    [config, permissions]
  );

  const heroLine = useMemo(() => {
    const map = {
      admin: "Review operations, manage access, and monitor system health.",
      cashier: "Record sales quickly and keep payments accurate.",
      accountant: "Review remittances and maintain financial records.",
      rider: "Complete assigned deliveries and update statuses.",
      inventory_manager: "Monitor stock movement and prevent shortages.",
    };
    return map[roleKey] || "Here is what you can work on today.";
  }, [roleKey]);

  const focusTitle = useMemo(() => {
    const map = {
      admin: "Owner focus today",
      cashier: "Shift actions",
      accountant: "Accounting tasks",
      rider: "Delivery tasks",
      inventory_manager: "Inventory tasks",
    };
    return map[roleKey] || "Today focus";
  }, [roleKey]);

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
              {heroLine}
            </div>
          </div>
        </Card>

        {/* Main content */}
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <Panel
              title={focusTitle}
              right={
                <span className="text-xs text-slate-500">
                  Role based actions
                </span>
              }
            >
              <div className="grid gap-3 md:grid-cols-2">
                {actions.slice(0, 6).map((a) => (
                  <Link
                    key={`${a.href}-${a.label}`}
                    href={a.href}
                    className="rounded-3xl bg-teal-50 p-4 ring-1 ring-teal-700/10 hover:bg-teal-100/50 transition"
                  >
                    <div className="text-sm font-extrabold text-slate-900">
                      {a.label}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Go to {a.label.toLowerCase()} to continue your task.
                    </div>
                  </Link>
                ))}
              </div>
            </Panel>
          </div>

          <Panel title={config.activityTitle || "Recent activity"}>
            <div className="space-y-3">
              {config.activity?.length ? (
                config.activity.map((x) => (
                  <div
                    key={x.title}
                    className="rounded-2xl bg-white ring-1 ring-slate-200 p-4"
                  >
                    <div className="text-sm font-extrabold text-slate-900">
                      {x.title}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {x.meta}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
                  <div className="text-sm font-extrabold text-slate-900">
                    No activity yet
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Actions will appear here once activity is recorded.
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </Layout>
  );
}
