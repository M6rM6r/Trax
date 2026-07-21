import { readFileSync } from 'fs';
const lines = readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.trim());
const env = Object.fromEntries(lines.map((l) => { const idx = l.indexOf('='); return [l.slice(0, idx), l.slice(idx + 1)]; }));
const { initializeApp } = await import('firebase/app');
const { getFirestore, collection, getDocs } = await import('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
const config = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);
console.log('signing in as boss@trax.com');
await signInWithEmailAndPassword(auth, 'boss@trax.com', '12345678');
const collections = ['users','companies','employees','geofences','attendance','locations'];
for (const name of collections) {
  try {
    const snap = await getDocs(collection(db, name));
    console.log(name, snap.size);
    if (snap.size && snap.size <= 20) {
      for (const d of snap.docs) console.log(name, d.id, JSON.stringify(d.data(), null, 2));
    }
  } catch (err) {
    console.log('error reading', name, err?.toString?.() ?? err);
  }
}
