<?php

namespace App\OpenApi;

/**
 * @OA\Info(
 *     title="Trax API",
 *     description="Employee Tracking & Attendance Management System API",
 *     version="1.0.0",
 *     @OA\Contact(
 *         email="support@trax.com",
 *         name="Trax Support"
 *     )
 * )
 * @OA\Server(
 *     url="http://localhost:8000",
 *     description="Local Development Server"
 * )
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT",
 *     description="Enter JWT token from /api/auth/login"
 * )
 * @OA\Schema(
 *     schema="Employee",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Ahmed Mohammed"),
 *     @OA\Property(property="email", type="string", example="ahmed@trax.com"),
 *     @OA\Property(property="phone", type="string", example="+966500000001"),
 *     @OA\Property(property="role", type="string", enum={"manager", "employee", "supervisor"}, example="manager"),
 *     @OA\Property(property="department", type="string", example="Management"),
 *     @OA\Property(property="avatar", type="string", nullable=true),
 *     @OA\Property(property="geofenceId", type="integer", nullable=true),
 *     @OA\Property(property="geofenceName", type="string", nullable=true),
 *     @OA\Property(property="status", type="string", enum={"active", "inactive"}, example="active"),
 *     @OA\Property(property="currentLat", type="number", nullable=true),
 *     @OA\Property(property="currentLng", type="number", nullable=true),
 *     @OA\Property(property="lastSeen", type="string", format="date-time", nullable=true)
 * )
 * @OA\Schema(
 *     schema="AttendanceRecord",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="employeeId", type="integer", example=1),
 *     @OA\Property(property="employeeName", type="string", example="Ahmed Mohammed"),
 *     @OA\Property(property="date", type="string", format="date", example="2024-01-15"),
 *     @OA\Property(property="checkInTime", type="string", example="08:00", nullable=true),
 *     @OA\Property(property="checkOutTime", type="string", example="17:00", nullable=true),
 *     @OA\Property(property="status", type="string", enum={"present", "late", "absent", "checked_out"}, example="present"),
 *     @OA\Property(property="lateMinutes", type="integer", example=0),
 *     @OA\Property(property="workedHours", type="number", example=8.0),
 *     @OA\Property(property="geofenceName", type="string", nullable=true),
 *     @OA\Property(property="checkInLat", type="number", nullable=true),
 *     @OA\Property(property="checkInLng", type="number", nullable=true)
 * )
 * @OA\Schema(
 *     schema="Geofence",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Main Headquarters"),
 *     @OA\Property(property="address", type="string", example="Riyadh, Saudi Arabia"),
 *     @OA\Property(property="lat", type="number", example=24.7136),
 *     @OA\Property(property="lng", type="number", example=46.6753),
 *     @OA\Property(property="radius", type="integer", example=150),
 *     @OA\Property(property="color", type="string", example="#2563EB"),
 *     @OA\Property(property="active", type="boolean", example=true),
 *     @OA\Property(property="employeeCount", type="integer", example=5)
 * )
 * @OA\Schema(
 *     schema="DashboardStats",
 *     type="object",
 *     @OA\Property(property="totalEmployees", type="integer", example=8),
 *     @OA\Property(property="activeEmployees", type="integer", example=7),
 *     @OA\Property(property="inactiveEmployees", type="integer", example=1),
 *     @OA\Property(property="presentToday", type="integer", example=5),
 *     @OA\Property(property="lateToday", type="integer", example=2),
 *     @OA\Property(property="absentToday", type="integer", example=1),
 *     @OA\Property(property="checkedOutToday", type="integer", example=0),
 *     @OA\Property(property="onTimeRate", type="number", example=71.4),
 *     @OA\Property(property="avgCheckInTime", type="string", example="08:11"),
 *     @OA\Property(property="avgWorkedHours", type="number", example=8.0),
 *     @OA\Property(property="totalGeofences", type="integer", example=3)
 * )
 * @OA\Schema(
 *     schema="LiveTrackingEmployee",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Ahmed Mohammed"),
 *     @OA\Property(property="lat", type="number", example=24.7136),
 *     @OA\Property(property="lng", type="number", example=46.6753),
 *     @OA\Property(property="status", type="string", enum={"inside_geofence", "outside_geofence", "offline"}, example="inside_geofence"),
 *     @OA\Property(property="geofenceName", type="string", nullable=true),
 *     @OA\Property(property="lastSeen", type="string", format="date-time"),
 *     @OA\Property(property="battery", type="integer", example=85)
 * )
 */
class Schemas
{
}
