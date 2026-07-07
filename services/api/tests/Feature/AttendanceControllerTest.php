<?php

namespace Tests\Feature;

use App\Models\Employee;
use Tests\TestCase;
use Illuminate\Support\Facades\DB;
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

        $employee = Employee::create([
            'company_id' => 1,
            'name' => 'Fresh Checkin User',
            'email' => 'fresh.checkin@trax.com',
            'phone' => '+966500000001',
            'role' => 'employee',
            'department' => 'Testing',
            'geofence_id' => 1,
            'status' => 'active',
        ]);

        $response = $this->withToken($token)->postJson('/api/attendance/check-in', [
            'employee_id' => $employee->id,
            'lat' => 24.7136,
            'lng' => 46.6753,
            'geofence_id' => 1,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.employeeId', $employee->id);
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

        $employee = Employee::create([
            'company_id' => 1,
            'name' => 'Fresh Checkout User',
            'email' => 'fresh.checkout@trax.com',
            'phone' => '+966500000002',
            'role' => 'employee',
            'department' => 'Testing',
            'geofence_id' => 1,
            'status' => 'active',
        ]);

        DB::table('attendance')->insert([
            'employee_id' => $employee->id,
            'date' => now()->toDateString(),
            'check_in_time' => '08:00:00',
            'check_in_lat' => 24.7136,
            'check_in_lng' => 46.6753,
            'geofence_id' => 1,
            'status' => 'present',
            'late_minutes' => 0,
            'worked_hours' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->withToken($token)->postJson('/api/attendance/check-out', [
            'employee_id' => $employee->id,
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

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['employee_id']);
    }
}
