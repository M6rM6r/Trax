"use client";

import { create } from "zustand";
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  type AppNotification as FirestoreNotification,
  type NotificationType,
} from "@/lib/services/firebase/notifications";

export type { NotificationType };
export type AppNotification = FirestoreNotification;

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
}

function isLocalId(id: string): boolean {
  return id.startsWith("notif_");
}

let notificationsUnsubscribe: (() => void) | null = null;

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
      // Re-initialize if the user context changed.
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
      loading: true,
    });

    if (!companyId || !userId || !role) {
      set({ notifications: [], unreadCount: 0, loading: false });
      return;
    }

    if (notificationsUnsubscribe) {
      notificationsUnsubscribe();
      notificationsUnsubscribe = null;
    }

    notificationsUnsubscribe = subscribeToNotifications(
      { companyId, userId, role, employeeId: employeeId ?? null },
      (notifications) => {
        set({
          notifications,
          unreadCount: notifications.filter((n) => !n.read).length,
          loading: false,
        });
      },
      () => {
        set({ loading: false });
      }
    );
  },

  stop: () => {
    if (notificationsUnsubscribe) {
      notificationsUnsubscribe();
      notificationsUnsubscribe = null;
    }
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

  markAsRead: async (id) => {
    const { userId } = get();
    if (!userId) return;

    set((state) => {
      const next = state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      return { notifications: next, unreadCount: next.filter((n) => !n.read).length };
    });

    if (!isLocalId(id)) {
      try {
        await markNotificationAsRead(id, userId);
      } catch (err) {
        console.error("[notification] mark as read failed:", err);
      }
    }
  },

  markAllAsRead: async () => {
    const { userId, notifications } = get();
    if (!userId) return;

    const firestoreIds = notifications.filter((n) => !n.read && !isLocalId(n.id)).map((n) => n.id);

    set((state) => {
      const next = state.notifications.map((n) => ({ ...n, read: true }));
      return { notifications: next, unreadCount: 0 };
    });

    if (firestoreIds.length > 0) {
      try {
        await markAllNotificationsAsRead(firestoreIds, userId);
      } catch (err) {
        console.error("[notification] mark all read failed:", err);
      }
    }
  },

  removeNotification: async (id) => {
    set((state) => {
      const next = state.notifications.filter((n) => n.id !== id);
      return { notifications: next, unreadCount: next.filter((n) => !n.read).length };
    });

    if (!isLocalId(id)) {
      try {
        await deleteNotification(id);
      } catch (err) {
        console.error("[notification] delete failed:", err);
      }
    }
  },

  clearAll: async () => {
    const { companyId, role, userId, employeeId, notifications } = get();
    if (!companyId || !userId || !role) {
      set({ notifications: [], unreadCount: 0 });
      return;
    }

    set({ notifications: [], unreadCount: 0 });

    try {
      await clearAllNotifications(companyId, role, userId, employeeId ?? null);
    } catch (err) {
      console.error("[notification] clear all failed:", err);
      const localOnly = notifications.filter((n) => isLocalId(n.id));
      set((state) => ({
        notifications: [...state.notifications, ...localOnly],
        unreadCount: [...state.notifications, ...localOnly].filter((n) => !n.read).length,
      }));
    }
  },
}));
