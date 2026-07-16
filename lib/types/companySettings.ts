export interface CompanySettings {
  // Work hours
  workStartTime: string; // "08:00"
  workEndTime: string; // "17:00"
  gracePeriodMinutes: number; // 15
  lateThresholdMinutes: number; // 15

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

  // Session
  sessionTimeoutMinutes: number; // 60
  autoSignOutEnabled: boolean;
  autoSignOutTime: string; // "18:00"

  // Geofence
  requireGeofenceForCheckIn: boolean;
  allowCheckInOutsideGeofence: boolean;

  // Company
  companyName: string;
  timezone: string;
  weekendDays: number[]; // [5, 6] = Friday, Saturday
}

export const defaultCompanySettings: CompanySettings = {
  workStartTime: "08:00",
  workEndTime: "17:00",
  gracePeriodMinutes: 15,
  lateThresholdMinutes: 15,

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

  sessionTimeoutMinutes: 60,
  autoSignOutEnabled: false,
  autoSignOutTime: "18:00",

  requireGeofenceForCheckIn: false,
  allowCheckInOutsideGeofence: true,

  companyName: "",
  timezone: "Asia/Riyadh",
  weekendDays: [5, 6],
};
