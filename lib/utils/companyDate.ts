/** Canonical product timezone when company settings are unavailable. */
export const DEFAULT_COMPANY_TIMEZONE = "Asia/Riyadh";

function resolveTz(timeZone?: string): string {
  return timeZone || DEFAULT_COMPANY_TIMEZONE;
}

/**
 * Format a calendar day as YYYY-MM-DD in the company timezone.
 * Single source of truth for attendance "today", dashboard buckets, and query keys.
 */
export function formatCompanyDate(
  value: Date = new Date(),
  timeZone: string = DEFAULT_COMPANY_TIMEZONE
): string {
  // en-CA yields ISO-like YYYY-MM-DD under Intl.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: resolveTz(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

/**
 * Format local wall-clock HH:mm in the company timezone.
 */
export function formatCompanyTime(
  value: Date = new Date(),
  timeZone: string = DEFAULT_COMPANY_TIMEZONE
): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: resolveTz(timeZone),
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(value);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

/** Minutes since midnight in company timezone (for shift slot / late math). */
export function companyMinutesSinceMidnight(
  value: Date = new Date(),
  timeZone: string = DEFAULT_COMPANY_TIMEZONE
): number {
  const [h, m] = formatCompanyTime(value, timeZone).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * JS weekday 0=Sun..6=Sat in company timezone (not browser-local getDay).
 */
export function companyWeekday(
  value: Date = new Date(),
  timeZone: string = DEFAULT_COMPANY_TIMEZONE
): number {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: resolveTz(timeZone),
    weekday: "short",
  }).format(value);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[wd] ?? value.getDay();
}

/** Stable Firestore attendance doc id — one row per employee per company day. */
export function attendanceDocId(companyId: string, employeeId: string, dateYmd: string): string {
  const safe = (s: string) => String(s).replace(/[/\\]/g, "_");
  return `${safe(companyId)}_${safe(employeeId)}_${safe(dateYmd)}`;
}

/**
 * Convert company wall-clock YYYY-MM-DD + HH:mm to UTC epoch ms.
 * Check-in times are stored in company TZ — never parse with bare `new Date(dateTtime)` (browser local).
 */
export function companyWallClockToUtcMs(
  dateYmd: string,
  timeHm: string,
  timeZone: string = DEFAULT_COMPANY_TIMEZONE
): number | null {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateYmd).trim());
  const tm = /^(\d{1,2}):(\d{2})$/.exec(String(timeHm).trim());
  if (!dm || !tm) return null;
  const y = Number(dm[1]);
  const mo = Number(dm[2]);
  const d = Number(dm[3]);
  const h = Number(tm[1]);
  const mi = Number(tm[2]);
  if (![y, mo, d, h, mi].every((n) => Number.isFinite(n))) return null;

  const tz = resolveTz(timeZone);
  // Guess UTC, then correct by the offset between desired wall clock and what that instant is in tz.
  let utcMs = Date.UTC(y, mo - 1, d, h, mi, 0, 0);
  for (let pass = 0; pass < 3; pass++) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date(utcMs));
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? NaN);
    const gy = get("year");
    const gmo = get("month");
    const gd = get("day");
    let gh = get("hour");
    // en-CA sometimes yields 24:00 for midnight — normalize.
    if (gh === 24) gh = 0;
    const gmi = get("minute");
    if (![gy, gmo, gd, gh, gmi].every((n) => Number.isFinite(n))) return null;
    const desired = Date.UTC(y, mo - 1, d, h, mi) / 60000;
    const got = Date.UTC(gy, gmo - 1, gd, gh, gmi) / 60000;
    const deltaMin = desired - got;
    if (deltaMin === 0) break;
    utcMs += deltaMin * 60000;
  }
  return utcMs;
}
