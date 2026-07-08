<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Check if Hash::check works for recently added employees
$users = \App\Models\User::where('role', '!=', 'boss')->get(['id', 'email', 'password', 'role']);
foreach ($users as $u) {
    $isHashed = str_starts_with($u->password, '$2');
    // For hashed ones, try a common test password
    $check8 = \Illuminate\Support\Facades\Hash::check('12345678', $u->password);
    echo $u->email . ' | hashed=' . ($isHashed ? 'YES' : 'NO') . ' | matches_12345678=' . ($check8 ? 'YES' : 'no') . PHP_EOL;
}
