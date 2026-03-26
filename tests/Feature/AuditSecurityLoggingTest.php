<?php

use App\Http\Middleware\EnsureTwoFactorEnrollment;
use App\Http\Middleware\SyncLegacyRoles;
use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Delivery;
use App\Models\Notification;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

function makeAuditUser(string $email, string $roleName = 'cashier', array $permissions = []): User
{
    $role = Role::firstOrCreate([
        'name' => $roleName,
        'guard_name' => 'web',
    ]);

    foreach ($permissions as $permissionName) {
        $role->givePermissionTo(Permission::findOrCreate($permissionName, 'web'));
    }

    $user = User::create([
        'name' => ucfirst($roleName) . ' User',
        'email' => $email,
        'password' => Hash::make('secret123'),
        'is_active' => true,
    ]);

    $user->assignRole($role);

    return $user->fresh();
}

function makeAuditDelivery(User $rider): Delivery
{
    $customer = Customer::create([
        'name' => 'Audit Delivery Customer',
        'customer_type' => 'regular',
    ]);

    $address = CustomerAddress::create([
        'customer_id' => $customer->id,
        'label' => 'home',
        'address_line1' => '456 Security Street',
        'city' => 'Davao City',
        'is_default' => true,
    ]);

    return Delivery::create([
        'delivery_number' => Delivery::generateDeliveryNumber(),
        'customer_id' => $customer->id,
        'address_id' => $address->id,
        'assigned_rider_user_id' => $rider->id,
        'status' => Delivery::STATUS_ASSIGNED,
        'scheduled_at' => now(),
    ]);
}

test('denied notification access is recorded in the audit log', function () {
    $this->withoutMiddleware(SyncLegacyRoles::class);

    $owner = makeAuditUser('owner-log@test.local');
    $other = makeAuditUser('other-log@test.local');

    $notification = Notification::create([
        'user_id' => $owner->id,
        'type' => 'system',
        'title' => 'Restricted',
        'message' => 'Private notification.',
        'channel' => 'database',
    ]);

    $this->actingAs($other)
        ->get(route('notifications.show', ['id' => $notification->id]))
        ->assertNotFound();

    $audit = AuditLog::where('action', 'notifications.view_denied')->latest('id')->first();

    expect($audit)->not->toBeNull();
    expect($audit->actor_user_id)->toBe($other->id);
    expect($audit->entity_id)->toBe($notification->id);
});

test('delivery proof access and denial are both recorded in the audit log', function () {
    $this->withoutMiddleware(SyncLegacyRoles::class);

    Storage::fake('local');

    $rider = makeAuditUser('proof-rider@test.local', 'rider');
    $other = makeAuditUser('proof-other@test.local', 'cashier');
    $delivery = makeAuditDelivery($rider);

    $delivery->update([
        'proof_type' => 'photo',
        'proof_photo_url' => 'pod/audit-proof.jpg',
        'proof_url' => 'pod/audit-proof.jpg',
    ]);

    Storage::disk('local')->put('pod/audit-proof.jpg', 'audit-proof');

    $this->actingAs($rider)
        ->get(route('deliveries.proof.show', ['delivery' => $delivery->id, 'kind' => 'photo']))
        ->assertOk();

    $this->actingAs($other)
        ->get(route('deliveries.proof.show', ['delivery' => $delivery->id, 'kind' => 'photo']))
        ->assertForbidden();

    expect(AuditLog::where('action', 'delivery.proof_accessed')->where('entity_id', $delivery->id)->exists())->toBeTrue();
    expect(AuditLog::where('action', 'delivery.proof_access_denied')->where('entity_id', $delivery->id)->exists())->toBeTrue();
});

test('admin password confirmation success and failure are recorded in the audit log', function () {
    $this->withoutMiddleware(SyncLegacyRoles::class);
    $this->withoutMiddleware(EnsureTwoFactorEnrollment::class);

    $admin = makeAuditUser('admin-log@test.local', 'admin', ['admin.users.update']);

    $this->actingAs($admin)
        ->post(route('dash.admin.password.confirm'), ['password' => 'wrong-secret'])
        ->assertStatus(422);

    $this->actingAs($admin)
        ->post(route('dash.admin.password.confirm'), ['password' => 'secret123'])
        ->assertOk();

    expect(AuditLog::where('action', 'admin.password.confirm_failed')->where('actor_user_id', $admin->id)->exists())->toBeTrue();
    expect(AuditLog::where('action', 'admin.password.confirmed')->where('actor_user_id', $admin->id)->exists())->toBeTrue();
});
