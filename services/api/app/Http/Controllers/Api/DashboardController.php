<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Attendance;
use App\Models\Geofence;
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

        $empCounts = Employee::where('company_id', $cid)
            ->selectRaw("count(*) as total, sum(case when status='active' then 1 else 0 end) as active, sum(case when status='inactive' then 1 else 0 end) as inactive")
            ->first();

        $totalEmployees  = (int) ($empCounts->total ?? 0);
        $activeEmployees = (int) ($empCounts->active ?? 0);
        $inactiveEmployees = (int) ($empCounts->inactive ?? 0);

        $attnToday = Attendance::join('employees', 'attendance.employee_id', '=', 'employees.id')
            ->where('employees.company_id', $cid)
            ->where('attendance.date', $today)
            ->selectRaw("
                sum(case when attendance.status = 'present' then 1 else 0 end) as present,
                sum(case when attendance.status = 'late' then 1 else 0 end) as late,
                sum(case when attendance.status = 'checked_out' then 1 else 0 end) as checked_out,
                count(*) as total_checked_in,
                avg(attendance.worked_hours) as avg_worked
            ")
            ->first();

        $presentToday    = (int) ($attnToday->present ?? 0);
        $lateToday       = (int) ($attnToday->late ?? 0);
        $checkedOutToday = (int) ($attnToday->checked_out ?? 0);
        $absentToday     = max(0, $totalEmployees - (int) ($attnToday->total_checked_in ?? 0));
        $avgWorkedHours  = round((float) ($attnToday->avg_worked ?? 0), 2);
        $onTimeRate      = $totalEmployees > 0
            ? round(($presentToday + $checkedOutToday) / $totalEmployees * 100, 2)
            : 0;

        $checkInTimes = Attendance::join('employees', 'attendance.employee_id', '=', 'employees.id')
            ->where('employees.company_id', $cid)
            ->where('attendance.date', $today)
            ->whereNotNull('attendance.check_in_time')
            ->pluck('attendance.check_in_time');

        $avgCheckIn = 'N/A';
        if ($checkInTimes->isNotEmpty()) {
            $totalSecs = $checkInTimes->reduce(function (int $carry, $t) {
                [$h, $m] = array_map('intval', explode(':', substr((string) $t, 0, 5)));
                return $carry + $h * 3600 + $m * 60;
            }, 0);
            $avgSecs   = intdiv($totalSecs, $checkInTimes->count());
            $avgCheckIn = sprintf('%02d:%02d', intdiv($avgSecs, 3600), intdiv($avgSecs % 3600, 60));
        }

        $totalGeofences = Geofence::where('company_id', $cid)->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'totalEmployees'    => $totalEmployees,
                'activeEmployees'   => $activeEmployees,
                'inactiveEmployees' => $inactiveEmployees,
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
        $cid   = $this->companyId();
        $arDays = [
            'Sunday' => 'الأحد', 'Monday' => 'الإثنين', 'Tuesday' => 'الثلاثاء',
            'Wednesday' => 'الأربعاء', 'Thursday' => 'الخميس', 'Friday' => 'الجمعة', 'Saturday' => 'السبت',
        ];

        $totalEmployees = Employee::where('company_id', $cid)->count();

        $start7  = now()->subDays(6)->toDateString();
        $start14 = now()->subDays(13)->toDateString();
        $end7    = now()->subDays(7)->toDateString();
        $today   = now()->toDateString();

        $rawRows = Attendance::join('employees', 'attendance.employee_id', '=', 'employees.id')
            ->where('employees.company_id', $cid)
            ->whereBetween('attendance.date', [$start14, $today])
            ->selectRaw("
                attendance.date,
                sum(case when attendance.status IN ('present','checked_out') then 1 else 0 end) as present,
                sum(case when attendance.status = 'late' then 1 else 0 end) as late,
                count(*) as total,
                avg(case when attendance.status = 'checked_out' then attendance.worked_hours end) as avg_worked
            ")
            ->groupBy('attendance.date')
            ->get()
            ->keyBy('date');

        $weeklyData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date   = now()->subDays($i)->toDateString();
            $engDay = now()->subDays($i)->format('l');
            $row    = $rawRows->get($date);

            $weeklyData[] = [
                'day'            => $arDays[$engDay] ?? $engDay,
                'present'        => (int) ($row->present ?? 0),
                'late'           => (int) ($row->late ?? 0),
                'absent'         => max(0, $totalEmployees - (int) ($row->total ?? 0)),
                'avgWorkedHours' => round((float) ($row->avg_worked ?? 0), 2),
            ];
        }

        $thisWeekRows = $rawRows->filter(fn($r) => $r->date >= $start7 && $r->date <= $today);
        $prevWeekRows = $rawRows->filter(fn($r) => $r->date >= $start14 && $r->date <= $end7);

        $thisPresent = $thisWeekRows->sum('present');
        $prevPresent = $prevWeekRows->sum('present');
        $thisLate    = $thisWeekRows->sum('late');
        $prevLate    = $prevWeekRows->sum('late');
        $thisTotal   = $thisWeekRows->sum('total');
        $prevTotal   = $prevWeekRows->sum('total');
        $thisAbsent  = max(0, $totalEmployees * 7 - $thisTotal);
        $prevAbsent  = max(0, $totalEmployees * 7 - $prevTotal);
        $thisOnTime  = ($thisPresent + $thisLate) > 0 ? round($thisPresent / ($thisPresent + $thisLate) * 100, 1) : 0;
        $prevOnTime  = ($prevPresent + $prevLate) > 0 ? round($prevPresent / ($prevPresent + $prevLate) * 100, 1) : 0;

        $pct = fn($cur, $prev) => $prev > 0 ? round(($cur - $prev) / $prev * 100, 1) : 0;

        $thisMonthEmp = Employee::where('company_id', $cid)->whereMonth('created_at', now()->month)->count();
        $prevMonthEmp = Employee::where('company_id', $cid)->whereMonth('created_at', now()->subMonth()->month)->count();

        $driver = DB::connection()->getDriverName();
        $hourExpr = $driver === 'sqlite'
            ? "CAST(strftime('%H', check_in_time) AS INTEGER)"
            : "HOUR(check_in_time)";

        $peakRows = Attendance::join('employees', 'attendance.employee_id', '=', 'employees.id')
            ->where('employees.company_id', $cid)
            ->whereBetween('attendance.date', [$start7, $today])
            ->whereNotNull('attendance.check_in_time')
            ->selectRaw("{$hourExpr} as hr, count(*) as cnt")
            ->groupByRaw("{$hourExpr}")
            ->orderByRaw("{$hourExpr}")
            ->get();

        $hourLabels = [
            0=>'12ص',1=>'1ص',2=>'2ص',3=>'3ص',4=>'4ص',5=>'5ص',6=>'6ص',7=>'7ص',8=>'8ص',9=>'9ص',
            10=>'10ص',11=>'11ص',12=>'12م',13=>'1م',14=>'2م',15=>'3م',16=>'4م',17=>'5م',
            18=>'6م',19=>'7م',20=>'8م',21=>'9م',22=>'10م',23=>'11م',
        ];
        $peakHoursData = $peakRows->map(fn($r) => [
            'hour'  => $hourLabels[$r->hr] ?? "{$r->hr}:00",
            'count' => (int) $r->cnt,
        ])->values()->all();

        return response()->json([
            'success' => true,
            'data'    => [
                'weeklyData'       => $weeklyData,
                'peakHoursData'    => $peakHoursData,
                'employeeGrowth'   => $pct($thisMonthEmp, $prevMonthEmp),
                'presentChange'    => $pct($thisPresent, $prevPresent),
                'lateChange'       => $pct($thisLate, $prevLate),
                'absentChange'     => $pct($thisAbsent, $prevAbsent),
                'onTimeRateChange' => round($thisOnTime - $prevOnTime, 1),
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
