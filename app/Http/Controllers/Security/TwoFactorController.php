<?php

namespace App\Http\Controllers\Security;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Services\TwoFactorAuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class TwoFactorController extends Controller
{
    public function __construct(
        private TwoFactorAuthService $twoFactorAuthService
    ) {}

    public function show(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user, 401);

        return Inertia::render('Security/TwoFactor', [
            'two_factor' => [
                'required' => $user->requiresTwoFactor(),
                'enabled' => $user->hasTwoFactorEnabled(),
                'confirmed_at' => $user->two_factor_confirmed_at?->toDateTimeString(),
                'secret' => $user->two_factor_secret ? $this->twoFactorAuthService->maskSecret($user->two_factor_secret) : null,
                'otpauth_uri' => $user->two_factor_secret
                    ? $this->twoFactorAuthService->provisioningUri($user, $user->two_factor_secret)
                    : null,
            ],
        ]);
    }

    public function provision(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $user->forceFill([
            'two_factor_secret' => $this->twoFactorAuthService->generateSecret(),
            'two_factor_confirmed_at' => null,
        ])->save();

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'auth.two_factor_secret_generated',
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'message' => 'Two-factor secret generated.',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', 'Authenticator setup key generated. Verify a code to enable MFA.');
    }

    public function enable(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $validated = $request->validate([
            'code' => ['required', 'string'],
        ]);

        if (!$user->two_factor_secret) {
            return back()->withErrors(['code' => 'Generate a setup key before enabling MFA.']);
        }

        if (!$this->twoFactorAuthService->verifyCode($user->two_factor_secret, $validated['code'])) {
            AuditLog::create([
                'actor_user_id' => $user->id,
                'action' => 'auth.two_factor_enable_failed',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'message' => 'Two-factor enable attempt failed due to invalid code.',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
            return back()->withErrors(['code' => 'Invalid authentication code.']);
        }

        $user->forceFill([
            'two_factor_confirmed_at' => now(),
        ])->save();

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'auth.two_factor_enabled',
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'message' => 'Two-factor authentication enabled.',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', 'Multi-factor authentication enabled.');
    }

    public function disable(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $validated = $request->validate([
            'password' => ['required', 'string'],
        ]);

        if (!Hash::check($validated['password'], $user->password)) {
            return back()->withErrors(['password' => 'Incorrect password.']);
        }

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        AuditLog::create([
            'actor_user_id' => $user->id,
            'action' => 'auth.two_factor_disabled',
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'message' => 'Two-factor authentication disabled.',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', 'Multi-factor authentication disabled.');
    }
}
