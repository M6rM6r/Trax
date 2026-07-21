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

const app = initializeApp(config, 'ensureCompanyUser');
const auth = getAuth(app);
const db = getFirestore(app);

const bossEmail = 'boss@trax.com';
const bossPassword = '12345678';
const targetEmail = 'g@g.com';
const targetPassword = '11223344';

console.log('Signing in as boss to obtain privileged token...');
const bossCredential = await signInWithEmailAndPassword(auth, bossEmail, bossPassword);
console.log('Boss signed in:', bossCredential.user.uid);

console.log('Signing in as target user to obtain uid...');
const targetCredential = await signInWithEmailAndPassword(auth, targetEmail, targetPassword);
const targetUid = targetCredential.user.uid;
console.log('Target user uid:', targetUid);

// Re-sign in as boss so Firestore writes use the boss token.
await signInWithEmailAndPassword(auth, bossEmail, bossPassword);

await setDoc(
  doc(db, 'users', targetUid),
  {
    name: 'Company Admin',
    email: targetEmail,
    role: 'boss',
    admin_role: 'boss',
    company_id: 1,
    company_name: 'Trax Demo Company',
    employee_id: null,
    assigned_geofence_id: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  { merge: true }
);

console.log(`Created/updated users/${targetUid} as boss for company 1.`);
process.exit(0);
