<?php

namespace Tests\Traits;

use App\Models\User;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use Lcobucci\JWT\Token\DataSet;
use Lcobucci\JWT\UnencryptedToken;
use Mockery;

trait MockFirebaseAuth
{
    protected function mockFirebaseAuth(User $user, ?string $firebaseUid = null): void
    {
        $mock = Mockery::mock(FirebaseAuth::class);
        $firebaseUid ??= $user->firebase_uid ?? 'test-uid';

        $mock->shouldReceive('verifyIdToken')
            ->andReturnUsing(function () use ($user, $firebaseUid) {
                $claims = new DataSet([
                    'email' => $user->email,
                    'sub' => $firebaseUid,
                ], '');

                $token = Mockery::mock(UnencryptedToken::class);
                $token->shouldReceive('claims')->andReturn($claims);

                return $token;
            });

        $mock->shouldReceive('getUserByEmail')
            ->andReturnUsing(function () use ($user, $firebaseUid) {
                $fbUser = Mockery::mock();
                $fbUser->uid = $firebaseUid;
                $fbUser->email = $user->email;

                return $fbUser;
            });

        $this->app->instance(FirebaseAuth::class, $mock);
    }

    protected function firebaseHeaders(User $user): array
    {
        $this->mockFirebaseAuth($user);

        return [
            'Authorization' => 'Bearer mock-firebase-token',
            'Accept' => 'application/json',
        ];
    }
}
