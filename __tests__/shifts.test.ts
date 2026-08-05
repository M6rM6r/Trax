import { describe, expect, it } from "@jest/globals";
import { getActiveShiftForDate, resolveEmployeeShift } from "@/lib/utils/shifts";
import type { CompanySettings } from "@/lib/types/companySettings";

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
