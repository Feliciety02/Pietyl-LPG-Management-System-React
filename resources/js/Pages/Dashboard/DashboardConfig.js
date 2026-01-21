
export const DASHBOARD_CONFIG = {
  admin: {
    title: "Owner Overview",
    actions: [
      { label: "Manage Users", href: "/dashboard/admin/users" },
      { label: "Employees", href: "/dashboard/admin/employees" },
      { label: "Products", href: "/dashboard/admin/products" },
      { label: "Suppliers", href: "/dashboard/admin/suppliers" },
      { label: "Low Stock", href: "/dashboard/inventory/low-stock" },
      { label: "Reports", href: "/dashboard/admin/reports" },
      { label: "Audit Logs", href: "/dashboard/admin/audit" },
    ],
    activityTitle: "Owner activity",
    activity: [
      { title: "Seeded roles created", meta: "roles table updated" },
      { title: "Users linked to employees", meta: "employee_id validated" },
      { title: "System initialized", meta: "initial setup completed" },
    ],
  },

  cashier: {
    title: "Cashier",
    actions: [
      { label: "Point of Sale", href: "/dashboard/cashier/POS" },
      { label: "Sales History", href: "/dashboard/cashier/sales" },
      { label: "Customers", href: "/dashboard/cashier/customers" },
    ],
    activityTitle: "Shift activity",
    activity: [],
  },

  accountant: {
    title: "Accountant",
    actions: [
      { label: "Remittances", href: "/dashboard/accountant/remittances" },
      { label: "Daily Summary", href: "/dashboard/accountant/daily" },
      { label: "Ledger", href: "/dashboard/accountant/ledger" },
      { label: "Payroll", href: "/dashboard/accountant/payroll" },
      { label: "Reports", href: "/dashboard/accountant/reports" },
    ],
    activityTitle: "Accounting notes",
    activity: [],
  },

  rider: {
    title: "Rider",
    actions: [
      { label: "My Deliveries", href: "/dashboard/rider/deliveries" },
      { label: "Update Status", href: "/dashboard/rider/deliveries" },
      { label: "History", href: "/dashboard/rider/history" },
      { label: "Remittance", href: "/dashboard/rider/remittance" },
    ],
    activityTitle: "Delivery timeline",
    activity: [],
  },

  inventory_manager: {
    title: "Inventory",
    actions: [
      { label: "Stock Counts", href: "/dashboard/inventory/counts" },
      { label: "Movements", href: "/dashboard/inventory/movements" },
      { label: "Low Stock", href: "/dashboard/inventory/low-stock" },
      { label: "Purchases", href: "/dashboard/inventory/purchases" },
      { label: "Suppliers", href: "/dashboard/inventory/suppliers" },
    ],
    activityTitle: "Inventory notes",
    activity: [],
  },
};