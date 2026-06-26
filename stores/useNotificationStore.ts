"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationType =
  | "late_arrival"
  | "geofence_breach"
  | "anomaly_detected"
  | "attendance"
  | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  employeeId?: number;
  employeeName?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        const newNotification: AppNotification = {
          ...notification,
          id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString(),
          read: false,
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50),
          unreadCount: get().notifications.filter((n) => !n.read).length + 1,
        }));
      },

      markAsRead: (id) => {
        set((state) => {
          const notifications = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );
          return {
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      removeNotification: (id) => {
        set((state) => {
          const notifications = state.notifications.filter((n) => n.id !== id);
          return {
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
          };
        });
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },
    }),
    {
      name: "notification-storage",
      partialize: (state) => ({ notifications: state.notifications }),
    }
  )
);
