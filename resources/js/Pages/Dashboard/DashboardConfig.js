// resources/js/pages/Dashboard/DashboardConfig.js
export const DASHBOARD_CONFIG = {
  admin: {
    title: "Owner Overview",
    overview: [
      {
        label: "Sales Today",
        valueKey: "sales_today",
        hint: "Total sales recorded today",
        icon: "transactions",
      },
      {
        label: "Pending Deliveries",
        valueKey: "pending_deliveries",
        hint: "Need assignment or dispatch",
        icon: "deliveries",
      },
      {
        label: "Low Stock Items",
        valueKey: "low_stock",
        hint: "Refill soon to avoid outages",
        icon: "lowStock",
      },
      {
        label: "Active Staff",
        valueKey: "active_staff",
        hint: "Users with access enabled",
        icon: "users",
      },
      {
        label: "Remittances Today",
        valueKey: "remittances_today",
        hint: "Cash / GCash / adjustments logged",
        icon: "remittance",
      },
      {
        label: "Audit Alerts",
        valueKey: "audit_alerts",
        hint: "Unusual actions needing review",
        icon: "audit",
      },
    ],
    actions: [
      { label: "Manage Users", href: "/dashboard/admin/users" },
      { label: "Review Low Stock", href: "/dashboard/inventory/low-stock" },
      { label: "View Reports", href: "/dashboard/admin/reports" },
      { label: "Audit Logs", href: "/dashboard/admin/audit" },
    ],
    activityTitle: "Owner activity",
    activity: [
      { title: "Seeded roles created", meta: "roles table updated" },
      { title: "Users linked to employees", meta: "employee_id validated" },
      { title: "Dashboard connected to auth", meta: "HandleInertiaRequests share" },
    ],
  },

  cashier: {
    title: "Cashier Overview",
    overview: [
      {
        label: "Sales Today",
        valueKey: "sales_today",
        hint: "Total sales recorded today",
        icon: "transactions",
      },
      {
        label: "Transactions",
        valueKey: "transactions_today",
        hint: "Number of receipts created",
        icon: "transactions",
      },
      {
        label: "Walk In Sales",
        valueKey: "walk_in_today",
        hint: "Direct store transactions",
        icon: "newSale",
      },
      {
        label: "Delivery Sales",
        valueKey: "delivery_today",
        hint: "Orders for delivery",
        icon: "deliveries",
      },
      {
        label: "Payments Collected",
        valueKey: "payments_collected",
        hint: "Cash and e wallet totals",
        icon: "payments",
      },
      {
        label: "Customers Added",
        valueKey: "customers_added_today",
        hint: "New customer records",
        icon: "customers",
      },
    ],
    actions: [
      { label: "Point of Sale", href: "/dashboard/cashier/POS" },
      { label: "Sales History", href: "/dashboard/cashier/sales" },
      { label: "Customers", href: "/dashboard/cashier/customers" },
      { label: "Open Transactions", href: "/dashboard/cashier/sales" },
    ],
    activityTitle: "Shift updates",
    activity: [],
  },

  accountant: {
    title: "Accounting Overview",
    overview: [
      {
        label: "Sales Today",
        valueKey: "sales_today",
        hint: "Total recorded sales today",
        icon: "transactions",
      },
      {
        label: "Remittances Logged",
        valueKey: "remittances_today",
        hint: "Cash and e wallet remitted",
        icon: "remittance",
      },
      {
        label: "Unreconciled",
        valueKey: "unreconciled_count",
        hint: "Needs ledger matching",
        icon: "ledger",
      },
      {
        label: "Expenses Today",
        valueKey: "expenses_today",
        hint: "Recorded expense entries",
        icon: "ledger",
      },
      {
        label: "Payroll Due",
        valueKey: "payroll_due",
        hint: "Employees pending payout",
        icon: "payroll",
      },
      {
        label: "Report Exports",
        valueKey: "reports_exported",
        hint: "Exports generated this week",
        icon: "reports",
      },
    ],
    actions: [
      { label: "Remittances", href: "/dashboard/accountant/remittances" },
      { label: "Daily Summary", href: "/dashboard/accountant/daily" },
      { label: "Ledger", href: "/dashboard/accountant/ledger" },
      { label: "Payroll", href: "/dashboard/accountant/payroll" },
    ],
    activityTitle: "Accounting notes",
    activity: [],
  },

  rider: {
    title: "Rider Overview",
    overview: [
      {
        label: "Assigned Deliveries",
        valueKey: "assigned_deliveries",
        hint: "Orders assigned to you",
        icon: "deliveries",
      },
      {
        label: "Out For Delivery",
        valueKey: "out_for_delivery",
        hint: "Currently in transit",
        icon: "status",
      },
      {
        label: "Delivered Today",
        valueKey: "delivered_today",
        hint: "Completed deliveries",
        icon: "history",
      },
      {
        label: "Failed or Returned",
        valueKey: "failed_returns",
        hint: "Needs follow up",
        icon: "history",
      },
      {
        label: "Collections Today",
        valueKey: "collections_today",
        hint: "COD collected for remittance",
        icon: "remittance",
      },
      {
        label: "Proof Pending",
        valueKey: "proof_pending",
        hint: "Missing confirmation photo or note",
        icon: "audit",
      },
    ],
    actions: [
      { label: "My Deliveries", href: "/dashboard/rider/deliveries" },
      { label: "History", href: "/dashboard/rider/history" },
      { label: "Update Status", href: "/dashboard/rider/deliveries" },
      { label: "Remittance", href: "/dashboard/rider/remittance" },
    ],
    activityTitle: "Delivery timeline",
    activity: [],
  },

  inventory_manager: {
    title: "Inventory Overview",
    overview: [
      {
        label: "Low Stock Items",
        valueKey: "low_stock",
        hint: "Needs refill soon",
        icon: "lowStock",
      },
      {
        label: "Stock On Hand",
        valueKey: "stock_on_hand",
        hint: "Total cylinders available",
        icon: "counts",
      },
      {
        label: "Movements Today",
        valueKey: "movements_today",
        hint: "Stock in and out",
        icon: "movements",
      },
      {
        label: "Purchases Pending",
        valueKey: "purchases_pending",
        hint: "Waiting delivery from suppliers",
        icon: "purchases",
      },
      {
        label: "Suppliers Active",
        valueKey: "suppliers_active",
        hint: "Suppliers with recent activity",
        icon: "suppliers",
      },
      {
        label: "Adjustments",
        valueKey: "adjustments_today",
        hint: "Manual count corrections",
        icon: "audit",
      },
    ],
    actions: [
      { label: "Stock Counts", href: "/dashboard/inventory/counts" },
      { label: "Movements", href: "/dashboard/inventory/movements" },
      { label: "Low Stock", href: "/dashboard/inventory/low-stock" },
      { label: "Purchases", href: "/dashboard/inventory/purchases" },
    ],
    activityTitle: "Inventory notes",
    activity: [],
  },
};
