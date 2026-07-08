<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DeviceController extends Controller
{
    public function registerFcmToken(Request $request): JsonResponse
    {
        $request->validate([
            'employee_id' => ['required', 'exists:employees,id'],
            'fcm_token'   => ['required', 'string', 'max:512'],
            'platform'    => ['nullable', 'in:android,ios'],
        ]);

        $employee = Employee::find($request->employee_id);

        $employee->update([
            'fcm_token' => $request->fcm_token,
            'fcm_platform' => $request->platform ?? 'android',
        ]);

        try { Cache::tags(['employees'])->flush(); } catch (\Throwable) {}

        return response()->json([
            'success' => true,
            'message' => 'FCM token registered',
        ]);
    }

    public function unregisterFcmToken(Request $request): JsonResponse
    {
        $request->validate([
            'employee_id' => ['required', 'exists:employees,id'],
        ]);

        Employee::where('id', $request->employee_id)->update([
            'fcm_token'    => null,
            'fcm_platform' => null,
        ]);

        try { Cache::tags(['employees'])->flush(); } catch (\Throwable) {}

        return response()->json([
            'success' => true,
            'message' => 'FCM token removed',
        ]);
    }
}
