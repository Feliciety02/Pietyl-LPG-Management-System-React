<?php

namespace App\Repositories;

use App\Models\Sale;
use Illuminate\Pagination\LengthAwarePaginator;

class SaleRepository
{
    public function getPaginated(array $filters = []): LengthAwarePaginator
    {
        $query = Sale::query()->with([
            'customer',
            'cashier',
            'items.productVariant.product',
            'payments.paymentMethod'
        ]);

        // Apply search filter
        if (!empty($filters['q'])) {
            $q = $filters['q'];
            $query->where(function ($subQuery) use ($q) {
                $subQuery->where('sale_number', 'like', "%$q%")
                         ->orWhereHas('customer', function ($cq) use ($q) {
                             $cq->where('name', 'like', "%$q%");
                         });
            });
        }

        // Apply status filter
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        $perPage = $filters['per'] ?? 10;
        $page = $filters['page'] ?? 1;

        // Sort by created_at instead of sale_datetime
        return $query->latest('created_at')
                     ->paginate($perPage, ['*'], 'page', $page)
                     ->withQueryString();
    }
}