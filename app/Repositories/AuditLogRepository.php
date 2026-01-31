<?php

namespace App\Repositories;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class AuditLogRepository
{
    protected Builder $query;

    public function __construct()
    {
        $this->query = AuditLog::query()->with(['actor.roles']);
    }

    public function applyFilters(array $filters = []): self
    {
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
            $this->query->where('entity_type', $filters['entity_type']);
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
}
