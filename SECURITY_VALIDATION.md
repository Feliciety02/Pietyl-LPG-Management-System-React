# Security Validation Guide

This document defines the repeatable validation process for the security enhancements implemented in the Pietyl LPG Management System.

## Scope

The current security validation suite covers:

- Login throttling and lockout
- Authorization hardening
- Private storage for sensitive delivery proof files
- Multi-factor authentication for privileged users
- Audit and security logging improvements
- Production security header hardening

## Automated Validation

Run the dedicated security regression suite:

```bash
composer test:security
```

This command executes the following feature tests:

- `tests/Feature/LoginRateLimitingTest.php`
- `tests/Feature/AuthorizationHardeningTest.php`
- `tests/Feature/PrivateDeliveryProofStorageTest.php`
- `tests/Feature/PrivilegedUserMfaTest.php`
- `tests/Feature/AuditSecurityLoggingTest.php`
- `tests/Feature/SecurityHeadersTest.php`

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
- review audit logs after sensitive actions to confirm entries are created as expected

## Operational Recommendation

Run the security regression suite:

- before merging security-related code changes
- before deployment to staging
- before deployment to production
- after framework, authentication, routing, or middleware changes
