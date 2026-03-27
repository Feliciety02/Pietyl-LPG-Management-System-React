<?php

use App\Http\Middleware\EnsureTwoFactorEnrollment;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function makeForcedPasswordUser(
    string $email = 'forced-password@test.local',
    string $password = 'TempPassword!123',
    bool $mustChangePassword = true
): User {
    $user = User::create([
        'name' => 'Cashier User',
        'email' => $email,
        'password' => Hash::make($password),
        'is_active' => true,
        'must_change_password' => $mustChangePassword,
    ]);

    Employee::create([
        'user_id' => $user->id,
        'employee_no' => 'EMP-' . str_pad((string) $user->id, 4, '0', STR_PAD_LEFT),
        'first_name' => 'Cashier',
        'last_name' => 'User',
        'email' => $email,
        'status' => 'active',
    ]);

    $role = Role::firstOrCreate([
        'name' => 'cashier',
        'guard_name' => 'web',
    ]);

    $user->assignRole($role);

    return $user->fresh();
}

test('flagged user is redirected to the password change page after login', function () {
    $user = makeForcedPasswordUser();

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'TempPassword!123',
    ]);

    $response->assertRedirect(route('security.password.show'));
    $this->assertAuthenticatedAs($user->fresh());
});

test('flagged user cannot continue to dashboard before changing password', function () {
    $user = makeForcedPasswordUser('forced-redirect@test.local');

    $response = $this->actingAs($user)->get('/dashboard/cashier');

    $response->assertRedirect(route('security.password.show'));
});

test('forced password change rejects weak passwords', function () {
    $user = makeForcedPasswordUser('weak-password@test.local');

    $response = $this->actingAs($user)
        ->put(route('security.password.update'), [
            'current_password' => 'TempPassword!123',
            'password' => 'weakpass',
            'password_confirmation' => 'weakpass',
        ]);

    $response->assertSessionHasErrors(['password']);
});

test('successful forced password change clears the flag and updates the password', function () {
    $user = makeForcedPasswordUser('password-success@test.local');

    $response = $this->actingAs($user)
        ->put(route('security.password.update'), [
            'current_password' => 'TempPassword!123',
            'password' => 'NewStrongPassword!123',
            'password_confirmation' => 'NewStrongPassword!123',
        ]);

    $response->assertRedirect('/');

    $updatedUser = $user->fresh();

    expect($updatedUser->must_change_password)->toBeFalse();
    expect($updatedUser->password_changed_at)->not->toBeNull();
    expect(Hash::check('NewStrongPassword!123', $updatedUser->password))->toBeTrue();

    $dashboard = $this
        ->withoutMiddleware(EnsureTwoFactorEnrollment::class)
        ->actingAs($updatedUser)
        ->get('/dashboard/cashier');

    $dashboard->assertOk();
});
