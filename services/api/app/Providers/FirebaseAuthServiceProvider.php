<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;

class FirebaseAuthServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(FirebaseAuth::class, function () {
            $path = config('firebase.service_account_path');

            if (!is_string($path) || $path === '' || !file_exists($path)) {
                throw new \RuntimeException(
                    'Firebase service account path is not configured or file does not exist: '.($path ?: 'empty')
                );
            }

            return (new Factory())
                ->withServiceAccount($path)
                ->createAuth();
        });
    }
}
