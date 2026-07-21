import { api } from "@/lib/services/api";

describe("API Service Layer", () => {
  it("employees.list returns array with success flag", async () => {
    const res = await api.employees.list();
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data)).toBe(true);
  });

  it("employees.inactive returns only inactive employees", async () => {
    const res = await api.employees.inactive();
    expect(res.success).toBe(true);
    expect(res.data.every((e) => e.status === "inactive")).toBe(true);
  });

  it("employees.byId returns employee or undefined", async () => {
    const res = await api.employees.byId(1);
    expect(res.success).toBe(true);
    expect(res.data === undefined || typeof res.data === "object").toBe(true);
  });

  it("attendance.list returns array", async () => {
    const res = await api.attendance.list();
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data)).toBe(true);
  });

  it("attendance.reports returns array", async () => {
    const res = await api.attendance.reports();
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data)).toBe(true);
  });

  it("geofences.list returns array", async () => {
    const res = await api.geofences.list();
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data)).toBe(true);
  });

  it("dashboard.stats returns DashboardStats object", async () => {
    const res = await api.dashboard.stats();
    expect(res.success).toBe(true);
    expect(res.data).toHaveProperty("totalEmployees");
    expect(res.data).toHaveProperty("presentToday");
    expect(res.data).toHaveProperty("onTimeRate");
  });

  it("tracking.live returns array", async () => {
    const res = await api.tracking.live();
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data)).toBe(true);
  });
});
