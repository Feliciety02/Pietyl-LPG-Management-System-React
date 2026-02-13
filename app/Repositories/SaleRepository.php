<?php

namespace App\Repositories;

use App\Models\Sale;
use App\Models\User;
use Carbon\Carbon;
use App\Models\SaleItem;
use App\Models\Receipt; 
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

        if (!empty($filters['from']) || !empty($filters['to'])) {
            $from = !empty($filters['from']) ? Carbon::parse($filters['from'])->startOfDay() : null;
            $to = !empty($filters['to']) ? Carbon::parse($filters['to'])->endOfDay() : null;

            if ($from && $to) {
                $query->whereBetween('sale_datetime', [$from, $to]);
            } elseif ($from) {
                $query->where('sale_datetime', '>=', $from);
            } elseif ($to) {
                $query->where('sale_datetime', '<=', $to);
            }
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
        } elseif ($statusScope === 'pending') {
            $query->where('status', 'pending');
        } elseif ($statusScope === 'failed') {
            $query->where('status', 'failed');
        }

        return $query->orderBy('sale_datetime', 'asc')->get();
    }

    public function create(array $data): Sale
    {
        return Sale::create($data);
    }

    public function createSaleItem(array $data): SaleItem
    {
        return SaleItem::create($data);
    }

    public function createReceipt(int $saleId): Receipt
    {
        return Receipt::create([
            'sale_id' => $saleId,
            'receipt_number' => Receipt::generateReceiptNumber(),
            'printed_count' => 0,
            'issued_at' => Carbon::now(),
        ]);
    }

    public function isSaleLocked(string $businessDate): bool
    {
        return \App\Models\DailyClose::where('business_date', $businessDate)->exists();
    }

    public function findById(int $id): ?Sale
    {
        return Sale::find($id);
    }

    public function generateSaleNumber(): string
    {
        return Sale::generateSaleNumber();
    }
}
