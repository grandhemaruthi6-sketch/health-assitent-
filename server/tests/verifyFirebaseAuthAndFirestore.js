import 'dotenv/config';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  deleteUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const results = {
  sdkInstalled: false,
  appInitialized: false,
  firestoreInitialized: false,
  authConfigured: false,
  emailAuthLiveTest: { status: 'NOT TESTED', error: null },
  firestoreLiveWriteTest: { status: 'NOT TESTED', error: null },
  firestoreLiveReadTest: { status: 'NOT TESTED', error: null },
  firestoreLiveDeleteTest: { status: 'NOT TESTED', error: null }
};

try {
  results.sdkInstalled = true;
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  results.appInitialized = Boolean(app);
  
  const auth = getAuth(app);
  results.authConfigured = Boolean(auth);

  const db = getFirestore(app);
  results.firestoreInitialized = Boolean(db);

  // 1. Test Auth: Attempt to sign in or create an ephemeral non-medical test user
  const testEmail = `test_verification_${Date.now()}@healthcopilot.test`;
  const testPassword = 'TestPassword123!';
  let authUser = null;

  try {
    const cred = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    authUser = cred.user;
    results.emailAuthLiveTest = {
      status: 'PASS',
      uid: authUser.uid,
      email: authUser.email
    };
  } catch (authErr) {
    results.emailAuthLiveTest = {
      status: 'FAIL',
      code: authErr.code,
      message: authErr.message
    };
  }

  // 2. Test Firestore Read / Write
  // Using an unauthenticated probe OR authenticated probe depending on auth result
  const testDocId = authUser ? authUser.uid : `probe_${Date.now()}`;
  const testRef = doc(db, 'system_health_checks', testDocId);

  // Write test (non-medical synthetic diagnostic heartbeat)
  try {
    await setDoc(testRef, {
      type: 'diagnostic_probe',
      client: 'HealthCopilot_Verification_Harness',
      status: 'active',
      testedAt: new Date().toISOString()
    });
    results.firestoreLiveWriteTest = { status: 'PASS', docId: testDocId };
  } catch (writeErr) {
    results.firestoreLiveWriteTest = {
      status: 'FAIL',
      code: writeErr.code,
      message: writeErr.message
    };
  }

  // Read test
  try {
    const snap = await getDoc(testRef);
    results.firestoreLiveReadTest = {
      status: 'PASS',
      exists: snap.exists(),
      data: snap.exists() ? snap.data() : null
    };
  } catch (readErr) {
    results.firestoreLiveReadTest = {
      status: 'FAIL',
      code: readErr.code,
      message: readErr.message
    };
  }

  // Clean up test document
  if (results.firestoreLiveWriteTest.status === 'PASS') {
    try {
      await deleteDoc(testRef);
      results.firestoreLiveDeleteTest = { status: 'PASS' };
    } catch (delErr) {
      results.firestoreLiveDeleteTest = {
        status: 'FAIL',
        code: delErr.code,
        message: delErr.message
      };
    }
  }

  // Clean up ephemeral test user if created
  if (authUser) {
    try {
      await deleteUser(authUser);
    } catch (cleanupAuthErr) {
      // Ignored in cleanup
    }
  }

} catch (globalErr) {
  console.error('Fatal probe error:', globalErr);
}

console.log(JSON.stringify(results, null, 2));
