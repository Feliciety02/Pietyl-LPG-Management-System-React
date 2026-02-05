<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\Exceptions\UnauthorizedException;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request by enforcing the specified role(s).
     *
     * Supports the Spatie-style pipe-separated syntax (e.g. "admin|cashier").
     */
    public function handle(Request $request, Closure $next, string $roles): Response
    {
        $user = $request->user();
        $requested = array_filter(array_map('trim', explode('|', $roles)));

        if (!$user) {
            throw UnauthorizedException::forRoles($requested ?: [$roles]);
        }
        if (!$user->hasAnyRole($requested)) {
            throw UnauthorizedException::forRoles($requested);
        }

        return $next($request);
    }
}
