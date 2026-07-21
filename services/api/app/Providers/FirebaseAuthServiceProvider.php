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
                $credentials = [
                    'type' => 'service_account',
                    'project_id' => config('firebase.project_id'),
                    'client_email' => config('firebase.client_email'),
                    'private_key' => config('firebase.private_key'),
                    'token_uri' => 'https://oauth2.googleapis.com/token',
                ];
            }

            if (is_array($credentials)) {
                if (empty($credentials['project_id']) || empty($credentials['client_email']) || empty($credentials['private_key'])) {
                    throw new \RuntimeException('Firebase individual service-account secrets are incomplete.');
                }

                $factory = (new Factory)->withServiceAccount($credentials);
            } elseif (file_exists($credentials)) {
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
