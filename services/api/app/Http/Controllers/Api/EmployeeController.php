<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = Employee::with('geofence')->get();

        return response()->json([
            'success' => true,
            'data' => $employees,
        ]);
    }

    public function inactive()
    {
        $employees = Employee::where('status', 'inactive')->get();

        return response()->json([
            'success' => true,
            'data' => $employees,
        ]);
    }

    public function show($id)
    {
        $employee = Employee::with('geofence')->find($id);

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $employee,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:employees',
            'phone' => 'required|string|max:20',
            'role' => 'required|in:manager,employee,supervisor',
            'department' => 'required|string|max:255',
            'geofence_id' => 'nullable|exists:geofences,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $employee = Employee::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Employee created',
            'data' => $employee,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $employee = Employee::find($id);

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found',
            ], 404);
        }

        $employee->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Employee updated',
            'data' => $employee,
        ]);
    }

    public function destroy($id)
    {
        $employee = Employee::find($id);

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found',
            ], 404);
        }

        $employee->delete();

        return response()->json([
            'success' => true,
            'message' => 'Employee deleted',
        ]);
    }
}
