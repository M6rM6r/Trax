<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create the main company
        $companyId = DB::table('companies')->insertGetId([
            'name' => 'Trax Main Company',
            'slug' => 'trax-main',
            'plan' => 'pro',
            'max_employees' => 100,
            'active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Create subscription record
        DB::table('subscriptions')->insert([
            'company_id' => $companyId,
            'plan' => 'pro',
            'employee_limit' => 100,
            'price_monthly' => 0,
            'starts_at' => now(),
            'active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3. Create real geofences
        $geofences = [
            ['name' => 'المقر الرئيسي', 'address' => 'الرياض، حي العليا', 'lat' => 24.7136, 'lng' => 46.6753, 'radius' => 200, 'color' => '#3C7EE7'],
            ['name' => 'فرع جدة', 'address' => 'جدة، حي الروضة', 'lat' => 21.4858, 'lng' => 39.1925, 'radius' => 150, 'color' => '#10B981'],
            ['name' => 'فرع الدمام', 'address' => 'الدمام، حي الشاطئ', 'lat' => 26.4207, 'lng' => 50.0888, 'radius' => 120, 'color' => '#F59E0B'],
        ];

        foreach ($geofences as $geo) {
            DB::table('geofences')->insert(array_merge($geo, [
                'company_id' => $companyId,
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // 4. Create admin user (boss) — Firebase Auth user must exist
        DB::table('users')->insert([
            'company_id' => $companyId,
            'name' => 'Admin Boss',
            'email' => 'boss@trax.com',
            'password' => bcrypt(str()->random(32)),
            'role' => 'boss',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 5. Create mastermind user record
        DB::table('users')->insert([
            'company_id' => $companyId,
            'name' => 'MasterMind',
            'email' => 'mastermind@trax.com',
            'password' => bcrypt(str()->random(32)),
            'role' => 'boss',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Note: Firebase Auth users and employee records should be created
        // via the application UI (MasterMind dashboard or company admin panel)
        // to ensure Firebase Auth accounts are properly linked.
    }
}
