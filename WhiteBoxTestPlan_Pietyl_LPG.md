# White Box Test Plan - Pietyl LPG Management System

Generated: 2026-02-25

## 1. LoginController

*File: app/Http/Controllers/Auth/LoginController.php*

| Test Case ID | Feature / Module | Testing Technique | Preconditions | Test Input | Expected Output | Actual Output | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| LC-01 | LoginController / store | Validation | Missing email fails validation; None | No email, password=secret | Session error on email | Session error on email | Passed |
| LC-02 | LoginController / store | Validation | Missing password fails validation; None | email=a@b.com, no password | Session error on password | Session error on password | Passed |
| LC-03 | LoginController / store | Branch Coverage | User not found creates audit log and throws error; No matching user in DB | email=ghost@test.com, password=x | Session error "Invalid login credentials" + audit log auth.login_failed with null actor_user_id | Session error "Invalid login credentials" + audit log auth.login_failed with null actor_user_id | Passed |
| LC-04 | LoginController / store | Branch Coverage | User with no employee record is rejected; User exists, no Employee record | Valid email + any password | Session error "No employee record found" | Session error "No employee record found" | Passed |
| LC-05 | LoginController / store | Branch Coverage | Inactive employee is rejected and logged; User + inactive Employee | Valid credentials | Session error "Employee record is inactive" + audit log auth.login_failed | Session error "Employee record is inactive" + audit log auth.login_failed | Passed |
| LC-06 | LoginController / store | Branch Coverage | Wrong password creates audit log and throws error; User + active Employee | Correct email, wrong password | Session error "Invalid login credentials" + audit log auth.login_failed | Session error "Invalid login credentials" + audit log auth.login_failed | Passed |
| LC-07 | LoginController / store | Branch Coverage | Admin redirects to /dashboard/admin; User + active Employee, role=admin | Valid admin credentials | Redirects to /dashboard/admin + audit log auth.login | Redirects to /dashboard/admin + audit log auth.login | Passed |
| LC-08 | LoginController / store | Branch Coverage | Cashier redirects to /dashboard/cashier; User + active Employee, role=cashier | Valid cashier credentials | Redirects to /dashboard/cashier | Redirects to /dashboard/cashier | Passed |
| LC-09 | LoginController / store | Branch Coverage | Accountant redirects to /dashboard/accountant; User + active Employee, role=accountant | Valid credentials | Redirects to /dashboard/accountant | Redirects to /dashboard/accountant | Passed |
| LC-10 | LoginController / store | Branch Coverage | Rider redirects to /dashboard/rider; User + active Employee, role=rider | Valid credentials | Redirects to /dashboard/rider | Redirects to /dashboard/rider | Passed |
| LC-11 | LoginController / store | Branch Coverage | Inventory manager redirects to /dashboard/inventory; User + active Employee, role=inventory_manager | Valid credentials | Redirects to /dashboard/inventory | Redirects to /dashboard/inventory | Passed |
| LC-12 | LoginController / store | Branch Coverage | Unknown role redirects to /; User + active Employee, no role assigned | Valid credentials | Redirects to / | Redirects to / | Passed |
| LC-13 | LoginController / destroy | Branch Coverage | Logged-in user logout creates audit log; Authenticated session active | POST logout | Session invalidated, redirects to /, audit log auth.logout created | Session invalidated, redirects to /, audit log auth.logout created | Passed |
| LC-14 | LoginController / destroy | Branch Coverage | Guest logout skips audit log; No active session | POST logout as guest | Redirects to /, no audit log created | Redirects to /, no audit log created | Passed |

## 2. UserController (Admin)

*File: app/Http/Controllers/Admin/UserController.php*

| Test Case ID | Feature / Module | Testing Technique | Preconditions | Test Input | Expected Output | Actual Output | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UC-01 | UserController / index | Branch Coverage | Unauthorized user gets 403; User without view permission | GET users list | 403 Forbidden | 403 Forbidden | Passed |
| UC-02 | UserController / index | Branch Coverage | Returns paginated user list; Admin with admin.users.view | GET users list | Inertia page with paginated users | Inertia page with paginated users | Passed |
| UC-03 | UserController / index | Branch Coverage | Search filter narrows results; 2 users: Alice, Bob | q=Alice | Only Alice returned | Only Alice returned | Passed |
| UC-04 | UserController / index | Branch Coverage | Status filter returns only active users; 1 active, 1 inactive user | status=active | Only active user returned | Only active user returned | Passed |
| UC-05 | UserController / store | Branch Coverage | Unauthorized user gets 403; User without create permission | POST create user | 403 Forbidden | 403 Forbidden | Passed |
| UC-06 | UserController / store | Validation | Missing name fails validation; Admin with permission | No name provided | Session error on name | Session error on name | Passed |
| UC-07 | UserController / store | Validation | Duplicate email fails validation; User with same email exists | Duplicate email | Session error on email | Session error on email | Passed |
| UC-08 | UserController / store | Branch Coverage | Creates user with temp password; Admin with permission | Valid name + unique email | User created with hashed password, redirect with success | User created with hashed password, redirect with success | Passed |
| UC-09 | UserController / resetPassword | Branch Coverage | Unauthorized user gets 403; User without update permission | POST reset password | 403 Forbidden | 403 Forbidden | Passed |
| UC-10 | UserController / resetPassword | Branch Coverage | Wrong admin password returns 422; Admin + target user exist | Incorrect admin_password | JSON 422 "Incorrect password." | JSON 422 "Incorrect password." | Passed |
| UC-11 | UserController / resetPassword | Branch Coverage | Valid reset updates password and logs audit; Admin + target user exist | Correct admin_password + new password | Password updated, audit row in password_reset_audits, JSON 200 | Password updated, audit row in password_reset_audits, JSON 200 | Passed |
| UC-12 | UserController / confirmPassword | Branch Coverage | Wrong password returns 422; Admin with permission | Wrong password | JSON 422 "Incorrect password." | JSON 422 "Incorrect password." | Passed |
| UC-13 | UserController / confirmPassword | Branch Coverage | Correct password returns confirmed; Admin with permission | Correct password | JSON 200 "Confirmed." | JSON 200 "Confirmed." | Passed |

## 3. RoleController (Admin)

*File: app/Http/Controllers/Admin/RoleController.php*

| Test Case ID | Feature / Module | Testing Technique | Preconditions | Test Input | Expected Output | Actual Output | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RC-01 | RoleController / index | Branch Coverage | Unauthorized user gets 403; User without view permission | GET roles list | 403 Forbidden | 403 Forbidden | Passed |
| RC-02 | RoleController / index | Branch Coverage | Scope filter system shows only system roles; System + custom roles exist | scope=system | Only admin, cashier, etc. returned | Only admin, cashier, etc. returned | Passed |
| RC-03 | RoleController / index | Branch Coverage | Scope filter custom shows non-system roles; System + custom roles exist | scope=custom | Only custom roles returned | Only custom roles returned | Passed |
| RC-04 | RoleController / index | Branch Coverage | Scope filter archived shows soft-deleted roles; 1 archived role exists | scope=archived | Only archived roles returned | Only archived roles returned | Passed |
| RC-05 | RoleController / store | Branch Coverage | Unauthorized user gets 403; User without create permission | POST create role | 403 Forbidden | 403 Forbidden | Passed |
| RC-06 | RoleController / store | Validation | Duplicate role name fails validation; Role with same name exists | Duplicate name | Session error on name | Session error on name | Passed |
| RC-07 | RoleController / store | Branch Coverage | Role created with source copies permissions; Source role with permissions exists | Valid name + source_role_id | New role created with same permissions | New role created with same permissions | Passed |
| RC-08 | RoleController / store | Branch Coverage | Role created without source has no permissions; Admin with permission | Valid name, no source_role_id | Role created with 0 permissions | Role created with 0 permissions | Passed |
| RC-09 | RoleController / update | Branch Coverage | Protected admin role cannot be modified; Admin role exists | PUT to admin role | Redirect with error "admin role is protected" | Redirect with error "admin role is protected" | Passed |
| RC-10 | RoleController / archive | Branch Coverage | System role cannot be archived; System role e.g. cashier | DELETE archive system role | Redirect with error "System roles cannot be archived" | Redirect with error "System roles cannot be archived" | Passed |
| RC-11 | RoleController / archive | Branch Coverage | Custom role can be archived; Custom role exists | DELETE archive custom role | Role soft-deleted, redirect back | Role soft-deleted, redirect back | Passed |
| RC-12 | RoleController / restore | Branch Coverage | Archived role can be restored; Soft-deleted role exists | PUT restore | Role restored, redirect back | Role restored, redirect back | Passed |
| RC-13 | RoleController / updatePermissions | Branch Coverage | Unauthorized user gets 403; User without permissions perm | PUT update permissions | 403 Forbidden | 403 Forbidden | Passed |
| RC-14 | RoleController / updatePermissions | Branch Coverage | Only valid permission names are synced; Role + permissions exist | Valid permission names array | Role permissions updated to exact list | Role permissions updated to exact list | Passed |

## 4. ProductController (Admin)

*File: app/Http/Controllers/Admin/ProductController.php*

| Test Case ID | Feature / Module | Testing Technique | Preconditions | Test Input | Expected Output | Actual Output | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PC-01 | ProductController / index | Branch Coverage | Returns all products without filters; Multiple products exist | GET products | All products paginated | All products paginated | Passed |
| PC-02 | ProductController / index | Branch Coverage | Search filter narrows by name; Products with different names | q=Caltex | Only matching products returned | Only matching products returned | Passed |
| PC-03 | ProductController / index | Branch Coverage | Status filter active returns only active; 1 active, 1 inactive product | status=active | Only active products | Only active products | Passed |
| PC-04 | ProductController / index | Branch Coverage | Status filter all returns all; Active + inactive products | status=all | All products returned | All products returned | Passed |
| PC-05 | ProductController / index | Branch Coverage | Type filter narrows by category; Products of different types | type=lpg | Only LPG products | Only LPG products | Passed |
| PC-06 | ProductController / store | Validation | Duplicate SKU fails validation; Product with same SKU exists | Duplicate sku | Session error on sku | Session error on sku | Passed |
| PC-07 | ProductController / store | Validation | Invalid type fails validation; Admin with permission | type=unknown | Session error on type | Session error on type | Passed |
| PC-08 | ProductController / store | Branch Coverage | LPG product extracts kg from size label; Admin, valid supplier | type=lpg, size_label=11kg | Variant created: size_unit=kg, size_value=11 | Variant created: size_unit=kg, size_value=11 | Passed |
| PC-09 | ProductController / store | Branch Coverage | Accessories get default size 1 PC; Admin, valid supplier | type=accessories, no size_label | Variant created: size_value=1, size_unit=PC | Variant created: size_value=1, size_unit=PC | Passed |
| PC-10 | ProductController / store | Branch Coverage | Stove gets default size 1 UNIT; Admin, valid supplier | type=stove, no size_label | Variant created: size_value=1, size_unit=UNIT | Variant created: size_value=1, size_unit=UNIT | Passed |
| PC-11 | ProductController / store | Validation | Comma in price is stripped before validation; Admin, valid supplier | price=1,500 | Product created with price=1500 | Product created with price=1500 | Passed |
| PC-12 | ProductController / archive | Branch Coverage | User without permission gets 403; User without permission | PUT archive product | 403 Forbidden | 403 Forbidden | Passed |
| PC-13 | ProductController / archive | Branch Coverage | Active product is archived; Admin with permission, active product | PUT archive | is_active = false in DB | is_active = false in DB | Passed |
| PC-14 | ProductController / restore | Branch Coverage | Archived product is restored; Admin with permission, archived product | PUT restore | is_active = true in DB | is_active = true in DB | Passed |

## 5. POSController (Cashier)

*File: app/Http/Controllers/Cashier/POSController.php*

| Test Case ID | Feature / Module | Testing Technique | Preconditions | Test Input | Expected Output | Actual Output | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POS-01 | POSController / index | Branch Coverage | User without permission gets 403; User without POS permission | GET POS page | 403 Forbidden | 403 Forbidden | Passed |
| POS-02 | POSController / index | Branch Coverage | Unauthenticated user gets 403; No active session | GET POS page | 403 Forbidden | 403 Forbidden | Passed |
| POS-03 | POSController / index | Branch Coverage | Authorized cashier sees POS page; Cashier with cashier.pos.use | GET POS page | Inertia render with products, customers, vat_settings, discount_settings | Inertia render with products, customers, vat_settings, discount_settings | Passed |
| POS-04 | POSController / store | Branch Coverage | User without cashier.sales.create gets 403; User without permission | POST sale | 403 Forbidden | 403 Forbidden | Passed |
| POS-05 | POSController / store | Validation | Missing customer_id fails validation; Cashier with permission | No customer_id | Session error on customer_id | Session error on customer_id | Passed |
| POS-06 | POSController / store | Validation | Invalid customer_id fails validation; Cashier with permission | customer_id=99999 | Session error on customer_id | Session error on customer_id | Passed |
| POS-07 | POSController / store | Validation | Invalid payment_method fails validation; Cashier with permission | payment_method=bitcoin | Session error on payment_method | Session error on payment_method | Passed |
| POS-08 | POSController / store | Validation | Invalid vat_treatment fails validation; Cashier with permission | vat_treatment=standard | Session error on vat_treatment | Session error on vat_treatment | Passed |
| POS-09 | POSController / store | Validation | Missing vat_inclusive fails validation; Cashier with permission | No vat_inclusive | Session error on vat_inclusive | Session error on vat_inclusive | Passed |
| POS-10 | POSController / store | Validation | Invalid is_delivery fails validation; Cashier with permission | is_delivery=maybe | Session error on is_delivery | Session error on is_delivery | Passed |
| POS-11 | POSController / store | Boundary Validation | Empty lines array fails validation; Cashier with permission | lines=[] | Session error on lines | Session error on lines | Passed |
| POS-12 | POSController / store | Validation | Invalid lines.*.product_id fails validation; Cashier with permission | lines[0].product_id=99999 | Session error on lines.0.product_id | Session error on lines.0.product_id | Passed |
| POS-13 | POSController / store | Boundary Validation | lines.*.qty below min fails validation; Cashier with permission | lines[0].qty=0 | Session error on lines.0.qty | Session error on lines.0.qty | Passed |
| POS-14 | POSController / store | Validation | Invalid lines.*.mode fails validation; Cashier with permission | lines[0].mode=exchange | Session error on lines.0.mode | Session error on lines.0.mode | Passed |
| POS-15 | POSController / store | Validation | Missing lines.*.unit_price fails validation; Cashier with permission | lines[0].unit_price missing | Session error on lines.0.unit_price | Session error on lines.0.unit_price | Passed |
| POS-16 | POSController / store | Boundary Validation | Negative unit_price fails validation; Cashier with permission | lines[0].unit_price=-1 | Session error on lines.0.unit_price | Session error on lines.0.unit_price | Passed |
| POS-17 | POSController / store | Validation | Non-string payment_ref fails validation; Cashier with permission | payment_ref=[] | Session error on payment_ref | Session error on payment_ref | Passed |
| POS-18 | POSController / store | Boundary Validation | Negative vat_rate fails validation; Cashier with permission | vat_rate=-0.5 | Session error on vat_rate | Session error on vat_rate | Passed |
| POS-19 | POSController / store | Boundary Validation | Negative cash_tendered fails validation; Cashier with permission | cash_tendered=-100 | Session error on cash_tendered | Session error on cash_tendered | Passed |
| POS-20 | POSController / store | Boundary Validation | Negative discount_total fails validation; Cashier with permission | discount_total=-50 | Session error on discount_total | Session error on discount_total | Passed |
| POS-21 | POSController / store | Validation | Discount item missing kind fails validation; Cashier with permission | discounts[0].code=PROMO10 | Session error on discounts.0.kind | Session error on discounts.0.kind | Passed |
| POS-22 | POSController / store | Validation | Invalid discounts.*.kind fails validation; Cashier with permission | discounts[0].kind=reward | Session error on discounts.0.kind | Session error on discounts.0.kind | Passed |
| POS-23 | POSController / store | Validation | Invalid discounts.*.discount_type fails validation; Cashier with permission | discounts[0].discount_type=ratio | Session error on discounts.0.discount_type | Session error on discounts.0.discount_type | Passed |
| POS-24 | POSController / store | Boundary Validation | Discount code too long fails validation; Cashier with permission | discounts[0].code=51+ chars | Session error on discounts.0.code | Session error on discounts.0.code | Passed |
| POS-25 | POSController / store | Boundary Validation | Negative discounts.*.value fails validation; Cashier with permission | discounts[0].value=-5 | Session error on discounts.0.value | Session error on discounts.0.value | Passed |
| POS-26 | POSController / store | Validation | Non-integer discounts.*.promo_id fails validation; Cashier with permission | discounts[0].promo_id=abc | Session error on discounts.0.promo_id | Session error on discounts.0.promo_id | Passed |
| POS-27 | POSController / store | Validation | Non-string manager_pin fails validation; Cashier with permission | manager_pin=[] | Session error on manager_pin | Session error on manager_pin | Passed |
| POS-28 | POSController / store | Branch Coverage | InvalidArgumentException returns sale error; Service throws invalid argument | Valid input but service throws | Redirect back with errors.sale = exception message | Redirect back with errors.sale = exception message | Passed |
| POS-29 | POSController / store | Branch Coverage | RuntimeException returns sale error; Service throws runtime error | Valid input but service throws | Redirect back with errors.sale = exception message | Redirect back with errors.sale = exception message | Passed |
| POS-30 | POSController / store | Branch Coverage | Unhandled Throwable returns generic error; Service throws unexpected | Valid input but service fails | Redirect back with errors.sale = generic message | Redirect back with errors.sale = generic message | Passed |
| POS-31 | POSController / store | Branch Coverage | Successful sale redirects with success; Valid customer, product variant, cashier | Complete valid payload | Redirect back with success flash | Redirect back with success flash | Passed |

## 6. SaleController (Cashier)

*File: app/Http/Controllers/Cashier/SaleController.php*

| Test Case ID | Feature / Module | Testing Technique | Preconditions | Test Input | Expected Output | Actual Output | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SC-01 | SaleController / export | Validation | Missing from_date fails validation; Authenticated user | No from_date | Validation error on from_date | Validation error on from_date | Passed |
| SC-02 | SaleController / export | Validation | to_date before from_date fails validation; Authenticated user | to_date earlier than from_date | Validation error on to_date | Validation error on to_date | Passed |
| SC-03 | SaleController / export | Validation | Invalid status_scope fails validation; Authenticated user | status_scope=unknown | Validation error on status_scope | Validation error on status_scope | Passed |
| SC-04 | SaleController / export | Branch Coverage | Format csv triggers CSV export; Valid date range | format=csv | CSV file download response | CSV file download response | Passed |
| SC-05 | SaleController / export | Branch Coverage | Default format triggers XLSX export; Valid date range | No format or format=xlsx | XLSX file download response | XLSX file download response | Passed |
| SC-06 | SaleController / export | Branch Coverage | from/to aliases accepted; Authenticated user | from=2025-01-01&to=2025-01-31 | Valid export produced | Valid export produced | Passed |
| SC-07 | SaleController / receipt | Branch Coverage | Sale with no receipt returns printed_count 0; Sale exists, no receipt | GET receipt for sale | JSON with printed_count = 0 | JSON with printed_count = 0 | Passed |
| SC-08 | SaleController / receipt | Branch Coverage | Sale with receipt returns its receipt_number; Sale with linked receipt | GET receipt | JSON with ref = receipt_number | JSON with ref = receipt_number | Passed |
| SC-09 | SaleController / receipt | Branch Coverage | Sale with no sale_datetime returns null date/time; Sale with null sale_datetime | GET receipt | JSON with date = null, time = null | JSON with date = null, time = null | Passed |
| SC-10 | SaleController / reprint | Branch Coverage | Existing receipt has printed_count incremented; Sale with existing receipt | POST reprint | printed_count incremented by 1 | printed_count incremented by 1 | Passed |
| SC-11 | SaleController / reprint | Branch Coverage | No receipt creates new and increments; Sale with no receipt | POST reprint | New receipt created, printed_count = 1 | New receipt created, printed_count = 1 | Passed |
| SC-12 | SaleController / printReceipt | Branch Coverage | Default format returns Blade view; Sale exists | GET print (no format) | Returns receipts.print Blade view | Returns receipts.print Blade view | Passed |
| SC-13 | SaleController / printReceipt | Branch Coverage | PDF format returns PDF download; Sale exists, DomPDF available | GET print with format=pdf | PDF file download response | PDF file download response | Passed |

## 7. CustomerController (Cashier)

*File: app/Http/Controllers/Cashier/CustomerController.php*

| Test Case ID | Feature / Module | Testing Technique | Preconditions | Test Input | Expected Output | Actual Output | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CC-01 | CustomerController / index | Branch Coverage | User without any view permission gets 403; User without cashier/admin view permission | GET customers | 403 Forbidden | 403 Forbidden | Passed |
| CC-02 | CustomerController / index | Branch Coverage | Cashier with cashier.customers.view can access; Cashier with view permission | GET customers | Inertia render with customers list | Inertia render with customers list | Passed |
| CC-03 | CustomerController / index | Branch Coverage | Admin with admin.customers.view can access; Admin with admin view permission | GET customers | Inertia render with customers list | Inertia render with customers list | Passed |
| CC-04 | CustomerController / store | Branch Coverage | User without create permission gets 403; User without any create permission | POST create customer | 403 Forbidden | 403 Forbidden | Passed |
| CC-05 | CustomerController / store | Validation | Missing name fails validation; User with permission | No name | Session error on name | Session error on name | Passed |
| CC-06 | CustomerController / store | Validation | Invalid customer_type fails validation; User with permission | customer_type=vip | Session error on customer_type | Session error on customer_type | Passed |
| CC-07 | CustomerController / store | Branch Coverage | Valid customer is created; User with permission | Valid name, optional fields | Customer created in DB, redirect with success | Customer created in DB, redirect with success | Passed |
| CC-08 | CustomerController / update | Branch Coverage | User without update permission gets 403; User without permission | PUT update customer | 403 Forbidden | 403 Forbidden | Passed |
| CC-09 | CustomerController / update | Validation | Missing customer_type in update fails; User with permission, customer exists | No customer_type | Session error on customer_type | Session error on customer_type | Passed |
| CC-10 | CustomerController / update | Branch Coverage | Valid update succeeds; User with permission, customer exists | Valid fields | Customer updated, redirect with success | Customer updated, redirect with success | Passed |
| CC-11 | CustomerController / destroy | Branch Coverage | User without delete permission gets 403; User without permission | DELETE customer | 403 Forbidden | 403 Forbidden | Passed |
| CC-12 | CustomerController / destroy | Branch Coverage | Authorized user can delete customer; Cashier with delete permission | DELETE customer | Customer deleted, redirect with success | Customer deleted, redirect with success | Passed |

## 8. StockController (Inventory)

*File: app/Http/Controllers/Inventory/StockController.php*

| Test Case ID | Feature / Module | Testing Technique | Preconditions | Test Input | Expected Output | Actual Output | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| STC-01 | StockController / stockCount | Branch Coverage | User without permission gets 403; User without permission | GET stock counts | 403 Forbidden | 403 Forbidden | Passed |
| STC-02 | StockController / stockCount | Branch Coverage | No location returns empty data; No location in DB | GET stock counts | Inertia page with empty stock_counts.data | Inertia page with empty stock_counts.data | Passed |
| STC-03 | StockController / stockCount | Branch Coverage | Returns counts when location exists; Location + stock data exist | GET stock counts | Inertia page with paginated stock counts | Inertia page with paginated stock counts | Passed |
| STC-04 | StockController / submitCount | Branch Coverage | User without permission gets 403; User without permission | POST submit count | 403 Forbidden | 403 Forbidden | Passed |
| STC-05 | StockController / submitCount | Branch Coverage | Admin cannot submit stock counts; Admin user | POST submit count | Redirect back with error "Admin cannot submit stock counts." | Redirect back with error "Admin cannot submit stock counts." | Passed |
| STC-06 | StockController / submitCount | Validation | Missing filled_qty fails validation; Inventory manager | No filled_qty | Session error on filled_qty | Session error on filled_qty | Passed |
| STC-07 | StockController / submitCount | Boundary Validation | Reason too short fails validation; Inventory manager | reason=AB | Session error on reason | Session error on reason | Passed |
| STC-08 | StockController / submitCount | Branch Coverage | Valid count submission succeeds; Inventory manager, valid InventoryBalance | Valid filled_qty + reason | Redirect back with success | Redirect back with success | Passed |
| STC-09 | StockController / reviewCount | Branch Coverage | Non-admin gets 403; Non-admin user | POST review count | 403 Forbidden | 403 Forbidden | Passed |
| STC-10 | StockController / reviewCount | Validation | Invalid action fails validation; Admin, stock count exists | action=skip | Validation error on action | Validation error on action | Passed |
| STC-11 | StockController / reviewCount | Branch Coverage | Approved count with movement ID redirects to audit; Admin, approvable stock count | action=approve | Redirect to audit page | Redirect to audit page | Passed |
| STC-12 | StockController / reviewCount | Branch Coverage | Rejected count redirects back with success; Admin, stock count exists | action=reject | Redirect back with "Stock count rejected." | Redirect back with "Stock count rejected." | Passed |
| STC-13 | StockController / thresholds | Branch Coverage | No location returns empty thresholds; No location in DB | GET thresholds | Inertia page with empty thresholds | Inertia page with empty thresholds | Passed |
| STC-14 | StockController / thresholds | Branch Coverage | Risk filter critical shows only critical items; Balance with ratio <= 0.5 | risk=critical | Only critical items returned | Only critical items returned | Passed |
| STC-15 | StockController / thresholds | Branch Coverage | Risk filter warning shows only warning items; Balance with warning ratio | risk=warning | Only warning items returned | Only warning items returned | Passed |
| STC-16 | StockController / thresholds | Branch Coverage | Zero reorder level is always ok; Balance with reorder_level=0 | GET thresholds | Item shown with risk_level = ok | Item shown with risk_level = ok | Passed |
| STC-17 | StockController / updateThresholds | Branch Coverage | User without permission gets 403; User without permission | PUT thresholds | 403 Forbidden | 403 Forbidden | Passed |
| STC-18 | StockController / updateThresholds | Branch Coverage | Valid threshold update saves to DB; Admin, inventory balances exist | Valid updates array | reorder_level updated in DB, redirect with success | reorder_level updated in DB, redirect with success | Passed |

## 9. PurchaseController (Inventory)

*File: app/Http/Controllers/Inventory/PurchaseController.php*

| Test Case ID | Feature / Module | Testing Technique | Preconditions | Test Input | Expected Output | Actual Output | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PRC-01 | PurchaseController / store | Branch Coverage | User without permission gets 403; User without permission | POST create purchase | 403 Forbidden | 403 Forbidden | Passed |
| PRC-02 | PurchaseController / store | Validation | Missing product_variant_id fails validation; User with permission | No product_variant_id | Validation error | Validation error | Passed |
| PRC-03 | PurchaseController / store | Validation | Non-existent supplier_id fails validation; User with permission | Invalid supplier_id | Validation error on supplier_id | Validation error on supplier_id | Passed |
| PRC-04 | PurchaseController / store | Boundary Validation | qty below 1 fails validation; User with permission | qty=0 | Validation error on qty | Validation error on qty | Passed |
| PRC-05 | PurchaseController / store | Branch Coverage | PurchaseStatusException redirects with error; Service throws status exception | Valid input | Redirect back with error message | Redirect back with error message | Passed |
| PRC-06 | PurchaseController / store | Branch Coverage | Valid purchase creates and redirects; Valid product variant + supplier | Valid payload | Purchase created in DB, redirect with success | Purchase created in DB, redirect with success | Passed |
| PRC-07 | PurchaseController / approve | Branch Coverage | User without approve permission gets 403; User without permission | POST approve | 403 Forbidden | 403 Forbidden | Passed |
| PRC-08 | PurchaseController / approve | Branch Coverage | User with no role gets 403; User with permission but no role | POST approve | 403 Forbidden | 403 Forbidden | Passed |
| PRC-09 | PurchaseController / reject | Boundary Validation | Reason too short fails validation; User with approve permission | reason=X | Validation error on reason | Validation error on reason | Passed |
| PRC-10 | PurchaseController / markDelivered | Branch Coverage | Non-inventory manager gets 403 JSON; Non-inventory manager | POST mark delivered | JSON 403 "You are not allowed..." | JSON 403 "You are not allowed..." | Passed |
| PRC-11 | PurchaseController / markDelivered | Branch Coverage | Invalid status transition returns 422; Purchase in wrong status | POST mark delivered | JSON 422 with error message | JSON 422 with error message | Passed |
| PRC-12 | PurchaseController / confirm | Branch Coverage | User without confirm permission gets 403; User without permission | POST confirm | 403 Forbidden | 403 Forbidden | Passed |
| PRC-13 | PurchaseController / pay | Branch Coverage | User without accountant.payables.pay gets 403; Non-accountant | POST pay | 403 Forbidden | 403 Forbidden | Passed |
| PRC-14 | PurchaseController / close | Branch Coverage | Non-finance role gets 403; User with no finance role | POST close | 403 Forbidden | 403 Forbidden | Passed |
| PRC-15 | PurchaseController / destroy | Branch Coverage | User without delete permission gets 403; User without permission | DELETE purchase | 403 Forbidden | 403 Forbidden | Passed |
| PRC-16 | PurchaseController / purge | Branch Coverage | No eligible purchases returns info; No purchases exist | POST purge | Redirect back with "No eligible purchases to delete." | Redirect back with "No eligible purchases to delete." | Passed |
| PRC-17 | PurchaseController / purge | Branch Coverage | Successful purge returns count; Purchases exist + user with permission | POST purge | Redirect back with "{n} purchase(s) cleared." | Redirect back with "{n} purchase(s) cleared." | Passed |

## 10. PurchaseRequestController (Inventory)

*File: app/Http/Controllers/Inventory/PurchaseRequestController.php*

| Test Case ID | Feature / Module | Testing Technique | Preconditions | Test Input | Expected Output | Actual Output | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PRQ-01 | PurchaseRequestController / store | Branch Coverage | Unauthorized user is rejected; User without create policy | POST create PR | 403 Forbidden | 403 Forbidden | Passed |
| PRQ-02 | PurchaseRequestController / store | Validation | Missing reason fails validation; Authorized user | No reason | Validation error on reason | Validation error on reason | Passed |
| PRQ-03 | PurchaseRequestController / store | Boundary Validation | Empty items array fails validation; Authorized user | items=[] | Validation error on items | Validation error on items | Passed |
| PRQ-04 | PurchaseRequestController / store | Branch Coverage | Item with zero qty is skipped; Authorized user, valid product | requested_qty=0 | Item not created in DB | Item not created in DB | Passed |
| PRQ-05 | PurchaseRequestController / store | Branch Coverage | Valid request creates PR with generated number; Authorized user, valid product | Valid reason + items | PR created with PR-YYYYMMDD-NNNN format number | PR created with PR-YYYYMMDD-NNNN format number | Passed |
| PRQ-06 | PurchaseRequestController / submit | Branch Coverage | PR with no items returns error; PR with 0 items | POST submit | Redirect back with error "Add at least one item" | Redirect back with error "Add at least one item" | Passed |
| PRQ-07 | PurchaseRequestController / submit | Branch Coverage | Valid PR is marked submitted; PR with items | POST submit | PR status = submitted, redirect with success | PR status = submitted, redirect with success | Passed |
| PRQ-08 | PurchaseRequestController / receive | Branch Coverage | Item not belonging to PR throws error; Different PR item passed | Item from another PR | Validation error "Item does not belong to this purchase request." | Validation error "Item does not belong to this purchase request." | Passed |
| PRQ-09 | PurchaseRequestController / receive | Branch Coverage | Damaged qty exceeding received qty throws error; Valid PR item | damaged_qty > received_qty | Validation error "Damaged quantity cannot exceed received quantity." | Validation error "Damaged quantity cannot exceed received quantity." | Passed |
| PRQ-10 | PurchaseRequestController / receive | Branch Coverage | Received qty exceeding approved qty throws error; PR item with approved_qty set | Total received > approved | Validation error "Received quantity cannot exceed the approved quantity." | Validation error "Received quantity cannot exceed the approved quantity." | Passed |
| PRQ-11 | PurchaseRequestController / receive | Branch Coverage | All items received → fully received status; All PR items fully received | Valid receive payload | PR status = fully_received | PR status = fully_received | Passed |
| PRQ-12 | PurchaseRequestController / receive | Branch Coverage | Partial items → partially received status; Only some items received | Partial receive payload | PR status = partially_received | PR status = partially_received | Passed |
| PRQ-13 | PurchaseRequestController / receive | Branch Coverage | Good cost > 0 creates inventory ledger entry; Valid receive, no damage | received_qty=5, damaged_qty=0 | Ledger entry with account 1200 debit created | Ledger entry with account 1200 debit created | Passed |
| PRQ-14 | PurchaseRequestController / receive | Branch Coverage | Damage cost > 0 creates damage ledger line; Some damaged items | damaged_qty > 0 | Ledger line with account 5200 debit created | Ledger line with account 5200 debit created | Passed |

## 11. RestockRequestController (Inventory)

*File: app/Http/Controllers/Inventory/RestockRequestController.php*

| Test Case ID | Feature / Module | Testing Technique | Preconditions | Test Input | Expected Output | Actual Output | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RRC-01 | RestockRequestController / store | Branch Coverage | User without permission gets 403; User without permission | POST create restock | 403 Forbidden | 403 Forbidden | Passed |
| RRC-02 | RestockRequestController / store | Validation | Missing product_variant_id fails validation; User with permission | No product_variant_id | Validation error | Validation error | Passed |
| RRC-03 | RestockRequestController / store | Boundary Validation | Zero qty fails validation; User with permission | qty=0 | Validation error on qty | Validation error on qty | Passed |
| RRC-04 | RestockRequestController / store | Branch Coverage | No location configured returns error; No location in DB | Valid input | Redirect back with error "No location configured." | Redirect back with error "No location configured." | Passed |
| RRC-05 | RestockRequestController / store | Branch Coverage | Valid request creates restock and redirects; Location exists, user with permission | Valid payload | Restock request created, redirect with success | Restock request created, redirect with success | Passed |
| RRC-06 | RestockRequestController / approve | Branch Coverage | User without update permission gets 403; User without permission | POST approve | 403 Forbidden | 403 Forbidden | Passed |
| RRC-07 | RestockRequestController / approve | Validation | Missing supplier_id fails validation; User with permission | No supplier_id | Validation error on supplier_id | Validation error on supplier_id | Passed |
| RRC-08 | RestockRequestController / reject | Branch Coverage | User without update permission gets 403; User without permission | POST reject | 403 Forbidden | 403 Forbidden | Passed |
| RRC-09 | RestockRequestController / receivePage | Branch Coverage | Non-existent request returns 404; Request not found | GET receive page with bad ID | 404 Not Found | 404 Not Found | Passed |
| RRC-10 | RestockRequestController / receive | Validation | Empty lines array fails validation; User with permission | lines=[] | Validation error on lines | Validation error on lines | Passed |

## 12. PayableController (Accountant)

*File: app/Http/Controllers/Accountant/PayableController.php*

| Test Case ID | Feature / Module | Testing Technique | Preconditions | Test Input | Expected Output | Actual Output | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PAY-01 | PayableController / index | Branch Coverage | Non-accountant gets 403; Non-accountant user | GET payables | 403 Forbidden | 403 Forbidden | Passed |
| PAY-02 | PayableController / index | Branch Coverage | Supplier filter narrows results; Multiple suppliers payables | supplier=1 | Only supplier 1 payables | Only supplier 1 payables | Passed |
| PAY-03 | PayableController / index | Branch Coverage | Status filter unpaid returns only unpaid; Mixed status payables | status=unpaid | Only unpaid payables | Only unpaid payables | Passed |
| PAY-04 | PayableController / show | Branch Coverage | Non-accountant gets 403; Non-accountant | GET payable detail | 403 Forbidden | 403 Forbidden | Passed |
| PAY-05 | PayableController / show | Branch Coverage | JSON request returns JSON response; Accountant, payable exists | GET with Accept: application/json | JSON response with payable data | JSON response with payable data | Passed |
| PAY-06 | PayableController / pay | Branch Coverage | Non-accountant gets 403; Non-accountant | POST pay | 403 Forbidden | 403 Forbidden | Passed |
| PAY-07 | PayableController / pay | Branch Coverage | Already paid payable returns error; Payable with status=paid | POST pay | Redirect back with error "Payable already settled." | Redirect back with error "Payable already settled." | Passed |
| PAY-08 | PayableController / pay | Validation | Amount mismatch throws validation error; Unpaid payable | paid_amount differs by > 0.01 | Validation error "Paid amount must equal payable balance." | Validation error "Paid amount must equal payable balance." | Passed |
| PAY-09 | PayableController / pay | Branch Coverage | Bank/transfer method maps to account 1020; Accountant, unpaid payable | payment_method=bank_transfer | Ledger credit line uses account 1020 | Ledger credit line uses account 1020 | Passed |
| PAY-10 | PayableController / pay | Branch Coverage | Cash method maps to account 1010; Accountant, unpaid payable | payment_method=cash | Ledger credit line uses account 1010 | Ledger credit line uses account 1010 | Passed |
| PAY-11 | PayableController / pay | Branch Coverage | Successful payment marks payable as paid; Unpaid payable, accountant | Valid payment_method + matching amount | status=paid, paid_at set, redirect with success | status=paid, paid_at set, redirect with success | Passed |
| PAY-12 | PayableController / pay | Branch Coverage | Paying RestockRequest source updates its status; Payable linked to RestockRequest | POST pay success | RestockRequest status=paid | RestockRequest status=paid | Passed |
| PAY-13 | PayableController / addNote | Branch Coverage | Non-accountant gets 403; Non-accountant | POST add note | 403 Forbidden | 403 Forbidden | Passed |
| PAY-14 | PayableController / addNote | Boundary Validation | Note too short fails validation; Accountant, payable exists | note=AB | Validation error on note | Validation error on note | Passed |

## 13. RemittanceController (Accountant)

*File: app/Http/Controllers/Accountant/RemittanceController.php*

| Test Case ID | Feature / Module | Testing Technique | Preconditions | Test Input | Expected Output | Actual Output | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REM-01 | RemittanceController / review | Branch Coverage | User without view permission gets 403; User without permission | GET review | 403 Forbidden | 403 Forbidden | Passed |
| REM-02 | RemittanceController / recordCash | Branch Coverage | User without verify permission gets 403; User without permission | POST record cash | 403 Forbidden | 403 Forbidden | Passed |
| REM-03 | RemittanceController / recordCash | Branch Coverage | Already finalized date returns error; DailyClose exists for date | POST with finalized date | Redirect back with error "already finalized" | Redirect back with error "already finalized" | Passed |
| REM-04 | RemittanceController / recordCash | Branch Coverage | Cash variance with no note throws error; Accountant, cash != expected | Cash counted != expected, no note | Redirect back with error "Provide a short note when cash variance is not zero." | Redirect back with error "Provide a short note when cash variance is not zero." | Passed |
| REM-05 | RemittanceController / recordCash | Branch Coverage | Zero variance with no note succeeds; Cash counted = expected | No note provided | Remittance created/updated, redirect with success | Remittance created/updated, redirect with success | Passed |
| REM-06 | RemittanceController / verifyCashlessTransactions | Branch Coverage | Already finalized date returns 422; Finalized date | POST verify cashless | JSON 422 "already finalized" | JSON 422 "already finalized" | Passed |
| REM-07 | RemittanceController / verifyCashlessTransactions | Branch Coverage | Already verified transactions throw error; Some payments already verified | POST with already-verified IDs | JSON 422 "already been verified" | JSON 422 "already been verified" | Passed |
| REM-08 | RemittanceController / dailyClose | Branch Coverage | Already finalized returns 200 with info; DailyClose already exists | POST daily close | JSON 200 "already finalized" + finalized_at | JSON 200 "already finalized" + finalized_at | Passed |
| REM-09 | RemittanceController / dailyClose | Branch Coverage | Pending cashless with no verified IDs throws error; Pending cashless transactions exist | POST, no verified_transaction_ids | JSON 422 "Verify all pending cashless" | JSON 422 "Verify all pending cashless" | Passed |
| REM-10 | RemittanceController / dailyClose | Branch Coverage | Missing transaction IDs throw error; Pending transactions exist | verified_transaction_ids missing some IDs | JSON 422 "All pending...must be verified" | JSON 422 "All pending...must be verified" | Passed |
| REM-11 | RemittanceController / dailyClose | Branch Coverage | Successful close creates DailyClose and audit log; All cashless verified, cash recorded | Valid payload | DailyClose created, audit log remittance.daily.finalized, JSON 200 | DailyClose created, audit log remittance.daily.finalized, JSON 200 | Passed |
| REM-12 | RemittanceController / reopen | Branch Coverage | User without verify permission gets 403; User without permission | POST reopen | 403 Forbidden | 403 Forbidden | Passed |
| REM-13 | RemittanceController / reopen | Branch Coverage | Non-finalized date returns error; No DailyClose for date | POST reopen | 422 / error "not finalized" | 422 / error "not finalized" | Passed |
| REM-14 | RemittanceController / reopen | Branch Coverage | Finalized date is reopened and logged; DailyClose exists | POST reopen | DailyClose deleted, audit log remittance.daily.reopen, success response | DailyClose deleted, audit log remittance.daily.reopen, success response | Passed |
| REM-15 | RemittanceController / stageFromFlags | Branch Coverage | All flags true → finalized; — | finalized=true | Returns finalized | Returns finalized | Passed |
| REM-16 | RemittanceController / stageFromFlags | Branch Coverage | Cash + cashless → ready_to_finalize; — | cash=true, cashless=true, finalized=false | Returns ready_to_finalize | Returns ready_to_finalize | Passed |
| REM-17 | RemittanceController / stageFromFlags | Branch Coverage | Only cashless → cashless_verified; — | cash=false, cashless=true | Returns cashless_verified | Returns cashless_verified | Passed |
| REM-18 | RemittanceController / stageFromFlags | Branch Coverage | Only cash → cash_recorded; — | cash=true, cashless=false | Returns cash_recorded | Returns cash_recorded | Passed |
| REM-19 | RemittanceController / stageFromFlags | Branch Coverage | Neither → draft; — | cash=false, cashless=false, finalized=false | Returns draft | Returns draft | Passed |

## 14. LedgerController (Accountant)

*File: app/Http/Controllers/Accountant/LedgerController.php*

| Test Case ID | Feature / Module | Testing Technique | Preconditions | Test Input | Expected Output | Actual Output | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| LC2-01 | LedgerController / index | Branch Coverage | No filters returns all ledger lines; Ledger entries exist | GET ledger | Inertia page with all lines paginated | Inertia page with all lines paginated | Passed |
| LC2-02 | LedgerController / index | Branch Coverage | Account filter narrows by account code; Multiple account codes | account=1010 | Only account 1010 lines | Only account 1010 lines | Passed |
| LC2-03 | LedgerController / index | Branch Coverage | Cleared filter returns only cleared lines; Mixed cleared/uncleared | cleared=cleared | Only cleared lines | Only cleared lines | Passed |
| LC2-04 | LedgerController / index | Branch Coverage | Uncleared filter returns only uncleared; Mixed cleared/uncleared | cleared=uncleared | Only uncleared lines | Only uncleared lines | Passed |
| LC2-05 | LedgerController / index | Branch Coverage | Date range filter narrows results; Lines on various dates | from=2025-01-01&to=2025-01-31 | Only lines within range | Only lines within range | Passed |
| LC2-06 | LedgerController / referenceLines | Branch Coverage | Returns lines matching reference ID; Lines linked to reference | GET referenceLines/ABC-001 | JSON with lines, totals, balanced flag | JSON with lines, totals, balanced flag | Passed |
| LC2-07 | LedgerController / referenceLines | Branch Coverage | Balanced entry returns balanced = true; Equal debit/credit lines | GET reference with balanced entries | balanced = true | balanced = true | Passed |
| LC2-08 | LedgerController / referenceLines | Branch Coverage | Unbalanced entry returns balanced = false; Unequal debit/credit | GET reference with unbalanced entries | balanced = false | balanced = false | Passed |
| LC2-09 | LedgerController / exportCsv | Branch Coverage | Returns a CSV download; Ledger entries exist | GET export CSV | CSV file download response | CSV file download response | Passed |
| LC2-10 | LedgerController / sortOrderSpec | Branch Coverage | posted_at_asc returns correct order; — | sort=posted_at_asc | Orders by le.entry_date ASC | Orders by le.entry_date ASC | Passed |
| LC2-11 | LedgerController / sortOrderSpec | Branch Coverage | created_at_desc returns correct order; — | sort=created_at_desc | Orders by ledger_lines.created_at DESC | Orders by ledger_lines.created_at DESC | Passed |
| LC2-12 | LedgerController / sortOrderSpec | Branch Coverage | Unknown sort defaults to posted_at_desc; — | sort=unknown | Orders by le.entry_date DESC | Orders by le.entry_date DESC | Passed |

## 15. RiderDeliveryController (Rider)

*File: app/Http/Controllers/Rider/RiderDeliveryController.php*

| Test Case ID | Feature / Module | Testing Technique | Preconditions | Test Input | Expected Output | Actual Output | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RDC-01 | RiderDeliveryController / updateStatus | Branch Coverage | Delivery not assigned to rider gets 403; Delivery assigned to different rider | POST update status | 403 Forbidden "not assigned to you" | 403 Forbidden "not assigned to you" | Passed |
| RDC-02 | RiderDeliveryController / updateStatus | Validation | Invalid status fails validation; Correct rider | status=cancelled | Validation error on status | Validation error on status | Passed |
| RDC-03 | RiderDeliveryController / updateStatus | Branch Coverage | Delivered without proof aborts 422; Correct rider, no proof on file | status=delivered, no proof | 422 "Proof of delivery photo or signature is required." | 422 "Proof of delivery photo or signature is required." | Passed |
| RDC-04 | RiderDeliveryController / updateStatus | Branch Coverage | Delivered with existing proof URL passes; Correct rider, delivery has photo | status=delivered, no new proof | Status updated successfully | Status updated successfully | Passed |
| RDC-05 | RiderDeliveryController / updateStatus | Branch Coverage | in_transit skips proof check; Correct rider | status=in_transit | Status updated without proof required | Status updated without proof required | Passed |
| RDC-06 | RiderDeliveryController / updateStatus | Branch Coverage | Invalid base64 data URL is ignored; Correct rider | proof_photo_data=invalid_string | Image silently ignored, status still updates | Image silently ignored, status still updates | Passed |
| RDC-07 | RiderDeliveryController / updateStatus | Branch Coverage | delivered_items as JSON string is decoded; Correct rider | delivered_items as JSON string | Items parsed and stored correctly | Items parsed and stored correctly | Passed |
| RDC-08 | RiderDeliveryController / updateStatus | Branch Coverage | Item with non-numeric delivered_qty is skipped; Correct rider | Item with delivered_qty=abc | Item skipped from normalized list | Item skipped from normalized list | Passed |
| RDC-09 | RiderDeliveryController / updateStatus | Branch Coverage | No delivered_items falls back to sale items; Delivery linked to sale with items | status=delivered, no delivered_items | Fallback uses sale items as delivered_items | Fallback uses sale items as delivered_items | Passed |
| RDC-10 | RiderDeliveryController / updateNote | Branch Coverage | Delivery not assigned to rider gets 403; Delivery assigned to other rider | POST update note | 403 "not assigned to you" | 403 "not assigned to you" | Passed |
| RDC-11 | RiderDeliveryController / updateNote | Branch Coverage | Valid note is saved; Correct rider, delivery exists | note=Left at the gate | Note updated, redirect with success | Note updated, redirect with success | Passed |

## 16. AuditLogController

*File: app/Http/Controllers/AuditLogController.php*

| Test Case ID | Feature / Module | Testing Technique | Preconditions | Test Input | Expected Output | Actual Output | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ALC-01 | AuditLogController / index | Branch Coverage | User without any audit view permission gets 403; User with no audit permissions | GET audit logs | 403 Forbidden | 403 Forbidden | Passed |
| ALC-02 | AuditLogController / index | Branch Coverage | Admin sees all sectors; Admin user with permission | GET audit logs | Sectors: all, access, people, sales, inventory, finance | Sectors: all, access, people, sales, inventory, finance | Passed |
| ALC-03 | AuditLogController / index | Branch Coverage | Cashier default sector is sales; Cashier with view permission | GET audit logs, no sector | sector = sales applied | sector = sales applied | Passed |
| ALC-04 | AuditLogController / index | Branch Coverage | Accountant default sector is finance; Accountant with permission | GET audit logs, no sector | sector = finance applied | sector = finance applied | Passed |
| ALC-05 | AuditLogController / index | Branch Coverage | Inventory manager default sector is inventory; Inventory manager | GET audit logs | sector = inventory applied | sector = inventory applied | Passed |
| ALC-06 | AuditLogController / index | Branch Coverage | Cashier requesting finance sector gets reset to sales; Cashier with audit view | sector=finance | Sector reset to sales | Sector reset to sales | Passed |
| ALC-07 | AuditLogController / index | Branch Coverage | Sector sales loads sales data; Cashier with permission | sector=sales | Response includes sales data, movements=null, finance=null | Response includes sales data, movements=null, finance=null | Passed |
| ALC-08 | AuditLogController / index | Branch Coverage | Sector inventory loads movements data; Inventory manager | sector=inventory | Response includes movements data, sales=null | Response includes movements data, sales=null | Passed |
| ALC-09 | AuditLogController / index | Branch Coverage | Sector finance loads finance logs; Accountant with permission | sector=finance | Response includes finance data | Response includes finance data | Passed |
| ALC-10 | AuditLogController / index | Branch Coverage | Sector all loads no supplemental data; Admin user | sector=all | sales=null, movements=null, finance=null | sales=null, movements=null, finance=null | Passed |
