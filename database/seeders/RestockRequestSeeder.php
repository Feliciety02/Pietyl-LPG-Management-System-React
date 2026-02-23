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
        $inventoryManager = User::whereHas('roles', fn($q) => $q->where('name', 'inventory_manager'))->first();
        $admin            = User::whereHas('roles', fn($q) => $q->where('name', 'admin'))->first();

        if (!$inventoryManager) {
            $this->command->warn('No inventory manager found. Skipping RestockRequestSeeder.');
            return;
        }

        $locations = Location::all();
        if ($locations->isEmpty()) {
            $this->command->warn('No locations found. Skipping RestockRequestSeeder.');
            return;
        }

        $today = Carbon::now();

        $requests = [
            // Pending - Urgent
            ['days_ago' =>  0, 'due_days' =>  2, 'status' => 'pending',   'priority' => 'urgent', 'approved' => false, 'notes' => 'Stock critically low on 11kg cylinders'],
            ['days_ago' =>  1, 'due_days' =>  1, 'status' => 'pending',   'priority' => 'urgent', 'notes' => 'Solane 11kg near zero - immediate restock needed',        'approved' => false],
            ['days_ago' =>  2, 'due_days' =>  3, 'status' => 'pending',   'priority' => 'urgent', 'notes' => 'Petron Gasul 22kg critically low at Matina Store',        'approved' => false],
            ['days_ago' =>  3, 'due_days' =>  2, 'status' => 'pending',   'priority' => 'urgent', 'notes' => 'Prycegas 11kg out of stock - urgent order required',      'approved' => false],
            ['days_ago' =>  4, 'due_days' =>  1, 'status' => 'pending',   'priority' => 'urgent', 'notes' => 'All 50kg cylinders depleted - corporate orders affected',  'approved' => false],

            // Pending - Normal
            ['days_ago' =>  0, 'due_days' =>  5, 'status' => 'pending',   'priority' => 'normal', 'notes' => 'Restock accessories - hoses and regulators',              'approved' => false],
            ['days_ago' =>  1, 'due_days' =>  7, 'status' => 'pending',   'priority' => 'normal', 'notes' => 'Monthly reorder of 2.7kg snap-on cylinders',              'approved' => false],
            ['days_ago' =>  2, 'due_days' =>  5, 'status' => 'pending',   'priority' => 'normal', 'notes' => 'Restock gas stoves - La Germania models low',             'approved' => false],
            ['days_ago' =>  3, 'due_days' =>  6, 'status' => 'pending',   'priority' => 'normal', 'notes' => 'Asahi gas stove variants need restocking',                'approved' => false],
            ['days_ago' =>  5, 'due_days' =>  7, 'status' => 'pending',   'priority' => 'normal', 'notes' => 'Fiesta Gas 5.0kg reorder - reorder point reached',        'approved' => false],

            // Approved
            ['days_ago' =>  1, 'due_days' =>  7, 'status' => 'approved',  'priority' => 'normal', 'notes' => 'Regular restock for 22kg cylinders',                      'approved' => true],
            ['days_ago' =>  2, 'due_days' =>  5, 'status' => 'approved',  'priority' => 'normal', 'notes' => 'Approved weekly LPG order from Towngas',                  'approved' => true],
            ['days_ago' =>  3, 'due_days' =>  4, 'status' => 'approved',  'priority' => 'urgent', 'notes' => 'Approved urgent 11kg restock - admin cleared',            'approved' => true],
            ['days_ago' =>  4, 'due_days' =>  6, 'status' => 'approved',  'priority' => 'normal', 'notes' => 'Approved accessories bundle order from M.Conpinco',       'approved' => true],
            ['days_ago' =>  5, 'due_days' =>  7, 'status' => 'approved',  'priority' => 'normal', 'notes' => 'Standard 50kg industrial order approved',                 'approved' => true],
            ['days_ago' =>  6, 'due_days' =>  5, 'status' => 'approved',  'priority' => 'normal', 'notes' => 'Monthly stove restock approved by admin',                 'approved' => true],
            ['days_ago' =>  7, 'due_days' =>  7, 'status' => 'approved',  'priority' => 'normal', 'notes' => 'Petron Gasul Snap On 11kg order approved',                'approved' => true],
            ['days_ago' =>  8, 'due_days' =>  5, 'status' => 'approved',  'priority' => 'urgent', 'notes' => 'Urgent Phoenix LPG restock approved',                     'approved' => true],
            ['days_ago' =>  9, 'due_days' =>  7, 'status' => 'approved',  'priority' => 'normal', 'notes' => 'Prycegas 22kg order approved and forwarded to supplier',  'approved' => true],
            ['days_ago' => 10, 'due_days' =>  5, 'status' => 'approved',  'priority' => 'normal', 'notes' => 'LPG hose and regulator bundle approved',                  'approved' => true],

            // Rejected
            ['days_ago' =>  2, 'due_days' =>  3, 'status' => 'rejected',  'priority' => 'normal', 'notes' => 'Declined - overstocked already',                          'approved' => true],
            ['days_ago' =>  5, 'due_days' =>  3, 'status' => 'rejected',  'priority' => 'normal', 'notes' => 'Rejected - budget not available this cycle',              'approved' => true],
            ['days_ago' =>  7, 'due_days' =>  2, 'status' => 'rejected',  'priority' => 'urgent', 'notes' => 'Rejected - supplier not available, resubmit next week',   'approved' => true],
            ['days_ago' =>  9, 'due_days' =>  3, 'status' => 'rejected',  'priority' => 'normal', 'notes' => 'Duplicate request - already processed in prior order',    'approved' => true],
            ['days_ago' => 11, 'due_days' =>  2, 'status' => 'rejected',  'priority' => 'normal', 'notes' => 'Rejected - quantities exceed monthly procurement limit',   'approved' => true],
            ['days_ago' => 13, 'due_days' =>  3, 'status' => 'rejected',  'priority' => 'low',    'notes' => 'Low priority item - deferred to next quarter',            'approved' => true],
            ['days_ago' => 15, 'due_days' =>  2, 'status' => 'rejected',  'priority' => 'normal', 'notes' => 'Not justified by current stock levels',                   'approved' => true],

            // Fulfilled / Completed
            ['days_ago' => 14, 'due_days' => -3, 'status' => 'fulfilled', 'priority' => 'normal', 'notes' => 'Successfully restocked 22kg cylinders - all delivered',   'approved' => true],
            ['days_ago' => 16, 'due_days' => -5, 'status' => 'fulfilled', 'priority' => 'urgent', 'notes' => 'Urgent 11kg restock completed on time',                   'approved' => true],
            ['days_ago' => 18, 'due_days' => -4, 'status' => 'fulfilled', 'priority' => 'normal', 'notes' => 'Monthly accessories order fully received',                'approved' => true],
            ['days_ago' => 20, 'due_days' => -6, 'status' => 'fulfilled', 'priority' => 'normal', 'notes' => 'Petron Gasul 50kg order fulfilled and stocked',           'approved' => true],
            ['days_ago' => 22, 'due_days' => -3, 'status' => 'fulfilled', 'priority' => 'normal', 'notes' => 'La Germania stove restock completed',                     'approved' => true],
            ['days_ago' => 24, 'due_days' => -5, 'status' => 'fulfilled', 'priority' => 'urgent', 'notes' => 'Emergency Solane 11kg order delivered same day',          'approved' => true],
            ['days_ago' => 26, 'due_days' => -4, 'status' => 'fulfilled', 'priority' => 'normal', 'notes' => 'Regulator and hose bundle order fulfilled',               'approved' => true],
            ['days_ago' => 28, 'due_days' => -7, 'status' => 'fulfilled', 'priority' => 'normal', 'notes' => 'Prycegas 22kg bi-weekly order completed',                 'approved' => true],

            // In Progress / Partially Fulfilled
            ['days_ago' =>  3, 'due_days' =>  2, 'status' => 'partial',   'priority' => 'urgent', 'notes' => 'Partial delivery received - 11kg still pending',          'approved' => true],
            ['days_ago' =>  5, 'due_days' =>  3, 'status' => 'partial',   'priority' => 'normal', 'notes' => 'First batch of 22kg received, 2nd batch scheduled',       'approved' => true],
            ['days_ago' =>  7, 'due_days' =>  2, 'status' => 'partial',   'priority' => 'normal', 'notes' => 'Accessories partially delivered - hoses pending',         'approved' => true],

            // Low priority
            ['days_ago' =>  5, 'due_days' => 14, 'status' => 'pending',   'priority' => 'low',    'notes' => 'Optional restock of slow-moving 1.4kg cylinders',         'approved' => false],
            ['days_ago' =>  8, 'due_days' => 14, 'status' => 'pending',   'priority' => 'low',    'notes' => 'Future order for display units - no urgency',             'approved' => false],
            ['days_ago' => 10, 'due_days' => 21, 'status' => 'pending',   'priority' => 'low',    'notes' => 'Long-term restock planning for Q3',                       'approved' => false],
            ['days_ago' => 12, 'due_days' => 30, 'status' => 'approved',  'priority' => 'low',    'notes' => 'Approved Q3 planning order - no rush',                    'approved' => true],
            ['days_ago' => 15, 'due_days' => 30, 'status' => 'approved',  'priority' => 'low',    'notes' => 'Pre-approved standing order for accessories',             'approved' => true],

            // Extra historical orders
            ['days_ago' => 30, 'due_days' => -5, 'status' => 'fulfilled', 'priority' => 'normal', 'notes' => 'Standard monthly order - prior cycle completed',          'approved' => true],
            ['days_ago' => 32, 'due_days' => -8, 'status' => 'fulfilled', 'priority' => 'normal', 'notes' => 'All cylinders from last month order received',            'approved' => true],
            ['days_ago' => 34, 'due_days' => -9, 'status' => 'fulfilled', 'priority' => 'urgent', 'notes' => 'Urgent mid-month restock - peak season',                  'approved' => true],
            ['days_ago' => 36, 'due_days' => -7, 'status' => 'fulfilled', 'priority' => 'normal', 'notes' => 'Quarterly stove order completed',                         'approved' => true],
            ['days_ago' => 38, 'due_days' => -6, 'status' => 'rejected',  'priority' => 'normal', 'notes' => 'Over-budget order rejected last quarter',                 'approved' => true],
            ['days_ago' => 40, 'due_days' => -5, 'status' => 'fulfilled', 'priority' => 'normal', 'notes' => 'Oldest fulfilled record in system',                       'approved' => true],
        ];

        foreach ($requests as $def) {
            $date        = $today->copy()->subDays($def['days_ago']);
            $neededByDate = $today->copy()->subDays($def['days_ago'])->addDays($def['due_days']);

            RestockRequest::firstOrCreate(
                [
                    'location_id' => $locations->random()->id,
                    'notes'       => $def['notes'],
                ],
                [
                    'request_number'        => $this->generateRequestNumber($date),
                    'requested_by_user_id'  => $inventoryManager->id,
                    'approved_by_user_id'   => $def['approved'] ? $admin?->id : null,
                    'status'                => $def['status'],
                    'priority'              => $def['priority'],
                    'needed_by_date'        => $neededByDate,
                ]
            );
        }

        $this->command->info('RestockRequestSeeder: ' . count($requests) . ' requests created.');
    }

    private function generateRequestNumber(Carbon $date): string
    {
        $prefix = 'RR-' . $date->format('Ymd') . '-';
        $latest = RestockRequest::where('request_number', 'like', $prefix . '%')
            ->orderBy('request_number', 'desc')
            ->value('request_number');

        $next = 1;
        if ($latest && preg_match('/-(\d+)$/', $latest, $m)) {
            $next = (int) $m[1] + 1;
        }

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }
}