<?php

namespace App\Services;

use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use Kreait\Firebase\Contract\Firestore as Firestore;

class FirebaseUserService
{
    private ?FirebaseAuth $firebaseAuth = null;
    private ?Firestore $firestore = null;

    private function auth(): ?FirebaseAuth
    {
        if ($this->firebaseAuth === null) {
            try {
                $this->firebaseAuth = app(FirebaseAuth::class);
            } catch (\Throwable $e) {
                $this->firebaseAuth = null;
            }
        }

        return $this->firebaseAuth;
    }

    private function firestore(): ?Firestore
    {
        if ($this->firestore === null) {
            try {
                $this->firestore = app(Firestore::class);
            } catch (\Throwable $e) {
                $this->firestore = null;
            }
        }

        return $this->firestore;
    }

    /**
     * Create a Firebase Auth user with email/password.
     * Returns the Firebase UID on success, null if Firebase is unavailable.
     */
    public function createUser(string $email, string $password, ?string $displayName = null): ?string
    {
        $auth = $this->auth();
        if (! $auth) {
            return null;
        }

        try {
            $properties = [
                'email' => $email,
                'password' => $password,
                'emailVerified' => false,
            ];

            if ($displayName) {
                $properties['displayName'] = $displayName;
            }

            $createdUser = $auth->createUser($properties);

            return $createdUser->uid;
        } catch (\Throwable $e) {
            // User may already exist in Firebase
            try {
                $existing = $auth->getUserByEmail($email);

                return $existing->uid;
            } catch (\Throwable $e2) {
                return null;
            }
        }
    }

    /**
     * Update a Firebase Auth user's password by UID.
     */
    public function updatePassword(string $uid, string $password): bool
    {
        $auth = $this->auth();
        if (! $auth) {
            return false;
        }

        try {
            $auth->updateUser($uid, ['password' => $password]);

            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Delete a Firebase Auth user by UID.
     */
    public function deleteUser(string $uid): bool
    {
        $auth = $this->auth();
        if (! $auth) {
            return false;
        }

        try {
            $auth->deleteUser($uid);

            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Sync user profile data to Firestore.
     */
    public function syncUserProfile(string $uid, array $data): bool
    {
        $firestore = $this->firestore();
        if (! $firestore) {
            return false;
        }

        try {
            $database = $firestore->database();
            $usersRef = $database->collection('users');
            $usersRef->document($uid)->set($data);

            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Create company in Firestore.
     */
    public function createCompany(array $data): ?string
    {
        $firestore = $this->firestore();
        if (! $firestore) {
            return null;
        }

        try {
            $database = $firestore->database();
            $companiesRef = $database->collection('companies');
            $docRef = $companiesRef->add($data);

            return $docRef->id();
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Update company in Firestore.
     */
    public function updateCompany(string $id, array $data): bool
    {
        $firestore = $this->firestore();
        if (! $firestore) {
            return false;
        }

        try {
            $database = $firestore->database();
            $companiesRef = $database->collection('companies');
            $companiesRef->document($id)->set($data, ['merge' => true]);

            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Delete company from Firestore.
     */
    public function deleteCompany(string $id): bool
    {
        $firestore = $this->firestore();
        if (! $firestore) {
            return false;
        }

        try {
            $database = $firestore->database();
            $companiesRef = $database->collection('companies');
            $companiesRef->document($id)->delete();

            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Get company from Firestore.
     */
    public function getCompany(string $id): ?array
    {
        $firestore = $this->firestore();
        if (! $firestore) {
            return null;
        }

        try {
            $database = $firestore->database();
            $companiesRef = $database->collection('companies');
            $doc = $companiesRef->document($id)->snapshot();

            if (! $doc->exists()) {
                return null;
            }

            return array_merge(['id' => $doc->id()], $doc->data());
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * List companies from Firestore.
     */
    public function listCompanies(int $limit = 20, ?string $search = null, ?string $plan = null, ?string $status = null): array
    {
        $firestore = $this->firestore();
        if (! $firestore) {
            return [];
        }

        try {
            $database = $firestore->database();
            $query = $database->collection('companies');

            if ($search) {
                $query = $query->where('name', '>=', $search)->where('name', '<=', $search . "\uf8ff");
            }

            if ($plan) {
                $query = $query->where('plan', '==', $plan);
            }

            if ($status === 'active') {
                $query = $query->where('active', '==', true);
            } elseif ($status === 'inactive') {
                $query = $query->where('active', '==', false);
            }

            $query = $query->orderBy('created_at', 'desc')->limit($limit);
            $snapshot = $query->documents();

            $companies = [];
            foreach ($snapshot as $doc) {
                $companies[] = array_merge(['id' => $doc->id()], $doc->data());
            }

            return $companies;
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Count companies in Firestore.
     */
    public function countCompanies(): int
    {
        $firestore = $this->firestore();
        if (! $firestore) {
            return 0;
        }

        try {
            $database = $firestore->database();
            $snapshot = $database->collection('companies')->documents();

            return $snapshot->size();
        } catch (\Throwable $e) {
            return 0;
        }
    }

    /**
     * Create employee in Firestore.
     */
    public function createEmployee(array $data): ?string
    {
        $firestore = $this->firestore();
        if (! $firestore) {
            return null;
        }

        try {
            $database = $firestore->database();
            $employeesRef = $database->collection('employees');
            $docRef = $employeesRef->add($data);

            return $docRef->id();
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Update employee in Firestore.
     */
    public function updateEmployee(string $id, array $data): bool
    {
        $firestore = $this->firestore();
        if (! $firestore) {
            return false;
        }

        try {
            $database = $firestore->database();
            $employeesRef = $database->collection('employees');
            $employeesRef->document($id)->set($data, ['merge' => true]);

            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Delete employee from Firestore.
     */
    public function deleteEmployee(string $id): bool
    {
        $firestore = $this->firestore();
        if (! $firestore) {
            return false;
        }

        try {
            $database = $firestore->database();
            $employeesRef = $database->collection('employees');
            $employeesRef->document($id)->delete();

            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * List employees by company from Firestore.
     */
    public function listEmployeesByCompany(string $companyId): array
    {
        $firestore = $this->firestore();
        if (! $firestore) {
            return [];
        }

        try {
            $database = $firestore->database();
            $snapshot = $database->collection('employees')
                ->where('company_id', '==', $companyId)
                ->orderBy('created_at', 'desc')
                ->documents();

            $employees = [];
            foreach ($snapshot as $doc) {
                $employees[] = array_merge(['id' => $doc->id()], $doc->data());
            }

            return $employees;
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Sync attendance record in Firestore.
     */
    public function syncAttendance(int|string $id, array $data): bool
    {
        $firestore = $this->firestore();
        if (! $firestore) {
            return false;
        }

        try {
            $database = $firestore->database();
            $attendanceRef = $database->collection('attendance');
            $attendanceRef->document((string) $id)->set($data, ['merge' => true]);

            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Delete attendance from Firestore.
     */
    public function deleteAttendance(int|string $id): bool
    {
        $firestore = $this->firestore();
        if (! $firestore) {
            return false;
        }

        try {
            $database = $firestore->database();
            $attendanceRef = $database->collection('attendance');
            $attendanceRef->document((string) $id)->delete();

            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Create geofence in Firestore.
     */
    public function createGeofence(array $data): ?string
    {
        $firestore = $this->firestore();
        if (! $firestore) {
            return null;
        }

        try {
            $database = $firestore->database();
            $geofencesRef = $database->collection('geofences');
            $docRef = $geofencesRef->add($data);

            return $docRef->id();
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Update geofence in Firestore.
     */
    public function updateGeofence(string $id, array $data): bool
    {
        $firestore = $this->firestore();
        if (! $firestore) {
            return false;
        }

        try {
            $database = $firestore->database();
            $geofencesRef = $database->collection('geofences');
            $geofencesRef->document($id)->set($data, ['merge' => true]);

            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Delete geofence from Firestore.
     */
    public function deleteGeofence(string $id): bool
    {
        $firestore = $this->firestore();
        if (! $firestore) {
            return false;
        }

        try {
            $database = $firestore->database();
            $geofencesRef = $database->collection('geofences');
            $geofencesRef->document($id)->delete();

            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * List geofences by company from Firestore.
     */
    public function listGeofencesByCompany(string $companyId): array
    {
        $firestore = $this->firestore();
        if (! $firestore) {
            return [];
        }

        try {
            $database = $firestore->database();
            $snapshot = $database->collection('geofences')
                ->where('company_id', '==', $companyId)
                ->orderBy('created_at', 'desc')
                ->documents();

            $geofences = [];
            foreach ($snapshot as $doc) {
                $geofences[] = array_merge(['id' => $doc->id()], $doc->data());
            }

            return $geofences;
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Get dashboard stats from Firestore.
     */
    public function getDashboardStats(): array
    {
        $firestore = $this->firestore();
        if (! $firestore) {
            return [
                'companies' => 0,
                'activeCompanies' => 0,
                'trialCompanies' => 0,
                'users' => 0,
                'employees' => 0,
                'geofences' => 0,
                'attendanceToday' => 0,
                'checkedOutToday' => 0,
            ];
        }

        try {
            $database = $firestore->database();
            $today = now()->toDateString();

            $companies = $database->collection('companies')->documents()->size();
            $users = $database->collection('users')->documents()->size();
            $employees = $database->collection('employees')->documents()->size();
            $geofences = $database->collection('geofences')->documents()->size();

            $attendanceToday = $database->collection('attendance')
                ->where('date', '==', $today)
                ->documents()
                ->size();

            $checkedOutToday = $database->collection('attendance')
                ->where('date', '==', $today)
                ->where('status', '==', 'checked_out')
                ->documents()
                ->size();

            $activeCompanies = $database->collection('companies')
                ->where('active', '==', true)
                ->documents()
                ->size();

            $trialCompanies = $database->collection('companies')
                ->where('plan', '==', 'trial')
                ->documents()
                ->size();

            return [
                'companies' => $companies,
                'activeCompanies' => $activeCompanies,
                'trialCompanies' => $trialCompanies,
                'users' => $users,
                'employees' => $employees,
                'geofences' => $geofences,
                'attendanceToday' => $attendanceToday,
                'checkedOutToday' => $checkedOutToday,
            ];
        } catch (\Throwable $e) {
            return [
                'companies' => 0,
                'activeCompanies' => 0,
                'trialCompanies' => 0,
                'users' => 0,
                'employees' => 0,
                'geofences' => 0,
                'attendanceToday' => 0,
                'checkedOutToday' => 0,
            ];
        }
    }
}
