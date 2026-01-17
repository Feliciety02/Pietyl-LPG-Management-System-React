<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    public function store(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $remember = $request->boolean('remember');

        if (!Auth::attempt($credentials, $remember)) {
            throw ValidationException::withMessages([
                'email' => 'Invalid login credentials.',
            ]);
        }

        $request->session()->regenerate();

        $user = Auth::user();

        /* ===============================
           ACCOUNT & EMPLOYEE CHECKS
           =============================== */

        if (!$user->is_active) {
            Auth::logout();

            throw ValidationException::withMessages([
                'email' => 'This account is disabled.',
            ]);
        }

        if (!$user->employee || $user->employee->status !== 'active') {
            Auth::logout();

            throw ValidationException::withMessages([
                'email' => 'Employee record is inactive.',
            ]);
        }

        /* ===============================
           ROLE BASED REDIRECT
           =============================== */

        $role = $user->roles()->first()?->name;

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
