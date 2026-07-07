<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TraxDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            GeofenceSeeder::class,
            EmployeeSeeder::class,
            AttendanceSeeder::class,
        ]);
    }
}

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $companyId = (int) (DB::table('companies')->where('slug', 'trax-main')->value('id')
            ?? DB::table('companies')->insertGetId([
                'name' => 'Trax Main Company',
                'slug' => 'trax-main',
                'plan' => 'pro',
                'max_employees' => 100,
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));

        DB::table('users')->insert([
            [
                'company_id' => $companyId,
                'name' => 'Admin Boss',
                'email' => 'boss@trax.com',
                'password' => Hash::make('12345678'),
                'role' => 'boss',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'company_id' => $companyId,
                'name' => 'Test Employee',
                'email' => 'employee@trax.com',
                'password' => Hash::make('12345678'),
                'role' => 'employee',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}

class GeofenceSeeder extends Seeder
{
    public function run(): void
    {
        $companyId = (int) (DB::table('companies')->where('slug', 'trax-main')->value('id')
            ?? DB::table('companies')->insertGetId([
                'name' => 'Trax Main Company',
                'slug' => 'trax-main',
                'plan' => 'pro',
                'max_employees' => 100,
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));

        $geofences = [
            ['name' => 'المقر الرئيسي', 'address' => 'الرياض، حي العليا', 'lat' => 24.7136, 'lng' => 46.6753, 'radius' => 150, 'color' => '#3C7EE7'],
            ['name' => 'فرع جدة', 'address' => 'جدة، حي الروضة', 'lat' => 21.4858, 'lng' => 39.1925, 'radius' => 120, 'color' => '#10B981'],
            ['name' => 'فرع الدمام', 'address' => 'الدمام، حي الشاطئ', 'lat' => 26.4207, 'lng' => 50.0888, 'radius' => 100, 'color' => '#F59E0B'],
        ];

        foreach ($geofences as $geo) {
            DB::table('geofences')->insert(array_merge($geo, [
                'company_id' => $companyId,
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }
}

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $companyId = (int) (DB::table('companies')->where('slug', 'trax-main')->value('id')
            ?? DB::table('companies')->insertGetId([
                'name' => 'Trax Main Company',
                'slug' => 'trax-main',
                'plan' => 'pro',
                'max_employees' => 100,
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));

        $employees = [
            ['name' => 'أحمد محمد', 'email' => 'ahmed@trax.com', 'phone' => '+966501234567', 'role' => 'manager', 'department' => 'الإدارة', 'geofence_id' => 1, 'status' => 'active'],
            ['name' => 'سارة أحمد', 'email' => 'sara@trax.com', 'phone' => '+966502345678', 'role' => 'employee', 'department' => 'المبيعات', 'geofence_id' => 1, 'status' => 'active'],
            ['name' => 'خالد العتيبي', 'email' => 'khalid@trax.com', 'phone' => '+966503456789', 'role' => 'supervisor', 'department' => 'العمليات', 'geofence_id' => 2, 'status' => 'active'],
            ['name' => 'نورة السالم', 'email' => 'noura@trax.com', 'phone' => '+966504567890', 'role' => 'employee', 'department' => 'الموارد البشرية', 'geofence_id' => 1, 'status' => 'inactive'],
            ['name' => 'فهد القحطاني', 'email' => 'fahd@trax.com', 'phone' => '+966505678901', 'role' => 'employee', 'department' => 'تقنية المعلومات', 'geofence_id' => 3, 'status' => 'active'],
        ];

        foreach ($employees as $emp) {
            DB::table('employees')->insert(array_merge($emp, [
                'company_id' => $companyId,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }
}

class AttendanceSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = ['present', 'late', 'absent', 'checked_out'];
        $today = today();

        for ($day = 0; $day < 30; $day++) {
            $date = $today->copy()->subDays($day);
            foreach (range(1, 5) as $employeeId) {
                $status = $statuses[array_rand($statuses)];
                $checkIn = $status !== 'absent' ? rand(7, 10) . ':' . str_pad(rand(0, 59), 2, '0', STR_PAD_LEFT) : null;
                $checkOut = in_array($status, ['checked_out', 'present']) ? rand(16, 18) . ':' . str_pad(rand(0, 59), 2, '0', STR_PAD_LEFT) : null;
                $lateMinutes = $status === 'late' ? rand(5, 45) : 0;
                $workedHours = $checkIn && $checkOut ? rand(7, 10) : 0;

                DB::table('attendance')->insert([
                    'employee_id' => $employeeId,
                    'date' => $date->format('Y-m-d'),
                    'check_in_time' => $checkIn,
                    'check_out_time' => $checkOut,
                    'check_in_lat' => 24.7136 + (rand(-100, 100) / 10000),
                    'check_in_lng' => 46.6753 + (rand(-100, 100) / 10000),
                    'geofence_id' => $employeeId <= 3 ? 1 : ($employeeId == 4 ? 1 : 3),
                    'status' => $status,
                    'late_minutes' => $lateMinutes,
                    'worked_hours' => $workedHours,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
