<?php

use Illuminate\Console\Command;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('mastermind:provision {--password=}', function (): int {
    $email = config('app.master_email');
    $password = $this->option('password') ?: $this->secret('MasterMind Firebase password');

    if (! is_string($email) || $email === '') {
        $this->error('MASTER_EMAIL is not configured.');

        return Command::FAILURE;
    }

    if (! is_string($password) || mb_strlen($password) < 12) {
        $this->error('MasterMind password must be at least 12 characters.');

        return Command::FAILURE;
    }

    try {
        $auth = app(FirebaseAuth::class);

        try {
            $user = $auth->getUserByEmail($email);
            $auth->updateUser($user->uid, [
                'password' => $password,
                'displayName' => 'MasterMind',
                'disabled' => false,
            ]);
            $this->info("MasterMind Firebase account updated for {$email}.");
        } catch (\Throwable) {
            $auth->createUser([
                'email' => $email,
                'password' => $password,
                'displayName' => 'MasterMind',
                'emailVerified' => false,
                'disabled' => false,
            ]);
            $this->info("MasterMind Firebase account created for {$email}.");
        }

        return Command::SUCCESS;
    } catch (\Throwable $error) {
        report($error);
        $this->error('MasterMind Firebase provisioning failed. Verify Firebase service-account configuration.');

        return Command::FAILURE;
    }
})->purpose('Create or reset the configured MasterMind Firebase account.');
