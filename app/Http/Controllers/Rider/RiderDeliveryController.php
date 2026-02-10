<?php

namespace App\Http\Controllers\Rider;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Services\Rider\DeliveryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RiderDeliveryController extends Controller
{
    public function __construct(
        private DeliveryService $deliveryService
    ) {}

    public function index(Request $request)
    {
       
        $user = $request->user();

        $deliveries = $this->deliveryService->getRiderDeliveries(
            rider: $user,
            search: null,
            status: null
        );
        
        return Inertia::render('RiderPage/MyDeliveries', [
            'deliveries' => $deliveries,
        ]);
    }

    public function updateStatus(Request $request, Delivery $delivery)
    {
        $user = $request->user();

        if ($delivery->assigned_rider_user_id !== $user->id) {
            abort(403, 'This delivery is not assigned to you.');
        }

        $request->validate([
            'status' => 'required|in:in_transit,delivered,failed',
        ]);

        DB::transaction(function () use ($delivery, $request, $user) {
            $this->deliveryService->updateDeliveryStatus(
                delivery: $delivery,
                newStatus: $request->status,
                user: $user
            );
        });

        return redirect()->back()->with('success', 'Delivery status updated.');
    }

    public function updateNote(Request $request, Delivery $delivery)
    {
        $user = $request->user();

        if ($delivery->assigned_rider_user_id !== $user->id) {
            abort(403, 'This delivery is not assigned to you.');
        }

        $request->validate([
            'note' => 'nullable|string|max:1000',
        ]);

        $this->deliveryService->updateDeliveryNote($delivery, $request->note);

        return redirect()->back()->with('success', 'Note saved.');
    }

    public function history(Request $request)
    {
        $user = $request->user();

        $filters = [
            'q' => $request->input('q', ''),
            'status' => $request->input('status', 'all'),
            'payment' => $request->input('payment', 'all'),
            'date_from' => $request->input('date_from', ''),
            'date_to' => $request->input('date_to', ''),
        ];

        $perPage = (int) $request->input('per', 10);

        $deliveries = $this->deliveryService->getRiderDeliveryHistory(
            rider: $user,
            filters: $filters,
            perPage: $perPage
        );

        return Inertia::render('RiderPage/History', [
            'deliveries' => $deliveries,
            'filters' => [
                'q' => $filters['q'],
                'status' => $filters['status'],
                'payment' => $filters['payment'],
                'date_from' => $filters['date_from'],
                'date_to' => $filters['date_to'],
                'per' => $perPage,
            ],
        ]);
    }
}