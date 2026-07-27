export type AttendanceStatus = "present" | "absent" | "late" | "checked_out";

export type EmployeeRole = "manager" | "employee" | "supervisor";

export type AttendanceMode = "field" | "office_two_shift" | "hourly";

export interface WorkShift {
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  gracePeriodMinutes: number;
  lateThresholdMinutes: number;
}

export interface ShiftSchedule {
  mode: AttendanceMode;
  // For office_two_shift
  morningShift: WorkShift;
  eveningShift: WorkShift;
  // For field / hourly / default fallback
  defaultShift: WorkShift;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  department: string;
  avatar?: string | null;
  geofenceId?: string | null;
  status: "active" | "inactive";
  currentLat?: number | null;
  currentLng?: number | null;
  lastSeen?: string | null;
  batteryLevel?: number | null;
  employeeNumber?: string | null;
  password?: string;
  /** Override company default attendance mode. If null, company default is used. */
  attendanceMode?: AttendanceMode | null;
  /** Override company default shift. If null, company schedule is used. */
  shiftOverride?: Partial<WorkShift> | null;
}

export interface Geofence {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  radius: number;
  color: string;
  active: boolean;
  employeesCount?: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status: AttendanceStatus;
  checkInLat?: number | null;
  checkInLng?: number | null;
  checkOutLat?: number | null;
  checkOutLng?: number | null;
  geofenceId?: string | null;
  geofenceName?: string | null;
  lateMinutes: number;
  workedHours: number;
  checkOutStatus?: "present" | "late" | "absent" | null;
  /** Attendance mode applied when this record was created. */
  attendanceMode?: AttendanceMode | null;
  /** Active shift details (start/end/grace) applied when this record was created. */
  appliedShift?: WorkShift | null;
  /** For office_two_shift: "morning" | "evening", otherwise null. */
  shiftSlot?: "morning" | "evening" | null;
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
  /** Breakdown of today's checked-in records by attendance mode. */
  fieldToday: number;
  officeToday: number;
  hourlyToday: number;
}

export interface LiveTrackingEmployee {
  id: string;
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
