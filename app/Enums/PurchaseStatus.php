<?php

namespace App\Enums;

use App\Exceptions\PurchaseStatusException;

final class PurchaseStatus
{
    public const ROLE_INVENTORY = 'inventory_manager';
    public const ROLE_ADMIN = 'admin';
    public const ROLE_ACCOUNTANT = 'accountant';
    public const ROLE_FINANCE = 'finance';

    public const DRAFT = 'draft';
    public const SUBMITTED = 'submitted';

    public const PENDING = 'pending';
    public const AWAITING_CONFIRMATION = 'awaiting_confirmation';

    public const APPROVED = 'approved';
    public const REJECTED = 'rejected';

    public const RECEIVING = 'receiving';
    public const DELIVERED = 'delivered';

    public const RECEIVED = 'received';
    public const DISCREPANCY_REPORTED = 'discrepancy_reported';

    public const COMPLETED = 'completed';
    public const PAYABLE_OPEN = 'payable_open';

    public const PAID = 'paid';
    public const CLOSED = 'closed';

    /*
      Allowed raw database values (includes legacy states so isValid remains true for old records).
      Logic and permissions are enforced using normalize() which maps legacy values into the COD flow.
    */
    private const VALUES = [
        self::DRAFT,
        self::SUBMITTED,
        self::PENDING,
        self::AWAITING_CONFIRMATION,
        self::APPROVED,
        self::REJECTED,
        self::RECEIVING,
        self::DELIVERED,
        self::RECEIVED,
        self::DISCREPANCY_REPORTED,
        self::COMPLETED,
        self::PAYABLE_OPEN,
        self::PAID,
        self::CLOSED,
    ];

    /*
      Normalize legacy states into the COD flow so UI and action gating behave consistently.

      COD flow stages we enforce
      draft -> submitted -> receiving -> received -> paid -> completed -> closed

      Notes
      pending and awaiting_confirmation are treated as submitted
      approved is treated as receiving so Inventory can proceed right away
      payable_open is treated as receiving (legacy meaning: approved/forwarded)
      delivered is treated as received (arrived)
    */
    private const LEGACY_STATUS_MAP = [
        self::PENDING => self::SUBMITTED,
        self::AWAITING_CONFIRMATION => self::SUBMITTED,

        self::APPROVED => self::RECEIVING,
        self::PAYABLE_OPEN => self::RECEIVING,

        self::DELIVERED => self::RECEIVED,
    ];

    /*
      COD lifecycle transitions (normalized statuses only).
    */
    private const TRANSITIONS = [
        self::DRAFT => [self::SUBMITTED],

        self::SUBMITTED => [self::RECEIVING, self::REJECTED],

        self::RECEIVING => [self::RECEIVED, self::DISCREPANCY_REPORTED],

        self::RECEIVED => [self::PAID, self::DISCREPANCY_REPORTED],

        self::DISCREPANCY_REPORTED => [self::PAID],

        self::PAID => [self::COMPLETED],

        self::COMPLETED => [self::CLOSED],

        self::REJECTED => [],
        self::CLOSED => [],
    ];

    /*
      Role ownership rules (normalized statuses only).

      Inventory Manager
        receiving -> received
        receiving -> discrepancy_reported
        received -> discrepancy_reported
        paid -> completed

      Admin
        submitted -> receiving
        submitted -> rejected

      Accountant
        received -> paid
        discrepancy_reported -> paid

      Finance
        completed -> closed
    */
    private const ROLE_TRANSITIONS = [
        self::ROLE_INVENTORY => [
            self::RECEIVING => [self::RECEIVED, self::DISCREPANCY_REPORTED],
            self::RECEIVED => [self::DISCREPANCY_REPORTED],
            self::PAID => [self::COMPLETED],
        ],
        self::ROLE_ADMIN => [
            self::SUBMITTED => [self::RECEIVING, self::REJECTED],
        ],
        self::ROLE_ACCOUNTANT => [
            self::RECEIVED => [self::PAID],
            self::DISCREPANCY_REPORTED => [self::PAID],
        ],
        self::ROLE_FINANCE => [
            self::COMPLETED => [self::CLOSED],
        ],
    ];

    public static function values(): array
    {
        return self::VALUES;
    }

    public static function normalize(?string $status): string
    {
        if ($status === null) {
            return '';
        }

        $normalized = strtolower(trim($status));
        $normalized = preg_replace('/\s+/', '_', $normalized) ?? $normalized;
        $normalized = str_replace('-', '_', $normalized);

        return self::LEGACY_STATUS_MAP[$normalized] ?? $normalized;
    }

    public static function normalizeRole(?string $role): ?string
    {
        if ($role === null) {
            return null;
        }

        $normalized = strtolower(trim($role));
        $normalized = preg_replace('/\s+/', '_', $normalized) ?? $normalized;
        $normalized = str_replace('-', '_', $normalized);

        /*
          Map UI labels like "System Admin" into the role key used in rules.
        */
        if ($normalized === 'system_admin' || $normalized === 'super_admin') {
            return self::ROLE_ADMIN;
        }

        return $normalized;
    }

    /*
      Valid means the raw value is known OR it is a known normalized value.
      This avoids throwing on old rows, and lets normalize drive behavior.
    */
    public static function isValid(?string $status): bool
    {
        $raw = $status === null ? '' : strtolower(trim((string) $status));
        $raw = preg_replace('/\s+/', '_', $raw) ?? $raw;
        $raw = str_replace('-', '_', $raw);

        $normalized = self::normalize($raw);

        return in_array($raw, self::VALUES, true) || in_array($normalized, self::VALUES, true);
    }

    public static function canTransition(string $from, string $to): bool
    {
        $normalizedFrom = self::normalize($from) ?: self::DRAFT;
        $normalizedTo = self::normalize($to);

        if ($normalizedFrom === $normalizedTo) {
            return false;
        }

        return in_array($normalizedTo, self::TRANSITIONS[$normalizedFrom] ?? [], true);
    }

    public static function actorCanTransition(?string $actorRole, string $from, string $to): bool
    {
        $normalizedRole = self::normalizeRole($actorRole);
        if (!$normalizedRole) {
            return false;
        }

        $normalizedFrom = self::normalize($from) ?: self::DRAFT;
        $normalizedTo = self::normalize($to);

        $allowed = self::ROLE_TRANSITIONS[$normalizedRole][$normalizedFrom] ?? [];
        return in_array($normalizedTo, $allowed, true);
    }

    public static function ensureTransition(?string $from, string $to, ?string $actorRole = null): void
    {
        $normalizedFrom = self::normalize($from) ?: self::DRAFT;
        $normalizedTo = self::normalize($to);

        if (!self::isValid($normalizedTo)) {
            throw new PurchaseStatusException("Invalid purchase status \"{$to}\".");
        }

        if (!self::canTransition($normalizedFrom, $normalizedTo)) {
            throw new PurchaseStatusException(
                "Cannot transition purchase status from {$normalizedFrom} to {$normalizedTo}."
            );
        }

        if ($actorRole && !self::actorCanTransition($actorRole, $normalizedFrom, $normalizedTo)) {
            $nr = self::normalizeRole($actorRole) ?? $actorRole;
            throw new PurchaseStatusException(
                "Role \"{$nr}\" is not allowed to transition from {$normalizedFrom} to {$normalizedTo}."
            );
        }
    }

    public static function terminalStatuses(): array
    {
        return [
            self::REJECTED,
            self::CLOSED,
        ];
    }

    /*
      Helpful for UI badges and reporting.
      This is the canonical COD flow order after normalization.
    */
    public static function codFlowStatuses(): array
    {
        return [
            self::DRAFT,
            self::SUBMITTED,
            self::RECEIVING,
            self::RECEIVED,
            self::PAID,
            self::COMPLETED,
            self::CLOSED,
        ];
    }
}
