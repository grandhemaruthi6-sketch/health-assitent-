import 'dotenv/config';
import { firebaseConfig, isFirebaseConfigured, verifyFirebaseConnection, app, auth, db } from '../../src/services/firebase.js';

console.log('=== FIREBASE LIVE INITIALIZATION & OPERATION CHECK ===');
console.log('1. Configuration Status:');
console.log(' - Project ID:', firebaseConfig.projectId || '(none)');
console.log(' - Auth Domain:', firebaseConfig.authDomain || '(none)');
console.log(' - Storage Bucket:', firebaseConfig.storageBucket || '(none)');
console.log(' - Measurement ID:', firebaseConfig.measurementId || '(none)');
console.log(' - Is Configured:', isFirebaseConfigured());
console.log(' - App Initialized:', Boolean(app));
console.log(' - Auth Initialized:', Boolean(auth));
console.log(' - Firestore Initialized:', Boolean(db));

console.log('\n2. Testing Real Firebase Live Operation...');
const result = await verifyFirebaseConnection();
console.log('Result:', JSON.stringify(result, null, 2));

if (result.connected) {
  console.log('\n SUCCESS: Cloud Firestore responded and is connected!');
  process.exit(0);
} else {
  console.log('\nℹ️ NOTICE: Cloud Firestore returned code:', result.code);
  console.log('Details:', result.message);
  process.exit(0);
}
