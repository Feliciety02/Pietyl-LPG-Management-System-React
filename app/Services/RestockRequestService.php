<?php

namespace App\Services;

use App\Repositories\RestockRequestRepository;
use App\Models\RestockRequest;

class RestockRequestService
{
    protected RestockRequestRepository $repo;

    public function __construct(RestockRequestRepository $repo)
    {
        $this->repo = $repo;
    }

    public function getRequestsForPage(array $filters = []): array
    {
        $requestsPaginated = $this->repo->getPaginated($filters);

        return [
            'data' => collect($requestsPaginated->items())->map(function ($request) {
                return [
                    'id' => $request->id,
                    'request_number' => $request->request_number,
                    'location' => $request->location?->name ?? '—',
                    'requested_by' => $request->requestedBy?->name ?? '—',
                    'requested_by_name' => $request->requestedBy?->name ?? '—',  // For frontend compatibility
                    'approved_by' => $request->approvedBy?->name ?? null,
                    'status' => $request->status,
                    'purchase_request_status' => $request->status,  // For frontend compatibility
                    'priority' => $request->priority,
                    'needed_by' => $request->needed_by_date?->format('M d, Y'),
                    'items_count' => $request->items->count(),
                    'notes' => $request->notes,
                    'created_at' => $request->created_at->format('M d, Y g:i A'),
                ];
            }),
            'meta' => [
                'current_page' => $requestsPaginated->currentPage(),
                'last_page' => $requestsPaginated->lastPage(),
                'from' => $requestsPaginated->firstItem(),
                'to' => $requestsPaginated->lastItem(),
                'total' => $requestsPaginated->total(),
                'per_page' => $requestsPaginated->perPage(),
            ],
        ];
    }

    public function createRequest(array $data)
    {
        // TODO: WALAY MODAL THINGY SA LOCATION
        // Get default location if not provided
        $locationId = $data['location_id'] ?? \App\Models\Location::first()?->id;
        
        if (!$locationId) {
            throw new \Exception('No location available. Please create a location first.');
        }

        $request = RestockRequest::create([
            'request_number' => RestockRequest::generateRequestNumber(),
            'location_id' => $locationId,
            'requested_by_user_id' => $data['requested_by_user_id'],
            'status' => 'pending',
            'priority' => $data['priority'] ?? 'normal',
            'needed_by_date' => $data['needed_by_date'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        // Create items
        if (!empty($data['items'])) {
            foreach ($data['items'] as $item) {
                $request->items()->create([
                    'product_variant_id' => $item['product_variant_id'],
                    'current_qty' => $item['current_qty'] ?? 0,
                    'reorder_level' => $item['reorder_level'] ?? 0,
                    'requested_qty' => $item['requested_qty'],
                    'supplier_id' => $item['supplier_id'] ?? null,
                ]);
            }
        }

        return $request;
    }

    public function approveRequest(int $id, int $approvedByUserId)
    {
        $request = $this->repo->findById($id);
        
        if (!$request || !$request->isPending()) {
            return false;
        }

        $request->update([
            'status' => 'approved',
            'approved_by_user_id' => $approvedByUserId,
        ]);

        return true;
    }

    public function rejectRequest(int $id, int $approvedByUserId)
    {
        $request = $this->repo->findById($id);
        
        if (!$request || !$request->isPending()) {
            return false;
        }

        $request->update([
            'status' => 'rejected',
            'approved_by_user_id' => $approvedByUserId,
        ]);

        return true;
    }
}