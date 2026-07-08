<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Employee;
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

    public function test_can_update_staff_location_heartbeat(): void
    {
        $token = $this->getAuthToken();
        $employee = Employee::query()->firstOrFail();

        $response = $this->withToken($token)->postJson('/api/tracking/location', [
            'employee_id' => $employee->id,
            'lat' => 26.2173,
            'lng' => 50.2905,
            'accuracy' => 15,
            'timestamp' => now()->toIso8601String(),
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.employeeId', $employee->id);

        $employee->refresh();
        $this->assertEquals(26.2173, (float) $employee->current_lat);
        $this->assertEquals(50.2905, (float) $employee->current_lng);
        $this->assertNotNull($employee->last_seen);
    }
}
