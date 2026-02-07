<?php

namespace App\Repositories;

use App\Models\RestockRequest;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class RestockRequestRepository
{
    protected Builder $query;

    public function __construct()
    {
        $this->query = RestockRequest::query()->with([
            'location',
            'requestedBy',
            'submittedBy',
            'approvedBy',
            'receivedBy',
            'supplier',
            'payable',
            'items.productVariant.product',
            'items.supplier',
        ]);
    }

    public function applyFilters(array $filters = []): self
    {
        // Search
        if (!empty($filters['q'])) {
            $q = $filters['q'];
            $this->query->where(function ($query) use ($q) {
                $query->where('request_number', 'like', "%$q%")
                      ->orWhere('notes', 'like', "%$q%")
                      ->orWhereHas('requestedBy', function ($uq) use ($q) {
                          $uq->where('name', 'like', "%$q%");
                      });
            });
        }

        // Status filter
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $this->query->where('status', $filters['status']);
        }

        // Priority filter
        if (!empty($filters['priority']) && $filters['priority'] !== 'all') {
            $this->query->where('priority', $filters['priority']);
        }

        return $this;
    }

    public function getPaginated(array $filters = []): LengthAwarePaginator
    {
        $perPage = $filters['per'] ?? 10;
        $this->applyFilters($filters);

        return $this->query->latest()->paginate($perPage)->withQueryString();
    }

    public function findById(int $id): ?RestockRequest
    {
        return RestockRequest::with([
            'location',
            'requestedBy',
            'submittedBy',
            'approvedBy',
            'receivedBy',
            'supplier',
            'payable',
            'items.productVariant.product',
            'items.supplier',
        ])->find($id);
    }
}
