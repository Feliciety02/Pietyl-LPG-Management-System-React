<?php

namespace App\Repositories;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class SupplierRepository
{
    protected Builder $query;

    public function __construct()
    {
        $this->query = Supplier::query();
    }

    public function applyFilters(array $filters = []): self
    {
        if (!empty($filters['q'])) {
            $q = $filters['q'];
            $this->query->where(function ($query) use ($q) {
                $query->where('name', 'like', "%$q%")
                      ->orWhere('email', 'like', "%$q%")
                      ->orWhere('phone', 'like', "%$q%");
            });
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $status = $filters['status'];
            $isActive = $status === 'active';
            $this->query->where('is_active', $isActive);
        }

        return $this;
    }

  
    public function getPaginated(array $filters = []): LengthAwarePaginator
    {
        $perPage = $filters['per'] ?? 10;
        
        // Apply filters
        $this->applyFilters($filters);

        return $this->query
            ->withCount('products')
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }
}
