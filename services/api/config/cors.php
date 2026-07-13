<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'https://naf--trax-ae.asia-southeast1.hosted.app',
        'https://trax-ae.web.app',
        'https://trax-ae.firebaseapp.com',
        'https://app.trax.com',
    ],

    'allowed_origins_patterns' => [
        '#^http://localhost(:\d+)?$#',
        '#^http://127\.0\.0\.1(:\d+)?$#',
        '#^https://.*\.hosted\.app$#',
        '#^https://.*\.web\.app$#',
        '#^https://.*\.firebaseapp\.com$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
