import { readFileSync } from 'fs';
const lines = readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.trim());
const env = Object.fromEntries(lines.map((l) => { const idx = l.indexOf('='); return [l.slice(0, idx), l.slice(idx + 1)]; }));
const { initializeApp } = await import('firebase/app');
const { getFirestore, collection, query, where, limit, getDocs, doc, getDoc } = await import('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
const config = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
console.log('using firebase project', config.projectId);
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);
const email = 'boss@trax.com';
const password = '12345678';
console.log('signing in as', email);
const credential = await signInWithEmailAndPassword(auth, email, password);
console.log('signed in uid', credential.user.uid);
const token = await credential.user.getIdToken();
console.log('id token length', token.length);
const emailToFind = 'g@g.com';
const direct = await getDoc(doc(db, 'users', 'uZzgVch2tgN8JSEqHJkZJuqTUKe2'));
console.log('direct exists', direct.exists());
if (direct.exists()) console.log('direct data', JSON.stringify(direct.data(), null, 2));
const q1 = query(collection(db, 'users'), where('email', '==', emailToFind), limit(10));
const snap1 = await getDocs(q1);
console.log('exact email query count', snap1.size);
for (const d of snap1.docs) console.log('exact doc', d.id, JSON.stringify(d.data(), null, 2));
const q2 = query(collection(db, 'users'), where('email', '==', emailToFind.toLowerCase()), limit(10));
const snap2 = await getDocs(q2);
console.log('lower email query count', snap2.size);
for (const d of snap2.docs) console.log('lower doc', d.id, JSON.stringify(d.data(), null, 2));
const all = await getDocs(collection(db, 'users'));
console.log('total users docs', all.size);
const matched = all.docs.find((item) => {
  const userEmail = String(item.data().email ?? '').trim().toLowerCase();
  return userEmail === emailToFind.toLowerCase();
});
console.log('matched full scan', matched ? matched.id : 'none');
if (matched) console.log('matched data', JSON.stringify(matched.data(), null, 2));
