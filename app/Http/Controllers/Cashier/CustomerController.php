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
        $filters = $request->only(['q', 'per', 'page']);
        $customers = $this->svc->getCustomersForPage($filters);

        return Inertia::render('CashierPage/Customers', [
            'customers' => $customers,
            'filters' => $filters,
        ]);
    }

    public function store(Request $request)
    {
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

        $this->svc->createCustomer($validated);

        return redirect()->back()->with('success', 'Customer created successfully');
    }

    public function update(Request $request, Customer $customer)
    {
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

    public function show(Customer $customer)
    {
        $customer->load('addresses');

        return Inertia::render('Cashier/CustomerShow', [
            'customer' => $customer,
        ]);
    }

    public function destroy(Customer $customer)
    {
        $this->svc->deleteCustomer($customer);

        return redirect()->route('cashier.customers.index')
            ->with('success', 'Customer deleted successfully');
    }
}
    