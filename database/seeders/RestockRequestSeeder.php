<?php

namespace Database\Seeders;

use App\Models\RestockRequest;
use App\Models\Location;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

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

        $today = Carbon::now();
        $yesterday = $today->copy()->subDay();
        $twoDaysAgo = $today->copy()->subDays(2);

        $requestDefinitions = [
            [
                'date' => $today,
                'needed_by_date' => $today->copy()->addDays(2),
                'status' => 'pending',
                'priority' => 'urgent',
                'notes' => 'Stock critically low on 11kg cylinders',
                'approved_by_admin' => false,
            ],
            [
                'date' => $yesterday,
                'needed_by_date' => $yesterday->copy()->addWeek(),
                'status' => 'approved',
                'priority' => 'normal',
                'notes' => 'Regular restock for 22kg cylinders',
                'approved_by_admin' => true,
            ],
            [
                'date' => $today,
                'needed_by_date' => $today->copy()->addDays(5),
                'status' => 'pending',
                'priority' => 'normal',
                'notes' => 'Restock accessories',
                'approved_by_admin' => false,
            ],
            [
                'date' => $twoDaysAgo,
                'needed_by_date' => $twoDaysAgo->copy()->addDays(3),
                'status' => 'rejected',
                'priority' => 'normal',
                'notes' => 'Declined - overstocked already',
                'approved_by_admin' => true,
            ],
        ];

        foreach ($requestDefinitions as $definition) {
            RestockRequest::firstOrCreate(
                [
                    'location_id' => $mainLocation->id,
                    'notes' => $definition['notes'],
                ],
                [
                    'request_number' => $this->generateRequestNumberForDate($definition['date']),
                    'requested_by_user_id' => $inventoryManager->id,
                    'approved_by_user_id' => $definition['approved_by_admin'] ? $admin?->id : null,
                    'status' => $definition['status'],
                    'priority' => $definition['priority'],
                    'needed_by_date' => $definition['needed_by_date'],
                ]
            );
        }
    }

    private function generateRequestNumberForDate(Carbon $date): string
    {
        $prefix = 'RR-' . $date->format('Ymd') . '-';
        $latestNumber = RestockRequest::where('request_number', 'like', $prefix . '%')
            ->orderBy('request_number', 'desc')
            ->value('request_number');

        $nextSequence = 1;

        if ($latestNumber !== null && preg_match('/-(\d+)$/', $latestNumber, $matches)) {
            $nextSequence = (int) $matches[1] + 1;
        }

        return $prefix . str_pad($nextSequence, 4, '0', STR_PAD_LEFT);
    }
}
