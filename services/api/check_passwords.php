<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$users = \App\Models\User::where('role', '!=', 'boss')->get(['id', 'email', 'password', 'role']);
foreach ($users as $u) {
    $isHashed = str_starts_with($u->password, '$2');
    echo $u->email . ' | role=' . $u->role . ' | hashed=' . ($isHashed ? 'YES' : 'NO-PLAINTEXT') . PHP_EOL;
}
