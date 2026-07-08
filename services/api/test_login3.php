<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Check what's actually stored without the model cast
$raw = \Illuminate\Support\Facades\DB::table('users')->where('email', 'co1@co1.com')->first();
echo "Raw password from DB: " . $raw->password . PHP_EOL;
echo "Is bcrypt: " . (str_starts_with($raw->password, '$2') ? 'YES' : 'NO - PLAINTEXT!') . PHP_EOL;

// Also check what happens when we read via Model (cast applies)
$user = \App\Models\User::where('email', 'co1@co1.com')->first();
echo "Via Model: " . substr($user->password, 0, 20) . "..." . PHP_EOL;
