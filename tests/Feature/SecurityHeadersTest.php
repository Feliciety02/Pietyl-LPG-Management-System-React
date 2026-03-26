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
    expect($csp)->toContain("frame-ancestors 'self'");
    expect($csp)->toContain("form-action 'self'");
});

test('hsts header is only added for secure requests', function () {
    $insecure = $this->get('/login');
    expect($insecure->headers->get('Strict-Transport-Security'))->toBeNull();

    $secure = $this->withServerVariables([
        'HTTPS' => 'on',
        'SERVER_PORT' => 443,
    ])->get('/login');

    $secure->assertOk()
        ->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
});
