from __future__ import annotations

from pathlib import Path


DEFAULT_HEADER = [
    "Test Case ID",
    "Title",
    "Precondition",
    "Test Steps",
    "Expected Result",
    "Actual Result",
    "Status",
]


WORDING_UPDATES = {
    # Sales Operations - align with POS/Sales UI labels
    "BB-SOS-001": {
        "steps": [
            "Add products",
            "Enter exact payment",
            "Click Confirm payment",
        ],
    },
    "BB-SOS-003": {
        "steps": [
            "Leave cart empty",
            "Attempt to click Confirm payment",
        ],
    },
    "BB-SOS-005": {
        "steps": [
            "Add items to cart",
            "Select Cash",
            "Enter amount less than total",
            "Click Confirm payment",
        ],
    },
    "BB-SOS-006": {
        "steps": [
            "Add items to cart",
            "Enter promo code",
            "Apply promo",
            "Click Confirm payment",
        ],
    },
    "BB-SOS-007": {
        "steps": [
            "Add items to cart",
            "Enter promo code",
            "Apply promo",
        ],
    },
    "BB-SOS-011": {
        "steps": [
            "Add manual discount",
            "Leave manager PIN blank or invalid",
            "Click Confirm payment",
        ],
    },
    "BB-SOS-013": {
        "steps": [
            "Select GCash or Card",
            "Leave reference blank",
            "Click Confirm payment",
        ],
    },
    "BB-SOS-014": {
        "steps": [
            "Enter reference with letters",
            "Click Confirm payment",
        ],
    },
    "BB-SOS-015": {
        "steps": [
            "Enter any cash tendered amount",
            "Click Confirm payment",
        ],
    },
    "BB-SOS-016": {
        "steps": [
            "Attempt to click Confirm payment",
        ],
    },
    "BB-SOS-017": {
        "steps": [
            "Leave customer unselected",
            "Click Confirm payment",
        ],
    },
    "BB-SOS-018": {
        "steps": [
            "Open Sales history page",
            "Click Reprint on a sale",
        ],
    },
    "BB-SOS-019": {
        "steps": [
            "Open Sales history page",
            "Click View on a sale",
            "Click Print receipt",
        ],
    },
    "BB-SOS-020": {
        "steps": [
            "Open Sales history page",
            "Set date range",
            "Click Export",
        ],
    },
    "BB-SOS-021": {
        "steps": [
            "Open Sales history page",
            "Wait for auto-refresh or click refresh",
        ],
    },
    "BB-SOS-022": {
        "steps": [
            "Open Sales history page",
            "Click Close business date",
        ],
        "expected": "Business date closed; summary locked for the date",
    },
    "BB-SOS-023": {
        "steps": [
            "Open Sales history page",
            "Click Reopen business date",
        ],
        "expected": "Business date reopens; sales unlocked for the date",
    },
    "BB-SOS-025": {
        "steps": [
            "Add items",
            "Select Cash",
            "Enter amount greater than total",
            "Click Confirm payment",
        ],
    },
    "BB-SOS-026": {
        "steps": [
            "Select Cash",
            "Leave amount empty",
            "Click Confirm payment",
        ],
    },
    "BB-SOS-027": {
        "steps": [
            "Enter reference shorter than 4 chars",
            "Click Confirm payment",
        ],
    },
    "BB-SOS-030": {
        "steps": [
            "Add items to cart",
            "Enter voucher code",
            "Apply voucher",
            "Click Confirm payment",
        ],
    },
    "BB-SOS-031": {
        "steps": [
            "Set item quantity to 0 or negative",
            "Click Confirm payment",
        ],
    },
    # Inventory - align with UI labels
    "BB-ISM-011": {"steps": ["Open Low stock page"]},
    "BB-ISM-014": {
        "steps": [
            "Open Purchases page",
            "Click Request Restock",
            "Add items and quantities",
            "Save request",
        ],
    },
    "BB-ISM-021": {
        "steps": [
            "Click Delivered",
        ],
    },
    "BB-ISM-033": {
        "steps": [
            "Open Low stock page",
            "Click Approve on a request",
        ],
    },
    "BB-ISM-034": {
        "steps": [
            "Open Low stock page",
            "Click Decline on a request",
        ],
        "expected": "Status changes to Rejected",
    },
    # Financial - align with Turnover UI labels
    "BB-FAS-003": {
        "steps": [
            "Open Cashier Turnover page",
            "Click Review on a cashier row",
            "Enter a cash count that differs from expected",
            "Leave the note blank",
            "Click Save turnover",
        ],
    },
    "BB-FAS-004": {
        "steps": [
            "Open Cashier Turnover page",
            "Click Review on a cashier row",
            "Enter valid cash count and note",
            "Click Save turnover",
        ],
    },
    "BB-FAS-005": {
        "steps": [
            "Open Cashier Turnover page",
            "Click Review on a cashier row",
            "Enter amount greater than expected cash",
            "Click Save turnover",
        ],
    },
    "BB-FAS-006": {
        "steps": [
            "Open Cashier Turnover page",
            "Click Review on a cashier row",
        ],
    },
    "BB-FAS-007": {
        "steps": [
            "Open Cashier Turnover page",
            "Click Review on a finalized date",
            "Attempt to save cash turnover",
        ],
    },
    "BB-FAS-008": {
        "steps": [
            "Open Cashier Turnover page",
            "Click Verify cashless",
            "Select transactions",
            "Click Verify",
        ],
    },
    "BB-FAS-009": {
        "steps": [
            "Open Cashier Turnover page",
            "Click Verify cashless",
            "Select already verified transactions",
            "Click Verify",
        ],
    },
    "BB-FAS-010": {
        "steps": [
            "Open Cashier Turnover page",
            "Click Review",
            "Attempt Daily Close without verifying all cashless",
        ],
    },
    "BB-FAS-011": {
        "steps": [
            "Open Cashier Turnover page",
            "Click Reopen on a finalized row",
        ],
    },
}


def parse_row(line: str):
    parts = [p.strip() for p in line.strip().strip("|").split("|")]
    if len(parts) < len(DEFAULT_HEADER):
        parts.extend([""] * (len(DEFAULT_HEADER) - len(parts)))
    return parts


def format_row(parts) -> str:
    return "| " + " | ".join(parts) + " |"


def join_steps(steps) -> str:
    return "<br>".join([f"{i + 1}. {s}" for i, s in enumerate(steps)])


def map_sales(title: str):
    t = title.lower()
    if "sales locked" in t:
        return (
            "POST /dashboard/cashier/POS (Cashier\\POSController@store)",
            "CashierPage/POS.jsx",
        )
    if "receipt" in t and "reprint" in t:
        return (
            "POST /dashboard/cashier/sales/{sale}/receipt/reprint (Cashier\\SaleController@reprint)",
            "CashierPage/Sales.jsx",
        )
    if "print receipt" in t:
        return (
            "GET /dashboard/cashier/sales/{sale}/receipt/print (Cashier\\SaleController@printReceipt)",
            "CashierPage/Sales.jsx",
        )
    if "export" in t and "sales" in t:
        return (
            "GET /dashboard/cashier/sales/export (Cashier\\SaleController@export)",
            "CashierPage/Sales.jsx",
        )
    if "latest" in t:
        return (
            "GET /dashboard/cashier/sales/latest (Cashier\\SaleController@latest)",
            "CashierPage/Sales.jsx",
        )
    if "daily summary" in t or "business date" in t:
        if "reopen" in t:
            return (
                "POST /dashboard/cashier/sales/summary/reopen (Cashier\\DailySummaryController@reopen)",
                "CashierPage/Sales.jsx",
            )
        return (
            "POST /dashboard/cashier/sales/summary/finalize (Cashier\\DailySummaryController@finalize)",
            "CashierPage/Sales.jsx",
        )
    if "promo" in t or "voucher" in t:
        if "manual" in t:
            return (
                "POST /dashboard/cashier/POS (Cashier\\POSController@store)",
                "CashierPage/POS.jsx",
            )
        return (
            "POST /dashboard/cashier/discounts/validate (Cashier\\DiscountController@validateCode)",
            "CashierPage/POS.jsx",
        )
    return (
        "POST /dashboard/cashier/POS (Cashier\\POSController@store)",
        "CashierPage/POS.jsx",
    )


def map_inventory(title: str):
    t = title.lower()
    if "product" in t or "sku" in t:
        if "archive" in t:
            return (
                "POST /dashboard/admin/products/{product}/archive (Admin\\ProductController@archive)",
                "AdminPage/Products.jsx",
            )
        if "restore" in t:
            return (
                "PUT /dashboard/admin/products/{product}/restore (Admin\\ProductController@restore)",
                "AdminPage/Products.jsx",
            )
        if "update" in t:
            return (
                "PUT /dashboard/admin/products/{product} (Admin\\ProductController@update)",
                "AdminPage/Products.jsx",
            )
        return (
            "POST /dashboard/admin/products (Admin\\ProductController@store)",
            "AdminPage/Products.jsx",
        )

    if "stock count" in t:
        if "submit" in t:
            return (
                "POST /dashboard/inventory/counts/{inventoryBalance}/submit (Inventory\\StockController@submitCount)",
                "InventoryPage/StockCounts.jsx",
            )
        if "approve" in t or "reject" in t or "review" in t:
            return (
                "POST /dashboard/inventory/counts/{stockCount}/review (Inventory\\StockController@reviewCount)",
                "InventoryPage/StockCounts.jsx",
            )
        return (
            "GET /dashboard/inventory/counts (Inventory\\StockController@stockCount)",
            "InventoryPage/StockCounts.jsx",
        )

    if "low stock" in t:
        return (
            "GET /dashboard/inventory/order-stocks (Inventory\\StockController@lowStock)",
            "InventoryPage/Lowstock.jsx",
        )

    if "threshold" in t:
        if "update" in t or "change" in t:
            return (
                "POST /dashboard/admin/inventory/thresholds (Inventory\\StockController@updateThresholds)",
                "InventoryPage/Thresholds.jsx",
            )
        return (
            "GET /dashboard/inventory/thresholds (Inventory\\StockController@thresholds)",
            "InventoryPage/Thresholds.jsx",
        )

    if "export inventory" in t:
        return (
            "GET /dashboard/inventory/export (Inventory\\StockController@exportInventoryReport)",
            "InventoryPage/Thresholds.jsx",
        )

    if "purchase request" in t:
        if "admin" in t and "approve" in t:
            return (
                "POST /dashboard/admin/purchase-requests/{id}/approve (Inventory\\RestockRequestController@approve)",
                "InventoryPage/Lowstock.jsx",
            )
        if "admin" in t and ("reject" in t or "decline" in t):
            return (
                "POST /dashboard/admin/purchase-requests/{id}/reject (Inventory\\RestockRequestController@reject)",
                "InventoryPage/Lowstock.jsx",
            )
        if "submit" in t:
            return (
                "POST /dashboard/inventory/purchase-requests/{purchaseRequest}/submit (Inventory\\PurchaseRequestController@submit)",
                "InventoryPage/Purchases.jsx",
            )
        if "receive" in t:
            return (
                "POST /dashboard/inventory/purchase-requests/{purchaseRequest}/receipts (Inventory\\PurchaseRequestController@receive)",
                "InventoryPage/Purchases.jsx",
            )
        if "update" in t or "draft" in t:
            return (
                "PUT /dashboard/inventory/purchase-requests/{purchaseRequest} (Inventory\\PurchaseRequestController@update)",
                "InventoryPage/Purchases.jsx",
            )
        if "create" in t:
            return (
                "POST /dashboard/inventory/purchase-requests (Inventory\\PurchaseRequestController@store)",
                "InventoryPage/Purchases.jsx",
            )
        return (
            "GET /dashboard/inventory/purchase-requests (Inventory\\PurchaseRequestController@index)",
            "InventoryPage/Purchases.jsx",
        )

    if "purchase" in t:
        if "approve" in t:
            return (
                "POST /dashboard/inventory/purchases/{purchase}/approve (Inventory\\PurchaseController@approve)",
                "InventoryPage/Purchases.jsx",
            )
        if "reject" in t:
            return (
                "POST /dashboard/inventory/purchases/{purchase}/reject (Inventory\\PurchaseController@reject)",
                "InventoryPage/Purchases.jsx",
            )
        if "delivered" in t:
            return (
                "POST /dashboard/inventory/purchases/{purchase}/mark-delivered (Inventory\\PurchaseController@markDelivered)",
                "InventoryPage/Purchases.jsx",
            )
        if "confirm" in t:
            return (
                "POST /dashboard/inventory/purchases/{purchase}/confirm (Inventory\\PurchaseController@confirm)",
                "InventoryPage/Purchases.jsx",
            )
        if "complete" in t:
            return (
                "POST /dashboard/inventory/purchases/{purchase}/complete (Inventory\\PurchaseController@complete)",
                "InventoryPage/Purchases.jsx",
            )
        if "delete" in t:
            return (
                "DELETE /dashboard/inventory/purchases/{purchase} (Inventory\\PurchaseController@destroy)",
                "InventoryPage/Purchases.jsx",
            )
        if "purge" in t:
            return (
                "DELETE /dashboard/inventory/purchases (Inventory\\PurchaseController@purge)",
                "InventoryPage/Purchases.jsx",
            )
        if "discrepancy" in t:
            return (
                "POST /dashboard/inventory/purchases/{purchase}/discrepancy (Inventory\\PurchaseController@discrepancy)",
                "InventoryPage/Purchases.jsx",
            )
        if "create" in t:
            return (
                "POST /dashboard/inventory/purchases (Inventory\\PurchaseController@store)",
                "InventoryPage/Purchases.jsx",
            )
        return (
            "GET /dashboard/inventory/purchases (Inventory\\PurchaseController@index)",
            "InventoryPage/Purchases.jsx",
        )

    if "supplier" in t:
        if "details" in t or "view" in t:
            return (
                "GET /dashboard/inventory/suppliers/{supplier}/details (Supplier\\SupplierController@details)",
                "InventoryPage/Lowstock.jsx",
            )
        return (
            "GET /dashboard/inventory/suppliers (Supplier\\SupplierController@index)",
            "InventoryPage/Lowstock.jsx",
        )

    return (
        "GET /dashboard/inventory (Inventory\\StockController@stockCount)",
        "InventoryPage/StockCounts.jsx",
    )


def map_delivery(title: str):
    t = title.lower()
    if "history" in t:
        return (
            "GET /dashboard/rider/history (Rider\\RiderDeliveryController@history)",
            "RiderPage/History.jsx",
        )
    if "note" in t:
        return (
            "PATCH /dashboard/rider/deliveries/{delivery}/note (Rider\\RiderDeliveryController@updateNote)",
            "RiderPage/MyDeliveries.jsx",
        )
    if "delivery order" in t or "delivery details" in t:
        return (
            "POST /dashboard/cashier/POS (Cashier\\POSController@store)",
            "CashierPage/POS.jsx",
        )
    if "filter deliveries" in t:
        return (
            "GET /dashboard/rider/deliveries (Rider\\RiderDeliveryController@index)",
            "RiderPage/MyDeliveries.jsx",
        )
    return (
        "PATCH /dashboard/rider/deliveries/{delivery} (Rider\\RiderDeliveryController@updateStatus)",
        "RiderPage/MyDeliveries.jsx",
    )


def map_financial(title: str):
    t = title.lower()
    if "ledger" in t:
        if "export csv" in t:
            return (
                "GET /dashboard/accountant/ledger/export/csv (Accountant\\LedgerController@exportCsv)",
                "AccountantPage/Ledger.jsx",
            )
        if "export pdf" in t:
            return (
                "GET /dashboard/accountant/ledger/export/pdf (Accountant\\LedgerController@exportPdf)",
                "AccountantPage/Ledger.jsx",
            )
        if "reference" in t or "detail" in t:
            return (
                "GET /dashboard/accountant/ledger/reference/{reference} (Accountant\\LedgerController@referenceLines)",
                "AccountantPage/Ledger.jsx",
            )
        return (
            "GET /dashboard/accountant/ledger (Accountant\\LedgerController@index)",
            "AccountantPage/Ledger.jsx",
        )

    if "payable" in t:
        if "pay" in t:
            return (
                "POST /dashboard/accountant/payables/{payable}/pay (Accountant\\PayableController@pay)",
                "AccountantPage/Payables.jsx",
            )
        if "note" in t:
            return (
                "POST /dashboard/accountant/payables/{payable}/notes (Accountant\\PayableController@addNote)",
                "AccountantPage/Payables.jsx",
            )
        return (
            "GET /dashboard/accountant/payables (Accountant\\PayableController@index)",
            "AccountantPage/Payables.jsx",
        )

    if "turnover" in t or "remittance" in t or "cashless" in t or "daily close" in t:
        if "review" in t:
            return (
                "GET /dashboard/accountant/remittances/review (Accountant\\RemittanceController@review)",
                "AccountantPage/TurnoverReview.jsx",
            )
        if "verify" in t:
            return (
                "POST /dashboard/accountant/remittances/cashless-transactions/verify (Accountant\\RemittanceController@verifyCashlessTransactions)",
                "AccountantPage/Remittances.jsx",
            )
        if "reopen" in t:
            return (
                "POST /dashboard/accountant/remittances/reopen (Accountant\\RemittanceController@reopen)",
                "AccountantPage/Remittances.jsx",
            )
        if "daily close" in t or "finalize" in t:
            return (
                "POST /dashboard/accountant/remittances/daily-close (Accountant\\RemittanceController@dailyClose)",
                "AccountantPage/TurnoverReview.jsx",
            )
        return (
            "POST /dashboard/accountant/remittances/record-cash (Accountant\\RemittanceController@recordCash)",
            "AccountantPage/TurnoverReview.jsx",
        )

    if "supplier purchases" in t or "supplier purchase" in t:
        return (
            "GET /dashboard/accountant/supplier-purchases/export (Accountant\\SupplierPurchaseController@export)",
            "AccountantPage/SupplierPurchases (Inertia target)",
        )

    if "accountant sales export" in t:
        return (
            "GET /dashboard/accountant/sales/export (Cashier\\SaleController@export)",
            "AccountantPage/Sales.jsx",
        )

    if "revenue summary" in t or "report" in t:
        if "export" in t:
            return (
                "GET /dashboard/accountant/reports/export (Accountant\\ReportController@export)",
                "AccountantPage/Reports.jsx",
            )
        return (
            "GET /dashboard/accountant/reports (Accountant\\ReportController@index)",
            "AccountantPage/Reports.jsx",
        )

    if "cost tracking" in t:
        return (
            "GET /dashboard/accountant/cost-tracking (Accounting\\CostTrackingController@index)",
            "AdminPage/CostTracking.jsx",
        )

    if "payroll" in t:
        return (
            "GET /dashboard/accountant/payroll (Route->Inertia)",
            "AccountantPage/Payroll.jsx",
        )

    if "sales" in t:
        return (
            "GET /dashboard/accountant/sales (Cashier\\SaleController@indexAccountant)",
            "AccountantPage/Sales.jsx",
        )

    return (
        "GET /dashboard/accountant (Dashboard)",
        "AccountantPage/Sales.jsx",
    )


def map_admin(title: str):
    t = title.lower()
    if "login" in t:
        return (
            "POST /login (Auth\\LoginController@store)",
            "Auth/Login.jsx",
        )
    if "logout" in t:
        return (
            "POST /logout (Auth\\LoginController@destroy)",
            "Dashboard/Dashboard.jsx",
        )
    if "user" in t:
        if "reset" in t:
            return (
                "POST /dashboard/admin/users/{user}/reset-password (Admin\\UserController@resetPassword)",
                "AdminPage/Users.jsx",
            )
        return (
            "GET/POST /dashboard/admin/users (Admin\\UserController@index/store)",
            "AdminPage/Users.jsx",
        )
    if "employee" in t:
        if "update" in t:
            return (
                "PUT /dashboard/admin/employees/{employee} (Admin\\EmployeeController@update)",
                "AdminPage/Employees.jsx",
            )
        if "link" in t:
            return (
                "POST /dashboard/admin/employees/{employee}/link-user (Admin\\EmployeeController@linkUser)",
                "AdminPage/Employees.jsx",
            )
        if "unlink" in t:
            return (
                "DELETE /dashboard/admin/employees/{employee}/unlink-user (Admin\\EmployeeController@unlinkUser)",
                "AdminPage/Employees.jsx",
            )
        return (
            "POST /dashboard/admin/employees (Admin\\EmployeeController@store)",
            "AdminPage/Employees.jsx",
        )
    if "role" in t:
        if "archive" in t:
            return (
                "POST /dashboard/admin/roles/{role}/archive (Admin\\RoleController@archive)",
                "AdminPage/Roles.jsx",
            )
        if "restore" in t:
            return (
                "PUT /dashboard/admin/roles/{role}/restore (Admin\\RoleController@restore)",
                "AdminPage/Roles.jsx",
            )
        if "permission" in t:
            return (
                "PUT /dashboard/admin/roles/{role}/permissions (Admin\\RoleController@updatePermissions)",
                "AdminPage/Roles.jsx",
            )
        return (
            "GET/POST /dashboard/admin/roles (Admin\\RoleController@index/store)",
            "AdminPage/Roles.jsx",
        )
    if "audit log" in t:
        return (
            "GET /dashboard/admin/audit (AuditLogController@index)",
            "AdminPage/AuditLogs.jsx",
        )
    if "report" in t:
        if "export" in t:
            return (
                "GET /dashboard/admin/reports/export (Admin\\ReportsController@export)",
                "AdminPage/Reports.jsx",
            )
        return (
            "GET /dashboard/admin/reports (Admin\\ReportsController@index)",
            "AdminPage/Reports.jsx",
        )
    if "supplier" in t:
        if "details" in t or "view" in t:
            return (
                "GET /dashboard/admin/suppliers/{supplier}/details (Supplier\\SupplierController@details)",
                "AdminPage/Suppliers.jsx",
            )
        if "archive" in t:
            return (
                "POST /dashboard/admin/suppliers/{supplier}/archive (Supplier\\SupplierController@archive)",
                "AdminPage/Suppliers.jsx",
            )
        if "restore" in t:
            return (
                "PUT /dashboard/admin/suppliers/{supplier}/restore (Supplier\\SupplierController@restore)",
                "AdminPage/Suppliers.jsx",
            )
        if "update" in t:
            return (
                "PUT /dashboard/admin/suppliers/{supplier} (Supplier\\SupplierController@update)",
                "AdminPage/Suppliers.jsx",
            )
        return (
            "POST /dashboard/admin/suppliers (Supplier\\SupplierController@store)",
            "AdminPage/Suppliers.jsx",
        )
    if "promo" in t or "voucher" in t:
        if "manager pin" in t:
            return (
                "POST /dashboard/admin/promos/manager-pin (Admin\\PromoVoucherController@updateManagerPin)",
                "AdminPage/Promos.jsx",
            )
        if "restore" in t:
            return (
                "PUT /dashboard/admin/promos/{promo}/restore (Admin\\PromoVoucherController@restore)",
                "AdminPage/Promos.jsx",
            )
        if "discontinue" in t:
            return (
                "POST /dashboard/admin/promos/{promo}/discontinue (Admin\\PromoVoucherController@discontinue)",
                "AdminPage/Promos.jsx",
            )
        if "update" in t:
            return (
                "PUT /dashboard/admin/promos/{promo} (Admin\\PromoVoucherController@update)",
                "AdminPage/Promos.jsx",
            )
        return (
            "POST /dashboard/admin/promos (Admin\\PromoVoucherController@store)",
            "AdminPage/Promos.jsx",
        )
    if "vat" in t:
        return (
            "POST /dashboard/admin/settings/vat (Admin\\VatSettingsController@update)",
            "AdminPage/VATSettings.jsx",
        )
    if "customer" in t:
        return (
            "GET/POST /dashboard/admin/customers (Cashier\\CustomerController@index/store)",
            "CashierPage/Customers.jsx",
        )
    if "purchase request" in t:
        if "approve" in t:
            return (
                "POST /dashboard/admin/purchase-requests/{id}/approve (Inventory\\RestockRequestController@approve)",
                "InventoryPage/Lowstock.jsx",
            )
        if "reject" in t:
            return (
                "POST /dashboard/admin/purchase-requests/{id}/reject (Inventory\\RestockRequestController@reject)",
                "InventoryPage/Lowstock.jsx",
            )
    return (
        "GET /dashboard/admin (Dashboard)",
        "Dashboard/Dashboard.jsx",
    )


def map_system(title: str):
    t = title.lower()
    if "notification" in t:
        if "unread" in t:
            return (
                "GET /notifications/unread (NotificationController@unread)",
                "components/notifications",
            )
        if "mark all" in t:
            return (
                "POST /notifications/read-all (NotificationController@markAllAsRead)",
                "components/notifications",
            )
        if "mark" in t:
            return (
                "POST /notifications/{id}/read (NotificationController@markAsRead)",
                "components/notifications",
            )
        if "delete" in t:
            return (
                "DELETE /notifications/{id} (NotificationController@delete)",
                "components/notifications",
            )
        return (
            "GET /notifications (NotificationController@index)",
            "components/notifications",
        )
    if "/me" in t or "api /me" in t:
        return ("GET /api/me (routes/api.php)", "N/A (API)")
    if "ping" in t:
        return ("GET /api/ping (routes/api.php)", "N/A (API)")
    return ("N/A", "N/A")


def map_route_ui(section: str, title: str):
    if section == "Sales Operations System":
        return map_sales(title)
    if section == "Inventory Stock Management System":
        return map_inventory(title)
    if section == "Delivery Logistics Management System":
        return map_delivery(title)
    if section == "Financial Accounting System":
        return map_financial(title)
    if section == "System Administration Governance System":
        return map_admin(title)
    return map_system(title)


def build_mapping_section(rows):
    lines = []
    lines.append("## Coverage Mapping (Routes and UI)")
    lines.append("| Test Case ID | Route / Controller | UI Page / Component |")
    lines.append("| --- | --- | --- |")
    for row in rows:
        lines.append(f"| {row['id']} | {row['route']} | {row['ui']} |")
    return lines


def main():
    path = Path("BlackBoxTestPlan_Pietyl_LPG.md")
    lines = path.read_text(encoding="utf-8").splitlines()

    out = []
    rows_for_mapping = []
    current_section = ""
    in_mapping_section = False

    for line in lines:
        if line.startswith("## "):
            if line.strip().lower() == "## coverage mapping (routes and ui)":
                in_mapping_section = True
                continue
            if in_mapping_section:
                in_mapping_section = False
            current_section = line.replace("## ", "").strip()
            out.append(line)
            continue

        if in_mapping_section:
            continue

        if line.startswith("| BB-"):
            parts = parse_row(line)
            test_id = parts[0]
            title = parts[1]
            update = WORDING_UPDATES.get(test_id)
            if update:
                if "title" in update:
                    parts[1] = update["title"]
                    title = parts[1]
                if "precondition" in update:
                    parts[2] = update["precondition"]
                if "steps" in update:
                    parts[3] = join_steps(update["steps"])
                if "expected" in update:
                    parts[4] = update["expected"]

            route, ui = map_route_ui(current_section, title)
            rows_for_mapping.append({"id": test_id, "route": route, "ui": ui})

            out.append(format_row(parts))
            continue

        out.append(line)

    out.extend(["", *build_mapping_section(rows_for_mapping), ""])
    path.write_text("\n".join(out), encoding="utf-8")


if __name__ == "__main__":
    main()
