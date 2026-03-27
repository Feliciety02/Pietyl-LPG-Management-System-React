<?php

use App\Http\Middleware\EnsureTwoFactorEnrollment;
use App\Http\Middleware\SyncLegacyRoles;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use App\Services\TwoFactorAuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Illuminate\Auth\SessionGuard;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function makeRememberUser(string $roleName = 'cashier', string $email = 'remember@test.local'): User
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

function responseCookieValue(TestResponse $response, string $cookieName): ?string
{
    $cookie = collect($response->headers->getCookies())->first(
        fn ($item) => $item->getName() === $cookieName
    );

    return $cookie?->getValue();
}

function rememberRecallerName(): string
{
    /** @var SessionGuard $guard */
    $guard = Auth::guard();

    return $guard->getRecallerName();
}

test('remember me sets a persistent recaller cookie and restores auth after session loss', function () {
    /** @var \Tests\TestCase $this */
    $this->withoutMiddleware(SyncLegacyRoles::class);

    $user = makeRememberUser();

    $login = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'secret123',
        'remember' => true,
    ]);

    $login->assertRedirect('/dashboard/cashier');

    $recallerName = rememberRecallerName();
    $recallerValue = responseCookieValue($login, $recallerName);

    expect($recallerValue)->not->toBeNull();

    $sessionCookie = (string) config('session.cookie');

    $restored = $this
        ->withCookie($recallerName, $recallerValue)
        ->withCookie($sessionCookie, 'expired-session')
        ->get('/notifications/unread');

    $restored->assertOk();
});

test('remember me survives the mfa login flow for privileged users', function () {
    /** @var \Tests\TestCase $this */
    $this->withoutMiddleware(SyncLegacyRoles::class);
    $this->withoutMiddleware(EnsureTwoFactorEnrollment::class);

    $user = makeRememberUser('admin', 'remember-mfa@test.local');
    $service = app(TwoFactorAuthService::class);
    $secret = $service->generateSecret();

    $user->forceFill([
        'two_factor_secret' => $secret,
        'two_factor_confirmed_at' => now(),
    ])->save();

    $firstStep = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'secret123',
        'remember' => true,
    ]);

    $firstStep->assertRedirect(route('login'));

    $reflection = new ReflectionClass($service);
    $method = $reflection->getMethod('totp');
    $method->setAccessible(true);
    $code = $method->invoke($service, $secret, (int) floor(time() / 30));

    $secondStep = $this->post(route('login.two-factor.verify'), [
        'code' => $code,
    ]);

    $secondStep->assertRedirect('/dashboard/admin');

    $recallerName = rememberRecallerName();
    $recallerValue = responseCookieValue($secondStep, $recallerName);

    expect($recallerValue)->not->toBeNull();

    $sessionCookie = (string) config('session.cookie');

    $restored = $this
        ->withCookie($recallerName, $recallerValue)
        ->withCookie($sessionCookie, 'expired-session')
        ->get('/notifications/unread');

    $restored->assertOk();
});
