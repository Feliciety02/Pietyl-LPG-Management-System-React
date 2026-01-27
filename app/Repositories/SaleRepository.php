<?php

namespace App\Repositories;

use App\Models\Sale;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class SaleRepository
{
    protected Builder $query;

    public function __construct()
    {
        $this->query = Sale::query()->with([
            'customer',
            'cashier',
            'items.productVariant.product',
            'payments.paymentMethod'
        ]);
    }

    public function applyFilters(array $filters = []): self
    {
        if (!empty($filters['q'])) {
            $q = $filters['q'];
            $this->query->where(function ($query) use ($q) {
                $query->where('sale_number', 'like', "%$q%")
                      ->orWhereHas('customer', function ($cq) use ($q) {
                          $cq->where('name', 'like', "%$q%");
                      });
            });
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $this->query->where('status', $filters['status']);
        }

        return $this;
    }

    public function getPaginated(array $filters = []): LengthAwarePaginator
    {
        $perPage = $filters['per'] ?? 10;
        $this->applyFilters($filters);

        return $this->query->latest('sale_datetime')
                           ->paginate($perPage)
                           ->withQueryString();
    }
}
