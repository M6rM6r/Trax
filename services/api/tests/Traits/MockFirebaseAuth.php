<?php

namespace Tests\Traits;

use App\Models\User;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use Lcobucci\JWT\Token\DataSet;
use Lcobucci\JWT\UnencryptedToken;
use Mockery;

trait MockFirebaseAuth
{
    protected function mockFirebaseAuth(User $user): void
    {
        $mock = Mockery::mock(FirebaseAuth::class);

        $mock->shouldReceive('verifyIdToken')
            ->andReturnUsing(function () use ($user) {
                $claims = new DataSet([
                    'email' => $user->email,
                    'sub' => $user->firebase_uid ?? 'test-uid',
                ], '');

                $token = Mockery::mock(UnencryptedToken::class);
                $token->shouldReceive('claims')->andReturn($claims);

                return $token;
            });

        $mock->shouldReceive('getUserByEmail')
            ->andReturnUsing(function () use ($user) {
                $fbUser = Mockery::mock();
                $fbUser->uid = $user->firebase_uid ?? 'test-uid';
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
