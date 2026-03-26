<?php

use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

uses(RefreshDatabase::class);

function makeLoginUser(string $email = 'cashier@test.local', string $password = 'secret123'): User
{
    $user = User::create([
        'name' => 'Cashier User',
        'email' => $email,
        'password' => Hash::make($password),
        'is_active' => true,
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

function loginThrottleKey(string $email, string $ip = '127.0.0.1'): string
{
    return strtolower($email) . '|' . $ip;
}

test('login locks after repeated failed attempts', function () {
    $user = makeLoginUser();

    foreach (range(1, 5) as $attempt) {
        $response = $this->from('/login')->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertRedirect('/login');
        $response->assertSessionHasErrors(['email' => 'Invalid login credentials.']);
    }

    $blocked = $this->from('/login')->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $blocked->assertRedirect('/login');
    $blocked->assertSessionHasErrors([
        'email' => 'Too many login attempts. Try again in 5 minute(s).',
    ]);
});

test('successful login clears prior failed attempts', function () {
    $user = makeLoginUser('reset-limit@test.local');
    $key = loginThrottleKey($user->email);

    foreach (range(1, 2) as $attempt) {
        $this->from('/login')->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertRedirect('/login');
    }

    expect(RateLimiter::attempts($key))->toBe(2);

    $success = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'secret123',
    ]);

    $success->assertRedirect('/dashboard/cashier');
    $this->assertAuthenticatedAs($user->fresh());
    expect(RateLimiter::attempts($key))->toBe(0);
});

test('inactive employee does not reveal account status and still counts toward lockout', function () {
    $user = makeLoginUser('inactive@test.local');
    $user->employee()->update(['status' => 'inactive']);

    foreach (range(1, 5) as $attempt) {
        $response = $this->from('/login')->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'secret123',
        ]);

        $response->assertRedirect('/login');
        $response->assertSessionHasErrors(['email' => 'Invalid login credentials.']);
    }

    $blocked = $this->from('/login')->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'secret123',
    ]);

    $blocked->assertRedirect('/login');
    $blocked->assertSessionHasErrors([
        'email' => 'Too many login attempts. Try again in 5 minute(s).',
    ]);
});
