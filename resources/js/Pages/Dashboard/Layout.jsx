import React, { useMemo } from "react";
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
  { label: "Products", href: "/dashboard/admin/products", icon: "products" },
  { label: "Suppliers", href: "/dashboard/admin/suppliers", icon: "suppliers" },
  { label: "Audit Logs", href: "/dashboard/admin/audit", icon: "audit" },
  { label: "Reports", href: "/dashboard/admin/reports", icon: "reports" },
  { label: "Customers", href: "/dashboard/admin/customers", icon: "reports" },
  { label: "Low Stock", href: "/dashboard/inventory/low-stock", icon: "lowStock" },

    ],
  },

  cashier: {
    title: "Cashier",
    items: [
      { label: "Overview", href: "/dashboard/cashier", icon: "overview" },
      { label: "Point of Sale", href: "/dashboard/cashier/POS", icon: "newSale" },
      { label: "Sales", href: "/dashboard/cashier/sales", icon: "transactions" },
      { label: "Customers", href: "/dashboard/cashier/customers", icon: "customers" },
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

  const items = useMemo(() => meta.items, [roleKey]);

  return (
    <DashboardShell
      title={title || meta.title}
      sidebarTitle={meta.title}
      items={items}
    >
      {children}
    </DashboardShell>
  );
}
