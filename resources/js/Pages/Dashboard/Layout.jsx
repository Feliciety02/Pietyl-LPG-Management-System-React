import React, { useMemo } from "react";
import { usePage } from "@inertiajs/react";
import DashboardShell from "./DashboardShell";

const ROLE_META = {
  admin: {
    title: "Admin Panel",
    items: [
      {
        type: "group",
        label: "Intelligence",
        items: [
          { label: "Reports", href: "/dashboard/admin/reports", icon: "reports", permission: "admin.reports.view" },
        ],
      },
      {
        type: "group",
        label: "People",
        items: [
          { label: "Users", href: "/dashboard/admin/users", icon: "users", permission: "admin.users.view" },
          { label: "Roles", href: "/dashboard/admin/roles", icon: "roles", permission: "admin.roles.view" },
          { label: "Employees", href: "/dashboard/admin/employees", icon: "employees", permission: "admin.employees.view" },
          { label: "Customers", href: "/dashboard/admin/customers", icon: "customers", permission: "admin.customers.view" },
        ],
      },
      {
        type: "group",
        label: "Catalog & Supply",
        items: [
          { label: "Products", href: "/dashboard/admin/products", icon: "products", permission: "admin.products.view" },
          { label: "Suppliers", href: "/dashboard/admin/suppliers", icon: "suppliers", permission: "admin.suppliers.view" },
          { label: "Purchase requests", href: "/dashboard/admin/purchase-requests", icon: "purchases", permission: "admin.purchase_requests.view" },
          { label: "Stock Requests", href: "/dashboard/admin/stock-requests", icon: "purchases", permission: "inventory.purchases.view" },
          { label: "Order Stocks", href: "/dashboard/inventory/order-stocks", icon: "lowStock", permission: "inventory.stock.low_stock" },
          { label: "Thresholds", href: "/dashboard/inventory/thresholds", icon: "thresholds", permission: "inventory.thresholds.view" },
          { label: "Stock Counts", href: "/dashboard/inventory/counts", icon: "counts", permission: "inventory.stock.view" },
        ],
      },
      {
        type: "group",
        label: "Finance",
        items: [
          { label: "Payroll", href: "/dashboard/accountant/payroll", icon: "payroll", permission: "accountant.payroll.view" },
          { label: "VAT Settings", href: "/dashboard/admin/settings/vat", icon: "vatSettings", permission: "admin.settings.manage" },
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
        label: "Transactions",
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
    ],
  },

  accountant: {
    title: "Accountant",
    items: [
      {
        type: "group",
        label: "Finance",
        items: [
          { label: "Remittances", href: "/dashboard/accountant/remittances", icon: "remittance", permission: "accountant.remittances.view" },
          { label: "Ledger", href: "/dashboard/accountant/ledger", icon: "ledger", permission: "accountant.ledger.view" },
          { label: "Supplier Payables", href: "/dashboard/accountant/payables", icon: "payables", permission: "accountant.payables.view" },
          { label: "Supplier purchases", href: "/dashboard/accountant/supplier-purchases", icon: "purchases", permission: "accountant.purchase_requests.view" },
        ],
      },
      {
        type: "group",
        label: "Payroll & Reporting",
        items: [
          { label: "Payroll", href: "/dashboard/accountant/payroll", icon: "payroll", permission: "accountant.payroll.view" },
          { label: "Reports", href: "/dashboard/accountant/reports", icon: "reports", permission: "accountant.reports.view" },
        ],
      },
    ],
  },

  rider: {
    title: "Rider",
    items: [
      {
        type: "group",
        label: "Deliveries",
        items: [
          { label: "My Deliveries", href: "/dashboard/rider/deliveries", icon: "deliveries", permission: "rider.deliveries.view" },
          { label: "History", href: "/dashboard/rider/history", icon: "history", permission: "rider.history.view" },
        ],
      },
    ],
  },

  inventory_manager: {
    title: "Inventory",
    items: [
      {
        type: "group",
        label: "Operations",
        items: [
          { label: "Stock Counts", href: "/dashboard/inventory/counts", icon: "counts", permission: "inventory.stock.view" },
          { label: "Movements", href: "/dashboard/inventory/movements", icon: "movements", permission: "inventory.movements.view" },
        ],
      },
      {
        type: "group",
        label: "Procurement",
        items: [
          { label: "Purchase requests", href: "/dashboard/inventory/purchase-requests", icon: "purchases", permission: "inventory.purchase_requests.view" },
          { label: "Order Stocks", href: "/dashboard/inventory/order-stocks", icon: "lowStock", permission: "inventory.stock.low_stock" },
          { label: "Thresholds", href: "/dashboard/inventory/thresholds", icon: "thresholds", permission: "inventory.thresholds.view" },
          { label: "Purchase history", href: "/dashboard/inventory/purchases", icon: "purchases", permission: "inventory.purchases.view" },
          { label: "Suppliers", href: "/dashboard/inventory/suppliers", icon: "suppliers", permission: "inventory.suppliers.view" },
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
