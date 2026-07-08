<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = \App\Models\User::where('email', 'co1@co1.com')->first();
$rawHash = \Illuminate\Support\Facades\DB::table('users')->where('email', 'co1@co1.com')->value('password');

// The actual password was set when creating via EmployeeController
// Model has `password => hashed` cast, so when we set 'co1co1co1' it becomes bcrypt
// But the raw DB value shows what's stored

echo "Raw hash: " . $rawHash . PHP_EOL;
echo "Model hash: " . $user->password . PHP_EOL;
echo "Same? " . ($rawHash === $user->password ? 'YES' : 'NO - MODEL REHASHED') . PHP_EOL;

// Try checking with various possible original passwords
$candidates = ['co1co1co1', '12345678', 'password', 'co1', 'test1234', 'Test1234', 'testtest'];
foreach ($candidates as $pw) {
    $matches = \Illuminate\Support\Facades\Hash::check($pw, $rawHash);
    echo "  Hash::check('$pw', rawHash) = " . ($matches ? 'MATCH!' : 'no') . PHP_EOL;
}
