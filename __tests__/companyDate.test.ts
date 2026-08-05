import {
  companyWallClockToUtcMs,
  DEFAULT_COMPANY_TIMEZONE,
  formatCompanyDate,
  formatCompanyTime,
} from "@/lib/utils/companyDate";
import { myAttendanceQueryKey, toApiDate } from "@/hooks/api/queryKeys";

describe("companyDate", () => {
  it("defaults to Asia/Riyadh", () => {
    expect(DEFAULT_COMPANY_TIMEZONE).toBe("Asia/Riyadh");
  });

  it("formats YYYY-MM-DD in company timezone", () => {
    // 2026-08-05 21:30 UTC → still 2026-08-06 morning in Riyadh (UTC+3)
    const d = new Date("2026-08-05T21:30:00.000Z");
    expect(formatCompanyDate(d, "Asia/Riyadh")).toBe("2026-08-06");
    expect(toApiDate(d)).toBe("2026-08-06");
  });

  it("formats wall-clock time in company timezone", () => {
    const d = new Date("2026-08-05T08:05:00.000Z"); // 11:05 Riyadh
    expect(formatCompanyTime(d, "Asia/Riyadh")).toBe("11:05");
  });

  it("round-trips company wall clock to UTC for elapsed timer", () => {
    const ms = companyWallClockToUtcMs("2026-08-06", "11:05", "Asia/Riyadh");
    expect(ms).not.toBeNull();
    expect(formatCompanyTime(new Date(ms!), "Asia/Riyadh")).toBe("11:05");
    expect(formatCompanyDate(new Date(ms!), "Asia/Riyadh")).toBe("2026-08-06");
  });

  it("keeps my-attendance query key stable for optimistic cache", () => {
    expect(myAttendanceQueryKey("c1", "e1", "2026-08-06")).toEqual([
      "attendance",
      "my",
      "c1",
      "e1",
      "2026-08-06",
    ]);
  });
});
