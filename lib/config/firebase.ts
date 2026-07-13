import { initializeApp, getApps } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredFirebaseKeys = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
];

export const isFirebaseConfigured = requiredFirebaseKeys.every(
  (value) => typeof value === "string" && value.length > 0
);

const app = isFirebaseConfigured
  ? getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0]
  : null;

// Initialize Firebase App Check for production protection
if (app && typeof window !== "undefined") {
  const reCAPTCHAPublicKey = process.env.NEXT_PUBLIC_FIREBASE_RECAPTCHA_PUBLIC_KEY;
  if (reCAPTCHAPublicKey) {
    if (process.env.NODE_ENV === "production") {
      try {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(reCAPTCHAPublicKey),
          isTokenAutoRefreshEnabled: true,
        });
      } catch (e) {
        console.warn("App Check initialization failed:", e);
      }
    } else {
      // Dev mode — use debug token
      try {
        (
          window as Window & { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string }
        ).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(reCAPTCHAPublicKey),
          isTokenAutoRefreshEnabled: true,
        });
      } catch (e) {
        console.warn("App Check dev initialization failed:", e);
      }
    }
  }
}

export const storage = app ? getStorage(app) : null;

export const auth = app ? getAuth(app) : null;

export const analytics =
  typeof window !== "undefined" && app
    ? isSupported().then((ok) => (ok ? getAnalytics(app) : null))
    : Promise.resolve(null);

if (typeof window !== "undefined" && !isFirebaseConfigured) {
  console.warn("Firebase is not fully configured. Storage features are disabled.");
}

export default app;
