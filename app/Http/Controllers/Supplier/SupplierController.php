<?php

namespace App\Http\Controllers\Supplier;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\SupplierService;
use App\Http\Controllers\Controller;
use App\Models\Supplier;


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
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
        ]);

        Supplier::create([
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'address' => $validated['address'] ?? null,
            'is_active' => true,
        ]);

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
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
        ]);

        $supplier->update([
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'address' => $validated['address'] ?? null,
        ]);

        return redirect()->back();
    }

    public function archive(Request $request, Supplier $supplier)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.suppliers.archive')) {
            abort(403);
        }

        $supplier->update(['is_active' => false]);

        return redirect()->back();
    }

    public function restore(Request $request, Supplier $supplier)
    {
        $user = $request->user();
        if (!$user || !$user->can('admin.suppliers.archive')) {
            abort(403);
        }

        $supplier->update(['is_active' => true]);

        return redirect()->back();
    }
}
