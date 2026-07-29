import { readFileSync } from 'fs';
const lines = readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.trim());
const env = Object.fromEntries(lines.map((l) => { const idx = l.indexOf('='); return [l.slice(0, idx), l.slice(idx + 1)]; }));
const { initializeApp } = await import('firebase/app');
const { getFirestore, collection, getDocs, doc, writeBatch, getDoc, query, where, limit } = await import('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');

const config = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(config, 'migrateAttendance');
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = 'boss@trax.com';
const ADMIN_PASSWORD = '12345678';

console.log('Signing in as admin...');
const cred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
const uid = cred.user.uid;

// Get admin's company_id from their user document
const userDoc = await getDoc(doc(db, 'users', uid));
if (!userDoc.exists()) {
  console.error('Admin user document not found!');
  process.exit(1);
}
const userData = userDoc.data();
const rawCompanyId = userData.company_id;
console.log(`Admin company_id (raw): ${rawCompanyId} (type: ${typeof rawCompanyId})`);

// Try both string and number variants for the query
const companyIdStr = String(rawCompanyId);
console.log(`Querying employees with company_id == "${companyIdStr}"...`);

const empSnapshot = await getDocs(
  query(collection(db, 'employees'), where('company_id', '==', companyIdStr), limit(500))
);
console.log(`Found ${empSnapshot.size} employees with string company_id`);

// If no results with string, try number
let employees = empSnapshot.docs;
if (empSnapshot.empty) {
  const numericCid = Number(rawCompanyId);
  if (!isNaN(numericCid)) {
    console.log(`Trying numeric company_id == ${numericCid}...`);
    const empSnapshot2 = await getDocs(
      query(collection(db, 'employees'), where('company_id', '==', numericCid), limit(500))
    );
    console.log(`Found ${empSnapshot2.size} employees with numeric company_id`);
    employees = empSnapshot2.docs;
  }
}

// Build map of employeeId -> company_id (as string)
const empCompanyMap = new Map();
for (const empDoc of employees) {
  const data = empDoc.data();
  const cid = data.company_id;
  if (cid !== undefined && cid !== null) {
    empCompanyMap.set(empDoc.id, String(cid));
  } else {
    empCompanyMap.set(empDoc.id, companyIdStr);
  }
}
console.log(`Built company_id map for ${empCompanyMap.size} employees`);

// Now query attendance with string company_id
console.log(`Fetching attendance with company_id == "${companyIdStr}"...`);
let attSnapshot = await getDocs(
  query(collection(db, 'attendance'), where('company_id', '==', companyIdStr), limit(500))
);
console.log(`Found ${attSnapshot.size} attendance records with string company_id`);

// Also try numeric
let attDocs = [...attSnapshot.docs];
const numericCid = Number(rawCompanyId);
if (!isNaN(numericCid)) {
  console.log(`Also fetching attendance with numeric company_id == ${numericCid}...`);
  const attSnapshot2 = await getDocs(
    query(collection(db, 'attendance'), where('company_id', '==', numericCid), limit(500))
  );
  console.log(`Found ${attSnapshot2.size} attendance records with numeric company_id`);
  attDocs = [...attDocs, ...attSnapshot2.docs];
}

// Also try querying attendance by employeeId (for records missing company_id)
console.log('Also fetching attendance by employee IDs (for records missing company_id)...');
for (const [empId, empCid] of empCompanyMap) {
  const empAttSnapshot = await getDocs(
    query(collection(db, 'attendance'), where('employeeId', '==', empId), limit(100))
  );
  for (const attDoc of empAttSnapshot.docs) {
    if (!attDocs.find(d => d.id === attDoc.id)) {
      attDocs.push(attDoc);
    }
  }
}
console.log(`Total unique attendance records to check: ${attDocs.length}`);

let fixed = 0;
let skipped = 0;
let batch = writeBatch(db);
let batchCount = 0;

async function flushBatch() {
  if (batchCount > 0) {
    console.log(`  Committing batch of ${batchCount}...`);
    await batch.commit();
    batch = writeBatch(db);
    batchCount = 0;
  }
}

for (const docSnap of attDocs) {
  const data = docSnap.data();
  const currentCid = data.company_id;
  const empId = data.employeeId;

  const correctCid = (empId && empCompanyMap.has(empId))
    ? empCompanyMap.get(empId)
    : companyIdStr;

  const needsFix = currentCid === undefined
    || currentCid === null
    || typeof currentCid === 'number'
    || String(currentCid) !== correctCid;

  if (needsFix) {
    const reason = currentCid === undefined || currentCid === null
      ? 'missing'
      : typeof currentCid === 'number'
        ? `numeric(${currentCid})`
        : `mismatch("${currentCid}" vs "${correctCid}")`;
    console.log(`  FIXING ${docSnap.id}: ${reason} -> "${correctCid}"`);
    batch.update(doc(db, 'attendance', docSnap.id), { company_id: correctCid });
    fixed++;
    batchCount++;
  } else {
    skipped++;
  }

  if (batchCount === 450) {
    await flushBatch();
  }
}

await flushBatch();
console.log(`\nMigration complete: ${fixed} fixed, ${skipped} already correct`);
process.exit(0);
