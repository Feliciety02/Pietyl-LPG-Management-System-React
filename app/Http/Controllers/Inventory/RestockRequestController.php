<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Services\RestockRequestService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RestockRequestController extends Controller
{
    protected RestockRequestService $svc;

    public function __construct(RestockRequestService $svc)
    {
        $this->svc = $svc;
    }

    public function index(Request $request)
    {
        $filters = $request->only(['q', 'status', 'priority', 'per', 'page']);
        $requests = $this->svc->getRequestsForPage($filters);

        return Inertia::render('InventoryPage/Purchases', [
            'purchase_requests' => $requests,  // ← Frontend expects this name
            'filters' => $filters,
        ]);
    }

    public function store(Request $request)
    {
        // TODO: LACKING INFORMATION FOR RESTOCK REQUEST CREATION ON request
        $data = $request->all();
        $data['requested_by_user_id'] = auth()->id();

        $this->svc->createRequest($data);

        return redirect()->back()->with('success', 'Purchase request created successfully');
    }

    public function approve(Request $request, int $id)
    {
        $success = $this->svc->approveRequest($id, auth()->id());

        if (!$success) {
            return redirect()->back()->with('error', 'Unable to approve request');
        }

        return redirect()->back()->with('success', 'Request approved successfully');
    }

    public function reject(Request $request, int $id)
    {
        $success = $this->svc->rejectRequest($id, auth()->id());

        if (!$success) {
            return redirect()->back()->with('error', 'Unable to reject request');
        }

        return redirect()->back()->with('success', 'Request rejected');
    }
}