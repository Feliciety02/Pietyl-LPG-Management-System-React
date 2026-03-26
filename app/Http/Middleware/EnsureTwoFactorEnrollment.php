<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTwoFactorEnrollment
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (
            $user &&
            $user->requiresTwoFactor() &&
            !$user->hasTwoFactorEnabled() &&
            !$request->routeIs('security.two-factor.*') &&
            !$request->routeIs('logout')
        ) {
            return redirect()
                ->route('security.two-factor.show')
                ->with('warning', 'Multi-factor authentication is required for your role. Complete setup before continuing.');
        }

        return $next($request);
    }
}
