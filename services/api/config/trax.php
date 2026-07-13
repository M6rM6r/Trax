<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Late Check-in Threshold
    |--------------------------------------------------------------------------
    | The hour (24h) and minute at which a check-in is considered "late".
    | Defaults to 09:00. Can be overridden via env TRAX_LATE_HOUR / TRAX_LATE_MIN.
    */
    'late_threshold_hour' => (int) env('TRAX_LATE_HOUR', 9),
    'late_threshold_minute' => (int) env('TRAX_LATE_MIN', 0),

    /*
    |--------------------------------------------------------------------------
    | AI Service
    |--------------------------------------------------------------------------
    */
    'ai_service_url' => env('AI_SERVICE_URL', 'http://ai:8001'),
    'ai_service_secret' => env('AI_SERVICE_SECRET', ''),

    /*
    |--------------------------------------------------------------------------
    | Webhook
    |--------------------------------------------------------------------------
    */
    'webhook_secret' => env('TRAX_WEBHOOK_SECRET', 'trax-webhook-secret'),

    /*
    |--------------------------------------------------------------------------
    | Cache TTLs (seconds)
    |--------------------------------------------------------------------------
    */
    'cache_ttl_employees' => (int) env('CACHE_TTL_EMPLOYEES', 60),
    'cache_ttl_dashboard' => (int) env('CACHE_TTL_DASHBOARD', 300),
    'cache_ttl_attendance' => (int) env('CACHE_TTL_ATTENDANCE', 120),
];
