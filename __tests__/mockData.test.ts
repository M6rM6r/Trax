import {
  mockEmployees,
  mockAttendance,
  mockGeofences,
  mockLiveTracking,
  mockDashboardStats,
} from "@/lib/mockData/trackingMockData";

describe("Mock Data Integrity", () => {
  it("mockEmployees has entries", () => {
    expect(mockEmployees.length).toBeGreaterThan(0);
    mockEmployees.forEach((e) => {
      expect(e.id).toBeDefined();
      expect(e.name).toBeDefined();
      expect(e.email).toBeDefined();
      expect(e.role).toBeDefined();
    });
  });

  it("mockAttendance has entries", () => {
    expect(mockAttendance.length).toBeGreaterThan(0);
    mockAttendance.forEach((a) => {
      expect(a.id).toBeDefined();
      expect(a.employeeId).toBeDefined();
      expect(a.status).toMatch(/^(present|late|absent)$/);
    });
  });

  it("mockGeofences has entries", () => {
    expect(mockGeofences.length).toBeGreaterThan(0);
    mockGeofences.forEach((g) => {
      expect(g.id).toBeDefined();
      expect(g.name).toBeDefined();
      expect(typeof g.lat).toBe("number");
      expect(typeof g.lng).toBe("number");
      expect(g.radius).toBeGreaterThan(0);
    });
  });

  it("mockLiveTracking has entries", () => {
    expect(mockLiveTracking.length).toBeGreaterThan(0);
    mockLiveTracking.forEach((t) => {
      expect(t.id).toBeDefined();
      expect(t.name).toBeDefined();
      expect(t.status).toMatch(/^(inside_geofence|outside_geofence|offline)$/);
    });
  });

  it("mockDashboardStats has valid numbers", () => {
    expect(mockDashboardStats.totalEmployees).toBeGreaterThan(0);
    expect(
      mockDashboardStats.presentToday +
        mockDashboardStats.lateToday +
        mockDashboardStats.absentToday
    ).toBe(mockDashboardStats.totalEmployees);
  });
});
