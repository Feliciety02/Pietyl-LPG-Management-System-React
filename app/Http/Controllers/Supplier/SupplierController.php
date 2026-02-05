<?php

namespace App\Http\Controllers\Supplier;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\SupplierService;
use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\AuditLog;
use App\Models\InventoryBalance;


class SupplierController extends Controller
{
    protected $svc;

    public function __construct(SupplierService $svc)
    {
        $this->svc = $svc;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->canAny(['admin.suppliers.view', 'inventory.suppliers.view'])) {
            abort(403);
        }

        $filters = [
            'q'      => $request->input('q', ''),
            'status' => $request->input('status', 'all'),
            'per'    => $request->input('per', 10),
            'page'   => $request->input('page', 1),
        ];

        $suppliers = $this->svc->getSuppliersForPage($filters);

        return Inertia::render('AdminPage/Suppliers', [
            'suppliers' => $suppliers,
            'filters'   => $filters,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.suppliers.create')) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contact_name' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $payload = $this->normalizeSupplierPayload($validated) + ['is_active' => true];

        $supplier = Supplier::create($payload);

        $this->logSupplierAction($request, 'supplier.created', $supplier, [], $supplier->only([
            'id', 'name', 'contact_name', 'phone', 'email', 'address', 'notes', 'is_active',
        ]));

        return redirect()->back();
    }

    public function update(Request $request, Supplier $supplier)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.suppliers.update')) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contact_name' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $before = $supplier->only([
            'id',
            'name',
            'contact_name',
            'phone',
            'email',
            'address',
            'notes',
            'is_active',
        ]);

        $supplier->update($this->normalizeSupplierPayload($validated));

        $this->logSupplierAction($request, 'supplier.updated', $supplier, $before, $supplier->only([
            'id',
            'name',
            'contact_name',
            'phone',
            'email',
            'address',
            'notes',
            'is_active',
        ]));

        return redirect()->back();
    }

    public function archive(Request $request, Supplier $supplier)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.suppliers.archive')) {
            abort(403);
        }

        $supplier->update([
            'is_active' => false,
            'archived_at' => now(),
        ]);

        $this->logSupplierAction($request, 'supplier.archived', $supplier, [
            'is_active' => true,
        ], [
            'is_active' => false,
        ]);

        return redirect()->back();
    }

    public function restore(Request $request, Supplier $supplier)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.suppliers.archive')) {
            abort(403);
        }

        $supplier->update([
            'is_active' => true,
            'archived_at' => null,
        ]);

        $this->logSupplierAction($request, 'supplier.restored', $supplier, [
            'is_active' => false,
        ], [
            'is_active' => true,
        ]);

        return redirect()->back();
    }

    public function details(Request $request, Supplier $supplier)
    {
        $user = $request->user();
        if (!$user || !$user->canAny(['admin.suppliers.view', 'inventory.suppliers.view'])) {
            abort(403);
        }

        $supplier->load('productVariants.product');

        $variantIds = $supplier->productVariants->pluck('id')->all();
        $balanceMap = InventoryBalance::query()
            ->selectRaw('product_variant_id, SUM(qty_filled + qty_empty) as on_hand')
            ->when($variantIds, function ($query, $ids) {
                return $query->whereIn('product_variant_id', $ids);
            })
            ->groupBy('product_variant_id')
            ->pluck('on_hand', 'product_variant_id');

        $items = $supplier->productVariants
            ->map(function ($variant) use ($balanceMap) {
                return [
                    'id' => $variant->id,
                    'product_name' => $variant->product?->name,
                    'variant_name' => $variant->variant_name,
                    'category' => $variant->product?->category,
                    'sku' => $variant->product?->sku,
                    'price' => $variant->product?->price,
                    'stock' => (int) ($balanceMap[$variant->id] ?? 0),
                    'status' => $variant->is_active ? 'Active' : 'Archived',
                ];
            })
            ->values();

        return response()->json([
            'supplier' => [
                'id' => $supplier->id,
                'name' => $supplier->name,
                'contact_name' => $supplier->contact_name,
                'phone' => $supplier->phone,
                'email' => $supplier->email,
                'address' => $supplier->address,
                'notes' => $supplier->notes,
                'is_active' => $supplier->is_active,
            ],
            'items' => $items,
        ]);
    }

    private function logSupplierAction(Request $request, string $action, Supplier $supplier, array $before = [], array $after = []): void
    {
        AuditLog::create([
            'actor_user_id' => $request->user()?->id,
            'action' => $action,
            'entity_type' => Supplier::class,
            'entity_id' => $supplier->id,
            'message' => ucfirst(str_replace('_', ' ', $action)) . " ({$supplier->name})",
            'before_json' => $before ?: null,
            'after_json' => $after ?: null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }

    private function normalizeSupplierPayload(array $payload): array
    {
        return [
            'name' => trim($payload['name']),
            'contact_name' => $this->normalizeNullableString($payload['contact_name'] ?? null),
            'phone' => $this->normalizeNullableString($payload['phone'] ?? null),
            'email' => $this->normalizeNullableString($payload['email'] ?? null),
            'address' => $this->normalizeNullableString($payload['address'] ?? null),
            'notes' => $this->normalizeNullableString($payload['notes'] ?? null),
        ];
    }

    private function normalizeNullableString(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }
}
