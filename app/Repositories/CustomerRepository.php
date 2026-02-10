<?php

namespace App\Repositories;

use App\Models\Customer;
use App\Models\Delivery;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

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

    public function getAllCustomers(): Collection
    {
        return Customer::select('id', 'name', 'phone')
            ->orderBy('name')
            ->get();
    }

    public function findCustomerWithAddresses(int $customerId): ?Customer
    {
        return Customer::with('addresses')->find($customerId);
    }

    public function getDefaultAddress(Customer $customer)
    {
        return $customer->addresses()
            ->where('is_default', 1)
            ->first()
            ?? $customer->addresses()->first();
    }
}
