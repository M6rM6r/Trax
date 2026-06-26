<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class GeofenceControllerTest extends TestCase
{
    use RefreshDatabase;

    private function getAuthToken(): string
    {
        $this->seed(\Database\Seeders\TraxDatabaseSeeder::class);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'boss@trax.com',
            'password' => '12345678',
        ]);

        return $response->json('data.token');
    }

    public function test_can_list_geofences(): void
    {
        $token = $this->getAuthToken();

        $response = $this->withToken($token)->getJson('/api/geofences');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [['id', 'name', 'lat', 'lng', 'radius']],
            ]);
    }

    public function test_can_create_geofence(): void
    {
        $token = $this->getAuthToken();

        $response = $this->withToken($token)->postJson('/api/geofences', [
            'name' => 'Test Geofence',
            'address' => 'Test Address, Riyadh',
            'lat' => 24.7136,
            'lng' => 46.6753,
            'radius' => 150,
            'color' => '#3C7EE7',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Test Geofence');
    }

    public function test_create_geofence_validation_fails(): void
    {
        $token = $this->getAuthToken();

        $response = $this->withToken($token)->postJson('/api/geofences', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'address', 'lat', 'lng', 'radius']);
    }

    public function test_can_update_geofence(): void
    {
        $token = $this->getAuthToken();

        $response = $this->withToken($token)->putJson('/api/geofences/1', [
            'name' => 'Updated Geofence',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Updated Geofence');
    }

    public function test_can_delete_geofence(): void
    {
        $token = $this->getAuthToken();

        $createResponse = $this->withToken($token)->postJson('/api/geofences', [
            'name' => 'Delete Me',
            'address' => 'Delete Address',
            'lat' => 21.4858,
            'lng' => 39.1925,
            'radius' => 100,
            'color' => '#FF0000',
        ]);

        $geofenceId = $createResponse->json('data.id');

        $deleteResponse = $this->withToken($token)->deleteJson("/api/geofences/{$geofenceId}");

        $deleteResponse->assertStatus(200);
    }

    public function test_can_check_inside_geofence(): void
    {
        $token = $this->getAuthToken();

        $response = $this->withToken($token)->postJson('/api/geofences/check-inside', [
            'lat' => 24.7136,
            'lng' => 46.6753,
            'geofence_id' => 1,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['inside', 'distance', 'geofence_radius'],
            ]);
    }
}
