import type { NotificationType } from "@/lib/services/firebase/notifications";
import { NOTIFICATION_TEMPLATES } from "./notificationTemplates";

export interface NotificationChannelPreference {
  push: boolean;
  in_app: boolean;
  email: boolean;
}

export interface NotificationTypePreference {
  enabled: boolean;
  channels: NotificationChannelPreference;
  quietHours?: { start: string; end: string }; // "22:00" - "07:00"
  frequency?: "immediate" | "batched_hourly" | "batched_daily" | "digest";
}

export interface UserNotificationPreferences {
  userId: string;
  companyId: string;
  global: {
    enabled: boolean;
    channels: NotificationChannelPreference;
    quietHours: { start: string; end: string } | null;
    language: "ar" | "en";
  };
  types: Record<NotificationType, NotificationTypePreference>;
  updatedAt: string;
}

export const DEFAULT_CHANNEL_PREFERENCE: NotificationChannelPreference = {
  push: true,
  in_app: true,
  email: false,
};

export const DEFAULT_TYPE_PREFERENCE: NotificationTypePreference = {
  enabled: true,
  channels: DEFAULT_CHANNEL_PREFERENCE,
  frequency: "immediate",
};

export function getDefaultPreferences(
  userId: string,
  companyId: string
): UserNotificationPreferences {
  const types: Record<NotificationType, NotificationTypePreference> = {} as Record<
    NotificationType,
    NotificationTypePreference
  >;

  for (const template of Object.values(NOTIFICATION_TEMPLATES)) {
    types[template.type] = {
      enabled: template.defaultEnabled,
      channels: { ...DEFAULT_CHANNEL_PREFERENCE, email: template.channels.includes("email") },
      frequency: template.priority === "high" ? "immediate" : "batched_hourly",
    };
  }

  return {
    userId,
    companyId,
    global: {
      enabled: true,
      channels: DEFAULT_CHANNEL_PREFERENCE,
      quietHours: { start: "22:00", end: "07:00" },
      language: "ar",
    },
    types,
    updatedAt: new Date().toISOString(),
  };
}

export function shouldSendNotification(
  preferences: UserNotificationPreferences,
  type: NotificationType,
  channel: "push" | "in_app" | "email",
  now: Date = new Date()
): boolean {
  if (!preferences.global.enabled) return false;

  const typePref = preferences.types[type];
  if (!typePref || !typePref.enabled) return false;
  if (!typePref.channels[channel]) return false;

  // Check quiet hours
  const quietHours = preferences.global.quietHours;
  if (quietHours) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = quietHours.start.split(":").map(Number);
    const [endH, endM] = quietHours.end.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    let inQuietHours = false;
    if (startMinutes <= endMinutes) {
      inQuietHours = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Quiet hours span midnight
      inQuietHours = currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }

    if (inQuietHours && channel === "push") return false;
  }

  return true;
}

export function getEffectiveChannels(
  preferences: UserNotificationPreferences,
  type: NotificationType
): ("push" | "in_app" | "email")[] {
  const channels: ("push" | "in_app" | "email")[] = [];
  const typePref = preferences.types[type];
  if (!typePref || !typePref.enabled) return channels;

  if (typePref.channels.push) channels.push("push");
  if (typePref.channels.in_app) channels.push("in_app");
  if (typePref.channels.email) channels.push("email");

  return channels;
}
