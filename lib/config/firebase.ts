import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

export const storage = app ? getStorage(app) : null;

export const auth = app ? getAuth(app) : null;

export const db = app ? getFirestore(app) : null;

// Secondary app instance for creating employee auth accounts without signing out the admin
const secondaryApp: FirebaseApp | null = isFirebaseConfigured
  ? getApps().find((a) => a.name === "secondary") ?? initializeApp(firebaseConfig, "secondary")
  : null;
export const secondaryAuth: Auth | null = secondaryApp ? getAuth(secondaryApp) : null;

export const analytics =
  typeof window !== "undefined" && app
    ? isSupported().then((ok) => (ok ? getAnalytics(app) : null))
    : Promise.resolve(null);

if (typeof window !== "undefined" && !isFirebaseConfigured) {
  console.warn("Firebase is not fully configured. Storage features are disabled.");
}

export default app;
