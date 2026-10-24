import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  deleteUser 
} from 'firebase/auth';
import { AuthService } from '../services/authService.js';
import { runMigrations } from '../db/migrations.js';

runMigrations();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

test('=== HEALTHCOPILOT FIREBASE EMAIL/PASSWORD AUTHENTICATION WORKFLOW ===', async (t) => {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);

  const timestamp = Date.now();
  const testEmail = `patient_verify_${timestamp}@healthcopilot.test`;
  const testPassword = 'SecurePatientPassword123!';
  const testName = 'Dr. Jane Roe';
  let createdUser = null;

  await t.test('1. Rejects weak password on signup', async () => {
    let errCode = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await createUserWithEmailAndPassword(auth, testEmail, '123');
        assert.fail('Should have rejected password < 6 characters');
      } catch (err) {
        errCode = err.code;
        if (err.code === 'auth/weak-password') break;
        await new Promise(r => setTimeout(r, 1500));
      }
    }
    assert.strictEqual(errCode, 'auth/weak-password');
  });

  await t.test('2. Successfully creates user with email & password', async () => {
    const cred = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    assert.ok(cred.user, 'Firebase UserCredential should contain user');
    assert.ok(cred.user.uid, 'User should have a Firebase UID');
    assert.strictEqual(cred.user.email.toLowerCase(), testEmail.toLowerCase());
    createdUser = cred.user;
  });

  await t.test('3. Rejects duplicate user signup with identical email', async () => {
    try {
      await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      assert.fail('Should have rejected duplicate email');
    } catch (err) {
      assert.strictEqual(err.code, 'auth/email-already-in-use');
    }
  });

  await t.test('4. Backend session sync without exposing or saving raw passwords', async () => {
    const syncRes = await AuthService.syncFirebaseUser({
      uid: createdUser.uid,
      email: testEmail,
      name: testName
    });

    assert.ok(syncRes.user, 'Should return synced user object');
    assert.strictEqual(syncRes.user.email, testEmail.toLowerCase());
    assert.strictEqual(syncRes.user.name, testName);
    assert.ok(syncRes.token, 'Should return session JWT for downstream API calls');

    // Verify raw password is NEVER stored in database
    const userInDb = AuthService.getUserById(syncRes.user.id);
    assert.ok(userInDb, 'User record must exist in DB');
    assert.strictEqual(userInDb.password_hash === testPassword, false, 'Raw password must never be saved');
  });

  await t.test('5. Rejects login with incorrect password', async () => {
    try {
      await signInWithEmailAndPassword(auth, testEmail, 'WrongPassword456!');
      assert.fail('Should reject invalid credentials');
    } catch (err) {
      assert.ok(
        err.code === 'auth/invalid-credential' || 
        err.code === 'auth/wrong-password',
        `Expected invalid-credential error, got ${err.code}`
      );
    }
  });

  await t.test('6. Successfully signs in with correct email and password', async () => {
    const cred = await signInWithEmailAndPassword(auth, testEmail, testPassword);
    assert.ok(cred.user);
    assert.strictEqual(cred.user.uid, createdUser.uid);
  });

  await t.test('7. Signs out cleanly from Firebase session', async () => {
    await signOut(auth);
    assert.strictEqual(auth.currentUser, null, 'currentUser should be null after signOut');
  });

  // Cleanup ephemeral test user
  await t.test('8. Teardown: Safely deletes ephemeral test user from Firebase', async () => {
    if (createdUser) {
      try {
        // Re-authenticate to ensure fresh token for account deletion
        const cred = await signInWithEmailAndPassword(auth, testEmail, testPassword);
        await deleteUser(cred.user);
        assert.ok(true, 'Test user cleanly removed from Firebase project');
      } catch (delErr) {
        console.warn('Could not delete test user:', delErr.message);
      }
    }
  });
});
