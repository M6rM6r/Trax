<?php

namespace App\Services;

use Kreait\Firebase\Contract\Auth as FirebaseAuth;

class FirebaseUserService
{
    private ?FirebaseAuth $firebaseAuth = null;

    private function auth(): ?FirebaseAuth
    {
        if ($this->firebaseAuth === null) {
            try {
                $this->firebaseAuth = app(FirebaseAuth::class);
            } catch (\Throwable $e) {
                $this->firebaseAuth = null;
            }
        }

        return $this->firebaseAuth;
    }

    /**
     * Create a Firebase Auth user with email/password.
     * Returns the Firebase UID on success, null if Firebase is unavailable.
     */
    public function createUser(string $email, string $password, ?string $displayName = null): ?string
    {
        $auth = $this->auth();
        if (! $auth) {
            return null;
        }

        try {
            $properties = [
                'email' => $email,
                'password' => $password,
                'emailVerified' => false,
            ];

            if ($displayName) {
                $properties['displayName'] = $displayName;
            }

            $createdUser = $auth->createUser($properties);

            return $createdUser->uid;
        } catch (\Throwable $e) {
            // User may already exist in Firebase
            try {
                $existing = $auth->getUserByEmail($email);

                return $existing->uid;
            } catch (\Throwable $e2) {
                return null;
            }
        }
    }

    /**
     * Update a Firebase Auth user's password by UID.
     */
    public function updatePassword(string $uid, string $password): bool
    {
        $auth = $this->auth();
        if (! $auth) {
            return false;
        }

        try {
            $auth->updateUser($uid, ['password' => $password]);

            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Delete a Firebase Auth user by UID.
     */
    public function deleteUser(string $uid): bool
    {
        $auth = $this->auth();
        if (! $auth) {
            return false;
        }

        try {
            $auth->deleteUser($uid);

            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }
}
