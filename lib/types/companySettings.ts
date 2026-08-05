export interface CompanySettings {
  // Work hours
  workStartTime: string; // "08:00"
  workEndTime: string; // "17:00"
  gracePeriodMinutes: number; // 15
  lateThresholdMinutes: number; // 15

  // Attendance modes & shifts
  attendanceMode: "field" | "office_two_shift" | "hourly";
  /** Start/end/grace for the default single shift (field / hourly). */
  defaultShift: {
    startTime: string;
    endTime: string;
    gracePeriodMinutes: number;
    lateThresholdMinutes: number;
  };
  /** Morning shift for office two-shift mode. */
  morningShift: {
    startTime: string;
    endTime: string;
    gracePeriodMinutes: number;
    lateThresholdMinutes: number;
  };
  /** Evening shift for office two-shift mode. */
  eveningShift: {
    startTime: string;
    endTime: string;
    gracePeriodMinutes: number;
    lateThresholdMinutes: number;
  };
  /** When true, Ramadan/seasonal hours are applied automatically based on the Hijri calendar. */
  seasonalAttendanceEnabled: boolean;
  /** Hijri month indexes (1-12) to treat as seasonal, e.g. [9] for Ramadan. */
  seasonalMonths: number[];
  /** Reduced work hours during seasonal months. */
  seasonalShift: {
    startTime: string;
    endTime: string;
    gracePeriodMinutes: number;
    lateThresholdMinutes: number;
  };

  // Auto check-in
  autoCheckInEnabled: boolean;
  autoCheckInRadiusOffset: number; // meters beyond geofence radius to trigger

  // Notifications
  notificationsEnabled: boolean;
  lateAlertsEnabled: boolean;
  attendanceAlertsEnabled: boolean;
  geofenceBreachAlertsEnabled: boolean;
  anomalyAlertsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  checkInReminderEnabled: boolean;
  checkInReminderTime: string; // "08:00"
  checkoutAlertsEnabled: boolean;

  // Session
  sessionTimeoutMinutes: number; // 60
  autoSignOutEnabled: boolean;
  autoSignOutTime: string; // "18:00"

  // Optional checkout time range (used to flag early checkouts). When not enabled, workEndTime/shift end is used as reference.
  checkoutTimeRangeEnabled: boolean;
  checkoutStartTime: string; // "17:00"
  checkoutEndTime: string; // "17:00"

  // Geofence
  requireGeofenceForCheckIn: boolean; // default: true
  allowCheckInOutsideGeofence: boolean; // default: false

  // Company
  companyName: string;
  timezone: string;
  weekendDays: number[]; // [5, 6] = Friday, Saturday
  language: "en" | "ar"; // Company language preference
}

export const defaultCompanySettings: CompanySettings = {
  workStartTime: "08:00",
  workEndTime: "17:00",
  gracePeriodMinutes: 30,
  lateThresholdMinutes: 30,

  attendanceMode: "field",
  defaultShift: {
    startTime: "08:00",
    endTime: "17:00",
    gracePeriodMinutes: 30,
    lateThresholdMinutes: 30,
  },
  morningShift: {
    startTime: "08:00",
    endTime: "12:00",
    gracePeriodMinutes: 30,
    lateThresholdMinutes: 30,
  },
  eveningShift: {
    startTime: "13:00",
    endTime: "17:00",
    gracePeriodMinutes: 30,
    lateThresholdMinutes: 30,
  },
  seasonalAttendanceEnabled: false,
  seasonalMonths: [9], // Ramadan is the 9th Hijri month
  seasonalShift: {
    startTime: "09:00",
    endTime: "15:00",
    gracePeriodMinutes: 30,
    lateThresholdMinutes: 30,
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
  checkoutStartTime: "08:30",
  checkoutEndTime: "17:00",

  requireGeofenceForCheckIn: true,
  allowCheckInOutsideGeofence: false,

  companyName: "",
  timezone: "Asia/Riyadh",
  weekendDays: [5, 6],
  language: "en",
};
