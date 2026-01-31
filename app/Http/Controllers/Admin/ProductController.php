<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query()
            ->with(['variants', 'supplier'])
            ->orderByDesc('created_at');

        if ($request->filled('q')) {
            $search = $request->input('q');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('is_active', $request->status === 'active');
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('category', $request->type);
        }

        if ($request->filled('supplier_id') && $request->supplier_id !== 'all') {
            $supplierId = $request->supplier_id;
            $query->where('supplier_id', $supplierId);
        }

        $products = $query->paginate($request->input('per', 10));

        $rows = $products->getCollection()->map(function (Product $product) {
            $variant = $product->variants->first();
            $supplier = $product->supplier;

            return [
                'id' => $product->id,
                'sku' => $product->sku,
                'name' => $product->name,
                'brand' => null,
                'type' => $product->category,
                'size_label' => $variant?->size_value && $variant?->size_unit
                    ? rtrim(rtrim(number_format((float) $variant->size_value, 3, '.', ''), '0'), '.') .
                      $variant->size_unit
                    : null,
                'price' => number_format((float) $product->price, 2, '.', ''),
                'is_active' => $product->is_active,
                'image_url' => null,
                'supplier' => $supplier ? ['id' => $supplier->id, 'name' => $supplier->name] : null,
            ];
        });

        return \Inertia\Inertia::render('AdminPage/Products', [
            'products' => [
                'data' => $rows,
                'meta' => [
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                    'from' => $products->firstItem(),
                    'to' => $products->lastItem(),
                    'total' => $products->total(),
                ],
            ],
            'suppliers' => \App\Models\Supplier::where('is_active', true)->get(['id', 'name']),
            'filters' => $request->only(['q', 'status', 'supplier_id', 'type', 'per']),
        ]);
    }

    public function store(Request $request)
    {
        $priceRaw = (string) $request->input('price', '');
        $supplierCostRaw = (string) $request->input('supplier_cost', '');
        $request->merge([
            'price' => str_replace(',', '', $priceRaw),
            'supplier_cost' => str_replace(',', '', $supplierCostRaw),
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['required', 'string', 'max:100', 'unique:products,sku'],
            'type' => ['required', 'in:lpg,stove,accessories'],
            'size_label' => ['nullable', 'string', 'max:120'],
            'price' => ['required', 'numeric', 'min:0'],
            'supplier_cost' => ['nullable', 'numeric', 'min:0'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
        ]);

        return DB::transaction(function () use ($validated) {
            $userId = auth()->id();

            $product = Product::create([
                'sku' => $validated['sku'],
                'name' => $validated['name'],
                'category' => $validated['type'],
                'supplier_id' => $validated['supplier_id'],
                'supplier_cost' => $validated['supplier_cost'] ?? 0,
                'price' => $validated['price'],
                'created_by_user_id' => $userId,
            ]);

            [$sizeValue, $sizeUnit] = $this->parseSize($validated['size_label'] ?? null);
            [$sizeValue, $sizeUnit] = $this->applySizeDefaults(
                $validated['type'],
                $sizeValue,
                $sizeUnit
            );

            $variantName = $validated['name'];
            if (!empty($validated['size_label'])) {
                $variantName = trim($validated['name'] . ' ' . $validated['size_label']);
            }

            $variant = ProductVariant::create([
                'product_id' => $product->id,
                'variant_name' => $variantName,
                'size_value' => $sizeValue,
                'size_unit' => $sizeUnit,
                'container_type' => $validated['type'],
                'is_active' => true,
            ]);

            return redirect()->back();
        });
    }

    public function update(Request $request, Product $product)
    {
        $priceRaw = (string) $request->input('price', '');
        $supplierCostRaw = (string) $request->input('supplier_cost', '');
        $request->merge([
            'price' => str_replace(',', '', $priceRaw),
            'supplier_cost' => str_replace(',', '', $supplierCostRaw),
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:lpg,stove,accessories'],
            'size_label' => ['nullable', 'string', 'max:120'],
            'stove_type' => ['nullable', 'in:single,double'],
            'accessory_type' => ['nullable', 'in:hose,regulator,others'],
            'price' => ['required', 'numeric', 'min:0'],
            'supplier_cost' => ['nullable', 'numeric', 'min:0'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
        ]);

        return DB::transaction(function () use ($validated, $product) {
            $sku = $this->generateSku(
                $validated['type'],
                $validated['name'],
                $validated['size_label'] ?? null,
                $validated['stove_type'] ?? null,
                $validated['accessory_type'] ?? null,
                $product->sku
            );

            $product->update([
                'sku' => $sku,
                'name' => $validated['name'],
                'category' => $validated['type'],
                'supplier_id' => $validated['supplier_id'],
                'supplier_cost' => $validated['supplier_cost'] ?? 0,
                'price' => $validated['price'],
            ]);

            [$sizeValue, $sizeUnit] = $this->parseSize($validated['size_label'] ?? null);
            [$sizeValue, $sizeUnit] = $this->applySizeDefaults(
                $validated['type'],
                $sizeValue,
                $sizeUnit
            );

            $variantName = $validated['name'];
            if (!empty($validated['size_label'])) {
                $variantName = trim($validated['name'] . ' ' . $validated['size_label']);
            }

            $variant = ProductVariant::firstOrCreate(
                ['product_id' => $product->id],
                [
                    'variant_name' => $variantName,
                    'size_value' => $sizeValue,
                    'size_unit' => $sizeUnit,
                    'container_type' => $validated['type'],
                    'is_active' => true,
                ]
            );

            $variant->update([
                'variant_name' => $variantName,
                'size_value' => $sizeValue,
                'size_unit' => $sizeUnit,
                'container_type' => $validated['type'],
            ]);

            return redirect()->back();
        });
    }

    public function archive(Request $request, Product $product)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.products.archive')) {
            abort(403);
        }

        $product->update(['is_active' => false]);

        return redirect()->back();
    }

    public function restore(Request $request, Product $product)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.products.archive')) {
            abort(403);
        }

        $product->update(['is_active' => true]);

        return redirect()->back();
    }

    private function generateSku(
        string $type,
        string $name,
        ?string $sizeLabel,
        ?string $stoveType,
        ?string $accessoryType,
        ?string $currentSku
    ): string {
        $nameCode = $this->compactCode($name, 3);

        if ($type === 'lpg') {
            $sizeSlug = $this->slugifySku($sizeLabel ?? '');
            $base = $sizeSlug && $nameCode ? "LPG-{$sizeSlug}-{$nameCode}" : '';
            return $this->nextSequence($base, $currentSku);
        }

        if ($type === 'stove') {
            $stoveCode = $stoveType === 'double' ? 'DBL' : 'SNG';
            $base = $nameCode ? "STV-{$stoveCode}-{$nameCode}" : '';
            return $this->nextSequence($base, $currentSku);
        }

        if ($type === 'accessories') {
            $accCode = match ($accessoryType) {
                'hose' => 'HOSE',
                'regulator' => 'REG',
                default => 'OTH',
            };
            $base = $nameCode ? "ACC-{$accCode}-{$nameCode}" : '';
            return $this->nextSequence($base, $currentSku);
        }

        return $currentSku ?: '';
    }

    private function slugifySku(?string $value): string
    {
        return strtoupper(trim((string) $value))
            ? preg_replace('/[^A-Z0-9]+/', '-', strtoupper(trim((string) $value)))
            : '';
    }

    private function compactCode(string $value, int $max): string
    {
        $cleaned = preg_replace('/[^A-Z0-9]/', '', strtoupper($value));
        return substr($cleaned ?? '', 0, $max);
    }

    private function nextSequence(string $base, ?string $currentSku): string
    {
        if ($base === '') {
            return $currentSku ?: '';
        }

        $prefix = $base . '-';
        $max = Product::where('sku', 'like', $prefix . '%')
            ->selectRaw("MAX(CAST(SUBSTRING_INDEX(sku, '-', -1) AS UNSIGNED)) as max_seq")
            ->value('max_seq');

        $next = max((int) $max, 0) + 1;
        $candidate = $base . '-' . str_pad((string) $next, 3, '0', STR_PAD_LEFT);

        if ($currentSku && str_starts_with($currentSku, $prefix)) {
            return $currentSku;
        }

        return $candidate;
    }
    private function parseSize(?string $label): array
    {
        if (!$label) {
            return [null, null];
        }

        $clean = trim($label);
        if ($clean === '') {
            return [null, null];
        }

        if (preg_match('/([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z]+)/', $clean, $matches)) {
            return [(float) $matches[1], strtoupper($matches[2])];
        }

        return [null, null];
    }

    private function applySizeDefaults(string $type, $sizeValue, $sizeUnit): array
    {
        if ($sizeValue != null && $sizeUnit != null) {
            return [$sizeValue, $sizeUnit];
        }

        if ($type === 'accessories') {
            return [1, 'PC'];
        }

        if ($type === 'stove') {
            return [1, 'UNIT'];
        }

        return [$sizeValue, $sizeUnit];
    }

}
