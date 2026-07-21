<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\TraxDatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\MockFirebaseAuth;

class EmployeeControllerTest extends TestCase
{
    use MockFirebaseAuth;
    use RefreshDatabase;

    private function authHeaders(): array
    {
        $this->seed(TraxDatabaseSeeder::class);
        $user = User::where('email', 'boss@trax.com')->first();

        return $this->firebaseHeaders($user);
    }

    public function test_can_list_employees(): void
    {
        $headers = $this->authHeaders();

        $response = $this->withHeaders($headers)->getJson('/api/employees');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [['id', 'name', 'email', 'role', 'department', 'status']],
            ]);
    }

    public function test_can_create_employee_with_valid_data(): void
    {
        $headers = $this->authHeaders();

        $response = $this->withHeaders($headers)->postJson('/api/employees', [
            'name' => 'Test Employee',
            'email' => 'test.employee@trax.com',
            'phone' => '+966509999999',
            'password' => '12345678',
            'role' => 'employee',
            'department' => 'Testing',
            'geofence_id' => 1,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Test Employee');
    }

    public function test_create_employee_validation_fails_without_required_fields(): void
    {
        $headers = $this->authHeaders();

        $response = $this->withHeaders($headers)->postJson('/api/employees', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'phone', 'role', 'department']);
    }

    public function test_can_get_inactive_employees(): void
    {
        $headers = $this->authHeaders();

        $response = $this->withHeaders($headers)->getJson('/api/employees/inactive/list');

        $response->assertStatus(200);
    }

    public function test_can_delete_employee(): void
    {
        $headers = $this->authHeaders();

        $response = $this->withHeaders($headers)->postJson('/api/employees', [
            'name' => 'Delete Me',
            'email' => 'delete.me@trax.com',
            'phone' => '+966508888888',
            'password' => '12345678',
            'role' => 'employee',
            'department' => 'Testing',
        ]);

        $employeeId = $response->json('data.id');

        $deleteResponse = $this->withHeaders($headers)->deleteJson("/api/employees/{$employeeId}");

        $deleteResponse->assertStatus(200);
    }
}
