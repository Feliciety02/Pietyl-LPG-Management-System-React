<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChange
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (
            $user &&
            $user->requiresPasswordChange() &&
            !$request->routeIs('security.password.*') &&
            !$request->routeIs('security.two-factor.*') &&
            !$request->routeIs('logout')
        ) {
            return redirect()
                ->route('security.password.show')
                ->with('warning', 'You must change your password before continuing.');
        }

        return $next($request);
    }
}
