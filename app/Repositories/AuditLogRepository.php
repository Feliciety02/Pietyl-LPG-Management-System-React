<?php

namespace App\Repositories;

use App\Models\AuditLog;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class AuditLogRepository
{
    protected Builder $query;
    protected array $sectorMap = [
        'access' => [
            'entity_types' => ['User', 'Role', 'UserRole'],
            'actions' => ['auth.'],
        ],
        'people' => [
            'entity_types' => ['Employee', 'Customer', 'CustomerAddress'],
        ],
        'sales' => [
            'entity_types' => ['Sale', 'SaleItem', 'Delivery', 'Receipt'],
        ],
        'inventory' => [
            'entity_types' => [
                'InventoryBalance',
                'InventoryMovement',
                'StockMovement',
                'StockCount',
                'Product',
                'ProductVariant',
                'Supplier',
                'SupplierProduct',
                'Purchase',
                'PurchaseItem',
                'PurchaseRequest',
                'PurchaseRequestItem',
                'RestockRequest',
                'RestockRequestItem',
                'PurchaseReceipt',
                'PurchaseReceiptItem',
                'Location',
                'SupplierPurchaseCommitment',
            ],
        ],
        'finance' => [
            'entity_types' => [
                'Payment',
                'PaymentMethod',
                'Receipt',
                'Remittance',
                'DailyClose',
                'LedgerEntry',
                'LedgerLine',
                'ChartOfAccount',
                'AccountingReport',
                'PayableLedger',
                'SupplierPayable',
            ],
            'actions' => ['remittance.'],
        ],
    ];

    public function __construct()
    {
        $this->query = AuditLog::query()->with(['actor.roles']);
    }

    public function applyFilters(array $filters = []): self
    {
        if (!empty($filters['sector']) && $filters['sector'] !== 'all') {
            $this->applySectorFilter($filters['sector']);
        }

        if (!empty($filters['q'])) {
            $q = $filters['q'];
            $this->query->where(function ($query) use ($q) {
                $query->where('action', 'like', "%$q%")
                    ->orWhere('entity_type', 'like', "%$q%")
                    ->orWhere('message', 'like', "%$q%")
                    ->orWhere('entity_id', 'like', "%$q%")
                    ->orWhereHas('actor', function ($aq) use ($q) {
                        $aq->where('name', 'like', "%$q%");
                    });
            });
        }

        if (!empty($filters['event']) && $filters['event'] !== 'all') {
            $this->query->where('action', $filters['event']);
        }

        if (!empty($filters['entity_type']) && $filters['entity_type'] !== 'all') {
            $types = $this->expandEntityTypes([$filters['entity_type']]);
            $this->query->whereIn('entity_type', $types);
        }

        if (!empty($filters['from']) || !empty($filters['to'])) {
            $from = !empty($filters['from']) ? Carbon::parse($filters['from'])->startOfDay() : null;
            $to = !empty($filters['to']) ? Carbon::parse($filters['to'])->endOfDay() : null;

            if ($from && $to) {
                $this->query->whereBetween('created_at', [$from, $to]);
            } elseif ($from) {
                $this->query->where('created_at', '>=', $from);
            } elseif ($to) {
                $this->query->where('created_at', '<=', $to);
            }
        }

        return $this;
    }

    public function getPaginated(array $filters = []): LengthAwarePaginator
    {
        $perPage = $filters['per'] ?? 10;
        $this->applyFilters($filters);

        return $this->query->latest('created_at')
            ->paginate($perPage)
            ->withQueryString();
    }

    private function applySectorFilter(string $sector): void
    {
        $key = strtolower(trim($sector));
        $config = $this->sectorMap[$key] ?? null;
        if (!$config) {
            return;
        }

        $entityTypes = $this->expandEntityTypes($config['entity_types'] ?? []);
        $actionPrefixes = $config['actions'] ?? [];

        if (empty($entityTypes) && empty($actionPrefixes)) {
            return;
        }

        $this->query->where(function ($query) use ($entityTypes, $actionPrefixes) {
            $hasClause = false;

            if (!empty($entityTypes)) {
                $query->whereIn('entity_type', $entityTypes);
                $hasClause = true;
            }

            foreach ($actionPrefixes as $prefix) {
                $prefix = trim((string) $prefix);
                if ($prefix === '') {
                    continue;
                }

                if ($hasClause) {
                    $query->orWhere('action', 'like', $prefix . '%');
                } else {
                    $query->where('action', 'like', $prefix . '%');
                    $hasClause = true;
                }
            }
        });
    }

    private function expandEntityTypes(array $types): array
    {
        $expanded = [];

        foreach ($types as $type) {
            $type = trim((string) $type);
            if ($type === '') {
                continue;
            }

            $expanded[] = $type;

            if (!str_contains($type, '\\')) {
                $expanded[] = "App\\Models\\{$type}";
            }
        }

        return array_values(array_unique($expanded));
    }
}
