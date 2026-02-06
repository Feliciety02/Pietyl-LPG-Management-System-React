<?php

return [
    // Default VAT rate used throughout the system
    'default_rate' => 0.12,
    // Assume prices include VAT by default
    'default_inclusive' => true,
    // Default VAT mode when creating settings
    'default_mode' => 'inclusive',
    'treatments' => [
        'vatable_12' => 'VATable 12%',
        'zero_rated_0' => 'Zero-rated 0%',
        'exempt' => 'VAT Exempt',
    ],
];
