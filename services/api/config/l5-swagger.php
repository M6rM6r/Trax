<?php

return [
    'default' => 'default',
    'documentations' => [
        'default' => [
            'api' => [
                'title' => 'Trax API Documentation',
                'description' => 'REST API for employee tracking, attendance management, and geofence monitoring',
                'version' => '1.0.0',
            ],
            'routes' => [
                'api' => 'api/documentation',
                'docs' => 'docs',
                'oauth2_callback' => 'api/oauth2-callback',
                'group_options' => [
                    'prefix' => '',
                    'middleware' => [],
                ],
                'middleware' => [
                    'api' => [],
                    'docs' => [],
                    'asset' => [],
                    'oauth2_callback' => [],
                ],
            ],
            'paths' => [
                'annotations' => [
                    base_path('app/Http/Controllers/Api'),
                    base_path('app/Models'),
                ],
                'storage' => storage_path('api-docs'),
            ],
            'generate_always' => env('L5_SWAGGER_GENERATE_ALWAYS', false),
            'swagger_version' => '3.0',
        ],
    ],
];
