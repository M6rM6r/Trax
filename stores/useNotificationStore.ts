"use client";

import { create } from "zustand";

export type NotificationType =
  | "check_in"
  | "late_arrival"
  | "missing_check_in"
  | "check_out"
  | "check_out_early"
  | "overtime"
  | "absence"
  | "geofence_breach"
  | "anomaly_detected"
  | "system"
  | "announcement"
  | "shift_change"
  | "leave_request"
  | "leave_approved"
  | "leave_rejected"
  | "payroll"
  | "document"
  | "meeting"
  | "training"
  | "emergency"
  | "maintenance"
  | "policy_update"
  | "birthday"
  | "work_anniversary"
  | "performance_review"
  | "schedule_change"
  | "location_change"
  | "device_change"
  | "reminder";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  employeeId?: string;
  employeeName?: string;
  data?: Record<string, string>;
  priority?: "low" | "normal" | "high";
  /** Stable identity across resyncs (type + employee + company day). */
  dedupeKey?: string;
}

const ATTENDANCE_TYPES = new Set([
  "check_in",
  "late_arrival",
  "missing_check_in",
  "check_out",
  "check_out_early",
]);

function storageScope(companyId: string | null, userId: string | null) {
  // v2: older keys permanently dismissed live attendance after "clear all".
  return `trax_notif_meta_v2:${companyId ?? "none"}:${userId ?? "anon"}`;
}

type MetaBlob = { readKeys: string[]; dismissedKeys: string[] };

function loadMeta(companyId: string | null, userId: string | null): MetaBlob {
  if (typeof window === "undefined") return { readKeys: [], dismissedKeys: [] };
  try {
    const raw = localStorage.getItem(storageScope(companyId, userId));
    if (!raw) return { readKeys: [], dismissedKeys: [] };
    const parsed = JSON.parse(raw) as MetaBlob;
    return {
      readKeys: Array.isArray(parsed.readKeys) ? parsed.readKeys.slice(-500) : [],
      dismissedKeys: Array.isArray(parsed.dismissedKeys) ? parsed.dismissedKeys.slice(-500) : [],
    };
  } catch {
    return { readKeys: [], dismissedKeys: [] };
  }
}

function saveMeta(companyId: string | null, userId: string | null, meta: MetaBlob) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      storageScope(companyId, userId),
      JSON.stringify({
        readKeys: meta.readKeys.slice(-500),
        dismissedKeys: meta.dismissedKeys.slice(-500),
      })
    );
  } catch {
    /* ignore quota */
  }
}

/** Drop dismiss/read keys for company-days older than keepDays (default 2). */
function pruneMetaKeys(keys: string[], keepDays = 2): string[] {
  const cutoff = Date.now() - keepDays * 86_400_000;
  return keys.filter((k) => {
    // Keys look like type:emp:YYYY-MM-DD or manual:...
    const m = k.match(/(\d{4}-\d{2}-\d{2})/);
    if (!m) return true;
    const t = Date.parse(`${m[1]}T12:00:00Z`);
    if (Number.isNaN(t)) return true;
    return t >= cutoff;
  });
}

export function notificationDedupeKey(
  n: Pick<AppNotification, "id" | "type" | "employeeId" | "timestamp" | "dedupeKey" | "data">
): string {
  if (n.dedupeKey) return n.dedupeKey;
  const day =
    (n.data && typeof n.data.date === "string" && n.data.date) || (n.timestamp || "").slice(0, 10);
  const emp = n.employeeId !== null && n.employeeId !== undefined ? String(n.employeeId) : "none";
  if (ATTENDANCE_TYPES.has(n.type)) return `${n.type}:${emp}:${day}`;
  return n.id;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  initialized: boolean;
  loading: boolean;
  companyId: string | null;
  userId: string | null;
  role: "company" | "employee" | "mastermind" | null;
  employeeId: string | null;
  readKeys: Set<string>;
  dismissedKeys: Set<string>;

  initialize: (params: {
    companyId: string | null;
    userId: string | null;
    role: "company" | "employee" | "mastermind" | null;
    employeeId?: string | null;
  }) => void;
  /** Soft stop: clear list only on logout — does not wipe read meta. */
  stop: () => void;
  setNotifications: (notifications: AppNotification[]) => void;
  addNotification: (notification: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  replaceLiveFeed: (live: AppNotification[]) => void;
  syncNotifications: (notifications: AppNotification[]) => void;
}

function applyMeta(
  list: AppNotification[],
  readKeys: Set<string>,
  dismissedKeys: Set<string>
): AppNotification[] {
  return list
    .map((n) => {
      const key = notificationDedupeKey(n);
      return {
        ...n,
        dedupeKey: key,
        read: n.read || readKeys.has(key),
      };
    })
    .filter((n) => !dismissedKeys.has(notificationDedupeKey(n)))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 120);
}

function countUnread(list: AppNotification[]) {
  return list.filter((n) => !n.read).length;
}

/**
 * Live feed: attendance events from today replace prior attendance of same key.
 * missing_check_in drops when check_in / late_arrival exists for employee+day.
 * Non-live (reminder/system) keep until dismissed.
 */
function rebuildFeed(
  previous: AppNotification[],
  live: AppNotification[],
  readKeys: Set<string>,
  dismissedKeys: Set<string>
): AppNotification[] {
  const nonLive = previous.filter((n) => !ATTENDANCE_TYPES.has(n.type));
  const byKey = new Map<string, AppNotification>();

  for (const n of live) {
    const key = notificationDedupeKey(n);
    if (dismissedKeys.has(key)) continue;
    byKey.set(key, {
      ...n,
      dedupeKey: key,
      read: readKeys.has(key) || n.read,
    });
  }

  const checkedInDays = new Set<string>();
  const lateDays = new Set<string>();
  for (const n of Array.from(byKey.values())) {
    const day =
      (n.data && n.data.date) ||
      (n.dedupeKey || "").split(":").pop() ||
      (n.timestamp || "").slice(0, 10);
    const emp = n.employeeId !== null && n.employeeId !== undefined ? String(n.employeeId) : "none";
    const empDay = `${emp}:${day}`;
    if (n.type === "check_in" || n.type === "late_arrival") {
      checkedInDays.add(empDay);
    }
    if (n.type === "late_arrival") {
      lateDays.add(empDay);
    }
  }
  // Late supersedes plain check-in for the same employee+day (wrong stored status fix).
  for (const [key, n] of Array.from(byKey.entries())) {
    if (n.type !== "check_in") continue;
    const day =
      (n.data && n.data.date) ||
      (n.dedupeKey || "").split(":").pop() ||
      (n.timestamp || "").slice(0, 10);
    const emp = n.employeeId !== null && n.employeeId !== undefined ? String(n.employeeId) : "none";
    if (lateDays.has(`${emp}:${day}`)) byKey.delete(key);
  }
  for (const [key, n] of Array.from(byKey.entries())) {
    if (n.type !== "missing_check_in") continue;
    const day =
      (n.data && n.data.date) ||
      (n.dedupeKey || "").split(":").pop() ||
      (n.timestamp || "").slice(0, 10);
    const emp = n.employeeId !== null && n.employeeId !== undefined ? String(n.employeeId) : "none";
    if (checkedInDays.has(`${emp}:${day}`)) byKey.delete(key);
  }

  const merged = nonLive.concat(Array.from(byKey.values()));
  return applyMeta(merged, readKeys, dismissedKeys);
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  initialized: false,
  loading: false,
  companyId: null,
  userId: null,
  role: null,
  employeeId: null,
  readKeys: new Set(),
  dismissedKeys: new Set(),

  initialize: ({ companyId, userId, role, employeeId }) => {
    const state = get();
    if (
      state.initialized &&
      state.companyId === companyId &&
      state.userId === userId &&
      state.role === role &&
      state.employeeId === (employeeId ?? null)
    ) {
      return;
    }

    // Tenant/user switch — soft reset list, reload meta (do not wipe storage).
    const meta = loadMeta(companyId, userId);
    const readKeys = new Set(pruneMetaKeys(meta.readKeys));
    const dismissedKeys = new Set(pruneMetaKeys(meta.dismissedKeys));
    saveMeta(companyId, userId, {
      readKeys: Array.from(readKeys),
      dismissedKeys: Array.from(dismissedKeys),
    });

    set({
      companyId,
      userId,
      role,
      employeeId: employeeId ?? null,
      initialized: true,
      loading: false,
      readKeys,
      dismissedKeys,
      // Keep list only if same user; else empty until live feed arrives.
      notifications:
        state.userId === userId && state.companyId === companyId ? state.notifications : [],
      unreadCount: state.userId === userId && state.companyId === companyId ? state.unreadCount : 0,
    });
  },

  stop: () => {
    // Logout only — clear in-memory feed; keep localStorage meta for next login.
    set({
      notifications: [],
      unreadCount: 0,
      initialized: false,
      loading: false,
      companyId: null,
      userId: null,
      role: null,
      employeeId: null,
      readKeys: new Set(),
      dismissedKeys: new Set(),
    });
  },

  setNotifications: (notifications) => {
    const { readKeys, dismissedKeys } = get();
    const next = applyMeta(notifications, readKeys, dismissedKeys);
    set({ notifications: next, unreadCount: countUnread(next) });
  },

  addNotification: (notification) => {
    const { readKeys, dismissedKeys } = get();
    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const timestamp = new Date().toISOString();
    const newNotification: AppNotification = {
      ...notification,
      id,
      timestamp,
      read: false,
      dedupeKey: notification.dedupeKey ?? `manual:${id}`,
    };
    const key = notificationDedupeKey(newNotification);
    if (dismissedKeys.has(key)) return;
    newNotification.dedupeKey = key;
    newNotification.read = readKeys.has(key);

    set((state) => {
      const notifications = applyMeta(
        [newNotification, ...state.notifications],
        state.readKeys,
        state.dismissedKeys
      );
      return { notifications, unreadCount: countUnread(notifications) };
    });
  },

  replaceLiveFeed: (live) => {
    const { notifications, readKeys, dismissedKeys } = get();
    const next = rebuildFeed(notifications, live, readKeys, dismissedKeys);
    set({ notifications: next, unreadCount: countUnread(next) });
  },

  syncNotifications: (notifications) => {
    get().replaceLiveFeed(notifications);
  },

  markAsRead: async (id) => {
    const state = get();
    const target = state.notifications.find((n) => n.id === id);
    if (!target) return;
    const key = notificationDedupeKey(target);
    const readKeys = new Set(state.readKeys);
    readKeys.add(key);
    saveMeta(state.companyId, state.userId, {
      readKeys: Array.from(readKeys),
      dismissedKeys: Array.from(state.dismissedKeys),
    });
    const next = state.notifications.map((n) =>
      notificationDedupeKey(n) === key || n.id === id ? { ...n, read: true } : n
    );
    set({ readKeys, notifications: next, unreadCount: countUnread(next) });
  },

  markAllAsRead: async () => {
    const state = get();
    const readKeys = new Set(state.readKeys);
    for (const n of state.notifications) {
      readKeys.add(notificationDedupeKey(n));
    }
    saveMeta(state.companyId, state.userId, {
      readKeys: Array.from(readKeys),
      dismissedKeys: Array.from(state.dismissedKeys),
    });
    const next = state.notifications.map((n) => ({ ...n, read: true }));
    set({ readKeys, notifications: next, unreadCount: 0 });
  },

  removeNotification: async (id) => {
    const state = get();
    const target = state.notifications.find((n) => n.id === id);
    if (!target) return;
    const key = notificationDedupeKey(target);
    const dismissedKeys = new Set(state.dismissedKeys);
    dismissedKeys.add(key);
    saveMeta(state.companyId, state.userId, {
      readKeys: Array.from(state.readKeys),
      dismissedKeys: Array.from(dismissedKeys),
    });
    const next = state.notifications.filter((n) => notificationDedupeKey(n) !== key && n.id !== id);
    set({ dismissedKeys, notifications: next, unreadCount: countUnread(next) });
  },

  clearAll: async () => {
    // Hide current list + mark read. Do NOT permanently dismiss live attendance keys
    // (that made the panel stay empty forever after one "clear"). Only dismiss non-live.
    const state = get();
    const readKeys = new Set(state.readKeys);
    const dismissedKeys = new Set(state.dismissedKeys);
    for (const n of state.notifications) {
      const key = notificationDedupeKey(n);
      readKeys.add(key);
      if (!ATTENDANCE_TYPES.has(n.type)) {
        dismissedKeys.add(key);
      }
    }
    // Soft-hide live items for this browser session only via a session flag set.
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(
          `trax_notif_cleared_at:${state.companyId ?? "none"}:${state.userId ?? "anon"}`,
          String(Date.now())
        );
      } catch {
        /* ignore */
      }
    }
    saveMeta(state.companyId, state.userId, {
      readKeys: Array.from(readKeys),
      dismissedKeys: Array.from(dismissedKeys),
    });
    set({
      readKeys,
      dismissedKeys,
      notifications: [],
      unreadCount: 0,
    });
  },
}));

export function wasFeedClearedRecently(
  companyId: string | null,
  userId: string | null,
  windowMs = 30_000
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(
      `trax_notif_cleared_at:${companyId ?? "none"}:${userId ?? "anon"}`
    );
    if (!raw) return false;
    const t = Number(raw);
    if (!Number.isFinite(t)) return false;
    return Date.now() - t < windowMs;
  } catch {
    return false;
  }
}

export function addNotificationDirect(
  notification: Omit<AppNotification, "id" | "timestamp" | "read">
) {
  useNotificationStore.getState().addNotification(notification);
}
