import {
  buildSyntheticAbsentRecords,
  computeAttendanceCoverage,
  isPastCheckInDeadlineForDay,
} from "@/lib/utils/attendanceAbsent";

describe("attendanceAbsent", () => {
  const settings = {
    workStartTime: "08:00",
    gracePeriodMinutes: 15,
    timezone: "Asia/Riyadh",
    weekendDays: [5, 6],
  };
  const now = new Date("2026-08-07T12:00:00Z");

  it("treats past calendar days as past deadline", () => {
    expect(isPastCheckInDeadlineForDay("2026-08-06", settings, now)).toBe(true);
  });

  it("identity: present + late + absent === expected for a multi-day range", () => {
    const employees = [
      { id: "1", name: "A", status: "active" as const },
      { id: "2", name: "B", status: "active" as const },
      { id: "3", name: "C", status: "inactive" as const },
    ];
    // Thu 2026-08-06 + Fri 2026-08-07 — Fri is weekend → 1 workday × 2 active = 2
    // One late check-in on Thu → present 0 late 1 absent 1
    const c = computeAttendanceCoverage({
      employees,
      attendance: [
        {
          date: "2026-08-06",
          employeeId: "1",
          checkInTime: "09:00",
          status: "late",
          lateMinutes: 60,
        },
      ],
      fromYmd: "2026-08-06",
      toYmd: "2026-08-07",
      settings,
      now,
    });
    expect(c.workdays).toBe(1);
    expect(c.expected).toBe(2);
    expect(c.present + c.late + c.absent).toBe(c.expected);
    expect(c.late).toBe(1);
    expect(c.absent).toBe(1);
    expect(c.total).toBe(c.expected);
  });

  it("last-7-style range counts every scorable workday", () => {
    // Mon 2026-08-03 .. Sun 2026-08-09 with Fri/Sat weekend → workdays Mon-Thu = 4
    // (Sun 09 is future relative to now Aug 7? now is Aug 7 12Z — Sun Aug 9 future skipped;
    // Fri 7 weekend, Sat 8 weekend. Scorable: 3,4,5,6 = 4 days. Today Fri not scorable as weekend.)
    const employees = [{ id: "1", status: "active" as const }];
    const c = computeAttendanceCoverage({
      employees,
      attendance: [],
      fromYmd: "2026-08-03",
      toYmd: "2026-08-09",
      settings,
      now,
    });
    expect(c.workdays).toBe(4);
    expect(c.absent).toBe(4);
    expect(c.total).toBe(4);
  });

  it("does not count weekend days", () => {
    const c = computeAttendanceCoverage({
      employees: [{ id: "1", status: "active" }],
      attendance: [],
      fromYmd: "2026-08-07",
      toYmd: "2026-08-07",
      settings,
      now: new Date("2026-08-08T12:00:00Z"),
    });
    expect(c.absent).toBe(0);
    expect(c.expected).toBe(0);
  });

  it("ignores weekend punches in KPIs so present+late+absent === expected", () => {
    // Fri 2026-08-07 is weekend (Fri/Sat). Real punch still exists in Firestore,
    // but company person-day slots are 0 → Late must not be 1 with Expected 0.
    const c = computeAttendanceCoverage({
      employees: Array.from({ length: 10 }, (_, i) => ({
        id: String(i + 1),
        status: "active" as const,
      })),
      attendance: [
        {
          date: "2026-08-07",
          employeeId: "1",
          checkInTime: "05:31",
          status: "late",
          lateMinutes: 331,
        },
      ],
      fromYmd: "2026-08-07",
      toYmd: "2026-08-07",
      settings,
      now: new Date("2026-08-07T12:00:00Z"),
    });
    expect(c.workdays).toBe(0);
    expect(c.expected).toBe(0);
    expect(c.late).toBe(0);
    expect(c.present).toBe(0);
    expect(c.absent).toBe(0);
    expect(c.present + c.late + c.absent).toBe(c.expected);
  });

  it("ignores pre-deadline punches on today until the day becomes scorable", () => {
    // Thu 2026-08-06, before 08:15 deadline — not scorable yet.
    const c = computeAttendanceCoverage({
      employees: [{ id: "1", status: "active" }],
      attendance: [
        {
          date: "2026-08-06",
          employeeId: "1",
          checkInTime: "07:00",
          status: "present",
          lateMinutes: 0,
        },
      ],
      fromYmd: "2026-08-06",
      toYmd: "2026-08-06",
      settings,
      now: new Date("2026-08-06T04:00:00Z"), // 07:00 Riyadh
    });
    expect(c.workdays).toBe(0);
    expect(c.expected).toBe(0);
    expect(c.present).toBe(0);
    expect(c.present + c.late + c.absent).toBe(c.expected);
  });

  it("builds synthetic absent rows for the table", () => {
    const rows = buildSyntheticAbsentRecords({
      employees: [
        { id: "e1", name: "Saeed", status: "active" },
        { id: "e2", name: "Waleed", status: "active" },
      ],
      attendance: [],
      fromYmd: "2026-08-06",
      toYmd: "2026-08-06",
      settings,
      now,
    });
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.status === "absent" && !r.checkInTime)).toBe(true);
  });

  it("skips synthetic materialization when over row cap", () => {
    const employees = Array.from({ length: 50 }, (_, i) => ({
      id: String(i),
      status: "active" as const,
    }));
    // 50 × many workdays >> 400
    const rows = buildSyntheticAbsentRecords({
      employees,
      attendance: [],
      fromYmd: "2026-07-01",
      toYmd: "2026-07-31",
      settings,
      now: new Date("2026-08-01T12:00:00Z"),
      rowCap: 400,
    });
    expect(rows).toHaveLength(0);
    const c = computeAttendanceCoverage({
      employees,
      attendance: [],
      fromYmd: "2026-07-01",
      toYmd: "2026-07-31",
      settings,
      now: new Date("2026-08-01T12:00:00Z"),
    });
    expect(c.absent).toBeGreaterThan(400);
  });

  it("skips employees who already checked in", () => {
    const rows = buildSyntheticAbsentRecords({
      employees: [
        { id: "e1", name: "Saeed", status: "active" },
        { id: "e2", name: "Waleed", status: "active" },
      ],
      attendance: [
        {
          id: "a1",
          employeeId: "e1",
          employeeName: "Saeed",
          date: "2026-08-06",
          checkInTime: "09:00",
          checkOutTime: null,
          status: "late",
          lateMinutes: 45,
          workedHours: null,
        },
      ],
      fromYmd: "2026-08-06",
      toYmd: "2026-08-06",
      settings,
      now,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].employeeId).toBe("e2");
  });
});
