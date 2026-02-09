<?php

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

test('admin password reset updates existing user without creating a new record', function () {
    $permission = Permission::create(['name' => 'admin.users.update', 'guard_name' => 'web']);
    $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);
    $role->givePermissionTo($permission);

    $admin = User::create([
        'name' => 'Admin User',
        'email' => 'admin-reset@test.local',
        'password' => Hash::make('secret123'),
        'is_active' => true,
    ]);

    $admin->assignRole($role);

    $target = User::create([
        'name' => 'Target User',
        'email' => 'target-user@test.local',
        'password' => Hash::make('old-password'),
        'is_active' => true,
    ]);

    $initialUserCount = User::count();

    $response = $this->actingAs($admin)
        ->post(route('dash.admin.users.reset-password', ['user' => $target->id]), [
            'admin_password' => 'secret123',
            'new_password' => 'new-password-123',
            'new_password_confirmation' => 'new-password-123',
        ]);

    $response->assertOk()
        ->assertJson(['message' => 'Password reset successfully.']);

    expect(User::count())->toBe($initialUserCount);
    expect(Hash::check('new-password-123', $target->refresh()->password))->toBeTrue();
});
