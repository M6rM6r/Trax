importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDummyKeyReplaceWithYourActualKey",
  authDomain: "trax-ae.firebaseapp.com",
  projectId: "trax-ae",
  storageBucket: "trax-ae.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  const icon = payload.data?.icon ?? "/icons/icon-192x192.png";
  const badge = "/icons/icon-72x72.png";

  self.registration.showNotification(title ?? "Trax", {
    body: body ?? "",
    icon,
    badge,
    tag: payload.data?.type ?? "default",
    data: payload.data,
    requireInteraction: payload.data?.requireInteraction === "true",
    actions: payload.data?.actions ? JSON.parse(payload.data.actions) : undefined,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data ?? {};

  let url = "/";
  if (data.type === "check_in_reminder") url = "/check-in";
  else if (data.type === "company_announcement") url = "/";
  else if (data.type === "attendance_report") url = "/attendance/reports";
  else if (data.type === "trial_expiring") url = "/settings/company";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
