<?php

namespace App\Http\Controllers\Rider;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DeliveryController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $q = trim((string) $request->query('q', ''));
        $status = trim((string) $request->query('status', 'all'));

        $deliveriesQuery = Delivery::query()
            ->with([
                'customer',
                'address',
                'items',
            ])
            ->where('assigned_rider_user_id', $user->id)
            ->orderByDesc('created_at');

        if ($q !== '') {
            $deliveriesQuery->where(function ($qq) use ($q) {
                $qq->where('delivery_number', 'like', "%{$q}%")
                    ->orWhereHas('customer', function ($qc) use ($q) {
                        $qc->where('name', 'like', "%{$q}%");
                    })
                    ->orWhereHas('address', function ($qa) use ($q) {
                        $qa->where('address_line', 'like', "%{$q}%");
                    });
            });
        }

        if ($status !== '' && $status !== 'all') {
            $deliveriesQuery->where('status', $status);
        }

        $deliveries = $deliveriesQuery->get()->map(function ($d) {
            $customerName = $d->customer?->name ?? 'Customer';
            $phone = $d->customer?->phone ?? '';
            $addressText = $this->formatAddress($d);

            $items = $d->items->map(function ($it) {
                $name = trim(($it->product_name ?? '') . ' ' . ($it->variant ? '(' . $it->variant . ')' : ''));
                return [
                    'name' => $name !== '' ? $name : 'Item',
                    'qty' => (int) ($it->qty ?? 0),
                ];
            })->values();

            return [
                'id' => $d->id,
                'code' => $d->delivery_number,
                'delivery_type' => 'delivery',

                'scheduled_at' => $d->scheduled_at ? $d->scheduled_at->format('M d, Y g:i A') : '',
                'created_at' => $d->created_at ? $d->created_at->format('Y-m-d H:i') : '',
                'status' => (string) $d->status,

                'customer_name' => $customerName,
                'customer_phone' => $phone,

                'address' => $addressText,
                'barangay' => $d->address?->barangay ?? '',
                'landmark' => $d->address?->landmark ?? '',
                'instructions' => $d->address?->instructions ?? '',

                // Optional placeholders if you later add these fields to deliveries or pull from sale
                'payment_method' => $d->sale?->payment_method ?? '',
                'payment_status' => $d->sale?->payment_status ?? '',
                'amount_total' => $d->sale?->total_amount ?? '',
                'delivery_fee' => $d->sale?->delivery_fee ?? '',

                'distance_km' => $d->distance_km ?? '',
                'eta_mins' => $d->eta_mins ?? '',

                'items' => $items,
                'notes' => (string) ($d->notes ?? ''),
            ];
        });

        return Inertia::render('Dashboard/Rider/MyDeliveries', [
            'deliveries' => $deliveries,
            'filters' => [
                'q' => $q,
                'status' => $status,
            ],
        ]);
    }

    public function update(Request $request, Delivery $delivery)
    {
        $user = $request->user();

        if ((int) $delivery->assigned_rider_user_id !== (int) $user->id) {
            abort(403);
        }

        $request->validate([
            'status' => ['required', 'string'],
        ]);

        $nextStatus = strtolower(trim((string) $request->input('status')));

        $allowed = [
            Delivery::STATUS_PENDING,
            Delivery::STATUS_ASSIGNED,
            Delivery::STATUS_DISPATCHED,
            Delivery::STATUS_IN_TRANSIT,
            Delivery::STATUS_DELIVERED,
            Delivery::STATUS_FAILED,
            Delivery::STATUS_CANCELLED,
            // allow "on_the_way" from UI
            'on_the_way',
        ];

        if (!in_array($nextStatus, $allowed, true)) {
            return back()->withErrors(['status' => 'Invalid status.']);
        }

        $normalized = $nextStatus === 'on_the_way' ? Delivery::STATUS_IN_TRANSIT : $nextStatus;

        DB::transaction(function () use ($delivery, $normalized, $user) {
            $delivery->loadMissing(['items']);

            $from = strtolower((string) $delivery->status);

            // Optional strict transitions
            // pending -> in_transit or failed/cancelled
            // in_transit -> delivered or failed
            // anything else stays guarded
            if ($from === Delivery::STATUS_PENDING) {
                if (!in_array($normalized, [Delivery::STATUS_IN_TRANSIT, Delivery::STATUS_FAILED, Delivery::STATUS_CANCELLED], true)) {
                    abort(422, 'Invalid status transition.');
                }
            }

            if ($from === Delivery::STATUS_IN_TRANSIT) {
                if (!in_array($normalized, [Delivery::STATUS_DELIVERED, Delivery::STATUS_FAILED, Delivery::STATUS_CANCELLED], true)) {
                    abort(422, 'Invalid status transition.');
                }
            }

            // Set timestamps
            if ($normalized === Delivery::STATUS_IN_TRANSIT && $delivery->dispatched_at == null) {
                $delivery->dispatched_at = now();
            }

            if ($normalized === Delivery::STATUS_DELIVERED) {
                // STOCK OUT happens here
                $service = app(InventoryService::class);
                $locationId = (int) ($user->location_id ?? 1);

                foreach ($delivery->items as $item) {
                    $service->stockOut(
                        productVariantId: (int) $item->product_variant_id,
                        locationId: $locationId,
                        qty: (int) $item->qty,
                        userId: (int) $user->id,
                        referenceType: 'delivery',
                        referenceId: (string) $delivery->id
                    );
                }

                $delivery->delivered_at = now();
            }

            $delivery->status = $normalized;
            $delivery->save();
        });

        return back();
    }

    public function updateNote(Request $request, Delivery $delivery)
    {
        $user = $request->user();

        if ((int) $delivery->assigned_rider_user_id !== (int) $user->id) {
            abort(403);
        }

        $request->validate([
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        $delivery->notes = $request->input('note');
        $delivery->save();

        return back();
    }

    private function formatAddress(Delivery $delivery): string
    {
        $addr = $delivery->address;

        if (!$addr) return '';

        // Adjust these field names if your CustomerAddress columns differ
        $parts = array_filter([
            $addr->address_line ?? null,
            $addr->barangay ?? null,
            $addr->city ?? null,
            $addr->province ?? null,
        ]);

        return implode(', ', $parts);
    }
}
