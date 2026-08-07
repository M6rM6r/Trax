import {
  attachEmployeeNames,
  buildAttendancePipeline,
  dedupeAttendanceByPersonDay,
  displayOutcome,
  isLateArrival,
  matchesStatusFilter,
} from "@/lib/utils/attendancePipeline";
import type { AttendanceRecord } from "@/lib/types/trackingTypes";

const settings = {
  workStartTime: "08:00",
  gracePeriodMinutes: 15,
  timezone: "Asia/Riyadh",
  weekendDays: [5, 6],
};

function punch(
  partial: Partial<AttendanceRecord> & Pick<AttendanceRecord, "id" | "employeeId" | "date">
): AttendanceRecord {
  return {
    employeeName: partial.employeeName ?? String(partial.employeeId),
    checkInTime: partial.checkInTime ?? null,
    checkOutTime: partial.checkOutTime ?? null,
    status: partial.status ?? "present",
    lateMinutes: partial.lateMinutes ?? 0,
    workedHours: partial.workedHours ?? null,
    ...partial,
  } as AttendanceRecord;
}

describe("attendancePipeline", () => {
  const now = new Date("2026-08-07T12:00:00Z");

  it("dedupes person-day preferring open session then later check-in", () => {
    const rows = dedupeAttendanceByPersonDay([
      punch({
        id: "a",
        employeeId: "1",
        date: "2026-08-06",
        checkInTime: "08:00",
        checkOutTime: "17:00",
        status: "checked_out",
      }),
      punch({
        id: "b",
        employeeId: "1",
        date: "2026-08-06",
        checkInTime: "09:00",
        status: "late",
        lateMinutes: 45,
      }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("b");
  });

  it("prefers real punch over synthetic absent on same day", () => {
    const rows = dedupeAttendanceByPersonDay([
      punch({
        id: "synthetic-absent-2026-08-06-1",
        employeeId: "1",
        date: "2026-08-06",
        status: "absent",
      }),
      punch({
        id: "real",
        employeeId: "1",
        date: "2026-08-06",
        checkInTime: "08:05",
        status: "present",
      }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("real");
  });

  it("displayOutcome: checkout wins; late still detectable", () => {
    const r = punch({
      id: "1",
      employeeId: "1",
      date: "2026-08-06",
      checkInTime: "09:00",
      checkOutTime: "17:00",
      status: "checked_out",
      lateMinutes: 40,
    });
    expect(displayOutcome(r)).toBe("checked_out");
    expect(isLateArrival(r)).toBe(true);
    expect(matchesStatusFilter(r, ["late"])).toBe(true);
    expect(matchesStatusFilter(r, ["checked_out"])).toBe(true);
    expect(matchesStatusFilter(r, ["present"])).toBe(false);
  });

  it("pipeline: weekend punch stays in table, not in KPI late", () => {
    // Fri 2026-08-07 weekend
    const employees = Array.from({ length: 10 }, (_, i) => ({
      id: String(i + 1),
      name: `E${i + 1}`,
      status: "active" as const,
    }));
    const result = buildAttendancePipeline({
      employees,
      attendance: [
        punch({
          id: "w",
          employeeId: "1",
          employeeName: "مطر",
          date: "2026-08-07",
          checkInTime: "05:31",
          status: "late",
          lateMinutes: 331,
        }),
      ],
      fromYmd: "2026-08-07",
      toYmd: "2026-08-07",
      settings,
      now,
    });
    expect(result.coverage.workdays).toBe(0);
    expect(result.coverage.expected).toBe(0);
    expect(result.coverage.late).toBe(0);
    expect(result.coverage.present + result.coverage.late + result.coverage.absent).toBe(
      result.coverage.expected
    );
    expect(result.rows.some((r) => r.checkInTime === "05:31")).toBe(true);
    expect(result.weekendPunchCount).toBe(1);
  });

  it("pipeline: workday identity holds with mixed punches + absents", () => {
    // Thu 2026-08-06 is a workday
    const employees = [
      { id: "1", name: "A", status: "active" as const },
      { id: "2", name: "B", status: "active" as const },
      { id: "3", name: "C", status: "active" as const },
    ];
    const result = buildAttendancePipeline({
      employees,
      attendance: [
        punch({
          id: "p1",
          employeeId: "1",
          date: "2026-08-06",
          checkInTime: "08:00",
          status: "present",
        }),
        punch({
          id: "p2",
          employeeId: "2",
          date: "2026-08-06",
          checkInTime: "09:30",
          status: "late",
          lateMinutes: 75,
        }),
      ],
      fromYmd: "2026-08-06",
      toYmd: "2026-08-06",
      settings,
      now,
    });
    expect(result.coverage.workdays).toBe(1);
    expect(result.coverage.expected).toBe(3);
    expect(result.coverage.total).toBe(result.coverage.expected);
    expect(result.coverage.present).toBe(1);
    expect(result.coverage.late).toBe(1);
    expect(result.coverage.absent).toBe(1);
    expect(result.coverage.present + result.coverage.late + result.coverage.absent).toBe(
      result.coverage.expected
    );
    // Table has 2 punches + 1 synthetic absent
    expect(result.rows).toHaveLength(3);
    expect(result.rows.filter((r) => r.status === "absent")).toHaveLength(1);
    expect(result.syntheticCapped).toBe(false);
  });

  it("attachEmployeeNames fills empty names from roster", () => {
    const rows = attachEmployeeNames(
      [
        punch({
          id: "1",
          employeeId: "e9",
          employeeName: "",
          date: "2026-08-06",
          checkInTime: "08:00",
        }),
      ],
      [{ id: "e9", name: "Saeed" }]
    );
    expect(rows[0].employeeName).toBe("Saeed");
  });

  it("dedupe drops empty employeeId garbage", () => {
    const rows = dedupeAttendanceByPersonDay([
      punch({ id: "x", employeeId: "", date: "2026-08-06", checkInTime: "08:00" }),
      punch({ id: "y", employeeId: "1", date: "2026-08-06", checkInTime: "08:00" }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].employeeId).toBe("1");
  });
});
