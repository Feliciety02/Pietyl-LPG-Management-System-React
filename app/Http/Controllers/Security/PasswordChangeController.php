<?php

namespace App\Http\Controllers\Security;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class PasswordChangeController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user, 401);

        return Inertia::render('Security/PasswordChange', [
            'password_security' => [
                'must_change_password' => $user->requiresPasswordChange(),
                'minimum_length' => 12,
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(12)->letters()->mixedCase()->numbers()->symbols()],
        ], [
            'password.confirmed' => 'The new password confirmation does not match.',
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            AuditLog::create([
                'actor_user_id' => $user->id,
                'action' => 'auth.password_change_failed',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'message' => 'Password change failed because the current password was incorrect.',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return back()->withErrors(['current_password' => 'Incorrect current password.']);
        }

        if (Hash::check($validated['password'], $user->password)) {
            return back()->withErrors(['password' => 'Choose a new password different from your current password.']);
        }

        $user->forceFill([
            'password' => Hash::make($validated['password']),
            'must_change_password' => false,
            'password_changed_at' => now(),
            'remember_token' => null,
        ])->save();

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'auth.password_changed',
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'message' => 'User changed their password.',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return redirect('/')
            ->with('success', 'Password updated successfully.');
    }
}
