# Security Validation Guide

This document defines the repeatable validation process for the security enhancements implemented in the Pietyl LPG Management System.

## Scope

The current security validation suite covers:

- Login throttling and lockout
- Authorization hardening
- Private storage for sensitive delivery proof files
- Reduced browser persistence for rider offline proof data
- Client-side rider proof image validation
- Safer new-tab handling for receipt reprints
- Explicit frontend CSRF bootstrap for browser requests
- Frontend idle-session timeout for authenticated dashboards
- Centralized axios use for remaining authenticated supplier detail requests
- Tightened production/testing CSP for script execution
- Targeted npm dependency remediation with patched transitive overrides
- Multi-factor authentication for privileged users
- Audit and security logging improvements
- Production security header hardening

## Automated Validation

Run the dedicated security regression suite:

```bash
composer test:security
```

Run the frontend security unit coverage:

```bash
npm run test:frontend:security
```

This command executes the following feature tests:

- `tests/Feature/LoginRateLimitingTest.php`
- `tests/Feature/AuthorizationHardeningTest.php`
- `tests/Feature/PrivateDeliveryProofStorageTest.php`
- `tests/Feature/PrivilegedUserMfaTest.php`
- `tests/Feature/AuditSecurityLoggingTest.php`
- `tests/Feature/SecurityHeadersTest.php`

The frontend security command executes:

- `resources/js/security/riderProofValidation.test.js`

## Implementation Coverage

### Implementation 1: Login Throttling and Lockout

Validated by:

- `LoginRateLimitingTest.php`

Checks:

- repeated failed logins trigger lockout
- successful login clears accumulated failed attempts
- inactive employee login attempts still use generic failures and count toward lockout

### Implementation 2: Authorization Hardening

Validated by:

- `AuthorizationHardeningTest.php`

Checks:

- users cannot access another user’s notification
- legitimate notification owners can still access their own records
- inventory threshold updates require explicit update permission

### Implementation 3: Private Storage for Sensitive Files

Validated by:

- `PrivateDeliveryProofStorageTest.php`

Checks:

- proof photos are stored on the private disk
- stored proof references are internal paths rather than public `/storage` URLs
- proof files are accessible only to authorized users

### Implementation 3A: Reduced Browser Persistence for Sensitive Rider Proof Data

Implemented in:

- `resources/js/Pages/RiderPage/MyDeliveries.jsx`
- `resources/js/components/modals/LogoutButton.jsx`
- `resources/js/Pages/Dashboard/DashboardShell.jsx`
- `resources/js/security/storageKeys.js`

Checks:

- rider offline queue is stored in `sessionStorage` instead of persistent `localStorage`
- legacy persistent queue entries are removed when the rider page loads
- logout clears both session-scoped and legacy queue storage keys

### Implementation 3B: Client-Side Rider Proof Image Validation

Implemented in:

- `resources/js/Pages/RiderPage/MyDeliveries.jsx`

Checks:

- proof image uploads are limited to JPEG, PNG, and WebP
- proof image uploads larger than 5 MB are rejected before preview or queueing
- rider UI shows the accepted proof formats and file size limit

### Implementation 3C: Safer New-Tab Handling for Receipt Reprints

Implemented in:

- `resources/js/components/modals/CashierModals/ReprintReceiptModal.jsx`

Checks:

- receipt reprint uses `noopener,noreferrer` when opening a new tab
- newly opened receipt window does not retain a live `window.opener` reference

### Implementation 3D: Explicit Frontend CSRF Bootstrap

Implemented in:

- `resources/views/app.blade.php`
- `resources/js/bootstrap.js`

Checks:

- app shell publishes the CSRF token through a meta tag
- axios is configured with explicit XSRF cookie and header names
- axios sends the CSRF token header when the token is present in the page shell

### Implementation 3E: Frontend Idle-Session Timeout for Authenticated Dashboards

Implemented in:

- `resources/js/Pages/Dashboard/DashboardShell.jsx`

Checks:

- authenticated dashboard sessions warn after prolonged inactivity
- inactive dashboard sessions automatically log out after 15 minutes
- forced logout clears sensitive client-side queue data before sign-out
- users can explicitly continue their session from the warning dialog

### Implementation 3F: Centralized Axios Use for Supplier Detail Requests

Implemented in:

- `resources/js/Pages/AdminPage/Suppliers.jsx`

Checks:

- authenticated supplier detail requests use the shared axios bootstrap
- supplier detail requests inherit centralized CSRF and request header defaults
- direct ad hoc `fetch(...)` usage is removed from this flow

### Implementation 3G: Tightened Production and Testing CSP for Script Execution

Implemented in:

- `app/Http/Middleware/SetSecurityHeaders.php`
- `tests/Feature/SecurityHeadersTest.php`

Checks:

- non-local environments no longer allow `'unsafe-inline'` in `script-src`
- non-local environments no longer allow `'unsafe-eval'` in `script-src`
- CSP explicitly blocks plugin/object execution with `object-src 'none'`
- local development still retains the looser Vite-compatible script policy

### Implementation 3H: Automated Frontend Security Validation for Rider Proof Upload Rules

Implemented in:

- `resources/js/security/riderProofValidation.js`
- `resources/js/security/riderProofValidation.test.js`
- `package.json`
- `vite.config.js`

Checks:

- supported rider proof image formats remain limited to JPEG, PNG, and WebP
- oversized rider proof images are rejected against the shared 5 MB limit
- user-facing size and validation messages stay aligned with production logic

### Implementation 3I: Targeted NPM Dependency Remediation

Implemented in:

- `package.json`

Checks:

- direct `axios` dependency is updated to a patched release
- patched versions of `qs`, `rollup`, and `picomatch` are enforced through npm overrides
- nested `vite-plugin-full-reload` uses a patched `picomatch` 2.x release
- remaining unresolved advisories are reviewed separately when no safe patch is published

Current unresolved npm audit items after remediation:

- `lodash-es` remains via the current `@inertiajs/react` 2.x dependency chain
- `xlsx` remains because the published npm package in use does not offer a patched release

### Implementation 4: Multi-Factor Authentication

Validated by:

- `PrivilegedUserMfaTest.php`

Checks:

- privileged users without MFA are redirected to setup
- privileged users can enroll MFA successfully
- privileged users with enabled MFA must complete second-factor verification during login

### Implementation 5: Audit and Security Logging Improvements

Validated by:

- `AuditSecurityLoggingTest.php`

Checks:

- denied notification access is audit-logged
- delivery proof access and denied access are audit-logged
- admin password confirmation success and failure are audit-logged

### Implementation 6: Production Security Hardening

Validated by:

- `SecurityHeadersTest.php`

Checks:

- browser-facing security headers are applied to web responses
- HSTS is applied when HTTPS hardening is enabled

## Manual Validation Recommendations

In addition to automated tests, the following manual checks should be performed before release:

- verify deployment uses `APP_DEBUG=false`
- verify `APP_FORCE_HTTPS=true` in production
- verify `SESSION_SECURE_COOKIE=true` in production
- verify trusted proxies are correctly configured for the hosting environment
- verify privileged users can complete MFA setup on first sign-in
- verify proof-of-delivery files are not directly accessible through `/storage`
- verify rider proof queue data does not remain in `localStorage` after logout
- verify unsupported or oversized rider proof images are rejected in the browser before upload
- verify receipt reprint opens in a new tab without exposing `window.opener`
- verify frontend requests still succeed with explicit CSRF token bootstrap in place
- verify inactive dashboard sessions display a warning and then sign out automatically
- verify supplier detail requests still succeed through the shared axios client
- verify non-local responses no longer expose unsafe script CSP allowances
- review audit logs after sensitive actions to confirm entries are created as expected

## Operational Recommendation

Run the security regression suite:

- before merging security-related code changes
- before deployment to staging
- before deployment to production
- after framework, authentication, routing, or middleware changes
