import { readFileSync } from 'fs';
const lines = readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.trim());
const env = Object.fromEntries(lines.map((l) => { const idx = l.indexOf('='); return [l.slice(0, idx), l.slice(idx + 1)]; }));
const { initializeApp } = await import('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = await import('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');

const config = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(config, 'createOwnProfile');
const auth = getAuth(app);
const db = getFirestore(app);

const email = 'g@g.com';
const password = '11223344';

console.log('Signing in as', email);
const credential = await signInWithEmailAndPassword(auth, email, password);
console.log('Signed in uid:', credential.user.uid);

await setDoc(
  doc(db, 'users', credential.user.uid),
  {
    name: 'Company Admin',
    email,
    role: 'boss',
    admin_role: 'boss',
    company_id: 1,
    company_name: 'Trax Demo Company',
    employee_id: null,
    assigned_geofence_id: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
);

console.log('Created users profile as boss for company 1.');
process.exit(0);
