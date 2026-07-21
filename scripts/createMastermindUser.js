const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

async function main() {
  try {
    const svcPath = path.resolve(__dirname, '..', 'services', 'api', 'storage', 'firebase', 'firebase-service-account.json');
    if (!fs.existsSync(svcPath)) {
      console.error('Service account file not found at:', svcPath);
      process.exit(2);
    }
    const svc = JSON.parse(fs.readFileSync(svcPath, 'utf8'));

    if (!getApps().length) {
      initializeApp({ credential: cert(svc) });
    }

    const auth = getAuth();
    const db = getFirestore();

    const email = 'mastermind@trax.com';
    const password = 'Mm!' + crypto.randomBytes(8).toString('base64').replace(/\W/g, '').slice(0, 12);

    let userRecord = null;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('Existing Firebase user found, updating password...');
      await auth.updateUser(userRecord.uid, { password });
      console.log('Password updated for', email);
    } catch (err) {
      if (err.code === 'auth/user-not-found' || /not-found/i.test(err.message || '')) {
        const created = await auth.createUser({ email, password, displayName: 'MasterMind' });
        userRecord = created;
        console.log('Created Firebase user', created.uid);
      } else {
        throw err;
      }
    }

    // Set custom claims (mastermind role)
    try {
      await auth.setCustomUserClaims(userRecord.uid, { role: 'mastermind' });
      console.log('Set custom claim role=mastermind');
    } catch (e) {
      console.warn('Failed to set custom claims:', e.message || e);
    }

    // Ensure Firestore users document exists so the app login flow can resolve the profile
    try {
      const userRef = db.collection('users').doc(userRecord.uid);
      const snap = await userRef.get();
      if (!snap.exists) {
        await userRef.set({
          name: 'MasterMind',
          email: email,
          role: 'mastermind',
          company_id: 1,
          company_name: 'Trax',
          employee_id: null,
          assigned_geofence_id: null,
          createdAt: FieldValue.serverTimestamp(),
        });
        console.log('Created Firestore users document for mastermind');
      } else {
        console.log('Firestore users document already exists for mastermind');
      }
    } catch (e) {
      console.warn('Failed to create Firestore users document:', e.message || e);
    }

    console.log('\n=== MASTERMIND CREDENTIALS ===');
    console.log('email:', email);
    console.log('password:', password);
    console.log('=============================\n');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err && (err.stack || err.message || err));
    process.exit(1);
  }
}

main();
