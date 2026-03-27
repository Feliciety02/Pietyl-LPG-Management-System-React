<?php

use App\Http\Middleware\EnsureTwoFactorEnrollment;
use App\Models\Notification;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

function makeAuthorizedUser(string $email, string $roleName, array $permissions = []): User
{
    $role = Role::firstOrCreate([
        'name' => $roleName,
        'guard_name' => 'web',
    ]);

    foreach ($permissions as $permissionName) {
        $permission = Permission::findOrCreate($permissionName, 'web');
        $role->givePermissionTo($permission);
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

test('users cannot view notifications that belong to another account', function () {
    $owner = makeAuthorizedUser('owner@test.local', 'cashier');
    $other = makeAuthorizedUser('other@test.local', 'cashier');

    $notification = Notification::create([
        'user_id' => $owner->id,
        'type' => 'system',
        'title' => 'Owner Notification',
        'message' => 'Private message for owner.',
        'channel' => 'database',
    ]);

    $this->actingAs($other)
        ->get(route('notifications.show', ['id' => $notification->id]))
        ->assertNotFound()
        ->assertJson(['error' => 'Notification not found']);
});

test('users can still view their own notifications', function () {
    $user = makeAuthorizedUser('viewer@test.local', 'cashier');

    $notification = Notification::create([
        'user_id' => $user->id,
        'type' => 'system',
        'title' => 'Own Notification',
        'message' => 'Visible to owner.',
        'channel' => 'database',
    ]);

    $this->actingAs($user)
        ->get(route('notifications.show', ['id' => $notification->id]))
        ->assertOk()
        ->assertJson([
            'id' => $notification->id,
            'user_id' => $user->id,
            'title' => 'Own Notification',
        ]);
});

test('inventory threshold updates require the update permission not just the view permission', function () {
    $this->withoutMiddleware(EnsureTwoFactorEnrollment::class);

    $user = makeAuthorizedUser('inventory-view@test.local', 'inventory_manager', [
        'inventory.thresholds.view',
    ]);

    $this->actingAs($user)
        ->post(route('dash.inventory.thresholds.save'), [
            'updates' => [],
        ])
        ->assertForbidden();
});
