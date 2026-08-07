import {
  defaultAttendanceWindow,
  last7CompanyDays,
  lastNCompanyDays,
} from "@/lib/utils/attendanceWindow";

describe("attendanceWindow", () => {
  const tz = "Asia/Riyadh";
  // Fixed UTC instant so company day is stable.
  const end = new Date("2026-08-07T12:00:00Z");

  it("lastNCompanyDays(1) is today only", () => {
    expect(lastNCompanyDays(1, tz, end)).toEqual({ from: "2026-08-07", to: "2026-08-07" });
  });

  it("last7 and default 30 use inclusive day counts", () => {
    expect(last7CompanyDays(tz, end)).toEqual({ from: "2026-08-01", to: "2026-08-07" });
    expect(defaultAttendanceWindow(tz, end)).toEqual({ from: "2026-07-09", to: "2026-08-07" });
  });
});
