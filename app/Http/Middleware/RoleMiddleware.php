<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        $userRole = $user->roles()->first()?->name;

        if ($userRole !== $role) {
            return redirect(match ($userRole) {
                'admin' => '/dashboard/admin',
                'cashier' => '/dashboard/cashier',
                'accountant' => '/dashboard/accountant',
                'rider' => '/dashboard/rider',
                'inventory_manager' => '/dashboard/inventory',
                default => '/',
            });
        }

        return $next($request);
    }
}
