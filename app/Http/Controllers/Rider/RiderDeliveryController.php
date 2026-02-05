<?php

namespace App\Http\Controllers\Rider;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RiderDeliveryController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Get deliveries assigned to this rider
        $deliveries = Delivery::with(['sale.items.productVariant.product', 'customer', 'address'])

            ->where('assigned_rider_user_id', $user->id)
            ->orderBy('scheduled_at', 'desc')
            ->get()
            ->map(function ($delivery) {
                return [
                    'id' => $delivery->id,
                    'code' => $delivery->delivery_number,
                    'delivery_type' => 'delivery',
                    'scheduled_at' => $delivery->scheduled_at?->format('M d, Y g:i A'),
                    'created_at' => $delivery->created_at?->format('Y-m-d H:i'),
                    'status' => $delivery->status,
                    
                    'customer_name' => $delivery->customer?->name,
                    'customer_phone' => $delivery->customer?->phone,
                    'address' => $delivery->address 
                        ? trim(($delivery->address->address_line1 ?? '') . ' ' . ($delivery->address->address_line2 ?? '')) . ', ' . ($delivery->address->barangay ?? '') . ', ' . ($delivery->address->city ?? '')
                        : 'No address provided',
                    'barangay' => $delivery->address?->barangay,
                    'landmark' => null, // Not in your schema
                    'instructions' => null, // Not in your schema
                    
                    'payment_method' => $delivery->sale?->payments?->first()?->paymentMethod?->method_key,
                    'payment_status' => $delivery->sale?->status === 'paid' ? 'prepaid' : 'unpaid',
                    'amount_total' => '₱' . number_format($delivery->sale?->grand_total ?? 0, 2),
                    'delivery_fee' => '₱50.00',
                    
                    'distance_km' => null,
                    'eta_mins' => null,
                    
                    'items' => $delivery->sale?->items->map(function ($item) {
                        return [
                            'name' => $item->productVariant?->product?->name . ' ' . $item->productVariant?->variant_name,
                            'qty' => $item->qty,
                        ];
                    })->toArray() ?? [],
                    
                    'notes' => $delivery->notes,
                ];
            });

        return Inertia::render('RiderPage/MyDeliveries', [
            'deliveries' => $deliveries,
        ]);
    }

    public function updateStatus(Request $request, Delivery $delivery)
    {
        $user = $request->user();

        // Verify this delivery is assigned to the rider
        if ($delivery->assigned_rider_user_id !== $user->id) {
            abort(403, 'This delivery is not assigned to you.');
        }

        $request->validate([
            'status' => 'required|in:in_transit,delivered,failed',
        ]);

        $delivery->update([
            'status' => $request->status,
            'dispatched_at' => $request->status === 'in_transit' && !$delivery->dispatched_at
                ? now() 
                : $delivery->dispatched_at,
            'delivered_at' => $request->status === 'delivered' 
                ? now() 
                : $delivery->delivered_at,
        ]);

        return redirect()->back()->with('success', 'Delivery status updated.');
    }

    public function updateNote(Request $request, Delivery $delivery)
    {
        $user = $request->user();

        // Verify this delivery is assigned to the rider
        if ($delivery->assigned_rider_user_id !== $user->id) {
            abort(403, 'This delivery is not assigned to you.');
        }

        $request->validate([
            'note' => 'nullable|string|max:1000',
        ]);

        $delivery->update([
            'notes' => $request->note,
        ]);

        return redirect()->back()->with('success', 'Note saved.');
    }
}
