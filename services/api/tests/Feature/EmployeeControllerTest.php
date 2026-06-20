<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class EmployeeControllerTest extends TestCase
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

    public function test_can_list_employees(): void
    {
        $token = $this->getAuthToken();

        $response = $this->withToken($token)->getJson('/api/employees');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [['id', 'name', 'email', 'role', 'department', 'status']],
            ]);
    }

    public function test_can_create_employee_with_valid_data(): void
    {
        $token = $this->getAuthToken();

        $response = $this->withToken($token)->postJson('/api/employees', [
            'name' => 'Test Employee',
            'email' => 'test.employee@trax.com',
            'phone' => '+966509999999',
            'role' => 'employee',
            'department' => 'Testing',
            'geofence_id' => 1,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Test Employee');
    }

    public function test_create_employee_validation_fails_without_required_fields(): void
    {
        $token = $this->getAuthToken();

        $response = $this->withToken($token)->postJson('/api/employees', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'phone', 'role', 'department']);
    }

    public function test_can_get_inactive_employees(): void
    {
        $token = $this->getAuthToken();

        $response = $this->withToken($token)->getJson('/api/employees/inactive/list');

        $response->assertStatus(200);
    }

    public function test_can_delete_employee(): void
    {
        $token = $this->getAuthToken();

        $response = $this->withToken($token)->postJson('/api/employees', [
            'name' => 'Delete Me',
            'email' => 'delete.me@trax.com',
            'phone' => '+966508888888',
            'role' => 'employee',
            'department' => 'Testing',
        ]);

        $employeeId = $response->json('data.id');

        $deleteResponse = $this->withToken($token)->deleteJson("/api/employees/{$employeeId}");

        $deleteResponse->assertStatus(200);
    }
}
