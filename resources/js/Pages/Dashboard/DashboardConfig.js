export const DASHBOARD_CONFIG = {
  admin: {
    title: "Admin Overview",
    stats: ["users", "employees", "reports"],
    actions: [
      { label: "Manage Users", href: "/dashboard/admin/users", icon: "users" },
      { label: "Employees", href: "/dashboard/admin/employees", icon: "employees" },
      { label: "Audit Logs", href: "/dashboard/admin/audit", icon: "audit" },
    ],
  },

  cashier: {
    title: "Cashier Overview",
    stats: ["sales", "transactions"],
    actions: [
      { label: "New Sale", href: "/dashboard/cashier/new-sale", icon: "newSale" },
      { label: "Transactions", href: "/dashboard/cashier/transactions", icon: "transactions" },
      { label: "Customers", href: "/dashboard/cashier/customers", icon: "customers" },
    ],
  },

  accountant: {
    title: "Accounting Overview",
    stats: ["remittance", "reports"],
    actions: [
      { label: "Daily Summary", href: "/dashboard/accountant/daily", icon: "daily" },
      { label: "Ledger", href: "/dashboard/accountant/ledger", icon: "ledger" },
      { label: "Reports", href: "/dashboard/accountant/reports", icon: "reports" },
    ],
  },

  rider: {
    title: "Rider Overview",
    stats: ["deliveries"],
    actions: [
      { label: "My Deliveries", href: "/dashboard/rider/deliveries", icon: "deliveries" },
      { label: "Status Updates", href: "/dashboard/rider/status", icon: "status" },
      { label: "History", href: "/dashboard/rider/history", icon: "history" },
    ],
  },

  inventory_manager: {
    title: "Inventory Overview",
    stats: ["lowStock", "counts"],
    actions: [
      { label: "Stock Counts", href: "/dashboard/inventory/counts", icon: "counts" },
      { label: "Low Stock", href: "/dashboard/inventory/low-stock", icon: "lowStock" },
      { label: "Purchases", href: "/dashboard/inventory/purchases", icon: "purchases" },
    ],
  },
};