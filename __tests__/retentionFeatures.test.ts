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

  it("computes retention metrics from attendance records", () => {
    const features = buildRetentionFeatures(
      [
        {
          id: "1",
          employeeId: "1",
          employeeName: "A",
          date: "2026-01-01",
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
          status: "late",
          lateMinutes: 12,
          workedHours: 7,
          checkOutTime: "17:10",
        },
        {
          id: "3",
          employeeId: "3",
          employeeName: "C",
          date: "2026-01-01",
          status: "absent",
          lateMinutes: 0,
          workedHours: 0,
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
          status: "inactive",
        },
      ]
    );

    expect(features.totalEmployees).toBe(3);
    expect(features.activeEmployees).toBe(2);
    expect(features.attendanceRate).toBeCloseTo(66.67, 2);
    expect(features.absenceRate).toBeCloseTo(33.33, 2);
    expect(features.avgLateMinutes).toBe(12);
    expect(features.checkOutCompletionRate).toBeCloseTo(66.67, 2);
  });
});
