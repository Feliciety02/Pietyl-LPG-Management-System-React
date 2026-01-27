<?php

namespace App\Services;

use App\Repositories\CustomerRepository;

class CustomerService
{
    protected CustomerRepository $repo;

    public function __construct(CustomerRepository $repo)
    {
        $this->repo = $repo;
    }

   public function getCustomersForPage(array $filters = []): array
    {
        $customersPaginated = $this->repo->getPaginated($filters);

        return [
            'data' => collect($customersPaginated->items())->map(function ($customer) {
                $defaultAddress = $customer->addresses->where('is_default', true)->first();

                // Calculate sales stats
                $totalSales = $customer->sales()->count();
                $totalSpent = $customer->sales()->sum('grand_total');
                $lastSale = $customer->sales()->latest('sale_datetime')->first();

                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'phone' => $customer->phone ?? '',
                    'email' => $customer->email ?? '',
                    'address' => $defaultAddress ? $defaultAddress->city : '',
                    'full_address' => $defaultAddress ? $defaultAddress->getFullAddress() : '',
                    'customer_type' => $customer->customer_type,
                    'notes' => $customer->notes,
                    'purchases' => $totalSales,
                    'last_purchase_at' => $lastSale?->sale_datetime?->format('M d, Y g:i A'),
                    'total_spent' => $totalSpent,
                ];
            }),
            'meta' => [
                'current_page' => $customersPaginated->currentPage(),
                'last_page' => $customersPaginated->lastPage(),
                'from' => $customersPaginated->firstItem(),
                'to' => $customersPaginated->lastItem(),
                'total' => $customersPaginated->total(),
                'per_page' => $customersPaginated->perPage(),
            ],
        ];
    }

    public function createCustomer(array $data)
    {
        $customer = \App\Models\Customer::create([
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'customer_type' => $data['customer_type'],
            'notes' => $data['notes'] ?? null,
        ]);

        if (!empty($data['address_line1']) || !empty($data['city'])) {
            $customer->addresses()->create([
                'label' => 'home',
                'address_line1' => $data['address_line1'] ?? '',
                'address_line2' => $data['address_line2'] ?? '',
                'barangay' => $data['barangay'] ?? '',
                'city' => $data['city'] ?? '',
                'province' => $data['province'] ?? '',
                'postal_code' => $data['postal_code'] ?? '',
                'is_default' => true,
            ]);
        }

        return $customer;
    }

    public function updateCustomer($customer, array $data)
    {
        $customer->update([
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'customer_type' => $data['customer_type'],
            'notes' => $data['notes'] ?? null,
        ]);

        $defaultAddress = $customer->addresses()->where('is_default', true)->first();

        if (!empty($data['address_line1']) || !empty($data['city'])) {
            if ($defaultAddress) {
                $defaultAddress->update([
                    'address_line1' => $data['address_line1'] ?? '',
                    'address_line2' => $data['address_line2'] ?? '',
                    'barangay' => $data['barangay'] ?? '',
                    'city' => $data['city'] ?? '',
                    'province' => $data['province'] ?? '',
                    'postal_code' => $data['postal_code'] ?? '',
                ]);
            } else {
                $customer->addresses()->create([
                    'label' => 'home',
                    'address_line1' => $data['address_line1'] ?? '',
                    'address_line2' => $data['address_line2'] ?? '',
                    'barangay' => $data['barangay'] ?? '',
                    'city' => $data['city'] ?? '',
                    'province' => $data['province'] ?? '',
                    'postal_code' => $data['postal_code'] ?? '',
                    'is_default' => true,
                ]);
            }
        }

        return $customer;
    }

    public function deleteCustomer($customer)
    {
        return $customer->delete();
    }
}
