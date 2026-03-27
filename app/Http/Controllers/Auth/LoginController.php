<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\TwoFactorAuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    private const MAX_LOGIN_ATTEMPTS = 5;
    private const LOCKOUT_SECONDS = 300;

    public function __construct(
        private TwoFactorAuthService $twoFactorAuthService
    ) {}

    public function store(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $email = strtolower(trim((string) $data['email']));
        $throttleKey = $this->throttleKey($request, $email);

        if (RateLimiter::tooManyAttempts($throttleKey, self::MAX_LOGIN_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            $this->storeLockoutState($request, $seconds);
            $this->logLoginBlocked($request, $email, $seconds);

            throw ValidationException::withMessages([
                'email' => $this->lockoutMessage($seconds),
            ]);
        }

        $remember = $request->boolean('remember');

        $user = User::with('employee', 'roles')->where('email', $email)->first();

        if (!$user) {
            return $this->failLoginAttempt($request, $throttleKey, $email, null, 'user_not_found');
        }

        if (!$user->employee || $user->employee->status !== 'active') {
            return $this->failLoginAttempt(
                $request,
                $throttleKey,
                $email,
                $user,
                !$user->employee ? 'employee_not_found' : 'employee_inactive'
            );
        }

        if (!\Illuminate\Support\Facades\Hash::check($data['password'], $user->password)) {
            return $this->failLoginAttempt($request, $throttleKey, $email, $user, 'invalid_credentials');
        }

        RateLimiter::clear($throttleKey);
        $request->session()->forget('auth.login_lockout');

        if ($user->hasTwoFactorEnabled()) {
            $request->session()->put('auth.two_factor.pending', [
                'user_id' => $user->id,
                'remember' => $remember,
            ]);

            return redirect()
                ->route('login')
                ->with('info', 'Enter your authentication code to finish signing in.');
        }

        Auth::login($user, $remember);

        $request->session()->regenerate();

        $role = $user->roles->first()?->name;

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'auth.login',
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'message' => 'User logged in',
            'after_json' => ['remember' => $remember],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return $this->postLoginRedirect($user);
    }

    public function verifyTwoFactor(Request $request)
    {
        $challenge = $request->session()->get('auth.two_factor.pending');
        if (!$challenge || empty($challenge['user_id'])) {
            throw ValidationException::withMessages([
                'code' => 'Your login session expired. Sign in again.',
            ]);
        }

        $validated = $request->validate([
            'code' => ['required', 'string'],
        ]);

        $user = User::with('roles')->find($challenge['user_id']);
        if (!$user || !$user->hasTwoFactorEnabled()) {
            $request->session()->forget('auth.two_factor.pending');

            throw ValidationException::withMessages([
                'code' => 'Your login session expired. Sign in again.',
            ]);
        }

        if (!$this->twoFactorAuthService->verifyCode((string) $user->two_factor_secret, $validated['code'])) {
            AuditLog::create([
                'actor_user_id' => $user->id,
                'action' => 'auth.two_factor_failed',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'message' => 'Two-factor authentication failed.',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            throw ValidationException::withMessages([
                'code' => 'Invalid authentication code.',
            ]);
        }

        $request->session()->forget('auth.two_factor.pending');

        Auth::login($user, (bool) ($challenge['remember'] ?? false));
        $request->session()->regenerate();

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'auth.two_factor_passed',
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'message' => 'Two-factor authentication completed.',
            'after_json' => ['remember' => (bool) ($challenge['remember'] ?? false)],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return $this->postLoginRedirect($user);
    }

    public function destroy(Request $request)
    {
        $user = $request->user();
        if ($user) {
            AuditLog::create([
                'actor_user_id' => $user->id,
                'action' => 'auth.logout',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'message' => 'User logged out',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    private function failLoginAttempt(
        Request $request,
        string $throttleKey,
        string $email,
        ?User $user,
        string $reason
    ): never {
        RateLimiter::hit($throttleKey, self::LOCKOUT_SECONDS);

        AuditLog::create([
            'actor_user_id' => $user?->id,
            'action' => 'auth.login_failed',
            'entity_type' => 'User',
            'entity_id' => $user?->id,
            'message' => 'Login failed.',
            'after_json' => [
                'email' => $email,
                'reason' => $reason,
                'attempts_remaining' => max(0, self::MAX_LOGIN_ATTEMPTS - RateLimiter::attempts($throttleKey)),
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        throw ValidationException::withMessages([
            'email' => 'Invalid login credentials.',
        ]);
    }

    private function logLoginBlocked(Request $request, string $email, int $seconds): void
    {
        AuditLog::create([
            'actor_user_id' => null,
            'action' => 'auth.login_locked',
            'entity_type' => 'User',
            'entity_id' => null,
            'message' => 'Login temporarily locked due to too many failed attempts.',
            'after_json' => [
                'email' => $email,
                'retry_after_seconds' => $seconds,
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }

    private function throttleKey(Request $request, string $email): string
    {
        return Str::lower($email) . '|' . $request->ip();
    }

    private function lockoutMessage(int $seconds): string
    {
        $minutes = (int) ceil($seconds / 60);

        return "Too many login attempts. Try again in {$minutes} minute(s).";
    }

    private function storeLockoutState(Request $request, int $seconds): void
    {
        $request->session()->flash('auth.login_lockout', [
            'seconds_remaining' => $seconds,
            'expires_at' => now()->addSeconds($seconds)->toIso8601String(),
        ]);
    }

    private function postLoginRedirect(User $user)
    {
        if ($user->requiresPasswordChange()) {
            return redirect()
                ->route('security.password.show')
                ->with('warning', 'Change your password before continuing.');
        }

        return match ($user->roles->first()?->name) {
            'admin' => redirect()->intended('/dashboard/admin'),
            'cashier' => redirect()->intended('/dashboard/cashier'),
            'accountant' => redirect()->intended('/dashboard/accountant'),
            'rider' => redirect()->intended('/dashboard/rider'),
            'inventory_manager' => redirect()->intended('/dashboard/inventory'),
            default => redirect('/'),
        };
    }
}
