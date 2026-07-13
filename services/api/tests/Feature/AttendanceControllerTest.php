<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\User;
use Database\Seeders\TraxDatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use Tests\Traits\MockFirebaseAuth;

class AttendanceControllerTest extends TestCase
{
    use MockFirebaseAuth;
    use RefreshDatabase;

    private function authHeaders(): array
    {
        $this->seed(TraxDatabaseSeeder::class);
        $user = User::where('email', 'boss@trax.com')->first();

        return $this->firebaseHeaders($user);
    }

    public function test_can_list_attendance_records(): void
    {
        $headers = $this->authHeaders();

        $response = $this->withHeaders($headers)->getJson('/api/attendance');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
            ]);
    }

    public function test_can_get_attendance_reports(): void
    {
        $headers = $this->authHeaders();

        $response = $this->withHeaders($headers)->getJson('/api/attendance/reports');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
            ]);
    }

    public function test_can_check_in(): void
    {
        $headers = $this->authHeaders();

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

        $response = $this->withHeaders($headers)->postJson('/api/attendance/check-in', [
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
        $headers = $this->authHeaders();

        $response = $this->withHeaders($headers)->postJson('/api/attendance/check-in', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['employee_id', 'lat', 'lng', 'geofence_id']);
    }

    public function test_cannot_check_in_twice_same_day(): void
    {
        $headers = $this->authHeaders();

        $this->withHeaders($headers)->postJson('/api/attendance/check-in', [
            'employee_id' => 2,
            'lat' => 24.7136,
            'lng' => 46.6753,
            'geofence_id' => 1,
        ]);

        $secondResponse = $this->withHeaders($headers)->postJson('/api/attendance/check-in', [
            'employee_id' => 2,
            'lat' => 24.7136,
            'lng' => 46.6753,
            'geofence_id' => 1,
        ]);

        $secondResponse->assertStatus(409);
    }

    public function test_can_check_out(): void
    {
        $headers = $this->authHeaders();

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

        $response = $this->withHeaders($headers)->postJson('/api/attendance/check-out', [
            'employee_id' => $employee->id,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'checked_out');
    }

    public function test_check_out_fails_without_check_in(): void
    {
        $headers = $this->authHeaders();

        $response = $this->withHeaders($headers)->postJson('/api/attendance/check-out', [
            'employee_id' => 999,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['employee_id']);
    }
}
