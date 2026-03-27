<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\EnsurePasswordChange;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\SyncLegacyRoles;
use App\Http\Middleware\EnsureTwoFactorEnrollment;
use App\Http\Middleware\SetSecurityHeaders;
use Illuminate\Http\Request;
use Spatie\Permission\Middleware\PermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(
            at: env('TRUSTED_PROXIES'),
            headers: Request::HEADER_X_FORWARDED_FOR
                | Request::HEADER_X_FORWARDED_HOST
                | Request::HEADER_X_FORWARDED_PORT
                | Request::HEADER_X_FORWARDED_PROTO
                | Request::HEADER_X_FORWARDED_PREFIX
                | Request::HEADER_X_FORWARDED_AWS_ELB
        );

        if (env('APP_ENV') === 'production') {
            $middleware->trustHosts(at: fn () => array_values(array_filter([
                parse_url((string) env('APP_URL', 'http://localhost'), PHP_URL_HOST),
            ])));
        }

        $middleware->web(append: [
            HandleInertiaRequests::class,
            SyncLegacyRoles::class,
            EnsureTwoFactorEnrollment::class,
            EnsurePasswordChange::class,
            SetSecurityHeaders::class,
        ]);

        // alias for role based routes: ->middleware('role:admin')
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->create();
