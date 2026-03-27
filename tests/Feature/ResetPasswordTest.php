<?php

use App\Models\Role;
use App\Models\User;
use App\Http\Middleware\EnsurePasswordChange;
use App\Http\Middleware\EnsureTwoFactorEnrollment;
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

    $response = $this
        ->withoutMiddleware(EnsureTwoFactorEnrollment::class)
        ->withoutMiddleware(EnsurePasswordChange::class)
        ->actingAs($admin)
        ->post(route('dash.admin.users.reset-password', ['user' => $target->id]), [
            'admin_password' => 'secret123',
            'new_password' => 'ResetPassword!123',
            'new_password_confirmation' => 'ResetPassword!123',
        ]);

    $response->assertOk()
        ->assertJson(['message' => 'Password reset successfully. The user must change it on next login.']);

    expect(User::count())->toBe($initialUserCount);
    expect(Hash::check('ResetPassword!123', $target->refresh()->password))->toBeTrue();
    expect($target->must_change_password)->toBeTrue();
    expect($target->password_changed_at)->toBeNull();
});
