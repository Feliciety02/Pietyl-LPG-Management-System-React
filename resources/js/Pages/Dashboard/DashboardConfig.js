
export const DASHBOARD_CONFIG = {
  admin: {
    title: "Owner Overview",
    actions: [
      { label: "Employees", href: "/dashboard/admin/employees", permission: "admin.employees.view" },
      { label: "Products", href: "/dashboard/admin/products", permission: "admin.products.view" },
      { label: "Suppliers", href: "/dashboard/admin/suppliers", permission: "admin.suppliers.view" },
      { label: "Purchase history", href: "/dashboard/admin/purchases", permission: "inventory.purchases.view" },
      { label: "Stock Counts", href: "/dashboard/inventory/counts", permission: "inventory.stock.view" },
      { label: "Reports", href: "/dashboard/admin/reports", permission: "admin.reports.view" },
      { label: "VAT Settings", href: "/dashboard/admin/vat", permission: "admin.settings.manage" },
      { label: "Audit Logs", href: "/dashboard/admin/audit", permission: "admin.audit.view" },
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
      { label: "Point of Sale", href: "/dashboard/cashier/POS", permission: "cashier.pos.use" },
      { label: "Sales History", href: "/dashboard/cashier/sales", permission: "cashier.sales.view" },
      { label: "Customers", href: "/dashboard/cashier/customers", permission: "cashier.customers.view" },
    ],
    activityTitle: "Shift activity",
    activity: [],
  },

  accountant: {
    title: "Accountant",
    actions: [
      { label: "Sales", href: "/dashboard/accountant/sales", permission: "accountant.sales.view" },
      { label: "Remittances", href: "/dashboard/accountant/remittances", permission: "accountant.remittances.view" },
      { label: "Ledger", href: "/dashboard/accountant/ledger", permission: "accountant.ledger.view" },
      { label: "Supplier Payables", href: "/dashboard/accountant/payables", permission: "accountant.payables.view" },
      { label: "Payroll", href: "/dashboard/accountant/payroll", permission: "accountant.payroll.view" },
      { label: "Reports", href: "/dashboard/accountant/reports", permission: "accountant.reports.view" },
      { label: "Audit Logs", href: "/dashboard/accountant/audit", permission: "accountant.audit.view" },
    ],
    activityTitle: "Accounting notes",
    activity: [],
  },

  rider: {
    title: "Rider",
    actions: [
      { label: "My Deliveries", href: "/dashboard/rider/deliveries", permission: "rider.deliveries.view" },
      { label: "Update Status", href: "/dashboard/rider/deliveries", permission: "rider.deliveries.update" },
      { label: "History", href: "/dashboard/rider/history", permission: "rider.history.view" },
      { label: "Remittance", href: "/dashboard/rider/remittance", permission: "rider.remittance.view" },
    ],
    activityTitle: "Delivery timeline",
    activity: [],
  },

  inventory_manager: {
    title: "Inventory",
    actions: [
      { label: "Stock Counts", href: "/dashboard/inventory/counts", permission: "inventory.stock.view" },
      { label: "Order Stocks", href: "/dashboard/inventory/order-stocks", permission: "inventory.stock.low_stock" },
      { label: "Purchases", href: "/dashboard/inventory/purchases", permission: "inventory.purchases.view" },
      { label: "Suppliers", href: "/dashboard/inventory/suppliers", permission: "inventory.suppliers.view" },
    ],
    activityTitle: "Inventory notes",
    activity: [],
  },
};
