<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Attendance;
use App\Models\Geofence;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    private function companyId(): int
    {
        return auth()->user()->company_id;
    }

    public function stats()
    {
        $cid   = $this->companyId();
        $today = now()->toDateString();

        $totalEmployees  = Employee::where('company_id', $cid)->count();
        $presentToday    = Attendance::whereHas('employee', fn($q) => $q->where('company_id', $cid))->where('date', $today)->where('status', 'present')->count();
        $lateToday       = Attendance::whereHas('employee', fn($q) => $q->where('company_id', $cid))->where('date', $today)->where('status', 'late')->count();
        $absentToday     = max(0, $totalEmployees - Attendance::whereHas('employee', fn($q) => $q->where('company_id', $cid))->where('date', $today)->count());
        $checkedOutToday = Attendance::whereHas('employee', fn($q) => $q->where('company_id', $cid))->where('date', $today)->where('status', 'checked_out')->count();
        $totalGeofences  = Geofence::where('company_id', $cid)->count();
        $onTimeRate      = $totalEmployees > 0 ? round(($presentToday / $totalEmployees) * 100, 2) : 0;
        $avgCheckIn      = Attendance::whereHas('employee', fn($q) => $q->where('company_id', $cid))->where('date', $today)->whereNotNull('check_in_time')->avg('check_in_time');
        $avgWorkedHours  = round(Attendance::whereHas('employee', fn($q) => $q->where('company_id', $cid))->where('date', $today)->where('status', 'checked_out')->avg('worked_hours') ?? 0, 2);

        return response()->json([
            'success' => true,
            'data'    => [
                'totalEmployees'    => $totalEmployees,
                'activeEmployees'   => Employee::where('company_id', $cid)->where('status', 'active')->count(),
                'inactiveEmployees' => Employee::where('company_id', $cid)->where('status', 'inactive')->count(),
                'presentToday'      => $presentToday,
                'lateToday'         => $lateToday,
                'absentToday'       => $absentToday,
                'checkedOutToday'   => $checkedOutToday,
                'onTimeRate'        => $onTimeRate,
                'avgCheckInTime'    => $avgCheckIn ?? 'N/A',
                'avgWorkedHours'    => $avgWorkedHours,
                'totalGeofences'    => $totalGeofences,
            ],
        ]);
    }

    public function trends()
    {
        $cid            = $this->companyId();
        $totalEmployees = Employee::where('company_id', $cid)->count();
        $arDays         = ['Sunday' => 'الأحد', 'Monday' => 'الإثنين', 'Tuesday' => 'الثلاثاء',
                           'Wednesday' => 'الأربعاء', 'Thursday' => 'الخميس', 'Friday' => 'الجمعة', 'Saturday' => 'السبت'];

        $attendanceBase = fn() => Attendance::whereHas('employee', fn($q) => $q->where('company_id', $cid));

        $weeklyData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date    = now()->subDays($i)->toDateString();
            $engDay  = now()->subDays($i)->format('l');
            $present = $attendanceBase()->where('date', $date)->whereIn('status', ['present', 'checked_out'])->count();
            $late    = $attendanceBase()->where('date', $date)->where('status', 'late')->count();
            $absent  = max(0, $totalEmployees - $attendanceBase()->where('date', $date)->count());

            $weeklyData[] = [
                'day'            => $arDays[$engDay] ?? $engDay,
                'present'        => $present,
                'late'           => $late,
                'absent'         => $absent,
                'avgWorkedHours' => round($attendanceBase()->where('date', $date)->where('status', 'checked_out')->avg('worked_hours') ?? 0, 2),
            ];
        }

        $thisWeekPresent = $attendanceBase()->whereBetween('date', [now()->subDays(6)->toDateString(), now()->toDateString()])->whereIn('status', ['present', 'checked_out'])->count();
        $prevWeekPresent = $attendanceBase()->whereBetween('date', [now()->subDays(13)->toDateString(), now()->subDays(7)->toDateString()])->whereIn('status', ['present', 'checked_out'])->count();
        $thisWeekLate    = $attendanceBase()->whereBetween('date', [now()->subDays(6)->toDateString(), now()->toDateString()])->where('status', 'late')->count();
        $prevWeekLate    = $attendanceBase()->whereBetween('date', [now()->subDays(13)->toDateString(), now()->subDays(7)->toDateString()])->where('status', 'late')->count();
        $thisWeekAbsent  = max(0, $totalEmployees * 7 - $attendanceBase()->whereBetween('date', [now()->subDays(6)->toDateString(), now()->toDateString()])->count());
        $prevWeekAbsent  = max(0, $totalEmployees * 7 - $attendanceBase()->whereBetween('date', [now()->subDays(13)->toDateString(), now()->subDays(7)->toDateString()])->count());
        $thisWeekOnTime  = $thisWeekPresent + $thisWeekLate > 0 ? round($thisWeekPresent / ($thisWeekPresent + $thisWeekLate) * 100, 1) : 0;
        $prevWeekOnTime  = $prevWeekPresent + $prevWeekLate > 0 ? round($prevWeekPresent / ($prevWeekPresent + $prevWeekLate) * 100, 1) : 0;
        $pctChange       = fn($cur, $prev) => $prev > 0 ? round(($cur - $prev) / $prev * 100, 1) : 0;
        $thisMonthCount  = Employee::where('company_id', $cid)->whereMonth('created_at', now()->month)->count();
        $prevMonthCount  = Employee::where('company_id', $cid)->whereMonth('created_at', now()->subMonth()->month)->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'weeklyData'       => $weeklyData,
                'employeeGrowth'   => $pctChange($thisMonthCount, $prevMonthCount),
                'presentChange'    => $pctChange($thisWeekPresent, $prevWeekPresent),
                'lateChange'       => $pctChange($thisWeekLate, $prevWeekLate),
                'absentChange'     => $pctChange($thisWeekAbsent, $prevWeekAbsent),
                'onTimeRateChange' => round($thisWeekOnTime - $prevWeekOnTime, 1),
            ],
        ]);
    }

    public function departmentStats()
    {
        $cid  = $this->companyId();
        $data = DB::table('employees')
            ->where('company_id', $cid)
            ->select('department', DB::raw('count(*) as count'))
            ->groupBy('department')
            ->get()
            ->map(fn($item) => ['department' => $item->department ?? 'Unassigned', 'count' => $item->count]);

        return response()->json(['success' => true, 'data' => $data]);
    }
}
