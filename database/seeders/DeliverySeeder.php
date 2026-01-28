<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Delivery;
use App\Models\Sale;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\User;
use Carbon\Carbon;

class DeliverySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sales = Sale::all();
        $customers = Customer::all();
        $addresses = CustomerAddress::all();
        $rider = User::first();

        if ($customers->isEmpty() || $addresses->isEmpty()) {
            return;
        }

        // Delivery 1: Pending
        Delivery::create([
            'delivery_number' => Delivery::generateDeliveryNumber(),
            'sale_id' => $sales->isNotEmpty() ? $sales->random()->id : null,
            'customer_id' => $customers->random()->id,
            'address_id' => $addresses->random()->id,
            'assigned_rider_user_id' => null,
            'status' => Delivery::STATUS_PENDING,
            'scheduled_at' => Carbon::now()->addHours(2),
            'notes' => 'Customer requested afternoon delivery',
        ]);

        // Delivery 2: Assigned
        Delivery::create([
            'delivery_number' => Delivery::generateDeliveryNumber(),
            'sale_id' => $sales->isNotEmpty() ? $sales->random()->id : null,
            'customer_id' => $customers->random()->id,
            'address_id' => $addresses->random()->id,
            'assigned_rider_user_id' => $rider?->id,
            'status' => Delivery::STATUS_ASSIGNED,
            'scheduled_at' => Carbon::now()->addHours(1),
            'notes' => 'Rider assigned, ready for dispatch',
        ]);

        // Delivery 3: In Transit
        Delivery::create([
            'delivery_number' => Delivery::generateDeliveryNumber(),
            'sale_id' => $sales->isNotEmpty() ? $sales->random()->id : null,
            'customer_id' => $customers->random()->id,
            'address_id' => $addresses->random()->id,
            'assigned_rider_user_id' => $rider?->id,
            'status' => Delivery::STATUS_IN_TRANSIT,
            'scheduled_at' => Carbon::now(),
            'dispatched_at' => Carbon::now()->subMinutes(30),
            'notes' => 'Out for delivery',
        ]);

        // Delivery 4: Delivered
        Delivery::create([
            'delivery_number' => Delivery::generateDeliveryNumber(),
            'sale_id' => $sales->isNotEmpty() ? $sales->random()->id : null,
            'customer_id' => $customers->random()->id,
            'address_id' => $addresses->random()->id,
            'assigned_rider_user_id' => $rider?->id,
            'status' => Delivery::STATUS_DELIVERED,
            'scheduled_at' => Carbon::yesterday(),
            'dispatched_at' => Carbon::yesterday()->addHours(1),
            'delivered_at' => Carbon::yesterday()->addHours(2),
            'proof_type' => 'signature',
            'proof_url' => null,
            'notes' => 'Successfully delivered, customer signed',
        ]);

        // Delivery 5: Failed
        Delivery::create([
            'delivery_number' => Delivery::generateDeliveryNumber(),
            'sale_id' => $sales->isNotEmpty() ? $sales->random()->id : null,
            'customer_id' => $customers->random()->id,
            'address_id' => $addresses->random()->id,
            'assigned_rider_user_id' => $rider?->id,
            'status' => Delivery::STATUS_FAILED,
            'scheduled_at' => Carbon::now()->subDays(2),
            'dispatched_at' => Carbon::now()->subDays(2)->addHours(1),
            'notes' => 'Customer not home, rescheduling required',
        ]);
    }
}