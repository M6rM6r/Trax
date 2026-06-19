type FeatureFlag = "LIVE_TRACKING" | "GEOFENCES" | "ATTENDANCE_REPORTS" | "EXPORT_EXCEL";

const flagDefaults: Record<FeatureFlag, boolean> = {
  LIVE_TRACKING: true,
  GEOFENCES: true,
  ATTENDANCE_REPORTS: true,
  EXPORT_EXCEL: true,
};

function getFlag(key: FeatureFlag): boolean {
  if (typeof process !== "undefined" && process.env) {
    const envKey = `NEXT_PUBLIC_FEATURE_${key}`;
    const val = process.env[envKey];
    if (val !== undefined) return val === "true";
  }
  return flagDefaults[key];
}

export const featureFlags: Record<FeatureFlag, boolean> = {
  LIVE_TRACKING: getFlag("LIVE_TRACKING"),
  GEOFENCES: getFlag("GEOFENCES"),
  ATTENDANCE_REPORTS: getFlag("ATTENDANCE_REPORTS"),
  EXPORT_EXCEL: getFlag("EXPORT_EXCEL"),
};

export function isFeatureEnabled(key: FeatureFlag): boolean {
  return featureFlags[key];
}
