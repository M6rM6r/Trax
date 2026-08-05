import { describe, expect, it } from "@jest/globals";
import { evaluateCheckIn, getActiveShiftForDate, resolveEmployeeShift } from "@/lib/utils/shifts";
import type { CompanySettings } from "@/lib/types/companySettings";
import type { WorkShift } from "@/lib/types/trackingTypes";

const settings: CompanySettings = {
  workStartTime: "08:00",
  workEndTime: "17:00",
  gracePeriodMinutes: 15,
  lateThresholdMinutes: 15,
  attendanceMode: "field",
  defaultShift: {
    startTime: "08:00",
    endTime: "17:00",
    gracePeriodMinutes: 15,
    lateThresholdMinutes: 15,
  },
  morningShift: {
    startTime: "08:00",
    endTime: "12:00",
    gracePeriodMinutes: 15,
    lateThresholdMinutes: 15,
  },
  eveningShift: {
    startTime: "13:00",
    endTime: "17:00",
    gracePeriodMinutes: 15,
    lateThresholdMinutes: 15,
  },
  seasonalAttendanceEnabled: false,
  seasonalMonths: [9],
  seasonalShift: {
    startTime: "09:00",
    endTime: "15:00",
    gracePeriodMinutes: 15,
    lateThresholdMinutes: 15,
  },
  autoCheckInEnabled: false,
  autoCheckInRadiusOffset: 50,
  notificationsEnabled: true,
  lateAlertsEnabled: true,
  attendanceAlertsEnabled: true,
  geofenceBreachAlertsEnabled: false,
  anomalyAlertsEnabled: true,
  emailNotificationsEnabled: true,
  pushNotificationsEnabled: true,
  checkInReminderEnabled: true,
  checkInReminderTime: "08:00",
  checkoutAlertsEnabled: true,
  sessionTimeoutMinutes: 60,
  autoSignOutEnabled: false,
  autoSignOutTime: "18:00",
  checkoutTimeRangeEnabled: false,
  checkoutStartTime: "17:00",
  checkoutEndTime: "17:00",
  requireGeofenceForCheckIn: true,
  allowCheckInOutsideGeofence: false,
  companyName: "Trax",
  timezone: "Asia/Riyadh",
  weekendDays: [5, 6],
  language: "en",
};

describe("shift utilities", () => {
  it("uses the default shift for regular attendance mode", () => {
    const shift = getActiveShiftForDate(settings, new Date("2024-01-15T09:00:00Z"));
    expect(shift.startTime).toBe("08:00");
  });

  it("resolves the default shift when no slot is chosen", () => {
    const result = resolveEmployeeShift({}, settings, new Date("2024-01-15T09:00:00Z"));
    expect(result.shift.startTime).toBe("08:00");
    expect(result.slot).toBeNull();
  });
});

/** Windsurf late rule: after start + grace => late with minutes from shift start. */
describe("evaluateCheckIn late after grace", () => {
  const shift: WorkShift = {
    startTime: "08:00",
    endTime: "17:00",
    gracePeriodMinutes: 15,
    lateThresholdMinutes: 15,
  };

  it("is present within grace", () => {
    expect(evaluateCheckIn("08:15", shift)).toEqual({ status: "present", lateMinutes: 0 });
  });

  it("marks late right after grace ends", () => {
    expect(evaluateCheckIn("08:16", shift)).toEqual({ status: "late", lateMinutes: 16 });
  });

  it("marks late well after allowed window", () => {
    expect(evaluateCheckIn("09:30", shift)).toEqual({ status: "late", lateMinutes: 90 });
  });

  it("handles night shift check-in after midnight", () => {
    const night: WorkShift = {
      startTime: "22:00",
      endTime: "06:00",
      gracePeriodMinutes: 15,
      lateThresholdMinutes: 15,
    };
    expect(evaluateCheckIn("22:10", night)).toEqual({ status: "present", lateMinutes: 0 });
    expect(evaluateCheckIn("22:20", night)).toEqual({ status: "late", lateMinutes: 20 });
    expect(evaluateCheckIn("01:00", night)).toEqual({ status: "late", lateMinutes: 180 });
  });
});
