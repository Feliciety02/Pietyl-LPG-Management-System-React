import React from "react";
import { Link, usePage } from "@inertiajs/react";
import Sidebar from "../../components/layouts/Sidebar";

export default function Layout({ children }) {
  const { auth } = usePage().props;
  const user = auth?.user;

  const items = [
    { label: "Overview", href: "/dashboard/admin" },
    { label: "Users", href: "/dashboard/admin/users" },
    { label: "Employees", href: "/dashboard/admin/employees" },
    { label: "Roles", href: "/dashboard/admin/roles" },
    { label: "Audit Logs", href: "/dashboard/admin/audit" },
    { label: "Reports", href: "/dashboard/admin/reports" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar title="Admin Panel" items={items} />

        <main className="flex-1">
          <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {user?.name || "Admin"}
              </div>
              <div className="text-xs text-gray-500">
                {user?.role || "admin"} • {user?.email || ""}
              </div>
            </div>

            <Link
              as="button"
              method="post"
              href="/logout"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Logout
            </Link>
          </header>

          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
