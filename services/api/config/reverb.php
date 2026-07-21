<?php

return [

    'apps' => [
        [
            'key' => env('REVERB_APP_KEY', 'trax-reverb-key'),
            'secret' => env('REVERB_APP_SECRET', 'trax-reverb-secret'),
            'id' => env('REVERB_APP_ID', 'trax-reverb-id'),
            'options' => [
                'host' => env('REVERB_HOST', '0.0.0.0'),
                'port' => env('REVERB_PORT', 8080),
            ],
            'allowed_origins' => ['*'],
            'ping_interval' => env('REVERB_PING_INTERVAL', 60),
            'max_request_size' => env('REVERB_MAX_REQUEST_SIZE', '10_000'),
        ],
    ],

    'development' => [
        'key' => env('REVERB_DEV_KEY', 'trax-reverb-dev-key'),
        'secret' => env('REVERB_DEV_SECRET', 'trax-reverb-dev-secret'),
        'id' => env('REVERB_DEV_ID', 'trax-reverb-dev-id'),
        'options' => [
            'host' => '0.0.0.0',
            'port' => 8080,
        ],
        'allowed_origins' => ['*'],
        'ping_interval' => 60,
        'max_request_size' => '10_000',
    ],

    'scaling' => [
        'enabled' => env('REVERB_SCALING_ENABLED', false),
        'driver' => env('REVERB_SCALING_DRIVER', 'redis'),
        'redis' => [
            'host' => env('REDIS_HOST', '127.0.0.1'),
            'port' => env('REDIS_PORT', 6379),
            'password' => env('REDIS_PASSWORD'),
            'database' => env('REDIS_DB', 0),
        ],
    ],

    'ssl' => [
        'enabled' => env('REVERB_SSL_ENABLED', false),
        'cert' => env('REVERB_SSL_CERT'),
        'key' => env('REVERB_SSL_KEY'),
    ],

];
