# Black Box Test Plan - Pietyl LPG Management System
Generated: 2026-02-24

## Sales Operations System
| Test Case ID | Title | Precondition | Test Steps | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- | --- |
| BB-SOS-001 | Checkout with exact payment | Cart has 2 valid products | 1. Add products<br>2. Enter exact payment<br>3. Click Confirm payment | Sale saved; inventory deducted; receipt generated; shown in sales history | Sale saved; inventory deducted; receipt generated; shown in sales history | Passed |
| BB-SOS-002 | Prevent quantity below 1 | Product quantity is 1 | 1. Click decrease quantity | Quantity remains 1 | Quantity remains 1 | Passed |
| BB-SOS-003 | Block checkout with empty cart | Cart is empty | 1. Leave cart empty<br>2. Attempt to click Confirm payment | Checkout blocked; error message shown | Checkout blocked; error message shown | Passed |
| BB-SOS-004 | Block adding quantity beyond available stock | Product has limited stock | 1. Add item to cart<br>2. Increase quantity beyond stock | Warning shown; quantity does not exceed available stock | Warning shown; quantity does not exceed available stock | Passed |
| BB-SOS-005 | Block cash checkout if amount received is less than total | POS page open with items in cart | 1. Add items to cart<br>2. Select Cash<br>3. Enter amount less than total<br>4. Click Confirm payment | Checkout blocked; error shown requiring amount >= total | Checkout blocked; error shown requiring amount >= total | Passed |
| BB-SOS-006 | Apply valid promo code | Active promo code exists; cart has eligible items | 1. Add items to cart<br>2. Enter promo code<br>3. Apply promo<br>4. Click Confirm payment | Discount applied; total reduced; sale completes | Discount applied; total reduced; sale completes | Passed |
| BB-SOS-007 | Reject invalid or expired promo code | Expired or inactive promo code exists | 1. Add items to cart<br>2. Enter promo code<br>3. Apply promo | Error shown; discount not applied | Error shown; discount not applied | Passed |
| BB-SOS-008 | Prevent duplicate promo or voucher code | Active promo or voucher code exists | 1. Add items to cart<br>2. Apply the same code twice | Second application blocked; code applied once | Second application blocked; code applied once | Passed |
| BB-SOS-009 | Reject mismatched promo or voucher kind | Promo code exists | 1. Attempt to apply promo as voucher (or vice versa) | Error shown; discount not applied | Error shown; discount not applied | Passed |
| BB-SOS-010 | Block promo or voucher at usage limit | Promo or voucher usage limit reached | 1. Add items to cart<br>2. Apply code | Error shown that code reached its limit; discount not applied | Error shown that code reached its limit; discount not applied | Passed |
| BB-SOS-011 | Manual discount requires manager PIN | Manager PIN configured; cart has items | 1. Add manual discount<br>2. Leave manager PIN blank or invalid<br>3. Click Confirm payment | Checkout blocked; message to enter valid manager PIN | Checkout blocked; message to enter valid manager PIN | Passed |
| BB-SOS-012 | Block discounts with empty cart | Cart is empty | 1. Apply any promo, voucher, or manual discount | Error shown; discount not applied | Error shown; discount not applied | Passed |
| BB-SOS-013 | Cashless payment requires reference | Cart has items; payment method is GCash or Card | 1. Select GCash or Card<br>2. Leave reference blank<br>3. Click Confirm payment | Checkout blocked; reference required error shown | Checkout blocked; reference required error shown | Passed |
| BB-SOS-014 | GCash reference must be digits only | Cart has items; payment method is GCash | 1. Enter reference with letters<br>2. Click Confirm payment | Error shown; GCash reference must be digits only | Error shown; GCash reference must be digits only | Passed |
| BB-SOS-015 | Cashless checkout ignores cash tendered | Cart has items; payment method is GCash or Card | 1. Enter any cash tendered amount<br>2. Click Confirm payment | Sale completes; no cash change shown; payment saved with reference | Sale completes; no cash change shown; payment saved with reference | Passed |
| BB-SOS-016 | Sales locked for business date | Sales locked for current business date | 1. Attempt to click Confirm payment | Checkout blocked with sales locked message | Checkout blocked with sales locked message | Passed |
| BB-SOS-017 | Require customer selection before checkout | POS open with items in cart | 1. Leave customer unselected<br>2. Click Confirm payment | Validation error shown; checkout blocked | Validation error shown; checkout blocked | Passed |
| BB-SOS-018 | Receipt reprint from sales history | Completed sale exists | 1. Open Sales history page<br>2. Click Reprint on a sale | Receipt reprint generated and logged | Receipt reprint generated and logged | Passed |
| BB-SOS-019 | Print receipt from sale detail | Completed sale exists | 1. Open Sales history page<br>2. Click View on a sale<br>3. Click Print receipt | Printable receipt opens | Printable receipt opens | Passed |
| BB-SOS-020 | Export sales list | Sales exist within selected date range | 1. Open Sales history page<br>2. Set date range<br>3. Click Export | Export file downloads with filtered sales | Export file downloads with filtered sales | Passed |
| BB-SOS-021 | View latest sale | At least one sale exists | 1. Open Sales history page<br>2. Wait for auto-refresh or click refresh | Most recent sale details displayed | Most recent sale details displayed | Passed |
| BB-SOS-022 | Daily summary finalize | Cashier has sales for business date; summary not finalized | 1. Open Sales history page<br>2. Click Close business date | Business date closed; summary locked for the date | Business date closed; summary locked for the date | Passed |
| BB-SOS-023 | Daily summary reopen | Daily summary finalized | 1. Open Sales history page<br>2. Click Reopen business date | Business date reopens; sales unlocked for the date | Business date reopens; sales unlocked for the date | Passed |
| BB-SOS-024 | VAT treatment selection updates totals | VAT settings configured; cart has items | 1. Switch VAT treatment (vatable, zero-rated, exempt)<br>2. Observe totals | Tax and net amounts update according to selection | Tax and net amounts update according to selection | Passed |
| BB-SOS-025 | Cash checkout with change | Cart has items; cash tendered is greater than total | 1. Add items<br>2. Select Cash<br>3. Enter amount greater than total<br>4. Click Confirm payment | Sale completed; correct change shown on receipt | Sale completed; correct change shown on receipt | Passed |
| BB-SOS-026 | Cash checkout requires amount received | Cart has items; payment method is Cash | 1. Select Cash<br>2. Leave amount empty<br>3. Click Confirm payment | Validation error shown; checkout blocked | Validation error shown; checkout blocked | Passed |
| BB-SOS-027 | Cashless reference too short blocked | Cart has items; payment method is GCash or Card | 1. Enter reference shorter than 4 chars<br>2. Click Confirm payment | Validation error shown; checkout blocked | Validation error shown; checkout blocked | Passed |
| BB-SOS-028 | Discount total capped at subtotal | Cart subtotal lower than discount amount | 1. Apply large manual or promo discount<br>2. Checkout | Discount applied up to subtotal; grand total not negative | Discount applied up to subtotal; grand total not negative | Passed |
| BB-SOS-029 | Manual percent discount capped at 100 | Manager PIN configured; cart has items | 1. Apply manual percent discount >100<br>2. Enter manager PIN<br>3. Checkout | Discount treated as 100%; total not negative | Discount treated as 100%; total not negative | Passed |
| BB-SOS-030 | Apply valid voucher code | Active voucher code exists; cart has eligible items | 1. Add items to cart<br>2. Enter voucher code<br>3. Apply voucher<br>4. Click Confirm payment | Voucher applied; total reduced; sale completes | Voucher applied; total reduced; sale completes | Passed |
| BB-SOS-031 | Invalid item quantity blocked | Cart has items | 1. Set item quantity to 0 or negative<br>2. Click Confirm payment | Validation error shown; checkout blocked | Validation error shown; checkout blocked | Passed |
| BB-SOS-032 | VAT inclusive toggle updates totals | VAT settings configured; cart has items | 1. Toggle VAT inclusive on or off<br>2. Observe totals | Net, tax, and total values recalculate | Net, tax, and total values recalculate | Passed |

## Inventory Stock Management System
| Test Case ID | Title | Precondition | Test Steps | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- | --- |
| BB-ISM-001 | Create product with valid details | Admin on product page | 1. Enter valid name, category, threshold, price<br>2. Click Save | Product saved; appears in catalog | Product saved; appears in catalog | Passed |
| BB-ISM-002 | Stock in with quantity 1 | Product exists | 1. Enter quantity 1<br>2. Submit | Inventory +1; stock in logged | Inventory +1; stock in logged | Passed |
| BB-ISM-003 | Prevent negative stock in | Product exists | 1. Enter negative quantity<br>2. Submit | Input restricted; error shown | Input restricted; error shown | Passed |
| BB-ISM-004 | Approve stock count with variance | Product with known quantity | 1. Submit different count<br>2. Admin approves<br>3. Check movements | Status approved; inventory updated; adjustment logged | Status approved; inventory updated; adjustment logged | Passed |
| BB-ISM-005 | Archive active product | Product active in catalog | 1. Click Archive | Hidden from cashier; visible in reports | Hidden from cashier; visible in reports | Passed |
| BB-ISM-006 | Search stock counts | Stock counts list has multiple products | 1. Enter search term<br>2. Apply filter | List shows matching products only | List shows matching products only | Passed |
| BB-ISM-007 | Submit stock count requires reason | Inventory item ready for count | 1. Enter filled quantity<br>2. Leave reason blank<br>3. Submit | Submission blocked; reason required | Submission blocked; reason required | Passed |
| BB-ISM-008 | Admin cannot submit stock count | Logged in as admin; stock count pending | 1. Attempt to submit stock count | Action blocked with message | Action blocked with message | Passed |
| BB-ISM-009 | Approve stock count updates inventory | Stock count submitted | 1. Admin reviews<br>2. Approve | Inventory balance updated; adjustment logged | Inventory balance updated; adjustment logged | Passed |
| BB-ISM-010 | Reject stock count does not change inventory | Stock count submitted | 1. Admin rejects | Inventory unchanged; rejection recorded | Inventory unchanged; rejection recorded | Passed |
| BB-ISM-011 | View low stock list | Products below reorder level exist | 1. Open Low stock page | Low stock items displayed with risk level | Low stock items displayed with risk level | Passed |
| BB-ISM-012 | Update reorder thresholds | Inventory thresholds page open | 1. Change reorder level<br>2. Save | Thresholds updated; risk recalculated | Thresholds updated; risk recalculated | Passed |
| BB-ISM-013 | Export inventory report | Inventory data exists | 1. Click Export Inventory | XLSX download with balances and recent movements | XLSX download with balances and recent movements | Passed |
| BB-ISM-014 | Create purchase request with valid items | Inventory manager on purchase requests page; supplier exists | 1. Open Purchases page<br>2. Click Request Restock<br>3. Add items and quantities<br>4. Save request | Request created in Draft | Request created in Draft | Passed |
| BB-ISM-015 | Update draft purchase request | Draft request exists | 1. Edit quantities<br>2. Save | Changes saved | Changes saved | Passed |
| BB-ISM-016 | Submit purchase request for approval | Draft request exists | 1. Click Submit | Status changes to Submitted; visible to admin | Status changes to Submitted; visible to admin | Passed |
| BB-ISM-017 | Receive items for approved request | Approved request exists | 1. Open Receive page<br>2. Enter received quantities<br>3. Submit | Stock increased; receiving logged | Stock increased; receiving logged | Passed |
| BB-ISM-018 | Create purchase order | Supplier exists; user has permission | 1. Create purchase with items and cost<br>2. Save | Purchase order created | Purchase order created | Passed |
| BB-ISM-019 | Approve purchase order | Purchase pending approval | 1. Click Approve | Status approved; available for confirmation | Status approved; available for confirmation | Passed |
| BB-ISM-020 | Reject purchase order | Purchase pending approval | 1. Click Reject | Status rejected; no stock changes | Status rejected; no stock changes | Passed |
| BB-ISM-021 | Mark purchase delivered | Approved purchase; delivery arrived | 1. Click Delivered | Status updated to Delivered | Status updated to Delivered | Passed |
| BB-ISM-022 | Confirm purchase | Delivered purchase exists | 1. Click Confirm | Purchase confirmed; payable generated | Purchase confirmed; payable generated | Passed |
| BB-ISM-023 | Complete purchase | Confirmed purchase with items received | 1. Click Complete | Purchase closed; stock finalized | Purchase closed; stock finalized | Passed |
| BB-ISM-024 | Delete purchase order | Draft purchase exists | 1. Delete purchase | Purchase removed | Purchase removed | Passed |
| BB-ISM-025 | Purge purchases | Multiple old purchases exist; user has purge permission | 1. Click Purge | Purchases cleared; confirmation shown | Purchases cleared; confirmation shown | Passed |
| BB-ISM-026 | Inventory export blocked when no location | No inventory location configured | 1. Click Export Inventory | Error shown; no file downloaded | Error shown; no file downloaded | Passed |
| BB-ISM-027 | View supplier details from inventory | Supplier exists | 1. Open Suppliers<br>2. View details | Supplier information displayed | Supplier information displayed | Passed |
| BB-ISM-028 | Low stock filter by risk level | Items exist with critical and warning risk | 1. Open Low Stock page<br>2. Filter by risk level | List shows only items matching selected risk | List shows only items matching selected risk | Passed |
| BB-ISM-029 | Thresholds search by SKU or name | Multiple products exist | 1. Open Thresholds page<br>2. Search by SKU or product name | List filtered to matches | List filtered to matches | Passed |
| BB-ISM-030 | Stock counts filter by status | Stock counts exist in multiple statuses | 1. Open Stock Counts<br>2. Filter by status | Only counts with selected status shown | Only counts with selected status shown | Passed |
| BB-ISM-031 | Stock counts empty when no location | No inventory location configured | 1. Open Stock Counts page | Empty list displayed; no error | Empty list displayed; no error | Passed |
| BB-ISM-032 | Purchase request submit without items blocked | Purchase request form open | 1. Submit request with no items | Validation error shown; request not saved | Validation error shown; request not saved | Passed |
| BB-ISM-033 | Admin approves purchase request | Submitted purchase request exists | 1. Open Low stock page<br>2. Click Approve on a request | Status changes to Approved | Status changes to Approved | Passed |
| BB-ISM-034 | Admin rejects purchase request | Submitted purchase request exists | 1. Open Low stock page<br>2. Click Decline on a request | Status changes to Rejected | Status changes to Rejected | Passed |
| BB-ISM-035 | Receive purchase with discrepancy | Approved purchase exists; received qty differs | 1. Receive items with mismatched quantities<br>2. Save discrepancy | Discrepancy recorded; status updated | Discrepancy recorded; status updated | Passed |

## Delivery Logistics Management System
| Test Case ID | Title | Precondition | Test Steps | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- | --- |
| BB-DLM-001 | Generate delivery order when enabled | Sale ready for confirmation | 1. Add items<br>2. Enable delivery<br>3. Confirm sale | Delivery order created; appears in rider list | Delivery order created; appears in rider list | Passed |
| BB-DLM-002 | No delivery order when disabled | Sale ready for confirmation | 1. Add items<br>2. Disable delivery<br>3. Confirm sale | No delivery order created; no rider list entry | No delivery order created; no rider list entry | Passed |
| BB-DLM-003 | Filter rider history same date | Rider history has records | 1. Set same start and end date<br>2. Apply filter | Shows deliveries for that day only | Shows deliveries for that day only | Passed |
| BB-DLM-004 | Update rider status | Delivery status is Pending | 1. Change to On the way<br>2. Save<br>3. Refresh | Status updated; remains after refresh | Status updated; remains after refresh | Passed |
| BB-DLM-005 | Require signature or reason | Delivery assigned to rider | 1. Mark as Failed or Finished<br>2. Leave required field blank<br>3. Submit | Submission blocked; prompt displayed | Submission blocked; prompt displayed | Passed |
| BB-DLM-006 | Delivery details created from sale | Sale marked for delivery | 1. Confirm sale<br>2. Open rider list | Delivery includes customer, address, and items | Delivery includes customer, address, and items | Passed |
| BB-DLM-007 | Rider cannot update delivery not assigned | Delivery assigned to another rider | 1. Attempt to change status | Action blocked or forbidden | Action blocked or forbidden | Passed |
| BB-DLM-008 | Invalid delivery status blocked | Delivery assigned to rider | 1. Submit invalid status | Error shown; status unchanged | Error shown; status unchanged | Passed |
| BB-DLM-009 | Update status to On the way | Delivery pending | 1. Change status to On the way<br>2. Save<br>3. Refresh | Status becomes In Transit | Status becomes In Transit | Passed |
| BB-DLM-010 | Delivered status with proof | Delivery assigned; proof available | 1. Set status to Delivered<br>2. Attach proof<br>3. Submit | Status Delivered; completion time saved | Status Delivered; completion time saved | Passed |
| BB-DLM-011 | Add rider note | Delivery assigned | 1. Add note<br>2. Save<br>3. Refresh | Note persists | Note persists | Passed |
| BB-DLM-012 | Filter deliveries by status or search | Multiple deliveries exist | 1. Use search term<br>2. Filter by status | List filtered accordingly | List filtered accordingly | Passed |
| BB-DLM-013 | History date range filter | Delivery history across dates | 1. Set start and end date<br>2. Apply filter | Shows deliveries within range | Shows deliveries within range | Passed |
| BB-DLM-014 | Failed delivery requires reason | Delivery assigned | 1. Mark as Failed<br>2. Leave reason blank<br>3. Submit | Submission blocked; reason required | Submission blocked; reason required | Passed |
| BB-DLM-015 | Invalid status transition blocked | Delivery already Delivered | 1. Attempt to change status to Pending | Error shown; status unchanged | Error shown; status unchanged | Passed |
| BB-DLM-016 | Delivered requires proof | Delivery assigned; proof required | 1. Set status to Delivered without proof<br>2. Submit | Submission blocked; proof required | Submission blocked; proof required | Passed |
| BB-DLM-017 | Inventory deducted on delivery completion | Delivery with items; inventory quantities known | 1. Mark delivery as Delivered with proof<br>2. Refresh inventory | Inventory reduced by delivered quantities | Inventory reduced by delivered quantities | Passed |
| BB-DLM-018 | Rider note length limit enforced | Delivery assigned to rider | 1. Enter note longer than allowed<br>2. Save | Validation error; note not saved | Validation error; note not saved | Passed |
| BB-DLM-019 | Search deliveries by customer or address | Multiple deliveries exist | 1. Search by customer name or address | List filtered to matches | List filtered to matches | Passed |
| BB-DLM-020 | Filter deliveries by In Transit status | Deliveries exist in multiple statuses | 1. Filter by status In Transit | Only in transit deliveries shown | Only in transit deliveries shown | Passed |

## Financial Accounting System
| Test Case ID | Title | Precondition | Test Steps | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- | --- |
| BB-FAS-001 | Generate revenue summary | Sales exist in range | 1. Select valid date range<br>2. Click Generate | Totals match sales history | Totals match sales history | Passed |
| BB-FAS-002 | Export single day report | Data exists for selected day | 1. Set same start and end date<br>2. Click Export | Export successful; file contains single day data | Export successful; file contains single day data | Passed |
| BB-FAS-003 | Block cash turnover save when variance has no note | Turnover Review available for a business date | 1. Open Cashier Turnover page<br>2. Click Review on a cashier row<br>3. Enter a cash count that differs from expected<br>4. Leave the note blank<br>5. Click Save turnover | Save blocked; no record created | Save blocked; no record created | Passed |
| BB-FAS-004 | Record valid remittance | On remittance page | 1. Open Cashier Turnover page<br>2. Click Review on a cashier row<br>3. Enter valid cash count and note<br>4. Click Save turnover | Remittance saved; appears in list and ledger | Remittance saved; appears in list and ledger | Passed |
| BB-FAS-005 | Prevent excess remittance | Daily cash available | 1. Open Cashier Turnover page<br>2. Click Review on a cashier row<br>3. Enter amount greater than expected cash<br>4. Click Save turnover | Save blocked; no ledger inconsistency | Save blocked; no ledger inconsistency | Passed |
| BB-FAS-006 | Remittance review shows expected totals | Sales and payments exist for date | 1. Open Cashier Turnover page<br>2. Click Review on a cashier row | Expected cash and cashless totals displayed | Expected cash and cashless totals displayed | Passed |
| BB-FAS-007 | Block recording cash on finalized date | Daily close already finalized for date | 1. Open Cashier Turnover page<br>2. Click Review on a finalized date<br>3. Attempt to save cash turnover | Error shown; no record saved | Error shown; no record saved | Passed |
| BB-FAS-008 | Verify cashless transactions | Pending cashless transactions exist | 1. Open Cashier Turnover page<br>2. Click Verify cashless<br>3. Select transactions<br>4. Click Verify | Transactions marked verified | Transactions marked verified | Passed |
| BB-FAS-009 | Block verifying already verified transactions | Transactions already verified | 1. Open Cashier Turnover page<br>2. Click Verify cashless<br>3. Select already verified transactions<br>4. Click Verify | Error shown; status unchanged | Error shown; status unchanged | Passed |
| BB-FAS-010 | Daily close requires all cashless verified | Pending cashless transactions exist | 1. Open Cashier Turnover page<br>2. Click Review<br>3. Attempt Daily Close without verifying all cashless | Blocked; message to verify all pending cashless | Blocked; message to verify all pending cashless | Passed |
| BB-FAS-011 | Reopen finalized business date | Daily close finalized | 1. Open Cashier Turnover page<br>2. Click Reopen on a finalized row | Date reopened; status resets | Date reopened; status resets | Passed |
| BB-FAS-012 | Ledger filter by account | Ledger entries exist | 1. Filter by account code | Only entries for account shown | Only entries for account shown | Passed |
| BB-FAS-013 | Ledger filter by date range | Entries across dates | 1. Set date range<br>2. Apply filter | Only entries within range | Only entries within range | Passed |
| BB-FAS-014 | Export ledger CSV | Ledger entries exist | 1. Click Export CSV | CSV downloaded | CSV downloaded | Passed |
| BB-FAS-015 | Export ledger PDF | Ledger entries exist | 1. Click Export PDF | PDF downloaded | PDF downloaded | Passed |
| BB-FAS-016 | Pay payable with exact amount | Unpaid payable exists | 1. Enter exact amount<br>2. Select payment method<br>3. Pay | Payable marked paid; ledger updated | Payable marked paid; ledger updated | Passed |
| BB-FAS-017 | Block payable payment amount mismatch | Unpaid payable exists | 1. Enter amount not equal to payable<br>2. Pay | Error shown; payable not paid | Error shown; payable not paid | Passed |
| BB-FAS-018 | Add note to payable | Payable exists | 1. Add note<br>2. Save | Note saved and displayed | Note saved and displayed | Passed |
| BB-FAS-019 | Export supplier purchases | Supplier purchases exist | 1. Click Export | Export file downloaded | Export file downloaded | Passed |
| BB-FAS-020 | Accountant sales export | Sales exist | 1. Open Accountant Sales<br>2. Click Export | Export file downloaded with filters applied | Export file downloaded with filters applied | Passed |
| BB-FAS-021 | Cost tracking view | User has permission | 1. Open Cost Tracking | Cost tracking page loads data | Cost tracking page loads data | Passed |
| BB-FAS-022 | Payroll page accessible | User has payroll permission | 1. Open Payroll page | Page loads without error | Page loads without error | Passed |
| BB-FAS-023 | Reports export with date range | Report data exists | 1. Set date range<br>2. Export report | Report file downloaded | Report file downloaded | Passed |
| BB-FAS-024 | Cash variance requires note on remittance | Remittance review open; cash count differs from expected | 1. Enter cash count different from expected<br>2. Leave note blank<br>3. Save cash record | Save blocked; note required | Save blocked; note required | Passed |
| BB-FAS-025 | Daily close finalizes business date | Cash recorded and cashless verified for date | 1. Click Daily Close | Date finalized; further edits blocked | Date finalized; further edits blocked | Passed |
| BB-FAS-026 | Reopen non-finalized date blocked | Date not finalized | 1. Click Reopen | Error shown; status unchanged | Error shown; status unchanged | Passed |
| BB-FAS-027 | Payable already paid cannot be paid again | Payable status is Paid | 1. Attempt to pay again | Error shown; payable remains paid | Error shown; payable remains paid | Passed |
| BB-FAS-028 | Ledger reference detail view | Ledger reference exists | 1. Open ledger reference detail | Lines and totals displayed | Lines and totals displayed | Passed |
| BB-FAS-029 | Ledger export respects filters | Ledger entries across accounts or dates | 1. Apply account or date filter<br>2. Export CSV | Export contains only filtered entries | Export contains only filtered entries | Passed |

## System Administration Governance System
| Test Case ID | Title | Precondition | Test Steps | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- | --- |
| BB-SAG-001 | Create user with valid details | Admin on user management page | 1. Click Add User<br>2. Enter valid details<br>3. Click Save | User saved; appears in list | User saved; appears in list | Passed |
| BB-SAG-002 | Prevent duplicate email | Email already exists | 1. Enter existing email<br>2. Click Save | Duplicate email error shown; user not saved | Duplicate email error shown; user not saved | Passed |
| BB-SAG-003 | Search audit logs empty term | On audit logs page | 1. Leave search blank<br>2. Click Search | Latest logs displayed; no error | Latest logs displayed; no error | Passed |
| BB-SAG-004 | View audit log details | Audit log entry exists | 1. Select log<br>2. Click View Details | Full activity details displayed | Full activity details displayed | Passed |
| BB-SAG-005 | Export audit logs for current filtered tab | User can access Audit Logs page | 1. Open Audit Logs<br>2. Apply any filter or tab<br>3. Click Export | XLSX export downloads and contains only the current filtered view | XLSX export downloads and contains only the current filtered view | Passed |
| BB-SAG-006 | Login redirects by role | Valid users exist for each role | 1. Login as admin, cashier, accountant, rider, and inventory manager | Redirects to the correct dashboard per role | Redirects to the correct dashboard per role | Passed |
| BB-SAG-007 | Login with invalid credentials | User exists | 1. Enter wrong password<br>2. Login | Error message shown; login blocked | Error message shown; login blocked | Passed |
| BB-SAG-008 | Logout | User logged in | 1. Click Logout | Session ended; redirected to login or landing | Session ended; redirected to login or landing | Passed |
| BB-SAG-009 | Create employee | Admin on employee page | 1. Add employee details<br>2. Save | Employee saved and listed | Employee saved and listed | Passed |
| BB-SAG-010 | Update employee | Employee exists | 1. Edit employee<br>2. Save | Changes saved | Changes saved | Passed |
| BB-SAG-011 | Link user to employee | Employee and user exist | 1. Link user to employee | Employee shows linked user | Employee shows linked user | Passed |
| BB-SAG-012 | Unlink user from employee | Employee linked to user | 1. Unlink user | Link removed | Link removed | Passed |
| BB-SAG-013 | Create role with permissions | Admin on roles page | 1. Add role<br>2. Select permissions<br>3. Save | Role created with permissions | Role created with permissions | Passed |
| BB-SAG-014 | Update role permissions | Role exists | 1. Edit permissions<br>2. Save | Permissions updated | Permissions updated | Passed |
| BB-SAG-015 | Archive custom role | Custom role exists | 1. Archive role | Role removed from active list | Role removed from active list | Passed |
| BB-SAG-016 | Restore archived role | Archived role exists | 1. Restore role | Role active again | Role active again | Passed |
| BB-SAG-017 | Prevent archive of system role | System role exists | 1. Attempt to archive system role | Action blocked with error | Action blocked with error | Passed |
| BB-SAG-018 | Create supplier | Admin on suppliers page | 1. Add supplier details<br>2. Save | Supplier saved | Supplier saved | Passed |
| BB-SAG-019 | Update supplier | Supplier exists | 1. Edit supplier<br>2. Save | Supplier updated | Supplier updated | Passed |
| BB-SAG-020 | Archive supplier | Supplier active | 1. Archive supplier | Supplier hidden from active lists | Supplier hidden from active lists | Passed |
| BB-SAG-021 | Restore supplier | Supplier archived | 1. Restore supplier | Supplier active again | Supplier active again | Passed |
| BB-SAG-022 | Create product with unique SKU | Admin on products page | 1. Enter product with new SKU<br>2. Save | Product saved | Product saved | Passed |
| BB-SAG-023 | Prevent duplicate SKU | Product with SKU exists | 1. Create product with same SKU | Validation error shown | Validation error shown | Passed |
| BB-SAG-024 | Update product details and price | Product exists | 1. Edit product details<br>2. Save | Product updated | Product updated | Passed |
| BB-SAG-025 | Restore archived product | Product archived | 1. Restore product | Product active again | Product active again | Passed |
| BB-SAG-026 | Create promo or voucher | Admin on promos page | 1. Enter code, type, dates, and value<br>2. Save | Promo or voucher created | Promo or voucher created | Passed |
| BB-SAG-027 | Discontinue promo or voucher | Promo active | 1. Discontinue promo | Promo inactive and cannot be applied in POS | Promo inactive and cannot be applied in POS | Passed |
| BB-SAG-028 | Restore promo or voucher | Promo discontinued | 1. Restore promo | Promo active again | Promo active again | Passed |
| BB-SAG-029 | Update manager PIN | Admin on promos settings | 1. Enter new manager PIN<br>2. Save | PIN updated; required for manual discounts | PIN updated; required for manual discounts | Passed |
| BB-SAG-030 | Update VAT settings | Admin on VAT settings page | 1. Change VAT rate or options<br>2. Save | Settings saved and reflected in POS | Settings saved and reflected in POS | Passed |
| BB-SAG-031 | Block invalid VAT rate | Admin on VAT settings page | 1. Enter invalid or negative VAT rate<br>2. Save | Validation error; settings not saved | Validation error; settings not saved | Passed |
| BB-SAG-032 | Audit logs filter by sector | Audit logs exist in multiple sectors | 1. Select sector filter<br>2. Apply | Logs show only selected sector | Logs show only selected sector | Passed |
| BB-SAG-033 | Export admin reports | Report data exists | 1. Set date range<br>2. Export | Report file downloaded | Report file downloaded | Passed |
| BB-SAG-034 | Create customer | User on customers page | 1. Add customer details<br>2. Save | Customer saved | Customer saved | Passed |
| BB-SAG-035 | Update customer | Customer exists | 1. Edit customer details<br>2. Save | Customer updated | Customer updated | Passed |
| BB-SAG-036 | Delete customer | Customer exists | 1. Delete customer | Customer removed from list | Customer removed from list | Passed |
| BB-SAG-037 | Reset user password with correct admin password | Admin on users page; user exists | 1. Click Reset Password<br>2. Enter correct admin password<br>3. Confirm | Password reset succeeds | Password reset succeeds | Passed |
| BB-SAG-038 | Block password reset with wrong admin password | Admin on users page; user exists | 1. Click Reset Password<br>2. Enter wrong admin password<br>3. Confirm | Error shown; password unchanged | Error shown; password unchanged | Passed |
| BB-SAG-039 | Users list search and status filter | Multiple users exist | 1. Search by name or email<br>2. Filter by status | List filtered correctly | List filtered correctly | Passed |
| BB-SAG-040 | Roles list filter by scope | System and custom roles exist | 1. Switch scope filter (system, custom, archived) | List updates to match scope | List updates to match scope | Passed |
| BB-SAG-041 | Supplier details view | Supplier exists | 1. Open supplier details | Supplier detail view displayed | Supplier detail view displayed | Passed |
| BB-SAG-042 | Admin password confirmation success | Admin user logged in | 1. Enter correct admin password in confirmation dialog | Confirmation succeeds; action can proceed | Confirmation succeeds; action can proceed | Passed |
| BB-SAG-043 | Admin password confirmation failure | Admin user logged in | 1. Enter incorrect admin password | Error shown; action blocked | Error shown; action blocked | Passed |
| BB-SAG-044 | Update promo or voucher details | Promo or voucher exists | 1. Edit promo details<br>2. Save | Promo updated | Promo updated | Passed |
| BB-SAG-045 | Prevent duplicate promo or voucher code | Promo code already exists | 1. Create new promo with duplicate code | Validation error shown | Validation error shown | Passed |
| BB-SAG-046 | Admin reports page loads | Admin has report access | 1. Open Admin Reports page | Report filters and list load | Report filters and list load | Passed |
| BB-SAG-047 | Admin purchases list loads | Purchases exist | 1. Open Admin Purchases page | Purchases list displayed | Purchases list displayed | Passed |
| BB-SAG-048 | Admin approve purchase request | Purchase request submitted | 1. Open request<br>2. Approve | Request status approved | Request status approved | Passed |
| BB-SAG-049 | Admin reject purchase request | Purchase request submitted | 1. Open request<br>2. Reject | Request status rejected | Request status rejected | Passed |

## System Utilities and Notifications
| Test Case ID | Title | Precondition | Test Steps | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- | --- |
| BB-SYS-001 | Notifications list loads | Logged in user has notifications | 1. Open Notifications | Notifications list displayed | Notifications list displayed | Passed |
| BB-SYS-002 | Unread notifications count | User has unread notifications | 1. View notifications badge or list | Unread count matches actual unread items | Unread count matches actual unread items | Passed |
| BB-SYS-003 | Mark notification as read | Unread notification exists | 1. Open notification<br>2. Mark as read | Notification marked read; unread count decreases | Notification marked read; unread count decreases | Passed |
| BB-SYS-004 | Mark all notifications as read | Multiple unread notifications | 1. Click Mark all read | All notifications marked read; unread count is zero | All notifications marked read; unread count is zero | Passed |
| BB-SYS-005 | Delete notification | Notification exists | 1. Delete notification | Notification removed from list | Notification removed from list | Passed |
| BB-SYS-006 | API ping health check | API accessible | 1. Send GET request to /api/ping | JSON response contains ok=true | JSON response contains ok=true | Passed |
| BB-SYS-007 | API /me requires authentication | User not logged in | 1. Send GET request to /api/me | Request blocked or unauthorized | Request blocked or unauthorized | Passed |
| BB-SYS-008 | API /me returns user when authenticated | User logged in | 1. Send GET request to /api/me | Response shows authenticated=true and user data | Response shows authenticated=true and user data | Passed |
| BB-SYS-009 | Unread notifications limited to 10 | User has more than 10 unread notifications | 1. Open unread notifications list | Only 10 unread notifications displayed | Only 10 unread notifications displayed | Passed |
| BB-SYS-010 | View notification not owned blocked | Notification belongs to another user | 1. Attempt to open notification by ID | Error shown; access denied | Error shown; access denied | Passed |
| BB-SYS-011 | Mark notification not owned blocked | Notification belongs to another user | 1. Attempt to mark as read | Error shown; access denied | Error shown; access denied | Passed |
| BB-SYS-012 | Delete notification not owned blocked | Notification belongs to another user | 1. Attempt to delete notification | Error shown; access denied | Error shown; access denied | Passed |



## Coverage Mapping (Routes and UI)
| Test Case ID | Route / Controller | UI Page / Component |
| --- | --- | --- |
| BB-SOS-001 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-SOS-002 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-SOS-003 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-SOS-004 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-SOS-005 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-SOS-006 | POST /dashboard/cashier/discounts/validate (Cashier\DiscountController@validateCode) | CashierPage/POS.jsx |
| BB-SOS-007 | POST /dashboard/cashier/discounts/validate (Cashier\DiscountController@validateCode) | CashierPage/POS.jsx |
| BB-SOS-008 | POST /dashboard/cashier/discounts/validate (Cashier\DiscountController@validateCode) | CashierPage/POS.jsx |
| BB-SOS-009 | POST /dashboard/cashier/discounts/validate (Cashier\DiscountController@validateCode) | CashierPage/POS.jsx |
| BB-SOS-010 | POST /dashboard/cashier/discounts/validate (Cashier\DiscountController@validateCode) | CashierPage/POS.jsx |
| BB-SOS-011 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-SOS-012 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-SOS-013 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-SOS-014 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-SOS-015 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-SOS-016 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-SOS-017 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-SOS-018 | POST /dashboard/cashier/sales/{sale}/receipt/reprint (Cashier\SaleController@reprint) | CashierPage/Sales.jsx |
| BB-SOS-019 | GET /dashboard/cashier/sales/{sale}/receipt/print (Cashier\SaleController@printReceipt) | CashierPage/Sales.jsx |
| BB-SOS-020 | GET /dashboard/cashier/sales/export (Cashier\SaleController@export) | CashierPage/Sales.jsx |
| BB-SOS-021 | GET /dashboard/cashier/sales/latest (Cashier\SaleController@latest) | CashierPage/Sales.jsx |
| BB-SOS-022 | POST /dashboard/cashier/sales/summary/finalize (Cashier\DailySummaryController@finalize) | CashierPage/Sales.jsx |
| BB-SOS-023 | POST /dashboard/cashier/sales/summary/reopen (Cashier\DailySummaryController@reopen) | CashierPage/Sales.jsx |
| BB-SOS-024 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-SOS-025 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-SOS-026 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-SOS-027 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-SOS-028 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-SOS-029 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-SOS-030 | POST /dashboard/cashier/discounts/validate (Cashier\DiscountController@validateCode) | CashierPage/POS.jsx |
| BB-SOS-031 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-SOS-032 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-ISM-001 | POST /dashboard/admin/products (Admin\ProductController@store) | AdminPage/Products.jsx |
| BB-ISM-002 | GET /dashboard/inventory (Inventory\StockController@stockCount) | InventoryPage/StockCounts.jsx |
| BB-ISM-003 | GET /dashboard/inventory (Inventory\StockController@stockCount) | InventoryPage/StockCounts.jsx |
| BB-ISM-004 | POST /dashboard/inventory/counts/{stockCount}/review (Inventory\StockController@reviewCount) | InventoryPage/StockCounts.jsx |
| BB-ISM-005 | POST /dashboard/admin/products/{product}/archive (Admin\ProductController@archive) | AdminPage/Products.jsx |
| BB-ISM-006 | GET /dashboard/inventory/counts (Inventory\StockController@stockCount) | InventoryPage/StockCounts.jsx |
| BB-ISM-007 | POST /dashboard/inventory/counts/{inventoryBalance}/submit (Inventory\StockController@submitCount) | InventoryPage/StockCounts.jsx |
| BB-ISM-008 | POST /dashboard/inventory/counts/{inventoryBalance}/submit (Inventory\StockController@submitCount) | InventoryPage/StockCounts.jsx |
| BB-ISM-009 | POST /dashboard/inventory/counts/{stockCount}/review (Inventory\StockController@reviewCount) | InventoryPage/StockCounts.jsx |
| BB-ISM-010 | POST /dashboard/inventory/counts/{stockCount}/review (Inventory\StockController@reviewCount) | InventoryPage/StockCounts.jsx |
| BB-ISM-011 | GET /dashboard/inventory/order-stocks (Inventory\StockController@lowStock) | InventoryPage/Lowstock.jsx |
| BB-ISM-012 | POST /dashboard/admin/inventory/thresholds (Inventory\StockController@updateThresholds) | InventoryPage/Thresholds.jsx |
| BB-ISM-013 | GET /dashboard/inventory/export (Inventory\StockController@exportInventoryReport) | InventoryPage/Thresholds.jsx |
| BB-ISM-014 | POST /dashboard/inventory/purchase-requests (Inventory\PurchaseRequestController@store) | InventoryPage/Purchases.jsx |
| BB-ISM-015 | PUT /dashboard/inventory/purchase-requests/{purchaseRequest} (Inventory\PurchaseRequestController@update) | InventoryPage/Purchases.jsx |
| BB-ISM-016 | POST /dashboard/inventory/purchase-requests/{purchaseRequest}/submit (Inventory\PurchaseRequestController@submit) | InventoryPage/Purchases.jsx |
| BB-ISM-017 | GET /dashboard/inventory (Inventory\StockController@stockCount) | InventoryPage/StockCounts.jsx |
| BB-ISM-018 | POST /dashboard/inventory/purchases (Inventory\PurchaseController@store) | InventoryPage/Purchases.jsx |
| BB-ISM-019 | POST /dashboard/inventory/purchases/{purchase}/approve (Inventory\PurchaseController@approve) | InventoryPage/Purchases.jsx |
| BB-ISM-020 | POST /dashboard/inventory/purchases/{purchase}/reject (Inventory\PurchaseController@reject) | InventoryPage/Purchases.jsx |
| BB-ISM-021 | POST /dashboard/inventory/purchases/{purchase}/mark-delivered (Inventory\PurchaseController@markDelivered) | InventoryPage/Purchases.jsx |
| BB-ISM-022 | POST /dashboard/inventory/purchases/{purchase}/confirm (Inventory\PurchaseController@confirm) | InventoryPage/Purchases.jsx |
| BB-ISM-023 | POST /dashboard/inventory/purchases/{purchase}/complete (Inventory\PurchaseController@complete) | InventoryPage/Purchases.jsx |
| BB-ISM-024 | DELETE /dashboard/inventory/purchases/{purchase} (Inventory\PurchaseController@destroy) | InventoryPage/Purchases.jsx |
| BB-ISM-025 | DELETE /dashboard/inventory/purchases (Inventory\PurchaseController@purge) | InventoryPage/Purchases.jsx |
| BB-ISM-026 | GET /dashboard/inventory (Inventory\StockController@stockCount) | InventoryPage/StockCounts.jsx |
| BB-ISM-027 | GET /dashboard/inventory/suppliers/{supplier}/details (Supplier\SupplierController@details) | InventoryPage/Lowstock.jsx |
| BB-ISM-028 | GET /dashboard/inventory/order-stocks (Inventory\StockController@lowStock) | InventoryPage/Lowstock.jsx |
| BB-ISM-029 | POST /dashboard/admin/products (Admin\ProductController@store) | AdminPage/Products.jsx |
| BB-ISM-030 | GET /dashboard/inventory/counts (Inventory\StockController@stockCount) | InventoryPage/StockCounts.jsx |
| BB-ISM-031 | GET /dashboard/inventory/counts (Inventory\StockController@stockCount) | InventoryPage/StockCounts.jsx |
| BB-ISM-032 | POST /dashboard/inventory/purchase-requests/{purchaseRequest}/submit (Inventory\PurchaseRequestController@submit) | InventoryPage/Purchases.jsx |
| BB-ISM-033 | POST /dashboard/admin/purchase-requests/{id}/approve (Inventory\RestockRequestController@approve) | InventoryPage/Lowstock.jsx |
| BB-ISM-034 | POST /dashboard/admin/purchase-requests/{id}/reject (Inventory\RestockRequestController@reject) | InventoryPage/Lowstock.jsx |
| BB-ISM-035 | POST /dashboard/inventory/purchases/{purchase}/discrepancy (Inventory\PurchaseController@discrepancy) | InventoryPage/Purchases.jsx |
| BB-DLM-001 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-DLM-002 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-DLM-003 | GET /dashboard/rider/history (Rider\RiderDeliveryController@history) | RiderPage/History.jsx |
| BB-DLM-004 | PATCH /dashboard/rider/deliveries/{delivery} (Rider\RiderDeliveryController@updateStatus) | RiderPage/MyDeliveries.jsx |
| BB-DLM-005 | PATCH /dashboard/rider/deliveries/{delivery} (Rider\RiderDeliveryController@updateStatus) | RiderPage/MyDeliveries.jsx |
| BB-DLM-006 | POST /dashboard/cashier/POS (Cashier\POSController@store) | CashierPage/POS.jsx |
| BB-DLM-007 | PATCH /dashboard/rider/deliveries/{delivery} (Rider\RiderDeliveryController@updateStatus) | RiderPage/MyDeliveries.jsx |
| BB-DLM-008 | PATCH /dashboard/rider/deliveries/{delivery} (Rider\RiderDeliveryController@updateStatus) | RiderPage/MyDeliveries.jsx |
| BB-DLM-009 | PATCH /dashboard/rider/deliveries/{delivery} (Rider\RiderDeliveryController@updateStatus) | RiderPage/MyDeliveries.jsx |
| BB-DLM-010 | PATCH /dashboard/rider/deliveries/{delivery} (Rider\RiderDeliveryController@updateStatus) | RiderPage/MyDeliveries.jsx |
| BB-DLM-011 | PATCH /dashboard/rider/deliveries/{delivery}/note (Rider\RiderDeliveryController@updateNote) | RiderPage/MyDeliveries.jsx |
| BB-DLM-012 | GET /dashboard/rider/deliveries (Rider\RiderDeliveryController@index) | RiderPage/MyDeliveries.jsx |
| BB-DLM-013 | GET /dashboard/rider/history (Rider\RiderDeliveryController@history) | RiderPage/History.jsx |
| BB-DLM-014 | PATCH /dashboard/rider/deliveries/{delivery} (Rider\RiderDeliveryController@updateStatus) | RiderPage/MyDeliveries.jsx |
| BB-DLM-015 | PATCH /dashboard/rider/deliveries/{delivery} (Rider\RiderDeliveryController@updateStatus) | RiderPage/MyDeliveries.jsx |
| BB-DLM-016 | PATCH /dashboard/rider/deliveries/{delivery} (Rider\RiderDeliveryController@updateStatus) | RiderPage/MyDeliveries.jsx |
| BB-DLM-017 | PATCH /dashboard/rider/deliveries/{delivery} (Rider\RiderDeliveryController@updateStatus) | RiderPage/MyDeliveries.jsx |
| BB-DLM-018 | PATCH /dashboard/rider/deliveries/{delivery}/note (Rider\RiderDeliveryController@updateNote) | RiderPage/MyDeliveries.jsx |
| BB-DLM-019 | PATCH /dashboard/rider/deliveries/{delivery} (Rider\RiderDeliveryController@updateStatus) | RiderPage/MyDeliveries.jsx |
| BB-DLM-020 | GET /dashboard/rider/deliveries (Rider\RiderDeliveryController@index) | RiderPage/MyDeliveries.jsx |
| BB-FAS-001 | GET /dashboard/accountant/reports (Accountant\ReportController@index) | AccountantPage/Reports.jsx |
| BB-FAS-002 | GET /dashboard/accountant/reports/export (Accountant\ReportController@export) | AccountantPage/Reports.jsx |
| BB-FAS-003 | POST /dashboard/accountant/remittances/record-cash (Accountant\RemittanceController@recordCash) | AccountantPage/TurnoverReview.jsx |
| BB-FAS-004 | POST /dashboard/accountant/remittances/record-cash (Accountant\RemittanceController@recordCash) | AccountantPage/TurnoverReview.jsx |
| BB-FAS-005 | POST /dashboard/accountant/remittances/record-cash (Accountant\RemittanceController@recordCash) | AccountantPage/TurnoverReview.jsx |
| BB-FAS-006 | GET /dashboard/accountant/remittances/review (Accountant\RemittanceController@review) | AccountantPage/TurnoverReview.jsx |
| BB-FAS-007 | GET /dashboard/accountant (Dashboard) | AccountantPage/Sales.jsx |
| BB-FAS-008 | POST /dashboard/accountant/remittances/cashless-transactions/verify (Accountant\RemittanceController@verifyCashlessTransactions) | AccountantPage/Remittances.jsx |
| BB-FAS-009 | GET /dashboard/accountant (Dashboard) | AccountantPage/Sales.jsx |
| BB-FAS-010 | POST /dashboard/accountant/remittances/daily-close (Accountant\RemittanceController@dailyClose) | AccountantPage/TurnoverReview.jsx |
| BB-FAS-011 | GET /dashboard/accountant (Dashboard) | AccountantPage/Sales.jsx |
| BB-FAS-012 | GET /dashboard/accountant/ledger (Accountant\LedgerController@index) | AccountantPage/Ledger.jsx |
| BB-FAS-013 | GET /dashboard/accountant/ledger (Accountant\LedgerController@index) | AccountantPage/Ledger.jsx |
| BB-FAS-014 | GET /dashboard/accountant/ledger (Accountant\LedgerController@index) | AccountantPage/Ledger.jsx |
| BB-FAS-015 | GET /dashboard/accountant/ledger (Accountant\LedgerController@index) | AccountantPage/Ledger.jsx |
| BB-FAS-016 | POST /dashboard/accountant/payables/{payable}/pay (Accountant\PayableController@pay) | AccountantPage/Payables.jsx |
| BB-FAS-017 | POST /dashboard/accountant/payables/{payable}/pay (Accountant\PayableController@pay) | AccountantPage/Payables.jsx |
| BB-FAS-018 | POST /dashboard/accountant/payables/{payable}/pay (Accountant\PayableController@pay) | AccountantPage/Payables.jsx |
| BB-FAS-019 | GET /dashboard/accountant/supplier-purchases/export (Accountant\SupplierPurchaseController@export) | AccountantPage/SupplierPurchases (Inertia target) |
| BB-FAS-020 | GET /dashboard/accountant/sales/export (Cashier\SaleController@export) | AccountantPage/Sales.jsx |
| BB-FAS-021 | GET /dashboard/accountant/cost-tracking (Accounting\CostTrackingController@index) | AdminPage/CostTracking.jsx |
| BB-FAS-022 | GET /dashboard/accountant/payroll (Route->Inertia) | AccountantPage/Payroll.jsx |
| BB-FAS-023 | GET /dashboard/accountant/reports/export (Accountant\ReportController@export) | AccountantPage/Reports.jsx |
| BB-FAS-024 | POST /dashboard/accountant/remittances/record-cash (Accountant\RemittanceController@recordCash) | AccountantPage/TurnoverReview.jsx |
| BB-FAS-025 | POST /dashboard/accountant/remittances/daily-close (Accountant\RemittanceController@dailyClose) | AccountantPage/TurnoverReview.jsx |
| BB-FAS-026 | GET /dashboard/accountant (Dashboard) | AccountantPage/Sales.jsx |
| BB-FAS-027 | POST /dashboard/accountant/payables/{payable}/pay (Accountant\PayableController@pay) | AccountantPage/Payables.jsx |
| BB-FAS-028 | GET /dashboard/accountant/ledger/reference/{reference} (Accountant\LedgerController@referenceLines) | AccountantPage/Ledger.jsx |
| BB-FAS-029 | GET /dashboard/accountant/ledger (Accountant\LedgerController@index) | AccountantPage/Ledger.jsx |
| BB-SAG-001 | GET/POST /dashboard/admin/users (Admin\UserController@index/store) | AdminPage/Users.jsx |
| BB-SAG-002 | GET /dashboard/admin (Dashboard) | Dashboard/Dashboard.jsx |
| BB-SAG-003 | GET /dashboard/admin/audit (AuditLogController@index) | AdminPage/AuditLogs.jsx |
| BB-SAG-004 | GET /dashboard/admin/audit (AuditLogController@index) | AdminPage/AuditLogs.jsx |
| BB-SAG-005 | GET /dashboard/admin/audit (AuditLogController@index) | AdminPage/AuditLogs.jsx |
| BB-SAG-006 | POST /login (Auth\LoginController@store) | Auth/Login.jsx |
| BB-SAG-007 | POST /login (Auth\LoginController@store) | Auth/Login.jsx |
| BB-SAG-008 | POST /logout (Auth\LoginController@destroy) | Dashboard/Dashboard.jsx |
| BB-SAG-009 | POST /dashboard/admin/employees (Admin\EmployeeController@store) | AdminPage/Employees.jsx |
| BB-SAG-010 | PUT /dashboard/admin/employees/{employee} (Admin\EmployeeController@update) | AdminPage/Employees.jsx |
| BB-SAG-011 | GET/POST /dashboard/admin/users (Admin\UserController@index/store) | AdminPage/Users.jsx |
| BB-SAG-012 | GET/POST /dashboard/admin/users (Admin\UserController@index/store) | AdminPage/Users.jsx |
| BB-SAG-013 | PUT /dashboard/admin/roles/{role}/permissions (Admin\RoleController@updatePermissions) | AdminPage/Roles.jsx |
| BB-SAG-014 | PUT /dashboard/admin/roles/{role}/permissions (Admin\RoleController@updatePermissions) | AdminPage/Roles.jsx |
| BB-SAG-015 | POST /dashboard/admin/roles/{role}/archive (Admin\RoleController@archive) | AdminPage/Roles.jsx |
| BB-SAG-016 | POST /dashboard/admin/roles/{role}/archive (Admin\RoleController@archive) | AdminPage/Roles.jsx |
| BB-SAG-017 | POST /dashboard/admin/roles/{role}/archive (Admin\RoleController@archive) | AdminPage/Roles.jsx |
| BB-SAG-018 | POST /dashboard/admin/suppliers (Supplier\SupplierController@store) | AdminPage/Suppliers.jsx |
| BB-SAG-019 | PUT /dashboard/admin/suppliers/{supplier} (Supplier\SupplierController@update) | AdminPage/Suppliers.jsx |
| BB-SAG-020 | POST /dashboard/admin/suppliers/{supplier}/archive (Supplier\SupplierController@archive) | AdminPage/Suppliers.jsx |
| BB-SAG-021 | PUT /dashboard/admin/suppliers/{supplier}/restore (Supplier\SupplierController@restore) | AdminPage/Suppliers.jsx |
| BB-SAG-022 | GET /dashboard/admin (Dashboard) | Dashboard/Dashboard.jsx |
| BB-SAG-023 | GET /dashboard/admin (Dashboard) | Dashboard/Dashboard.jsx |
| BB-SAG-024 | GET /dashboard/admin (Dashboard) | Dashboard/Dashboard.jsx |
| BB-SAG-025 | GET /dashboard/admin (Dashboard) | Dashboard/Dashboard.jsx |
| BB-SAG-026 | POST /dashboard/admin/promos (Admin\PromoVoucherController@store) | AdminPage/Promos.jsx |
| BB-SAG-027 | POST /dashboard/admin/promos/{promo}/discontinue (Admin\PromoVoucherController@discontinue) | AdminPage/Promos.jsx |
| BB-SAG-028 | PUT /dashboard/admin/promos/{promo}/restore (Admin\PromoVoucherController@restore) | AdminPage/Promos.jsx |
| BB-SAG-029 | GET /dashboard/admin (Dashboard) | Dashboard/Dashboard.jsx |
| BB-SAG-030 | POST /dashboard/admin/settings/vat (Admin\VatSettingsController@update) | AdminPage/VATSettings.jsx |
| BB-SAG-031 | POST /dashboard/admin/settings/vat (Admin\VatSettingsController@update) | AdminPage/VATSettings.jsx |
| BB-SAG-032 | GET /dashboard/admin/audit (AuditLogController@index) | AdminPage/AuditLogs.jsx |
| BB-SAG-033 | GET /dashboard/admin/reports/export (Admin\ReportsController@export) | AdminPage/Reports.jsx |
| BB-SAG-034 | GET/POST /dashboard/admin/customers (Cashier\CustomerController@index/store) | CashierPage/Customers.jsx |
| BB-SAG-035 | GET/POST /dashboard/admin/customers (Cashier\CustomerController@index/store) | CashierPage/Customers.jsx |
| BB-SAG-036 | GET/POST /dashboard/admin/customers (Cashier\CustomerController@index/store) | CashierPage/Customers.jsx |
| BB-SAG-037 | POST /dashboard/admin/users/{user}/reset-password (Admin\UserController@resetPassword) | AdminPage/Users.jsx |
| BB-SAG-038 | GET /dashboard/admin (Dashboard) | Dashboard/Dashboard.jsx |
| BB-SAG-039 | GET/POST /dashboard/admin/users (Admin\UserController@index/store) | AdminPage/Users.jsx |
| BB-SAG-040 | GET/POST /dashboard/admin/roles (Admin\RoleController@index/store) | AdminPage/Roles.jsx |
| BB-SAG-041 | GET /dashboard/admin/suppliers/{supplier}/details (Supplier\SupplierController@details) | AdminPage/Suppliers.jsx |
| BB-SAG-042 | GET /dashboard/admin (Dashboard) | Dashboard/Dashboard.jsx |
| BB-SAG-043 | GET /dashboard/admin (Dashboard) | Dashboard/Dashboard.jsx |
| BB-SAG-044 | PUT /dashboard/admin/promos/{promo} (Admin\PromoVoucherController@update) | AdminPage/Promos.jsx |
| BB-SAG-045 | POST /dashboard/admin/promos (Admin\PromoVoucherController@store) | AdminPage/Promos.jsx |
| BB-SAG-046 | GET /dashboard/admin/reports (Admin\ReportsController@index) | AdminPage/Reports.jsx |
| BB-SAG-047 | GET /dashboard/admin (Dashboard) | Dashboard/Dashboard.jsx |
| BB-SAG-048 | POST /dashboard/admin/purchase-requests/{id}/approve (Inventory\RestockRequestController@approve) | InventoryPage/Lowstock.jsx |
| BB-SAG-049 | POST /dashboard/admin/purchase-requests/{id}/reject (Inventory\RestockRequestController@reject) | InventoryPage/Lowstock.jsx |
| BB-SYS-001 | GET /notifications (NotificationController@index) | components/notifications |
| BB-SYS-002 | GET /notifications/unread (NotificationController@unread) | components/notifications |
| BB-SYS-003 | POST /notifications/{id}/read (NotificationController@markAsRead) | components/notifications |
| BB-SYS-004 | POST /notifications/read-all (NotificationController@markAllAsRead) | components/notifications |
| BB-SYS-005 | DELETE /notifications/{id} (NotificationController@delete) | components/notifications |
| BB-SYS-006 | GET /api/ping (routes/api.php) | N/A (API) |
| BB-SYS-007 | GET /api/me (routes/api.php) | N/A (API) |
| BB-SYS-008 | GET /api/me (routes/api.php) | N/A (API) |
| BB-SYS-009 | GET /notifications/unread (NotificationController@unread) | components/notifications |
| BB-SYS-010 | GET /notifications (NotificationController@index) | components/notifications |
| BB-SYS-011 | POST /notifications/{id}/read (NotificationController@markAsRead) | components/notifications |
| BB-SYS-012 | DELETE /notifications/{id} (NotificationController@delete) | components/notifications |