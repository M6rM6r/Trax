import { APP_ROUTES, APP_CONFIG, ATTENDANCE_STATUS, USER_ROLES } from "@/lib/config/constants";

describe("Constants", () => {
  it("APP_ROUTES has all required routes", () => {
    expect(APP_ROUTES.LOGIN).toBe("/login");
    expect(APP_ROUTES.DASHBOARD).toBe("/");
    expect(APP_ROUTES.EMPLOYEES).toBe("/employees");
    expect(APP_ROUTES.LIVE_MAP).toBe("/live-map");
    expect(APP_ROUTES.ATTENDANCE).toBe("/attendance");
    expect(APP_ROUTES.GEOFENCES).toBe("/geofences");
    expect(APP_ROUTES.CHECK_IN).toBe("/check-in");
  });

  it("APP_CONFIG has correct defaults", () => {
    expect(APP_CONFIG.APP_NAME).toBe("Trax");
    expect(APP_CONFIG.DEFAULT_LOCALE).toBe("ar");
    expect(APP_CONFIG.MAP_DEFAULT_ZOOM).toBe(12);
  });

  it("ATTENDANCE_STATUS has three states", () => {
    expect(Object.keys(ATTENDANCE_STATUS)).toHaveLength(3);
    expect(ATTENDANCE_STATUS.PRESENT).toBe("present");
    expect(ATTENDANCE_STATUS.LATE).toBe("late");
    expect(ATTENDANCE_STATUS.ABSENT).toBe("absent");
  });

  it("USER_ROLES has boss and employee", () => {
    expect(Object.keys(USER_ROLES)).toHaveLength(2);
    expect(USER_ROLES.BOSS).toBe("boss");
    expect(USER_ROLES.EMPLOYEE).toBe("employee");
  });
});
