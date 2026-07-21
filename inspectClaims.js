import { readFileSync } from 'fs';
const lines = readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.trim());
const env = Object.fromEntries(lines.map((l) => { const idx = l.indexOf('='); return [l.slice(0, idx), l.slice(idx + 1)]; }));
const { initializeApp } = await import('firebase/app');
const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
const { getIdTokenResult } = await import('firebase/auth');
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
console.log('Signing in as boss@trax.com');
const credential = await signInWithEmailAndPassword(auth, 'boss@trax.com', '12345678');
console.log('uid', credential.user.uid);
console.log('email', credential.user.email);
console.log('displayName', credential.user.displayName);
const tokenResult = await getIdTokenResult(credential.user);
console.log('claims', JSON.stringify(tokenResult.claims, null, 2));
console.log('token length', tokenResult.token.length);
console.log('auth tenant', credential.user.tenantId);
