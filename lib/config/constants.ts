export const APP_ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/",
  EMPLOYEES: "/employees",
  EMPLOYEES_INACTIVE: "/employees/inactive",
  LIVE_MAP: "/live-map",
  ATTENDANCE: "/attendance",
  ATTENDANCE_REPORTS: "/attendance/reports",
  GEOFENCES: "/geofences",
  CHECK_IN: "/check-in",
  SETTINGS: "/settings",
  SETTINGS_SECURITY: "/settings/securitySettings",
  SETTINGS_NOTIFICATIONS: "/settings/notificationSettings",
} as const;

export const APP_COLORS = {
  PRIMARY: "#3C7EE7",
  SECONDARY: "#10489B",
  SUCCESS: "#16A34A",
  WARNING: "#F59E0B",
  ERROR: "#DC2626",
  INFO: "#0EA5E9",
  GRAY: "#9CA3AF",
  GEOFENCE_INSIDE: "#16A34A",
  GEOFENCE_OUTSIDE: "#F59E0B",
  GEOFENCE_OFFLINE: "#9CA3AF",
} as const;

export const APP_CONFIG = {
  APP_NAME: "Trax",
  APP_VERSION: "0.1.0",
  DEFAULT_LOCALE: "ar",
  LOCALES: ["en", "ar"] as const,
  TOAST_DURATION: 3000,
  DEBOUNCE_DELAY: 300,
  MAP_DEFAULT_CENTER: [46.6753, 24.7136] as [number, number],
  MAP_DEFAULT_ZOOM: 12,
  GEOFENCE_DEFAULT_RADIUS: 100,
  GEOFENCE_MAX_RADIUS: 1000,
  GEOFENCE_MIN_RADIUS: 10,
  CHECK_IN_DISTANCE_THRESHOLD: 100,
  BATTERY_LOW_THRESHOLD: 20,
} as const;

export const ATTENDANCE_STATUS = {
  PRESENT: "present",
  LATE: "late",
  ABSENT: "absent",
} as const;

export const EMPLOYEE_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export const TRACKING_STATUS = {
  INSIDE_GEOFENCE: "inside_geofence",
  OUTSIDE_GEOFENCE: "outside_geofence",
  OFFLINE: "offline",
} as const;

export const USER_ROLES = {
  BOSS: "boss",
  EMPLOYEE: "employee",
} as const;

export const ARABIC_LABELS = {
  PRESENT: "حاضر",
  LATE: "متأخر",
  ABSENT: "غائب",
  ACTIVE: "نشط",
  INACTIVE: "غير نشط",
  INSIDE_GEOFENCE: "داخل النطاق",
  OUTSIDE_GEOFENCE: "خارج النطاق",
  OFFLINE: "غير متصل",
  BOSS: "المدير",
  EMPLOYEE: "موظف",
} as const;
