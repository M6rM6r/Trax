<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use Kreait\Firebase\Factory;

class FirebaseAuthServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(FirebaseAuth::class, function () {
            $credentials = config('firebase.service_account_path');

            if (! is_string($credentials) || $credentials === '') {
                throw new \RuntimeException('Firebase service account credentials are not configured.');
            }

            if (file_exists($credentials)) {
                $factory = (new Factory)->withServiceAccount($credentials);
            } else {
                $decodedCredentials = json_decode($credentials, true);

                if (! is_array($decodedCredentials) || empty($decodedCredentials['project_id'])) {
                    throw new \RuntimeException(
                        'Firebase service account must be a valid file path or service-account JSON.'
                    );
                }

                $factory = (new Factory)->withServiceAccount($decodedCredentials);
            }

            return $factory->createAuth();
        });
    }

    public function boot(): void
    {
        // Defer Firebase initialization until the auth service is actually resolved.
    }
}
