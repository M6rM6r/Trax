import { create } from "zustand";
import { Employee, AttendanceRecord, Geofence } from "@/lib/types/trackingTypes";

export interface PageCacheState {
  employeesData: Employee[] | null;
  attendanceData: AttendanceRecord[] | null;
  geofencesData: Geofence[] | null;
  setEmployeesData: (data: Employee[] | null) => void;
  setAttendanceData: (data: AttendanceRecord[] | null) => void;
  setGeofencesData: (data: Geofence[] | null) => void;
}

export const usePageCache = create<PageCacheState>((set) => ({
  employeesData: null,
  attendanceData: null,
  geofencesData: null,
  setEmployeesData: (data) => set({ employeesData: data }),
  setAttendanceData: (data) => set({ attendanceData: data }),
  setGeofencesData: (data) => set({ geofencesData: data }),
}));
