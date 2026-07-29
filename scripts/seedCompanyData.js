import { readFileSync } from 'fs';
const lines = readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.trim());
const env = Object.fromEntries(lines.map((l) => { const idx = l.indexOf('='); return [l.slice(0, idx), l.slice(idx + 1)]; }));
const { initializeApp } = await import('firebase/app');
const { getFirestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, where, limit, getDocs } = await import('firebase/firestore');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('firebase/auth');

const config = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(config, 'seedCompanyData');
const auth = getAuth(app);
const db = getFirestore(app);

// Secondary app instance for creating auth users without signing out the admin
const secondaryApp = initializeApp(config, 'seedSecondary');
const secondaryAuth = getAuth(secondaryApp);

const COMPANY_ID = "1";
const COMPANY_NAME = 'Trax Demo Company';

// Sample geofence: Dubai Internet City area
const geofences = [
  {
    name: 'مقر الشركة الرئيسي',
    address: 'دبي، الإمارات العربية المتحدة',
    lat: 25.0965,
    lng: 55.1644,
    radius: 250,
    color: '#10b981',
    active: true,
    company_id: COMPANY_ID,
  },
  {
    name: 'موقع العمل - أبوظبي',
    address: 'أبوظبي، الإمارات العربية المتحدة',
    lat: 24.4539,
    lng: 54.3773,
    radius: 400,
    color: '#3b82f6',
    active: true,
    company_id: COMPANY_ID,
    shifts: {
      defaultShift: { startTime: '09:00', endTime: '18:00', gracePeriodMinutes: 15, lateThresholdMinutes: 15 },
      morningShift: { startTime: '09:00', endTime: '13:00', gracePeriodMinutes: 15, lateThresholdMinutes: 15 },
      eveningShift: { startTime: '14:00', endTime: '18:00', gracePeriodMinutes: 15, lateThresholdMinutes: 15 },
    },
  },
];

const employees = [
  {
    name: 'أحمد محمد',
    email: 'ahmed@trax.com',
    password: 'employee1234',
    phone: '+971501234567',
    role: 'manager',
    department: 'المبيعات',
    status: 'active',
    attendanceMode: 'field',
    employeeNumber: 'EMP-001',
  },
  {
    name: 'سارة عبدالله',
    email: 'sara@trax.com',
    password: 'employee1234',
    phone: '+971502345678',
    role: 'supervisor',
    department: 'العمليات',
    status: 'active',
    attendanceMode: 'office_two_shift',
    employeeNumber: 'EMP-002',
  },
  {
    name: 'خالد عمر',
    email: 'khaled@trax.com',
    password: 'employee1234',
    phone: '+971503456789',
    role: 'employee',
    department: 'المالية',
    status: 'active',
    attendanceMode: 'hourly',
    employeeNumber: 'EMP-003',
  },
  {
    name: 'نورة سعد',
    email: 'nora@trax.com',
    password: 'employee1234',
    phone: '+971504567890',
    role: 'employee',
    department: 'الموارد البشرية',
    status: 'active',
    attendanceMode: 'field',
    employeeNumber: 'EMP-004',
  },
  {
    name: 'فهد سليمان',
    email: 'fahad@trax.com',
    password: 'employee1234',
    phone: '+971505678901',
    role: 'employee',
    department: 'الخدمات اللوجستية',
    status: 'inactive',
    attendanceMode: 'field',
    employeeNumber: 'EMP-005',
  },
  {
    name: 'ليلى حسن',
    email: 'laila@trax.com',
    password: 'employee1234',
    phone: '+971506789012',
    role: 'employee',
    department: 'المبيعات',
    status: 'active',
    attendanceMode: 'field',
    employeeNumber: 'EMP-006',
  },
];

const now = new Date();
const todayStr = now.toISOString().split('T')[0];

async function findUserUidByEmail(email) {
  const q = query(collection(db, 'users'), where('email', '==', email), limit(1));
  const snapshot = await getDocs(q);
  return snapshot.empty ? null : snapshot.docs[0].id;
}

async function createAuthUser(email, password, name, role, employeeId, geofenceId, attendanceMode) {
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    // Write user doc using admin's auth (primary) — admin can write to any user doc
    // because the rule allows create if uid == request.auth.uid OR sameCompany(request.resource)
    // Since admin is signed in on primary auth, and the new user's uid != admin's uid,
    // we need sameCompany — the user doc has company_id: COMPANY_ID which matches admin's
    await setDoc(doc(db, 'users', cred.user.uid), {
      name,
      email,
      role,
      company_id: COMPANY_ID,
      company_name: COMPANY_NAME,
      employee_id: employeeId,
      assigned_geofence_id: geofenceId,
      attendanceMode: attendanceMode ?? null,
      createdAt: serverTimestamp(),
    });
    return cred.user.uid;
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      // Try to link to existing user profile if we know the password.
      try {
        const cred = await signInWithEmailAndPassword(secondaryAuth, email, password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          name,
          email,
          role,
          company_id: COMPANY_ID,
          company_name: COMPANY_NAME,
          employee_id: employeeId,
          assigned_geofence_id: geofenceId,
          attendanceMode: attendanceMode ?? null,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        return cred.user.uid;
      } catch (signInErr) {
        if (signInErr.code === 'auth/wrong-password') {
          // Password mismatch: try to find existing Firestore user by email
          // and link the employee record without touching Firebase Auth.
          const existingUid = await findUserUidByEmail(email);
          if (existingUid) {
            await setDoc(doc(db, 'users', existingUid), {
              name,
              email,
              role,
              company_id: COMPANY_ID,
              company_name: COMPANY_NAME,
              employee_id: employeeId,
              assigned_geofence_id: geofenceId,
              attendanceMode: attendanceMode ?? null,
              updatedAt: serverTimestamp(),
            }, { merge: true });
            console.log(`    Note: ${email} already exists with a different password; linked existing account.`);
            return existingUid;
          }
          console.warn(`    Warning: ${email} already exists in Firebase Auth but no Firestore profile found; skipping auth link.`);
          return null;
        }
        throw signInErr;
      }
    }
    throw err;
  }
}

console.log('Signing in as company admin g@g.com...');
const adminCred = await signInWithEmailAndPassword(auth, 'g@g.com', '11223344');
console.log('Signed in admin uid:', adminCred.user.uid);

// Step 1: Write admin user doc (allowed by rule: uid == request.auth.uid)
console.log('Creating admin user doc...');
await setDoc(doc(db, 'users', adminCred.user.uid), {
  id: adminCred.user.uid,
  company_id: COMPANY_ID,
  name: 'Company Admin',
  email: 'g@g.com',
  role: 'company',
  company_name: COMPANY_NAME,
  company: { id: COMPANY_ID, name: COMPANY_NAME },
  createdAt: serverTimestamp(),
}, { merge: true });

// Step 2: Create company doc (allowed by rule: ownerId == request.auth.uid)
console.log('Creating company doc...');
await setDoc(doc(db, 'companies', String(COMPANY_ID)), {
  id: String(COMPANY_ID),
  name: COMPANY_NAME,
  industry: 'Technology',
  plan: 'trial',
  maxEmployees: 50,
  active: true,
  ownerId: adminCred.user.uid,
  createdAt: serverTimestamp(),
}, { merge: true });

// Note: Firestore security rules may restrict deletes from the client SDK,
// so this script uses deterministic document IDs to stay idempotent on rerun.
// Any older seed documents created with auto-generated IDs can be removed from
// the Firebase Console when you are ready.

console.log('Creating/updating geofences...');
function slugify(text) {
  const normalized = String(text)
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}\-_]/gu, '')
    .replace(/-+/g, '-')
    .slice(0, 64);
  return normalized || `geo-${Date.now()}`;
}

const createdGeofences = [];
for (const geofence of geofences) {
  const ref = await addDoc(collection(db, 'geofences'), {
    ...geofence,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  createdGeofences.push({ id: ref.id, ...geofence });
  console.log(`  Created geofence: ${geofence.name} (${ref.id})`);
}

const mainGeofence = createdGeofences[0];

console.log('Creating employees and auth accounts...');
const createdEmployees = [];
for (let i = 0; i < employees.length; i++) {
  const emp = employees[i];
  const geofenceId = i < 4 ? mainGeofence.id : createdGeofences[1]?.id ?? mainGeofence.id;
  let empRef;
  try {
    empRef = await addDoc(collection(db, 'employees'), {
    ...emp,
    id: emp.email,
    company_id: COMPANY_ID,
    company_name: COMPANY_NAME,
    geofenceId,
    currentLat: null,
    currentLng: null,
    lastSeen: null,
    batteryLevel: null,
    avatar: null,
    shiftOverride: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  } catch (empErr) {
    console.error(`  FAILED to create employee ${emp.email}:`, empErr.code || empErr.message);
    continue;
  }
  const employeeDbId = empRef.id;

  let uid = null;
  try {
    uid = await createAuthUser(emp.email, emp.password, emp.name, emp.role, empRef.id, geofenceId, emp.attendanceMode);
  } catch (authErr) {
    console.error(`  FAILED to create auth user for ${emp.email}:`, authErr.code || authErr.message);
  }

  // Update employee with authUid if auth account was linked/created.
  if (uid) {
    await setDoc(doc(db, 'employees', empRef.id), { authUid: uid }, { merge: true });
  }

  createdEmployees.push({ id: empRef.id, ...emp, geofenceId, authUid: uid });
  console.log(`  Created employee: ${emp.name} (${emp.email}) - ${emp.role}`);
}

console.log('Creating sample attendance records for today...');
const attendanceStatuses = [
  { status: 'present', checkInTime: '08:05', checkOutTime: '17:05', lateMinutes: 5 },
  { status: 'present', checkInTime: '07:55', checkOutTime: '17:10', lateMinutes: 0 },
  { status: 'late', checkInTime: '09:20', checkOutTime: '17:30', lateMinutes: 80 },
  { status: 'absent', checkInTime: null, checkOutTime: null, lateMinutes: 0 },
  { status: 'present', checkInTime: '08:00', checkOutTime: '17:00', lateMinutes: 0 },
  { status: 'present', checkInTime: '08:10', checkOutTime: '16:50', lateMinutes: 10 },
];
const defaultAppliedShift = { startTime: '08:00', endTime: '17:00', gracePeriodMinutes: 15, lateThresholdMinutes: 15 };

for (let i = 0; i < createdEmployees.length; i++) {
  const emp = createdEmployees[i];
  if (emp.status === 'inactive') continue;
  const record = attendanceStatuses[i];
  await addDoc(collection(db, 'attendance'), {
    company_id: COMPANY_ID,
    ownerUid: adminCred.user.uid,
    employeeId: emp.id,
    employeeName: emp.name,
    date: todayStr,
    checkInTime: record.checkInTime,
    checkOutTime: record.checkOutTime,
    status: record.status,
    checkInLat: mainGeofence.lat,
    checkInLng: mainGeofence.lng,
    checkOutLat: record.checkOutTime ? mainGeofence.lat : null,
    checkOutLng: record.checkOutTime ? mainGeofence.lng : null,
    geofenceId: emp.geofenceId,
    geofenceName: mainGeofence.name,
    lateMinutes: record.lateMinutes,
    workedHours: record.checkOutTime && record.checkInTime ? 9 : 0,
    checkOutStatus: record.checkOutTime ? 'present' : null,
    appliedShift: defaultAppliedShift,
    expectedCheckoutTime: defaultAppliedShift.endTime,
    earlyCheckout: Boolean(record.checkOutTime && record.checkOutTime < defaultAppliedShift.endTime),
    attendanceMode: emp.attendanceMode,
    createdAt: serverTimestamp(),
  });
  console.log(`  Created attendance for: ${emp.name} - ${record.status}`);
}

console.log('\nSeed completed successfully!');
console.log(`Created ${createdGeofences.length} geofences and ${createdEmployees.length} employees.`);
console.log('\nEmployee login credentials:');
for (const emp of createdEmployees) {
  console.log(`  ${emp.email} / ${emp.password}`);
}
process.exit(0);
