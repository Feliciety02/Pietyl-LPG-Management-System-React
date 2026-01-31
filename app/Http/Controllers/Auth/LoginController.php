<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $remember = $request->boolean('remember');

        $user = User::with('employee', 'roles')->where('email', $data['email'])->first();

        if (!$user) {
            AuditLog::create([
                'actor_user_id' => null,
                'action' => 'auth.login_failed',
                'entity_type' => 'User',
                'entity_id' => null,
                'message' => 'Login failed: user not found for ' . $data['email'],
                'after_json' => ['email' => $data['email']],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
            throw ValidationException::withMessages([
                'email' => 'Invalid login credentials.',
            ]);
        }

        if (!$user->is_active) {
            AuditLog::create([
                'actor_user_id' => $user->id,
                'action' => 'auth.login_failed',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'message' => 'Login failed: account disabled',
                'after_json' => ['email' => $data['email']],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
            throw ValidationException::withMessages([
                'email' => 'This account is disabled.',
            ]);
        }

        if (!$user->employee || $user->employee->status !== 'active') {
            AuditLog::create([
                'actor_user_id' => $user->id,
                'action' => 'auth.login_failed',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'message' => 'Login failed: employee inactive',
                'after_json' => ['email' => $data['email']],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
            throw ValidationException::withMessages([
                'email' => 'Employee record is inactive.',
            ]);
        }

        if (!Auth::attempt(['email' => $data['email'], 'password' => $data['password']], $remember)) {
            AuditLog::create([
                'actor_user_id' => $user->id,
                'action' => 'auth.login_failed',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'message' => 'Login failed: invalid credentials',
                'after_json' => ['email' => $data['email']],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
            throw ValidationException::withMessages([
                'email' => 'Invalid login credentials.',
            ]);
        }

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
}
