<?php

namespace Database\Seeders;

use App\Models\RestockRequest;
use App\Models\Location;
use App\Models\User;
use Illuminate\Database\Seeder;

class RestockRequestSeeder extends Seeder
{
    public function run(): void
    {
        $inventoryManager = User::whereHas('roles', function ($q) {
            $q->where('name', 'inventory_manager');
        })->first();

        $admin = User::whereHas('roles', function ($q) {
            $q->where('name', 'admin');
        })->first();

        if (!$inventoryManager) {
            $this->command->warn('No inventory manager found. Skipping RestockRequestSeeder.');
            return;
        }

        $locations = Location::all();

        if ($locations->isEmpty()) {
            $this->command->warn('No locations found. Skipping RestockRequestSeeder.');
            return;
        }

        $mainLocation = $locations->first();

        // Request 1 - Pending (Urgent)
        RestockRequest::create([
            'request_number' => 'RR-' . now()->format('Ymd') . '-0001',
            'location_id' => $mainLocation->id,
            'requested_by_user_id' => $inventoryManager->id,
            'approved_by_user_id' => null,
            'status' => 'pending',
            'priority' => 'urgent',
            'needed_by_date' => now()->addDays(2),
            'notes' => 'Stock critically low on 11kg cylinders',
        ]);

        // Request 2 - Approved
        RestockRequest::create([
            'request_number' => 'RR-' . now()->subDay()->format('Ymd') . '-0001',
            'location_id' => $mainLocation->id,
            'requested_by_user_id' => $inventoryManager->id,
            'approved_by_user_id' => $admin?->id,
            'status' => 'approved',
            'priority' => 'normal',
            'needed_by_date' => now()->addWeek(),
            'notes' => 'Regular restock for 22kg cylinders',
        ]);

        // Request 3 - Pending (Normal)
        RestockRequest::create([
            'request_number' => 'RR-' . now()->format('Ymd') . '-0002',
            'location_id' => $mainLocation->id,
            'requested_by_user_id' => $inventoryManager->id,
            'approved_by_user_id' => null,
            'status' => 'pending',
            'priority' => 'normal',
            'needed_by_date' => now()->addDays(5),
            'notes' => 'Restock accessories',
        ]);

        // Request 4 - Rejected
        RestockRequest::create([
            'request_number' => 'RR-' . now()->subDays(2)->format('Ymd') . '-0001',
            'location_id' => $mainLocation->id,
            'requested_by_user_id' => $inventoryManager->id,
            'approved_by_user_id' => $admin?->id,
            'status' => 'rejected',
            'priority' => 'normal',
            'needed_by_date' => now()->addDays(3),
            'notes' => 'Declined - overstocked already',
        ]);
    }
}