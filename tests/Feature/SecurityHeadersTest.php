<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('security headers are included on standard web responses', function () {
    $response = $this->get('/login');

    $response->assertOk()
        ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
        ->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

    $csp = (string) $response->headers->get('Content-Security-Policy');
    expect($csp)->toContain("default-src 'self'");
    expect($csp)->toContain("script-src 'self'");
    expect($csp)->toContain("worker-src 'self' blob:");
    expect($csp)->toContain("object-src 'none'");
    expect($csp)->toContain("frame-ancestors 'self'");
    expect($csp)->toContain("form-action 'self'");
    expect($csp)->not->toContain("'unsafe-eval'");
    expect($csp)->not->toContain("script-src 'self' 'unsafe-inline'");
});

test('hsts header is added when https hardening is enabled', function () {
    $insecure = $this->get('/login');
    expect($insecure->headers->get('Strict-Transport-Security'))->toBeNull();

    config()->set('app.force_https', true);

    $secure = $this->get('/login');

    $secure->assertOk()
        ->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
});
