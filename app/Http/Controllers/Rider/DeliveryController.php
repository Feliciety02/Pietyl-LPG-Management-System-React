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

        // ── Auth: rider must own this delivery (BB_DLM_007) ─────────────────
        if ((int) $delivery->assigned_rider_user_id !== (int) $user->id) {
            abort(403, 'You are not assigned to this delivery.');
        }

        // ── Layer 1: basic field presence & types ────────────────────────────
        $request->validate([
            'status'           => ['required', 'string'],
            'failed_reason'    => ['nullable', 'string', 'max:500'],  // BB_DLM_014
            // Proof fields — validated conditionally below
            'proof_geo_lat'    => ['nullable', 'numeric', 'between:-90,90'],
            'proof_geo_lng'    => ['nullable', 'numeric', 'between:-180,180'],
            'proof_captured_at'=> ['nullable', 'date'],
            'proof_exceptions' => ['nullable', 'string', 'max:2000'],
            'delivered_items'  => ['nullable', 'string'], // JSON string, decoded below
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
            'on_the_way',
        ];

        // ── Layer 2: status value must be in the allowed list ────────────────
        if (!in_array($nextStatus, $allowed, true)) {
            abort(422, 'Invalid status.');
        }

        $normalized = $nextStatus === 'on_the_way' ? Delivery::STATUS_IN_TRANSIT : $nextStatus;

        // ── BB_DLM_015: terminal state guard — outside transaction for clean 422 to axios ──
        $currentStatus = strtolower((string) $delivery->status);
        if (in_array($currentStatus, [Delivery::STATUS_DELIVERED, Delivery::STATUS_CANCELLED], true)) {
            abort(422, 'Delivery is already ' . $currentStatus . ' and cannot be updated.');
        }

        // ── BB_DLM_014: failed delivery requires a reason ────────────────────
        if ($normalized === Delivery::STATUS_FAILED) {
            $failedReason = trim((string) $request->input('failed_reason', ''));
            if ($failedReason === '') {
                abort(422, 'A reason is required when marking a delivery as failed.');
            }
        }

        // ── Layer 3: proof of delivery — required when marking delivered ──────
        if ($normalized === Delivery::STATUS_DELIVERED) {

            $hasPhoto     = $request->hasFile('proof_photo') || filled($request->input('proof_photo_data'));
            $hasSignature = filled($request->input('proof_signature'));

            if (!$hasPhoto && !$hasSignature) {
                abort(422, 'A delivery photo or customer signature is required before marking as delivered.');
            }

            // ── Layer 4: delivered_items — required, valid, non-negative ──────
            $rawItems = $request->input('delivered_items');

            if (blank($rawItems)) {
                abort(422, 'Delivered item quantities are required.');
            }

            $decodedItems = json_decode($rawItems, true);

            if (!is_array($decodedItems) || count($decodedItems) === 0) {
                abort(422, 'Delivered items must be a valid non-empty list.');
            }

            foreach ($decodedItems as $index => $item) {
                $orderedQty   = isset($item['ordered_qty'])  ? (int) $item['ordered_qty']  : null;
                $deliveredQty = isset($item['delivered_qty']) ? (int) $item['delivered_qty'] : null;

                if ($deliveredQty === null || $deliveredQty < 0) {
                    abort(422, 'Item #' . ($index + 1) . ' has an invalid delivered quantity (must be 0 or more).');
                }

                // ── Layer 5: delivered qty must not exceed ordered qty ────────
                if ($orderedQty !== null && $deliveredQty > $orderedQty) {
                    $name = $item['name'] ?? 'Item #' . ($index + 1);
                    abort(422, "Delivered quantity for \"{$name}\" ({$deliveredQty}) exceeds the ordered quantity ({$orderedQty}).");
                }
            }
        }

        DB::transaction(function () use ($delivery, $normalized, $user, $request) {
            $delivery->loadMissing(['items']);

            $from = strtolower((string) $delivery->status);

            // ── Layer 6: strict status transition rules ───────────────────────
            if ($from === Delivery::STATUS_PENDING || $from === Delivery::STATUS_ASSIGNED) {
                if (!in_array($normalized, [Delivery::STATUS_IN_TRANSIT, Delivery::STATUS_FAILED, Delivery::STATUS_CANCELLED], true)) {
                    abort(422, 'Invalid status transition from pending/assigned.');
                }
            }

            if ($from === Delivery::STATUS_IN_TRANSIT) {
                if (!in_array($normalized, [Delivery::STATUS_DELIVERED, Delivery::STATUS_FAILED, Delivery::STATUS_CANCELLED], true)) {
                    abort(422, 'Invalid status transition from in_transit.');
                }
            }

            // Set timestamps
            if ($normalized === Delivery::STATUS_IN_TRANSIT && $delivery->dispatched_at === null) {
                $delivery->dispatched_at = now();
            }

            if ($normalized === Delivery::STATUS_DELIVERED) {
                // Stock out per item
                $service    = app(InventoryService::class);
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

                // Persist proof fields
                if ($request->hasFile('proof_photo')) {
                    $delivery->proof_photo_path = $request->file('proof_photo')->store('proof/photos', 'public');
                } elseif (filled($request->input('proof_photo_data'))) {
                    $delivery->proof_photo_path = $request->input('proof_photo_data'); // base64 or URL
                }

                if (filled($request->input('proof_signature'))) {
                    $delivery->proof_signature = $request->input('proof_signature');
                }

                if (filled($request->input('proof_geo_lat'))) {
                    $delivery->proof_geo_lat = (float) $request->input('proof_geo_lat');
                }

                if (filled($request->input('proof_geo_lng'))) {
                    $delivery->proof_geo_lng = (float) $request->input('proof_geo_lng');
                }

                if (filled($request->input('proof_captured_at'))) {
                    $delivery->proof_captured_at = $request->input('proof_captured_at');
                }

                if (filled($request->input('proof_exceptions'))) {
                    $delivery->proof_exceptions = $request->input('proof_exceptions');
                }

                if (filled($request->input('delivered_items'))) {
                    $delivery->delivered_items = $request->input('delivered_items'); // store raw JSON
                }
            }

            // ── BB_DLM_014: persist failed reason ───────────────────────────────
            if ($normalized === Delivery::STATUS_FAILED) {
                $delivery->failed_reason = trim((string) $request->input('failed_reason', ''));
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

        $parts = array_filter([
            $addr->address_line ?? null,
            $addr->barangay ?? null,
            $addr->city ?? null,
            $addr->province ?? null,
        ]);

        return implode(', ', $parts);
    }
}