<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AttendanceControllerTest extends TestCase
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

    public function test_can_list_attendance_records(): void
    {
        $token = $this->getAuthToken();

        $response = $this->withToken($token)->getJson('/api/attendance');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [['id', 'employeeId', 'date', 'status']],
            ]);
    }

    public function test_can_get_attendance_reports(): void
    {
        $token = $this->getAuthToken();

        $response = $this->withToken($token)->getJson('/api/attendance/reports');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['records', 'stats'],
            ]);
    }

    public function test_can_check_in(): void
    {
        $token = $this->getAuthToken();

        $response = $this->withToken($token)->postJson('/api/attendance/check-in', [
            'employee_id' => 1,
            'lat' => 24.7136,
            'lng' => 46.6753,
            'geofence_id' => 1,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.employeeId', 1);
    }

    public function test_check_in_validation_fails_without_required_fields(): void
    {
        $token = $this->getAuthToken();

        $response = $this->withToken($token)->postJson('/api/attendance/check-in', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['employee_id', 'lat', 'lng', 'geofence_id']);
    }

    public function test_cannot_check_in_twice_same_day(): void
    {
        $token = $this->getAuthToken();

        $this->withToken($token)->postJson('/api/attendance/check-in', [
            'employee_id' => 2,
            'lat' => 24.7136,
            'lng' => 46.6753,
            'geofence_id' => 1,
        ]);

        $secondResponse = $this->withToken($token)->postJson('/api/attendance/check-in', [
            'employee_id' => 2,
            'lat' => 24.7136,
            'lng' => 46.6753,
            'geofence_id' => 1,
        ]);

        $secondResponse->assertStatus(409);
    }

    public function test_can_check_out(): void
    {
        $token = $this->getAuthToken();

        $this->withToken($token)->postJson('/api/attendance/check-in', [
            'employee_id' => 3,
            'lat' => 24.7136,
            'lng' => 46.6753,
            'geofence_id' => 1,
        ]);

        $response = $this->withToken($token)->postJson('/api/attendance/check-out', [
            'employee_id' => 3,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'checked_out');
    }

    public function test_check_out_fails_without_check_in(): void
    {
        $token = $this->getAuthToken();

        $response = $this->withToken($token)->postJson('/api/attendance/check-out', [
            'employee_id' => 999,
        ]);

        $response->assertStatus(404);
    }
}
