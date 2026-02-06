<?php

namespace App\Repositories;

use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

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

        // Sort by created_at (newest first)
        return $query->latest('created_at')
                     ->paginate($perPage, ['*'], 'page', $page)
                     ->withQueryString();
    }

    public function getForExport(array $filters = []): Collection
    {
        $from = array_key_exists('from', $filters) && $filters['from']
            ? Carbon::parse($filters['from'])->startOfDay()
            : Carbon::today()->startOfDay();

        $to = array_key_exists('to', $filters) && $filters['to']
            ? Carbon::parse($filters['to'])->endOfDay()
            : Carbon::today()->endOfDay();

        $statusScope = $filters['status_scope'] ?? 'paid';

        $query = Sale::query()->with([
            'customer',
            'cashier',
            'items.productVariant.product',
            'payments.paymentMethod'
        ]);

        $query->whereBetween('sale_datetime', [$from, $to]);

        if ($statusScope === 'paid') {
            $query->where('status', 'paid');
        } elseif ($statusScope === 'paid_pending') {
            $query->whereIn('status', ['paid', 'pending']);
        }

        return $query->orderBy('sale_datetime', 'asc')->get();
    }
}
