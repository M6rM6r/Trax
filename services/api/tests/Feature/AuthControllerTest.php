<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_with_valid_credentials_returns_token(): void
    {
        $this->seed(\Database\Seeders\TraxDatabaseSeeder::class);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'boss@trax.com',
            'password' => '12345678',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['token', 'user' => ['id', 'name', 'email', 'role']],
            ]);
    }

    public function test_login_with_invalid_credentials_returns_401(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'wrong@trax.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
    }

    public function test_login_validation_requires_password(): void
    {
        $response = $this->postJson('/api/auth/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_login_validation_requires_identifier_when_password_exists(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'password' => '12345678',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Identifier is required');
    }

    public function test_protected_route_without_token_returns_401(): void
    {
        $response = $this->getJson('/api/employees');

        $response->assertStatus(401);
    }
}
