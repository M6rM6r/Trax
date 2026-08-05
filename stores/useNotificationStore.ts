"use client";

import { create } from "zustand";

export type NotificationType =
  | "check_in"
  | "late_arrival"
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

  initialize: (params: {
    companyId: string | null;
    userId: string | null;
    role: "company" | "employee" | "mastermind" | null;
    employeeId?: string | null;
  }) => void;
  stop: () => void;
  setNotifications: (notifications: AppNotification[]) => void;
  addNotification: (notification: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  syncNotifications: (notifications: AppNotification[]) => void;
}

function mergeNotifications(
  existing: AppNotification[],
  incoming: AppNotification[]
): AppNotification[] {
  const incomingAttendanceEmployees = new Set<string>();
  for (const n of incoming) {
    const employeeId = n.employeeId ? String(n.employeeId) : null;
    if (
      employeeId &&
      ["check_in", "late_arrival", "check_out", "check_out_early"].includes(n.type)
    ) {
      incomingAttendanceEmployees.add(employeeId);
    }
  }

  const latestByKey = new Map<string, AppNotification>();

  // Keep existing notifications, but drop stale admin "late_arrival" alerts once
  // the employee actually has an attendance record (checked in / out).
  for (const n of existing) {
    const employeeId = n.employeeId ? String(n.employeeId) : null;
    if (employeeId && n.type === "late_arrival" && incomingAttendanceEmployees.has(employeeId)) {
      continue;
    }
    const key = employeeId ? `${n.type}:${employeeId}` : n.id;
    latestByKey.set(key, n);
  }

  for (const n of incoming) {
    const employeeId = n.employeeId ? String(n.employeeId) : null;
    const key = employeeId ? `${n.type}:${employeeId}` : n.id;
    const current = latestByKey.get(key);
    if (!current || new Date(n.timestamp).getTime() > new Date(current.timestamp).getTime()) {
      latestByKey.set(key, n);
    }
  }

  return Array.from(latestByKey.values())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 100);
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

  initialize: ({ companyId, userId, role, employeeId }) => {
    const state = get();
    if (state.initialized) {
      if (
        state.companyId === companyId &&
        state.userId === userId &&
        state.role === role &&
        state.employeeId === (employeeId ?? null)
      ) {
        return;
      }
      state.stop();
    }

    set({
      companyId,
      userId,
      role,
      employeeId: employeeId ?? null,
      initialized: true,
      loading: false,
    });

    if (!companyId || !userId || !role) {
      set({ notifications: [], unreadCount: 0 });
    }
  },

  stop: () => {
    set({
      notifications: [],
      unreadCount: 0,
      initialized: false,
      loading: false,
    });
  },

  setNotifications: (notifications) => {
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    });
  },

  addNotification: (notification) => {
    const newNotification: AppNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    set((state) => {
      const notifications = [newNotification, ...state.notifications].slice(0, 100);
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      };
    });
  },

  syncNotifications: (notifications) => {
    set((state) => {
      const merged = mergeNotifications(state.notifications, notifications);
      return { notifications: merged, unreadCount: merged.filter((n) => !n.read).length };
    });
  },

  markAsRead: async (id) => {
    set((state) => {
      const next = state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      return { notifications: next, unreadCount: next.filter((n) => !n.read).length };
    });
  },

  markAllAsRead: async () => {
    set((state) => {
      const next = state.notifications.map((n) => ({ ...n, read: true }));
      return { notifications: next, unreadCount: 0 };
    });
  },

  removeNotification: async (id) => {
    set((state) => {
      const next = state.notifications.filter((n) => n.id !== id);
      return { notifications: next, unreadCount: next.filter((n) => !n.read).length };
    });
  },

  clearAll: async () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));

export function addNotificationDirect(
  notification: Omit<AppNotification, "id" | "timestamp" | "read">
) {
  const newNotification: AppNotification = {
    ...notification,
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    read: false,
  };
  useNotificationStore.setState((state) => {
    const notifications = [newNotification, ...state.notifications].slice(0, 100);
    return {
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    };
  });
}
