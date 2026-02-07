<?php

namespace App\Services\POS;

use App\Models\Delivery;
use App\Models\Sale;
use App\Repositories\CustomerRepository;
use App\Repositories\DeliveryRepository;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class DeliveryManagementService
{
    public function __construct(
        private CustomerRepository $customerRepository,
        private DeliveryRepository $deliveryRepository
    ) {}

    public function createDeliveryForSale(Sale $sale, int $customerId): void
    {
        $customer = $this->customerRepository->findCustomerWithAddresses($customerId);

        if (!$customer) {
            Log::warning('DeliveryManagementService: customer not found', [
                'sale_id' => $sale->id,
                'customer_id' => $customerId,
            ]);
            return;
        }

        $defaultAddress = $this->customerRepository->getDefaultAddress($customer);

        if (!$defaultAddress) {
            Log::warning('DeliveryManagementService: no address found, skipping delivery', [
                'sale_id' => $sale->id,
                'customer_id' => $customerId,
            ]);
            return;
        }

        $selectedRiderId = $this->findLeastBusyRider();

        $this->deliveryRepository->createDelivery([
            'delivery_number' => $this->deliveryRepository->generateDeliveryNumber(),
            'sale_id' => $sale->id,
            'customer_id' => $customerId,
            'address_id' => $defaultAddress->id,
            'assigned_rider_user_id' => $selectedRiderId,
            'status' => $selectedRiderId ? Delivery::STATUS_ASSIGNED : Delivery::STATUS_PENDING,
            'scheduled_at' => Carbon::now()->addHours(2),
        ]);
    }

    private function findLeastBusyRider(): ?int
    {
        $riders = $this->deliveryRepository->getRiders();

        if ($riders->isEmpty()) {
            return null;
        }

        $riderWorkload = [];
        
        foreach ($riders as $rider) {
            $activeCount = $this->deliveryRepository->getActiveDeliveryCount($rider->id);
            
            $riderWorkload[] = [
                'id' => $rider->id,
                'count' => $activeCount,
            ];
        }

        usort($riderWorkload, function($a, $b) {
            if ($a['count'] === $b['count']) {
                return $a['id'] <=> $b['id'];
            }
            return $a['count'] <=> $b['count'];
        });

        return $riderWorkload[0]['id'] ?? null;
    }
}