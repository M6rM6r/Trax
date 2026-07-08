<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);

// Simulate POST /api/auth/login for the employee
$request = \Illuminate\Http\Request::create('/api/auth/login', 'POST', [], [], [], [
    'CONTENT_TYPE' => 'application/json',
    'HTTP_ACCEPT' => 'application/json',
], json_encode([
    'identifier' => 'co1@co1.com',
    'password' => 'co1co1co1',
]));

$response = $kernel->handle($request);
echo "Status: " . $response->getStatusCode() . PHP_EOL;
echo "Body: " . $response->getContent() . PHP_EOL;
