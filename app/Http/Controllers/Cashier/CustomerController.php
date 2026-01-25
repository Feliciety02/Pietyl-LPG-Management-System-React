<?php

namespace App\Http\Controllers\Cashier;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::query();

        // Search
        if ($search = $request->input('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Pagination
        $perPage = $request->input('per', 10);
        $customers = $query->with('addresses')
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        $customers->getCollection()->transform(function ($customer) {
            $defaultAddress = $customer->addresses->where('is_default', true)->first();
            
            return [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone ?? '',
                'email' => $customer->email ?? '',
                'address' => $defaultAddress ? $defaultAddress->city : '',
                'full_address' => $defaultAddress ? $defaultAddress->getFullAddress() : '',
                'customer_type' => $customer->customer_type,
                'notes' => $customer->notes,
                // TODO: Add these when sales table is ready
                'purchases' => 0,
                'last_purchase_at' => null,
                'total_spent' => 0,
            ];
        });

        return Inertia::render('CashierPage/Customers', [
            'customers' => $customers,
            'filters' => $request->only(['q', 'per']),
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

        $customer = Customer::create([
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'],
            'customer_type' => $validated['customer_type'],
            'notes' => $validated['notes'] ?? null,
        ]);

        // Create address if provided
        if (!empty($validated['address_line1']) || !empty($validated['city'])) {
            $customer->addresses()->create([
                'label' => 'home',
                'address_line1' => $validated['address_line1'] ?? '',
                'address_line2' => $validated['address_line2'],
                'barangay' => $validated['barangay'],
                'city' => $validated['city'] ?? '',
                'province' => $validated['province'],
                'postal_code' => $validated['postal_code'],
                'is_default' => true,
            ]);
        }

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

        $customer->update([
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'],
            'customer_type' => $validated['customer_type'],
            'notes' => $validated['notes'] ?? null,
        ]);

        $defaultAddress = $customer->addresses()->where('is_default', true)->first();
        
        if (!empty($validated['address_line1']) || !empty($validated['city'])) {
            if ($defaultAddress) {
                $defaultAddress->update([
                    'address_line1' => $validated['address_line1'] ?? '',
                    'address_line2' => $validated['address_line2'],
                    'barangay' => $validated['barangay'],
                    'city' => $validated['city'] ?? '',
                    'province' => $validated['province'],
                    'postal_code' => $validated['postal_code'],
                ]);
            } else {
                $customer->addresses()->create([
                    'label' => 'home',
                    'address_line1' => $validated['address_line1'] ?? '',
                    'address_line2' => $validated['address_line2'],
                    'barangay' => $validated['barangay'],
                    'city' => $validated['city'] ?? '',
                    'province' => $validated['province'],
                    'postal_code' => $validated['postal_code'],
                    'is_default' => true,
                ]);
            }
        }

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
        $customer->delete();

        return redirect()->route('cashier.customers.index')
            ->with('success', 'Customer deleted successfully');
    }
}