<?php

return [
    'dsn' => env('SENTRY_DSN'),

    // Capture release as git sha
    'release' => env('SENTRY_RELEASE'),

    // Set traces sample rate
    'traces_sample_rate' => env('SENTRY_TRACES_SAMPLE_RATE', 0.1),

    // Set profiles sample rate
    'profiles_sample_rate' => env('SENTRY_PROFILES_SAMPLE_RATE', 0.1),

    // Override default integrations
    'integrations' => [],

    // Send default PII
    'send_default_pii' => false,

    // Enable Sentry tracing
    'enable_tracing' => (bool) env('SENTRY_ENABLE_TRACING', false),
];
