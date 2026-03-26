<?php

use App\Http\Middleware\SyncLegacyRoles;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use App\Services\TwoFactorAuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function makePrivilegedUser(string $roleName = 'admin', string $email = 'admin-mfa@test.local'): User
{
    $role = Role::firstOrCreate([
        'name' => $roleName,
        'guard_name' => 'web',
    ]);

    $user = User::create([
        'name' => ucfirst($roleName) . ' User',
        'email' => $email,
        'password' => Hash::make('secret123'),
        'is_active' => true,
    ]);

    Employee::create([
        'user_id' => $user->id,
        'employee_no' => 'EMP-' . str_pad((string) $user->id, 4, '0', STR_PAD_LEFT),
        'first_name' => ucfirst($roleName),
        'last_name' => 'User',
        'email' => $email,
        'status' => 'active',
    ]);

    $user->assignRole($role);

    return $user->fresh();
}

test('privileged users without enrolled mfa are redirected to setup', function () {
    $this->withoutMiddleware(SyncLegacyRoles::class);

    $user = makePrivilegedUser();

    $this->actingAs($user)
        ->get('/dashboard/admin')
        ->assertRedirect(route('security.two-factor.show'));
});

test('privileged users can enroll mfa with a valid authenticator code', function () {
    $this->withoutMiddleware(SyncLegacyRoles::class);

    $user = makePrivilegedUser('inventory_manager', 'inventory-mfa@test.local');

    $this->actingAs($user)
        ->post(route('security.two-factor.provision'))
        ->assertRedirect();

    $user->refresh();
    expect($user->two_factor_secret)->not->toBeNull();
    expect($user->two_factor_confirmed_at)->toBeNull();

    $service = app(TwoFactorAuthService::class);
    $code = (new ReflectionClass($service))
        ->getMethod('verifyCode');

    $secret = $user->two_factor_secret;
    $generate = function (string $secret): string {
        $service = app(TwoFactorAuthService::class);
        $reflection = new ReflectionClass($service);
        $method = $reflection->getMethod('totp');
        $method->setAccessible(true);

        return $method->invoke($service, $secret, (int) floor(time() / 30));
    };

    $this->actingAs($user)
        ->post(route('security.two-factor.enable'), [
            'code' => $generate($secret),
        ])
        ->assertRedirect();

    expect($user->fresh()->two_factor_confirmed_at)->not->toBeNull();
});

test('privileged users with enabled mfa must complete the second factor during login', function () {
    $this->withoutMiddleware(SyncLegacyRoles::class);

    $user = makePrivilegedUser('admin', 'mfa-login@test.local');
    $service = app(TwoFactorAuthService::class);
    $secret = $service->generateSecret();

    $user->forceFill([
        'two_factor_secret' => $secret,
        'two_factor_confirmed_at' => now(),
    ])->save();

    $login = $this->from('/login')->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'secret123',
    ]);

    $login->assertRedirect(route('login'));
    $this->assertGuest();
    expect(session('auth.two_factor.pending.user_id'))->toBe($user->id);

    $reflection = new ReflectionClass($service);
    $method = $reflection->getMethod('totp');
    $method->setAccessible(true);
    $code = $method->invoke($service, $secret, (int) floor(time() / 30));

    $verify = $this->post(route('login.two-factor.verify'), [
        'code' => $code,
    ]);

    $verify->assertRedirect('/dashboard/admin');
    $this->assertAuthenticatedAs($user->fresh());
});
