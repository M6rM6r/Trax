"use client";

import { useState, useEffect, useCallback } from "react";
import {
  requestFCMToken,
  revokeFCMToken,
  onForegroundMessage,
  isNotificationSupported,
  getNotificationPermission,
} from "@/lib/services/firebase/messaging";
import { toastInfo } from "@/hooks/use-toast";

interface UseFCMReturn {
  token: string | null;
  permission: NotificationPermission;
  supported: boolean;
  requestPermission: () => Promise<string | null>;
  revokePermission: () => Promise<void>;
  lastMessage: { title: string; body: string } | null;
}

export function useFCM(): UseFCMReturn {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [lastMessage, setLastMessage] = useState<{ title: string; body: string } | null>(null);
  const supported = isNotificationSupported();

  useEffect(() => {
    if (!supported) return;
    setPermission(getNotificationPermission());

    // Listen for foreground messages
    const unsubscribe = onForegroundMessage((payload) => {
      setLastMessage({ title: payload.title, body: payload.body });
      toastInfo(`${payload.title}: ${payload.body}`);
    });

    return unsubscribe;
  }, [supported]);

  const requestPermission = useCallback(async (): Promise<string | null> => {
    const newToken = await requestFCMToken();
    if (newToken) {
      setToken(newToken);
      setPermission("granted");
    }
    return newToken;
  }, []);

  const revokePermission = useCallback(async (): Promise<void> => {
    if (token) {
      await revokeFCMToken(token);
      setToken(null);
      setPermission("default");
    }
  }, [token]);

  return {
    token,
    permission,
    supported,
    requestPermission,
    revokePermission,
    lastMessage,
  };
}
