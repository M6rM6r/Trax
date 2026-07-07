<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DashboardTrackingControllerTest extends TestCase
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

    public function test_can_get_dashboard_stats(): void
    {
        $token = $this->getAuthToken();

        $response = $this->withToken($token)->getJson('/api/dashboard/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'totalEmployees',
                    'presentToday',
                    'lateToday',
                    'absentToday',
                    'onTimeRate',
                    'totalGeofences',
                ],
            ]);
    }

    public function test_can_get_live_tracking(): void
    {
        $token = $this->getAuthToken();

        $response = $this->withToken($token)->getJson('/api/tracking/live');

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    public function test_dashboard_stats_reflect_seeded_data(): void
    {
        $token = $this->getAuthToken();

        $response = $this->withToken($token)->getJson('/api/dashboard/stats');

        $response->assertStatus(200)
            ->assertJsonPath('data.totalEmployees', 5)
            ->assertJsonPath('data.totalGeofences', 3);
    }
}
