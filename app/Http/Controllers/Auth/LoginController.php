<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    private const MAX_LOGIN_ATTEMPTS = 5;
    private const LOCKOUT_SECONDS = 300;

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

        if (!Auth::attempt(['email' => $email, 'password' => $data['password']], $remember)) {
            return $this->failLoginAttempt($request, $throttleKey, $email, $user, 'invalid_credentials');
        }

        RateLimiter::clear($throttleKey);
        $request->session()->regenerate();

        $role = $user->roles->first()?->name;

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'auth.login',
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'message' => 'User logged in',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return match ($role) {
            'admin' => redirect()->intended('/dashboard/admin'),
            'cashier' => redirect()->intended('/dashboard/cashier'),
            'accountant' => redirect()->intended('/dashboard/accountant'),
            'rider' => redirect()->intended('/dashboard/rider'),
            'inventory_manager' => redirect()->intended('/dashboard/inventory'),
            default => redirect('/'),
        };
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
}
