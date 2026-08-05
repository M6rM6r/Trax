import { describe, it, expect } from "@jest/globals";
import { employeeSchema, createEmployeeSchema } from "@/lib/schemas/employee.schema";
import { geofenceSchema, createGeofenceSchema } from "@/lib/schemas/geofence.schema";
import { attendanceRecordSchema, checkInSchema } from "@/lib/schemas/attendance.schema";
import { dashboardStatsSchema } from "@/lib/schemas/dashboard.schema";

describe("Zod Validation Schemas", () => {
  describe("employeeSchema", () => {
    const validEmployee = {
      id: 1,
      name: "Ahmed",
      email: "ahmed@trax.com",
      phone: "+966501234567",
      department: "IT",
      status: "active",
    };

    it("validates a correct employee object", () => {
      expect(() => employeeSchema.parse(validEmployee)).not.toThrow();
    });

    it("rejects invalid email", () => {
      expect(() => employeeSchema.parse({ ...validEmployee, email: "not-an-email" })).toThrow();
    });

    it("rejects short name", () => {
      expect(() => employeeSchema.parse({ ...validEmployee, name: "A" })).toThrow();
    });
  });

  describe("createEmployeeSchema", () => {
    it("accepts employee without id", () => {
      const valid = {
        name: "Test",
        email: "test@trax.com",
        phone: "+966501234567",
        department: "Ops",
        status: "active",
      };
      expect(() => createEmployeeSchema.parse(valid)).not.toThrow();
    });
  });

  describe("geofenceSchema", () => {
    const validGeofence = {
      id: 1,
      name: "HQ",
      address: "Riyadh",
      lat: 24.7136,
      lng: 46.6753,
      radius: 150,
      color: "#3C7EE7",
      active: true,
    };

    it("validates a correct geofence", () => {
      expect(() => geofenceSchema.parse(validGeofence)).not.toThrow();
    });

    it("rejects invalid hex color", () => {
      expect(() => geofenceSchema.parse({ ...validGeofence, color: "red" })).toThrow();
    });

    it("rejects zero radius", () => {
      expect(() => geofenceSchema.parse({ ...validGeofence, radius: 0 })).toThrow();
    });

    it("rejects out-of-range latitude", () => {
      expect(() => geofenceSchema.parse({ ...validGeofence, lat: 91 })).toThrow();
    });
  });

  describe("createGeofenceSchema", () => {
    it("accepts geofence without id", () => {
      const valid = {
        name: "Branch",
        address: "Jeddah",
        lat: 21.4858,
        lng: 39.1925,
        radius: 100,
        color: "#10B981",
        active: true,
      };
      expect(() => createGeofenceSchema.parse(valid)).not.toThrow();
    });
  });

  describe("attendanceRecordSchema", () => {
    it("validates a correct attendance record", () => {
      const valid = {
        id: 1,
        employeeId: 1,
        employeeName: "Ahmed",
        date: "2024-01-15",
        status: "present",
        lateMinutes: 0,
        workedHours: 8,
      };
      expect(() => attendanceRecordSchema.parse(valid)).not.toThrow();
    });

    it("rejects invalid status", () => {
      const invalid = {
        id: 1,
        employeeId: 1,
        employeeName: "Ahmed",
        date: "2024-01-15",
        status: "sick",
        lateMinutes: 0,
        workedHours: 8,
      };
      expect(() => attendanceRecordSchema.parse(invalid)).toThrow();
    });
  });

  describe("checkInSchema", () => {
    it("validates correct check-in payload", () => {
      const valid = {
        employeeId: 1,
        lat: 24.7136,
        lng: 46.6753,
        geofenceId: 1,
      };
      expect(() => checkInSchema.parse(valid)).not.toThrow();
    });
  });

  describe("dashboardStatsSchema", () => {
    it("validates correct dashboard stats", () => {
      const valid = {
        totalEmployees: 50,
        activeEmployees: 45,
        inactiveEmployees: 5,
        presentToday: 40,
        lateToday: 5,
        absentToday: 5,
        checkedOutToday: 3,
        earlyCheckoutsToday: 1,
        onTimeRate: 0.89,
        avgCheckInTime: "08:15",
        avgWorkedHours: 8.2,
        totalGeofences: 3,
      };
      expect(() => dashboardStatsSchema.parse(valid)).not.toThrow();
    });
  });
});
