<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\TraxDatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\MockFirebaseAuth;

class GeofenceControllerTest extends TestCase
{
    use MockFirebaseAuth;
    use RefreshDatabase;

    private function authHeaders(): array
    {
        $this->seed(TraxDatabaseSeeder::class);
        $user = User::where('email', 'boss@trax.com')->first();

        return $this->firebaseHeaders($user);
    }

    public function test_can_list_geofences(): void
    {
        $headers = $this->authHeaders();

        $response = $this->withHeaders($headers)->getJson('/api/geofences');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [['id', 'name', 'lat', 'lng', 'radius']],
            ]);
    }

    public function test_can_create_geofence(): void
    {
        $headers = $this->authHeaders();

        $response = $this->withHeaders($headers)->postJson('/api/geofences', [
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
        $headers = $this->authHeaders();

        $response = $this->withHeaders($headers)->postJson('/api/geofences', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['lat', 'lng', 'radius', 'color']);
    }

    public function test_can_update_geofence(): void
    {
        $headers = $this->authHeaders();

        $response = $this->withHeaders($headers)->putJson('/api/geofences/1', [
            'name' => 'Updated Geofence',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Updated Geofence');
    }

    public function test_can_delete_geofence(): void
    {
        $headers = $this->authHeaders();

        $createResponse = $this->withHeaders($headers)->postJson('/api/geofences', [
            'name' => 'Delete Me',
            'address' => 'Delete Address',
            'lat' => 21.4858,
            'lng' => 39.1925,
            'radius' => 100,
            'color' => '#FF0000',
        ]);

        $geofenceId = $createResponse->json('data.id');

        $deleteResponse = $this->withHeaders($headers)->deleteJson("/api/geofences/{$geofenceId}");

        $deleteResponse->assertStatus(200);
    }

    public function test_can_check_inside_geofence(): void
    {
        $headers = $this->authHeaders();

        $response = $this->withHeaders($headers)->postJson('/api/geofences/check-inside', [
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
