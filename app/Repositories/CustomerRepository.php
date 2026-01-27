<?php

namespace App\Repositories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class CustomerRepository
{
    protected Builder $query;

    public function __construct()
    {
        $this->query = Customer::query()->with('addresses');
    }

    public function applyFilters(array $filters = []): self
    {
        if (!empty($filters['q'])) {
            $q = $filters['q'];
            $this->query->where(function ($query) use ($q) {
                $query->where('name', 'like', "%$q%")
                      ->orWhere('phone', 'like', "%$q%")
                      ->orWhere('email', 'like', "%$q%");
            });
        }

        return $this;
    }

    public function getPaginated(array $filters = []): LengthAwarePaginator
    {
        $perPage = $filters['per'] ?? 10;
        $this->applyFilters($filters);

        return $this->query->latest()->paginate($perPage)->withQueryString();
    }
}
