<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DeviceController extends Controller
{
    private function companyId(): int
    {
        return (int) (auth()->user()?->company_id ?? 0);
    }

    private function canActOnEmployee(Employee $employee): bool
    {
        $user = auth()->user();

        if (($user->role ?? null) !== 'employee') {
            return true;
        }

        if ($user->firebase_uid && $employee->firebase_uid) {
            return hash_equals($employee->firebase_uid, $user->firebase_uid);
        }

        return $user->company_id === $employee->company_id
            && strcasecmp((string) $user->email, (string) $employee->email) === 0;
    }

    public function registerFcmToken(Request $request): JsonResponse
    {
        $request->validate([
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
            'fcm_token' => ['required', 'string', 'max:512'],
            'platform' => ['nullable', 'in:android,ios'],
        ]);

        $employee = Employee::where('company_id', $this->companyId())
            ->find($request->employee_id);

        if (! $employee) {
            return response()->json(['success' => false, 'message' => 'Employee not found in your company'], 404);
        }

        if (! $this->canActOnEmployee($employee)) {
            return response()->json(['success' => false, 'message' => 'You can only manage your own device token.'], 403);
        }

        $employee->update([
            'fcm_token' => $request->fcm_token,
            'fcm_platform' => $request->platform ?? 'android',
        ]);

        try {
            Cache::tags(['employees'])->flush();
        } catch (\Throwable) {
        }

        return response()->json([
            'success' => true,
            'message' => 'FCM token registered',
        ]);
    }

    public function unregisterFcmToken(Request $request): JsonResponse
    {
        $request->validate([
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
        ]);

        $employee = Employee::where('company_id', $this->companyId())
            ->find($request->employee_id);

        if (! $employee) {
            return response()->json(['success' => false, 'message' => 'Employee not found in your company'], 404);
        }

        if (! $this->canActOnEmployee($employee)) {
            return response()->json(['success' => false, 'message' => 'You can only manage your own device token.'], 403);
        }

        $employee->update([
            'fcm_token' => null,
            'fcm_platform' => null,
        ]);

        try {
            Cache::tags(['employees'])->flush();
        } catch (\Throwable) {
        }

        return response()->json([
            'success' => true,
            'message' => 'FCM token removed',
        ]);
    }
}
