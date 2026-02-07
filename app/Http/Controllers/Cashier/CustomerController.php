<?php

namespace App\Http\Controllers\Cashier;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\CustomerService;
use App\Models\Customer;

class CustomerController extends Controller
{
    protected CustomerService $svc;

    public function __construct(CustomerService $svc)
    {
        $this->svc = $svc;
    }

    public function index(Request $request)
    {
        if (!$this->canViewCustomers($request)) {
            abort(403);
        }

        $filters = $request->only(['q', 'per', 'page']);
        $customers = $this->svc->getCustomersForPage($filters);

        return Inertia::render('CashierPage/Customers', [
            'customers' => $customers,
            'filters' => $filters,
        ]);
    }

    public function store(Request $request)
    {   
        $user = $request->user();
        if (
            !$user ||
            (!$user->can('cashier.customers.create') && !$user->can('admin.customers.create'))
        ) {
            abort(403);
        }

        //TODO: BASIG NEED TO ADJUST VALIDATION RULES
        $validated = $request->validate([
        'name' => 'required|string|max:255',
        'phone' => 'nullable|string|max:50',
        'email' => 'nullable|email|max:255',
        'customer_type' => 'nullable|in:walkin,regular,corporate',
        'notes' => 'nullable|string',
        'address' => 'nullable|string|max:255',  // ← Simple address field
    ]);

        $this->svc->createCustomer($validated);

        return redirect()->back()->with('success', 'Customer created successfully');
    }

    public function update(Request $request, Customer $customer)
    {
        $user = $request->user();
        if (!$user || !$user->can('cashier.customers.update')) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'customer_type' => 'required|in:walkin,regular,corporate',
            'notes' => 'nullable|string',
            'address_line1' => 'nullable|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'barangay' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'province' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:20',
        ]);

        $this->svc->updateCustomer($customer, $validated);

        return redirect()->back()->with('success', 'Customer updated successfully');
    }

    public function show(Request $request, Customer $customer)
    {
        if (!$this->canViewCustomers($request)) {
            abort(403);
        }

        $customer->load('addresses');

        return Inertia::render('Cashier/CustomerShow', [
            'customer' => $customer,
        ]);
    }

    private function canViewCustomers(Request $request): bool
    {
        $user = $request->user();
        if (!$user) {
            return false;
        }

        return $user->can('cashier.customers.view') || $user->can('admin.customers.view');
    }

    public function destroy(Request $request, Customer $customer)
    {
        $user = $request->user();
        if (!$user || !$user->can('cashier.customers.delete')) {
            abort(403);
        }

        $this->svc->deleteCustomer($customer);

        return redirect()->route('cashier.customers.index')
            ->with('success', 'Customer deleted successfully');
    }
}
