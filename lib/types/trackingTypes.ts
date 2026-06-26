export type AttendanceStatus = "present" | "absent" | "late" | "checked_out";

export type EmployeeRole = "manager" | "employee" | "supervisor";

export interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  department: string;
  avatar?: string | null;
  geofenceId?: number | null;
  status: "active" | "inactive";
  currentLat?: number | null;
  currentLng?: number | null;
  lastSeen?: string | null;
  batteryLevel?: number | null;
  employeeNumber?: string | null;
}

export interface Geofence {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  radius: number; // in meters
  color: string;
  active: boolean;
  employeesCount?: number;
}

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status: AttendanceStatus;
  checkInLat?: number | null;
  checkInLng?: number | null;
  checkOutLat?: number | null;
  checkOutLng?: number | null;
  geofenceId?: number | null;
  geofenceName?: string | null;
  lateMinutes: number;
  workedHours: number;
  checkOutStatus?: "present" | "late" | "absent" | null;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  checkedOutToday: number;
  onTimeRate: number;
  avgCheckInTime: string;
  avgWorkedHours: number;
  totalGeofences: number;
}

export interface LiveTrackingEmployee {
  id: number;
  name: string;
  lat: number;
  lng: number;
  status: "inside_geofence" | "outside_geofence" | "offline";
  geofenceName?: string | null;
  lastSeen: string;
  batteryLevel: number | null;
  role?: EmployeeRole;
  avatar?: string | null;
  speed?: number | null;
}
