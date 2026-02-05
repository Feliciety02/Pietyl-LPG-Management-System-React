<?php

namespace App\Services;

use App\Repositories\SupplierRepository;

class SupplierService
{
    protected $repo;

    public function __construct(SupplierRepository $repo)
    {
        $this->repo = $repo;
    }

    /**
     * Get suppliers with filters and pagination
     */
    public function getSuppliersForPage(array $filters = []): array
    {
        $suppliersPaginated = $this->repo->getPaginated($filters);

        return [
            'data' => collect($suppliersPaginated->items())->map(function ($s) {
                return [
                    'id'             => $s->id,
                    'name'           => $s->name,
                    'contact_name'   => $s->contact_name,
                    'phone'          => $s->phone,
                    'email'          => $s->email,
                    'address'        => $s->address,
                    'notes'          => $s->notes,
                    'is_active'      => $s->is_active,
                    'products_count' => $s->products_count ?? 0,
                ];
            }),
            'meta' => [
                'current_page' => $suppliersPaginated->currentPage(),
                'last_page'    => $suppliersPaginated->lastPage(),
                'per_page'     => $suppliersPaginated->perPage(),
                'total'        => $suppliersPaginated->total(),
                'from'         => $suppliersPaginated->firstItem(),
                'to'           => $suppliersPaginated->lastItem(),
            ],
        ];
    }

    
}
