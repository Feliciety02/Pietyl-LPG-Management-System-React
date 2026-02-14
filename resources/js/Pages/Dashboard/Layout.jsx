import React, { useMemo } from "react";
import { usePage } from "@inertiajs/react";
import DashboardShell from "./DashboardShell";

const ROLE_META = {
  admin: {
    title: "Admin Panel",
    items: [
      {
        type: "group",
        label: "Overview",
        items: [
          { label: "Dashboard", href: "/dashboard/admin", icon: "overview" },
        ],
      },
      {
        type: "group",
        label: "People & Access",
        items: [
          { label: "Users", href: "/dashboard/admin/users", icon: "users", permission: "admin.users.view" },
          { label: "Roles", href: "/dashboard/admin/roles", icon: "roles", permission: "admin.roles.view" },
          { label: "Employees", href: "/dashboard/admin/employees", icon: "employees", permission: "admin.employees.view" },
          { label: "Customers", href: "/dashboard/admin/customers", icon: "customers", permission: "admin.customers.view" },
        ],
      },
      {
        type: "group",
        label: "Inventory",
        items: [
          { label: "Products", href: "/dashboard/admin/products", icon: "products", permission: "admin.products.view" },
          { label: "Suppliers", href: "/dashboard/admin/suppliers", icon: "suppliers", permission: "admin.suppliers.view" },
          { label: "Purchase Requests", href: "/dashboard/admin/purchases", icon: "purchases", permission: "inventory.purchases.view" },
          { label: "Stock Counts", href: "/dashboard/inventory/counts", icon: "counts", permission: "inventory.stock.view" },
          { label: "Thresholds", href: "/dashboard/inventory/thresholds", icon: "thresholds", permission: "inventory.thresholds.view" },
        ],
      },
      {
        type: "group",
        label: "Reports & Settings",
        items: [
          { label: "Reports", href: "/dashboard/admin/reports", icon: "reports", permission: "admin.reports.view" },
          { label: "Cost Tracking", href: "/dashboard/admin/cost-tracking", icon: "costTracking", permission: "admin.reports.view" },
          { label: "VAT Settings", href: "/dashboard/admin/settings/vat", icon: "vatSettings", permission: "admin.settings.manage" },
          { label: "Promos & Vouchers", href: "/dashboard/admin/promos", icon: "promos", permission: "admin.promos.view" },
        ],
      },
      {
        type: "group",
        label: "Security",
        items: [
          { label: "Audit Logs", href: "/dashboard/admin/audit", icon: "audit", permission: "admin.audit.view" },
        ],
      },
    ],
  },

  cashier: {
    title: "Cashier",
    items: [
      {
        type: "group",
        label: "Overview",
        items: [
          { label: "Dashboard", href: "/dashboard/cashier", icon: "overview" },
        ],
      },
      {
        type: "group",
        label: "Sales",
        items: [
          { label: "Point of Sale", href: "/dashboard/cashier/POS", icon: "newSale", permission: "cashier.pos.use" },
          { label: "Sales", href: "/dashboard/cashier/sales", icon: "transactions", permission: "cashier.sales.view" },
        ],
      },
      {
        type: "group",
        label: "Customers",
        items: [
          { label: "Customers", href: "/dashboard/cashier/customers", icon: "customers", permission: "cashier.customers.view" },
        ],
      },
      {
        type: "group",
        label: "Security",
        items: [
          { label: "Audit Logs", href: "/dashboard/cashier/audit", icon: "audit", permission: "cashier.audit.view" },
        ],
      },
    ],
  },

  accountant: {
    title: "Accountant",
    items: [
      {
        type: "group",
        label: "Overview",
        items: [
          { label: "Dashboard", href: "/dashboard/accountant", icon: "overview" },
        ],
      },
      {
        type: "group",
        label: "Revenue",
        items: [
          { label: "Sales", href: "/dashboard/accountant/sales", icon: "transactions", permission: "accountant.sales.view" },
          { label: "Remittances", href: "/dashboard/accountant/remittances", icon: "remittance", permission: "accountant.remittances.view" },
        ],
      },
      {
        type: "group",
        label: "Accounting",
        items: [
          { label: "Ledger", href: "/dashboard/accountant/ledger", icon: "ledger", permission: "accountant.ledger.view" },
          { label: "Supplier Payables", href: "/dashboard/accountant/payables", icon: "payables", permission: "accountant.payables.view" },
        ],
      },
      {
        type: "group",
        label: "Payroll & Reporting",
        items: [
          { label: "Payroll", href: "/dashboard/accountant/payroll", icon: "payroll", permission: "accountant.payroll.view" },
          { label: "Reports", href: "/dashboard/accountant/reports", icon: "reports", permission: "accountant.reports.view" },
          { label: "Cost Tracking", href: "/dashboard/accountant/cost-tracking", icon: "costTracking", permission: "accountant.reports.view" },
        ],
      },
      {
        type: "group",
        label: "Security",
        items: [
          { label: "Audit Logs", href: "/dashboard/accountant/audit", icon: "audit", permission: "accountant.audit.view" },
        ],
      },
    ],
  },

  rider: {
    title: "Rider",
    items: [
      {
        type: "group",
        label: "Overview",
        items: [
          { label: "Dashboard", href: "/dashboard/rider", icon: "overview" },
        ],
      },
      {
        type: "group",
        label: "Deliveries",
        items: [
          { label: "My Deliveries", href: "/dashboard/rider/deliveries", icon: "deliveries", permission: "rider.deliveries.view" },
          { label: "History", href: "/dashboard/rider/history", icon: "history", permission: "rider.history.view" },
        ],
      },
      {
        type: "group",
        label: "Security",
        items: [
          { label: "Audit Logs", href: "/dashboard/rider/audit", icon: "audit", permission: "rider.audit.view" },
        ],
      },
    ],
  },

  inventory_manager: {
    title: "Inventory",
    items: [
      {
        type: "group",
        label: "Overview",
        items: [
          { label: "Dashboard", href: "/dashboard/inventory", icon: "overview" },
        ],
      },
      {
        type: "group",
        label: "Stock Control",
        items: [
          { label: "Stock Counts", href: "/dashboard/inventory/counts", icon: "counts", permission: "inventory.stock.view" },
          { label: "Thresholds", href: "/dashboard/inventory/thresholds", icon: "thresholds", permission: "inventory.thresholds.view" },
        ],
      },
      {
        type: "group",
        label: "Procurement",
        items: [
          { label: "Low Stock", href: "/dashboard/inventory/order-stocks", icon: "lowStock", permission: "inventory.stock.low_stock" },
          { label: "Purchase Requests", href: "/dashboard/inventory/purchases", icon: "purchases", permission: "inventory.purchases.view" },
          { label: "Suppliers", href: "/dashboard/inventory/suppliers", icon: "suppliers", permission: "inventory.suppliers.view" },
        ],
      },
      {
        type: "group",
        label: "Security",
        items: [
          { label: "Audit Logs", href: "/dashboard/inventory/audit", icon: "audit", permission: "inventory.audit.view" },
        ],
      },
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
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const permissionSet = useMemo(() => new Set(permissions), [permissions]);
  const can = (perm) => !perm || permissionSet.has(perm);

  const roleKey = normalizeRoleKey(user?.role);
  const meta =
    ROLE_META[roleKey] ||
    ({
      title: "Dashboard",
      items: [{ label: "Overview", href: "/", icon: "overview" }],
    });

  const items = useMemo(() => {
    return meta.items
      .map((item) => {
        if (item.type === "group") {
          const filteredItems = (item.items || []).filter((i) => can(i.permission));
          if (!filteredItems.length) return null;
          return { ...item, items: filteredItems };
        }
        return can(item.permission) ? item : null;
      })
      .filter(Boolean);
  }, [roleKey, permissions]);

  return (
    <DashboardShell title={title || meta.title} sidebarTitle={meta.title} items={items}>
      {children}
    </DashboardShell>
  );
}
