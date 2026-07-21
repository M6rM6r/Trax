<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\User;
use Database\Seeders\TraxDatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\MockFirebaseAuth;

class DashboardTrackingControllerTest extends TestCase
{
    use MockFirebaseAuth;
    use RefreshDatabase;

    private function authHeaders(): array
    {
        $this->seed(TraxDatabaseSeeder::class);
        $user = User::where('email', 'boss@trax.com')->first();

        return $this->firebaseHeaders($user);
    }

    public function test_can_get_dashboard_stats(): void
    {
        $headers = $this->authHeaders();

        $response = $this->withHeaders($headers)->getJson('/api/dashboard/stats');

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
        $headers = $this->authHeaders();

        $response = $this->withHeaders($headers)->getJson('/api/tracking/live');

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    public function test_dashboard_stats_reflect_seeded_data(): void
    {
        $headers = $this->authHeaders();

        $response = $this->withHeaders($headers)->getJson('/api/dashboard/stats');

        $response->assertStatus(200)
            ->assertJsonPath('data.totalEmployees', 5)
            ->assertJsonPath('data.totalGeofences', 3);
    }

    public function test_can_update_staff_location_heartbeat(): void
    {
        $headers = $this->authHeaders();
        $employee = Employee::query()->firstOrFail();

        $response = $this->withHeaders($headers)->postJson('/api/tracking/location', [
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
