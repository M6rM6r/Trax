import { describe, expect, it } from "@jest/globals";
import { buildRetentionFeatures } from "@/lib/utils/retentionFeatures";

describe("buildRetentionFeatures", () => {
  it("returns zeroed rates when attendance is empty", () => {
    const features = buildRetentionFeatures(
      [],
      [
        {
          id: "1",
          name: "A",
          email: "a@x.com",
          phone: "1",
          department: "Ops",
          status: "active",
        },
      ]
    );

    expect(features.totalEmployees).toBe(1);
    expect(features.attendanceRate).toBe(0);
    expect(features.absenceRate).toBe(0);
    expect(features.checkOutCompletionRate).toBe(0);
  });

  it("computes retention metrics via person-day coverage", () => {
    // 3 active on one workday: A on-time+out, B late+out, C no check-in → expected 3
    const features = buildRetentionFeatures(
      [
        {
          id: "1",
          employeeId: "1",
          employeeName: "A",
          date: "2026-01-01",
          checkInTime: "08:00",
          status: "present",
          lateMinutes: 0,
          workedHours: 8,
          checkOutTime: "17:00",
        },
        {
          id: "2",
          employeeId: "2",
          employeeName: "B",
          date: "2026-01-01",
          checkInTime: "08:20",
          status: "late",
          lateMinutes: 12,
          workedHours: 7,
          checkOutTime: "17:10",
        },
      ],
      [
        {
          id: "1",
          name: "A",
          email: "a@x.com",
          phone: "1",
          department: "Ops",
          status: "active",
        },
        {
          id: "2",
          name: "B",
          email: "b@x.com",
          phone: "2",
          department: "Ops",
          status: "active",
        },
        {
          id: "3",
          name: "C",
          email: "c@x.com",
          phone: "3",
          department: "Ops",
          status: "active",
        },
      ],
      {
        workStartTime: "08:00",
        gracePeriodMinutes: 0,
        timezone: "Asia/Riyadh",
        weekendDays: [5, 6],
      }
    );

    expect(features.totalEmployees).toBe(3);
    expect(features.activeEmployees).toBe(3);
    // present+late = 2 of 3 expected
    expect(features.attendanceRate).toBeCloseTo(66.7, 1);
    expect(features.absenceRate).toBeCloseTo(33.3, 1);
    expect(features.avgLateMinutes).toBe(12);
    // 2 checkouts / 2 check-ins
    expect(features.checkOutCompletionRate).toBeCloseTo(100, 1);
  });
});
