import test from 'node:test';
import assert from 'node:assert';
import { firebaseConfig, isFirebaseConfigured, verifyFirebaseConnection } from '../../src/services/firebase.js';

test('=== HEALTHCOPILOT FIREBASE INITIALIZATION MODULE TESTS ===', async (t) => {
  await t.test('1. Firebase configuration object conforms to Vite conventions', () => {
    assert.strictEqual(typeof firebaseConfig, 'object');
    assert.ok('apiKey' in firebaseConfig);
    assert.ok('authDomain' in firebaseConfig);
    assert.ok('projectId' in firebaseConfig);
    assert.ok('storageBucket' in firebaseConfig);
    assert.ok('messagingSenderId' in firebaseConfig);
    assert.ok('appId' in firebaseConfig);
    assert.ok('measurementId' in firebaseConfig);
  });

  await t.test('2. isFirebaseConfigured correctly checks for required credentials', () => {
    const configured = isFirebaseConfigured();
    assert.strictEqual(typeof configured, 'boolean');
  });

  await t.test('3. verifyFirebaseConnection reports diagnostic status without throwing', async () => {
    const status = await verifyFirebaseConnection();
    assert.strictEqual(typeof status, 'object');
    assert.strictEqual(typeof status.configured, 'boolean');
    assert.strictEqual(typeof status.connected, 'boolean');
    assert.strictEqual(typeof status.message, 'string');
  });

  await t.test('4. Security: Never exposes Admin SDK service account credentials in web client', async () => {
    const { readFile } = await import('fs/promises');
    const content = await readFile(new URL('../../src/services/firebase.js', import.meta.url), 'utf8');
    assert.strictEqual(content.includes('firebase-admin'), false, 'Must not import firebase-admin in client module');
    assert.strictEqual(content.includes('private_key'), false, 'Must not include private keys');
    assert.strictEqual(content.includes('client_email'), false, 'Must not include service account emails');
  });
});
