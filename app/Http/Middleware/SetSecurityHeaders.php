<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetSecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        $isLocal = app()->environment('local');
        $viteHttpSources = $isLocal
            ? [
                'http://127.0.0.1:5173',
                'http://localhost:5173',
            ]
            : [];
        $viteConnectSources = $isLocal
            ? [
                'http://127.0.0.1:5173',
                'http://localhost:5173',
                'ws://127.0.0.1:5173',
                'ws://localhost:5173',
            ]
            : [];

        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
        $response->headers->set(
            'Content-Security-Policy',
            implode('; ', [
                "default-src 'self'",
                $this->directive('script-src', array_merge(["'self'", "'unsafe-inline'", "'unsafe-eval'"], $viteHttpSources)),
                $this->directive('style-src', array_merge(["'self'", "'unsafe-inline'"], $viteHttpSources)),
                $this->directive('img-src', array_merge(["'self'", 'data:', 'blob:'], $viteHttpSources)),
                "font-src 'self' data:",
                $this->directive('connect-src', array_merge(["'self'"], $viteConnectSources)),
                "frame-ancestors 'self'",
                "base-uri 'self'",
                "form-action 'self'",
            ])
        );

        if ($request->isSecure() || (bool) config('app.force_https', false)) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }

    private function directive(string $name, array $sources): string
    {
        return $name . ' ' . implode(' ', array_unique($sources));
    }
}
