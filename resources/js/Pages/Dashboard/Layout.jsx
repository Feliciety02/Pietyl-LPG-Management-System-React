import React, { useMemo, useState } from "react";
import { usePage } from "@inertiajs/react";
import DashboardShell from "./DashboardShell";

const ROLE_META = {
  admin: {
    title: "Admin Panel",
    items: [
      { label: "Overview", href: "/dashboard/admin", icon: "overview" },
      { label: "Users", href: "/dashboard/admin/users", icon: "users" },
      { label: "Employees", href: "/dashboard/admin/employees", icon: "employees" },
      { label: "Roles", href: "/dashboard/admin/roles", icon: "roles" },
      { label: "Audit Logs", href: "/dashboard/admin/audit", icon: "audit" },
      { label: "Reports", href: "/dashboard/admin/reports", icon: "reports" },
    ],
  },

  cashier: {
    title: "Cashier",
    items: [
      { label: "Overview", href: "/dashboard/cashier", icon: "overview" },
      { label: "New Sale", href: "/dashboard/cashier/new-sale", icon: "newSale" },
      { label: "Transactions", href: "/dashboard/cashier/transactions", icon: "transactions" },
      { label: "Refill or Swap", href: "/dashboard/cashier/refill-swap", icon: "refillSwap" },
      { label: "Customers", href: "/dashboard/cashier/customers", icon: "customers" },
      { label: "Payments", href: "/dashboard/cashier/payments", icon: "payments" },
    ],
  },

  accountant: {
    title: "Accountant",
    items: [
      { label: "Overview", href: "/dashboard/accountant", icon: "overview" },
      { label: "Remittances", href: "/dashboard/accountant/remittances", icon: "remittance" },
      { label: "Daily Summary", href: "/dashboard/accountant/daily", icon: "daily" },
      { label: "Ledger", href: "/dashboard/accountant/ledger", icon: "ledger" },
      { label: "Reports", href: "/dashboard/accountant/reports", icon: "reports" },
    ],
  },

  rider: {
    title: "Rider",
    items: [
      { label: "Overview", href: "/dashboard/rider", icon: "overview" },
      { label: "My Deliveries", href: "/dashboard/rider/deliveries", icon: "deliveries" },
      { label: "Status Updates", href: "/dashboard/rider/status", icon: "status" },
      { label: "Remittance", href: "/dashboard/rider/remittance", icon: "remittance" },
      { label: "History", href: "/dashboard/rider/history", icon: "history" },
    ],
  },

  inventory_manager: {
    title: "Inventory",
    items: [
      { label: "Overview", href: "/dashboard/inventory", icon: "overview" },
      { label: "Stock Counts", href: "/dashboard/inventory/counts", icon: "counts" },
      { label: "Movements", href: "/dashboard/inventory/movements", icon: "movements" },
      { label: "Low Stock", href: "/dashboard/inventory/low-stock", icon: "lowStock" },
      { label: "Purchases", href: "/dashboard/inventory/purchases", icon: "purchases" },
      { label: "Suppliers", href: "/dashboard/inventory/suppliers", icon: "suppliers" },
    ],
  },
};

function normalizeRoleKey(role) {
  const r = String(role || "").trim();
  if (!r) return "admin";
  return r;
}

export default function Layout({ children, title }) {
  const page = usePage();
  const { auth } = page.props;
  const user = auth?.user;

  const roleKey = normalizeRoleKey(user?.role);

  const meta =
    ROLE_META[roleKey] ||
    ({
      title: "Dashboard",
      items: [{ label: "Overview", href: "/", icon: "overview" }],
    });

  const items = useMemo(() => meta.items, [meta.items]);

  // Sidebar state lives here, so it survives page navigation
  const [collapsed, setCollapsed] = useState(false);

  return (
    <DashboardShell
      title={title || meta.title}
      sidebarTitle={meta.title}
      items={items}
      collapsed={collapsed}
      setCollapsed={setCollapsed}
    >
      {children}
    </DashboardShell>
  );
}
