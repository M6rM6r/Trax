import { DEFAULT_COMPANY_TIMEZONE, formatCompanyDate } from "@/lib/utils/companyDate";

export type CompanyDateWindow = { from: string; to: string };

/**
 * Inclusive company-calendar window ending on `end` (default now).
 * n=1 → today only; n=7 → last 7 company days; n=30 → last 30.
 * Uses UTC-noon anchors so YYYY-MM-DD does not slip across TZ boundaries.
 */
export function lastNCompanyDays(
  n: number,
  timeZone: string = DEFAULT_COMPANY_TIMEZONE,
  end: Date = new Date()
): CompanyDateWindow {
  const days = Math.max(1, Math.floor(n));
  const to = formatCompanyDate(end, timeZone);
  if (days === 1) return { from: to, to };
  const start = new Date(`${to}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { from: formatCompanyDate(start, timeZone), to };
}

/** Attendance page "all" + reports default: last 30 company days (bounded). */
export function defaultAttendanceWindow(
  timeZone: string = DEFAULT_COMPANY_TIMEZONE,
  end: Date = new Date()
): CompanyDateWindow {
  return lastNCompanyDays(30, timeZone, end);
}

/** Dashboard trend / employee 7-day KPIs. */
export function last7CompanyDays(
  timeZone: string = DEFAULT_COMPANY_TIMEZONE,
  end: Date = new Date()
): CompanyDateWindow {
  return lastNCompanyDays(7, timeZone, end);
}
