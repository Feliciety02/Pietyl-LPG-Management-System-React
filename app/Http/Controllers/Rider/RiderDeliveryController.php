<?php

namespace App\Http\Controllers\Rider;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Services\Rider\DeliveryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Support\Carbon;

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
            'proof_photo' => 'nullable|image|max:5120',
            'proof_photo_data' => 'nullable|string',
            'proof_signature' => 'nullable|string',
            'proof_geo_lat' => 'nullable|numeric|between:-90,90',
            'proof_geo_lng' => 'nullable|numeric|between:-180,180',
            'proof_captured_at' => 'nullable|date',
            'proof_exceptions' => 'nullable|string|max:2000',
            'delivered_items' => 'nullable',
        ]);

        $normalizedStatus = strtolower(trim((string) $request->input('status')));
        $requiresProof = $normalizedStatus === Delivery::STATUS_DELIVERED;

        $proofPhotoUrl = null;
        if ($request->hasFile('proof_photo')) {
            $path = $request->file('proof_photo')->store('pod', 'public');
            $proofPhotoUrl = Storage::disk('public')->url($path);
        }
        if (!$proofPhotoUrl) {
            $proofPhotoUrl = $this->storeDataUrlImage($request->input('proof_photo_data'), 'photo');
        }

        $proofSignatureUrl = $this->storeDataUrlImage($request->input('proof_signature'), 'signature');

        $proofCapturedAt = $request->input('proof_captured_at');
        $proofGeoLat = $request->input('proof_geo_lat');
        $proofGeoLng = $request->input('proof_geo_lng');
        $proofExceptions = $request->input('proof_exceptions');

        $deliveredItems = $this->normalizeDeliveredItems($request->input('delivered_items'));
        if ($requiresProof && $deliveredItems === null) {
            $deliveredItems = $this->buildDeliveredItemsFallback($delivery);
        }

        if ($requiresProof) {
            $hasProof = $proofPhotoUrl || $proofSignatureUrl || $delivery->proof_photo_url || $delivery->proof_signature_url;
            if (!$hasProof) {
                abort(422, 'Proof of delivery photo or signature is required.');
            }
        }

        DB::transaction(function () use (
            $delivery,
            $request,
            $user,
            $proofPhotoUrl,
            $proofSignatureUrl,
            $proofCapturedAt,
            $proofGeoLat,
            $proofGeoLng,
            $proofExceptions,
            $deliveredItems
        ) {
            $normalizedStatus = strtolower(trim((string) $request->input('status')));

            if ($normalizedStatus === Delivery::STATUS_DELIVERED) {
                if ($proofPhotoUrl) {
                    $delivery->proof_photo_url = $proofPhotoUrl;
                }
                if ($proofSignatureUrl) {
                    $delivery->proof_signature_url = $proofSignatureUrl;
                }

                if ($proofGeoLat !== null) {
                    $delivery->proof_geo_lat = (float) $proofGeoLat;
                }
                if ($proofGeoLng !== null) {
                    $delivery->proof_geo_lng = (float) $proofGeoLng;
                }

                if ($proofCapturedAt) {
                    $delivery->proof_captured_at = Carbon::parse($proofCapturedAt);
                } elseif (!$delivery->proof_captured_at) {
                    $delivery->proof_captured_at = now();
                }

                if ($proofExceptions !== null) {
                    $delivery->proof_exceptions = $proofExceptions;
                }

                if (is_array($deliveredItems)) {
                    $delivery->delivered_items = $deliveredItems;
                }

                if ($proofPhotoUrl) {
                    $delivery->proof_type = 'photo';
                    $delivery->proof_url = $proofPhotoUrl;
                } elseif ($proofSignatureUrl) {
                    $delivery->proof_type = 'signature';
                    $delivery->proof_url = $proofSignatureUrl;
                }
            }

            $this->deliveryService->updateDeliveryStatus(
                delivery: $delivery,
                newStatus: $request->status,
                user: $user
            );
        });

        return redirect()->back()->with('success', 'Delivery status updated.');
    }

    private function storeDataUrlImage(?string $dataUrl, string $prefix): ?string
    {
        if (!$dataUrl) {
            return null;
        }

        if (!preg_match('/^data:image\\/(png|jpe?g|webp);base64,/', $dataUrl, $matches)) {
            return null;
        }

        $payload = substr($dataUrl, strpos($dataUrl, ',') + 1);
        $binary = base64_decode($payload);

        if ($binary === false) {
            return null;
        }

        $ext = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
        $path = 'pod/' . $prefix . '-' . Str::uuid() . '.' . $ext;

        Storage::disk('public')->put($path, $binary);

        return Storage::disk('public')->url($path);
    }

    private function normalizeDeliveredItems($raw): ?array
    {
        if ($raw === null) {
            return null;
        }

        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return null;
            }
            $raw = $decoded;
        }

        if (!is_array($raw)) {
            return null;
        }

        $normalized = [];

        foreach ($raw as $item) {
            if (!is_array($item)) {
                continue;
            }

            $ordered = $item['ordered_qty'] ?? $item['qty'] ?? null;
            $delivered = $item['delivered_qty'] ?? null;

            if (!is_numeric($delivered)) {
                continue;
            }

            $orderedQty = is_numeric($ordered) ? (float) $ordered : (float) $delivered;
            $deliveredQty = max(0, (float) $delivered);

            $normalized[] = [
                'sale_item_id' => isset($item['sale_item_id']) ? (int) $item['sale_item_id'] : null,
                'product_variant_id' => isset($item['product_variant_id']) ? (int) $item['product_variant_id'] : null,
                'name' => (string) ($item['name'] ?? 'Item'),
                'ordered_qty' => $orderedQty,
                'delivered_qty' => $deliveredQty,
            ];
        }

        return $normalized;
    }

    private function buildDeliveredItemsFallback(Delivery $delivery): array
    {
        $delivery->loadMissing(['sale.items.productVariant.product', 'items']);

        $saleItems = $delivery->sale?->items ?? collect();
        if ($saleItems->isNotEmpty()) {
            return $saleItems->map(function ($item) {
                $productName = $item->productVariant?->product?->name ?? '';
                $variantName = $item->productVariant?->variant_name ?? '';
                $fullName = trim($productName . ' ' . ($variantName !== '' ? '(' . $variantName . ')' : ''));

                $qty = is_numeric($item->qty ?? null) ? (float) $item->qty : 0;

                return [
                    'sale_item_id' => (int) ($item->id ?? 0),
                    'product_variant_id' => (int) ($item->product_variant_id ?? 0),
                    'name' => $fullName !== '' ? $fullName : 'Item',
                    'ordered_qty' => $qty,
                    'delivered_qty' => $qty,
                ];
            })->values()->all();
        }

        $deliveryItems = $delivery->items ?? collect();
        if ($deliveryItems->isNotEmpty()) {
            return $deliveryItems->map(function ($item) {
                $fullName = trim(($item->product_name ?? '') . ' ' . ($item->variant ? '(' . $item->variant . ')' : ''));
                $qty = is_numeric($item->qty ?? null) ? (float) $item->qty : 0;

                return [
                    'sale_item_id' => null,
                    'product_variant_id' => (int) ($item->product_variant_id ?? 0),
                    'name' => $fullName !== '' ? $fullName : 'Item',
                    'ordered_qty' => $qty,
                    'delivered_qty' => $qty,
                ];
            })->values()->all();
        }

        return [];
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
