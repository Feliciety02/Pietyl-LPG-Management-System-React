<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
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
            throw ValidationException::withMessages([
                'email' => 'Invalid login credentials.',
            ]);
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => 'This account is disabled.',
            ]);
        }

        if (!$user->employee || $user->employee->status !== 'active') {
            throw ValidationException::withMessages([
                'email' => 'Employee record is inactive.',
            ]);
        }

        if (!Auth::attempt(['email' => $data['email'], 'password' => $data['password']], $remember)) {
            throw ValidationException::withMessages([
                'email' => 'Invalid login credentials.',
            ]);
        }

        $request->session()->regenerate();

        $role = $user->roles->first()?->name;

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
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
