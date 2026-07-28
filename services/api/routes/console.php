<?php

use App\Http\Resources\AttendanceResource;
use App\Http\Resources\EmployeeResource;
use App\Http\Resources\GeofenceResource;
use App\Models\Attendance;
use App\Models\Company;
use App\Models\Employee;
use App\Models\Geofence;
use App\Models\User;
use App\Services\FirebaseUserService;
use Illuminate\Console\Command;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('mastermind:provision {--password=}', function (): int {
    $email = config('app.master_email');
    $password = $this->option('password') ?: $this->secret('MasterMind Firebase password');

    if (! is_string($email) || $email === '') {
        $this->error('MASTER_EMAIL is not configured.');

        return Command::FAILURE;
    }

    if (! is_string($password) || mb_strlen($password) < 12) {
        $this->error('MasterMind password must be at least 12 characters.');

        return Command::FAILURE;
    }

    try {
        $auth = app(FirebaseAuth::class);

        try {
            $user = $auth->getUserByEmail($email);
            $auth->updateUser($user->uid, [
                'password' => $password,
                'displayName' => 'MasterMind',
                'disabled' => false,
            ]);
            $this->info("MasterMind Firebase account updated for {$email}.");
        } catch (\Throwable) {
            $auth->createUser([
                'email' => $email,
                'password' => $password,
                'displayName' => 'MasterMind',
                'emailVerified' => false,
                'disabled' => false,
            ]);
            $this->info("MasterMind Firebase account created for {$email}.");
        }

        return Command::SUCCESS;
    } catch (\Throwable $error) {
        report($error);
        $this->error('MasterMind Firebase provisioning failed. Verify Firebase service-account configuration.');

        return Command::FAILURE;
    }
})->purpose('Create or reset the configured MasterMind Firebase account.');

Artisan::command('firestore:sync-data', function (): int {
    $firebase = app(FirebaseUserService::class);

    $this->info('Syncing employees to Firestore...');
    foreach (Employee::with('geofence')->get() as $employee) {
        $firebase->updateEmployee(
            (string) $employee->id,
            array_merge(
                (new EmployeeResource($employee))->toArray(request()),
                ['company_id' => (string) $employee->company_id]
            )
        );
    }

    $this->info('Syncing geofences to Firestore...');
    foreach (Geofence::all() as $geofence) {
        $firebase->updateGeofence(
            (string) $geofence->id,
            array_merge(
                (new GeofenceResource($geofence))->toArray(request()),
                ['company_id' => (string) $geofence->company_id]
            )
        );
    }

    $this->info('Syncing attendance to Firestore...');
    foreach (Attendance::with(['employee', 'geofence'])->get() as $attendance) {
        $firebase->syncAttendance(
            (string) $attendance->id,
            array_merge(
                (new AttendanceResource($attendance))->toArray(request()),
                ['company_id' => (string) ($attendance->employee?->company_id ?? 1)]
            )
        );
    }

    $this->info('Syncing companies to Firestore...');
    foreach (Company::all() as $company) {
        $owner = User::where('company_id', $company->id)
            ->whereNotNull('firebase_uid')
            ->whereNotIn('role', ['employee'])
            ->first();

        $firebase->updateCompany(
            (string) $company->id,
            [
                'id' => (string) $company->id,
                'name' => $company->name,
                'slug' => $company->slug,
                'ownerId' => $owner?->firebase_uid,
                'plan' => $company->plan,
                'maxEmployees' => $company->max_employees,
                'active' => $company->active,
                'settings' => $company->settings ?? [],
            ]
        );
    }

    $this->info('Syncing user profiles to Firestore...');
    foreach (User::whereNotNull('firebase_uid')->get() as $user) {
        $employee = Employee::where('company_id', $user->company_id)
            ->where('email', $user->email)
            ->first();

        $companyName = $user->company?->name ?? '';
        $profile = [
            'id' => (string) $user->id,
            'company_id' => (string) $user->company_id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'company_name' => $companyName,
            'company' => ['id' => (string) $user->company_id, 'name' => $companyName],
        ];

        if ($employee) {
            $profile['employee_id'] = (string) $employee->id;
            $profile['assigned_geofence_id'] = $employee->geofence_id ? (string) $employee->geofence_id : null;
        }

        $firebase->syncUserProfile($user->firebase_uid, $profile);
    }

    $this->info('Firestore sync complete.');

    return Command::SUCCESS;
})->purpose('Sync existing MySQL records to Firestore');
