import { getMessaging, getToken, onMessage, deleteToken, type Messaging } from "firebase/messaging";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import app, { db, isFirebaseConfigured } from "@/lib/config/firebase";
import { getCompanyId } from "./helpers";

let messagingInstance: Messaging | null = null;

function getMessagingInstance(): Messaging | null {
  if (!isFirebaseConfigured || !app || typeof window === "undefined") return null;
  if (!messagingInstance) {
    messagingInstance = getMessaging(app);
  }
  return messagingInstance;
}

export async function requestFCMToken(): Promise<string | null> {
  const messaging = getMessagingInstance();
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "",
    });

    if (currentToken) {
      await storeFCMToken(currentToken);
    }

    return currentToken;
  } catch (err) {
    console.error("FCM token registration failed:", err);
    return null;
  }
}

export async function revokeFCMToken(token: string): Promise<void> {
  const messaging = getMessagingInstance();
  if (!messaging) return;

  try {
    await deleteToken(messaging);
    await deleteDoc(doc(db!, "fcm_tokens", token));
  } catch (err) {
    console.error("FCM token revocation failed:", err);
  }
}

async function storeFCMToken(token: string): Promise<void> {
  if (!db) return;

  const companyId = getCompanyId();
  await setDoc(doc(db, "fcm_tokens", token), {
    token,
    company_id: companyId,
    platform: getPlatform(),
    user_agent: navigator.userAgent,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
}

function getPlatform(): string {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Mac/i.test(ua)) return "macos";
  if (/Windows/i.test(ua)) return "windows";
  if (/Linux/i.test(ua)) return "linux";
  return "unknown";
}

export function onForegroundMessage(
  callback: (payload: {
    title: string;
    body: string;
    type?: string;
    data?: Record<string, string>;
  }) => void
): () => void {
  const messaging = getMessagingInstance();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    callback({
      title: payload.notification?.title ?? "Trax",
      body: payload.notification?.body ?? "",
      type: payload.data?.type,
      data: payload.data,
    });
  });
}

export function isNotificationSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission;
}
