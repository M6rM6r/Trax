import {
  getRemoteConfig,
  fetchAndActivate,
  getBoolean,
  getNumber,
  getString,
  getValue,
  type RemoteConfig,
} from "firebase/remote-config";
import app, { isFirebaseConfigured } from "@/lib/config/firebase";

let remoteConfigInstance: RemoteConfig | null = null;

function getRC(): RemoteConfig | null {
  if (!isFirebaseConfigured || !app || typeof window === "undefined") return null;
  if (!remoteConfigInstance) {
    remoteConfigInstance = getRemoteConfig(app);
    remoteConfigInstance.settings = {
      minimumFetchIntervalMillis: 3600000, // 1 hour
      fetchTimeoutMillis: 10000,
    };
    remoteConfigInstance.defaultConfig = {
      allow_self_registration: false,
      check_in_radius_meters: 100,
      max_employees_per_plan_trial: 10,
      max_employees_per_plan_basic: 50,
      max_employees_per_plan_pro: 500,
      maintenance_mode: false,
      maintenance_message: "النظام في وضع الصيانة حالياً. يرجى المحاولة لاحقاً.",
      min_app_version: "0.1.0",
      enable_ai_features: false,
      enable_offline_mode: true,
      attendance_grace_period_minutes: 15,
      location_update_interval_seconds: 60,
      max_geofences_per_company: 20,
    };
  }
  return remoteConfigInstance;
}

export async function initializeRemoteConfig(): Promise<boolean> {
  const rc = getRC();
  if (!rc) return false;

  try {
    const activated = await fetchAndActivate(rc);
    return activated;
  } catch {
    return false;
  }
}

export function getFeatureFlag(key: string, defaultValue = false): boolean {
  const rc = getRC();
  if (!rc) return defaultValue;
  try {
    return getBoolean(rc, key);
  } catch {
    return defaultValue;
  }
}

export function getConfigNumber(key: string, defaultValue = 0): number {
  const rc = getRC();
  if (!rc) return defaultValue;
  try {
    return getNumber(rc, key);
  } catch {
    return defaultValue;
  }
}

export function getConfigString(key: string, defaultValue = ""): string {
  const rc = getRC();
  if (!rc) return defaultValue;
  try {
    return getString(rc, key);
  } catch {
    return defaultValue;
  }
}

export function getConfigValue(key: string) {
  const rc = getRC();
  if (!rc) return null;
  try {
    return getValue(rc, key);
  } catch {
    return null;
  }
}

// Typed feature flags for the app
export const FeatureFlags = {
  get allowSelfRegistration() {
    return getFeatureFlag("allow_self_registration");
  },
  get checkInRadiusMeters() {
    return getConfigNumber("check_in_radius_meters", 100);
  },
  get maxEmployeesTrial() {
    return getConfigNumber("max_employees_per_plan_trial", 10);
  },
  get maxEmployeesBasic() {
    return getConfigNumber("max_employees_per_plan_basic", 50);
  },
  get maxEmployeesPro() {
    return getConfigNumber("max_employees_per_plan_pro", 500);
  },
  get maintenanceMode() {
    return getFeatureFlag("maintenance_mode");
  },
  get maintenanceMessage() {
    return getConfigString("maintenance_message", "النظام في وضع الصيانة حالياً.");
  },
  get minAppVersion() {
    return getConfigString("min_app_version", "0.1.0");
  },
  get enableAiFeatures() {
    return getFeatureFlag("enable_ai_features");
  },
  get enableOfflineMode() {
    return getFeatureFlag("enable_offline_mode", true);
  },
  get attendanceGracePeriodMinutes() {
    return getConfigNumber("attendance_grace_period_minutes", 15);
  },
  get locationUpdateIntervalSeconds() {
    return getConfigNumber("location_update_interval_seconds", 60);
  },
  get maxGeofencesPerCompany() {
    return getConfigNumber("max_geofences_per_company", 20);
  },
};
