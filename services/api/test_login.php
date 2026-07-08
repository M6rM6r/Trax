<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Test login for the first non-boss user that doesn't match 12345678
$users = \App\Models\User::where('role', '!=', 'boss')->get();
foreach ($users as $u) {
    if (!\Illuminate\Support\Facades\Hash::check('12345678', $u->password)) {
        echo "Testing login for: " . $u->email . PHP_EOL;
        echo "Password hash: " . substr($u->password, 0, 20) . "..." . PHP_EOL;
        // Try some common passwords
        foreach (['password', '11111111', '87654321', 'co1password', 'testtest', 'co1co1co1', '12345678'] as $pw) {
            if (\Illuminate\Support\Facades\Hash::check($pw, $u->password)) {
                echo "  MATCHES: '$pw'" . PHP_EOL;
            }
        }
        echo PHP_EOL;
    }
}
