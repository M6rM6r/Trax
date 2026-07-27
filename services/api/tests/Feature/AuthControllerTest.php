<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\TraxDatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\MockFirebaseAuth;

class AuthControllerTest extends TestCase
{
    use MockFirebaseAuth;
    use RefreshDatabase;

    public function test_firebase_login_returns_user_data(): void
    {
        $this->seed(TraxDatabaseSeeder::class);
        $user = User::where('email', 'boss@trax.com')->first();

        $this->mockFirebaseAuth($user);

        $response = $this->postJson('/api/auth/firebase', [
            'id_token' => 'mock-firebase-token',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => ['user' => ['id', 'name', 'email', 'role']],
            ]);
    }

    public function test_firebase_login_rejects_mismatched_firebase_uid(): void
    {
        $this->seed(TraxDatabaseSeeder::class);
        $user = User::where('email', 'boss@trax.com')->first();
        $user->firebase_uid = 'linked-firebase-uid';
        $user->save();

        $this->mockFirebaseAuth($user, 'different-firebase-uid');

        $response = $this->postJson('/api/auth/firebase', [
            'id_token' => 'mock-firebase-token',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('message', 'Firebase account linkage mismatch.');
    }

    public function test_firebase_login_without_token_returns_422(): void
    {
        $response = $this->postJson('/api/auth/firebase', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['id_token']);
    }

    public function test_protected_route_without_token_returns_401(): void
    {
        $response = $this->getJson('/api/employees');

        $response->assertStatus(401);
    }
}
