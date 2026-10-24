import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * HealthCopilot AI — Firebase Initialization Module
 * Single reusable module for Cloud Firestore, Firebase Authentication, and optional Analytics.
 * Configuration is injected via Vite's standard environment variables (VITE_FIREBASE_*).
 * 
 * Note: Never expose Firebase Admin SDK service account credentials in this client-side module.
 */

const getEnvVar = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

// Read config from Vite environment variables (with fallback for test/node runners)
export const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID')
};

/**
 * Checks if the required Firebase Web App configuration is present in environment variables
 * @returns {boolean}
 */
export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

// Initialize single Firebase App instance
let appInstance = null;
let authInstance = null;
let dbInstance = null;
let analyticsInstance = null;

if (isFirebaseConfigured()) {
  try {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);

    // Conditionally initialize analytics in browser environments if supported and measurementId is provided
    if (firebaseConfig.measurementId && typeof window !== 'undefined') {
      import('firebase/analytics').then(({ getAnalytics, isSupported }) => {
        isSupported().then((supported) => {
          if (supported) {
            analyticsInstance = getAnalytics(appInstance);
          }
        }).catch(() => {});
      }).catch(() => {});
    }
  } catch (initErr) {
    console.error('[Firebase Initialization Error]', initErr);
  }
} else {
  // Graceful fallback when environment variables are not yet populated
  if (typeof window !== 'undefined' && (import.meta.env?.DEV || process.env?.NODE_ENV === 'development')) {
    console.warn(
      '[Firebase] Configuration incomplete. Please configure VITE_FIREBASE_* variables in your .env file to enable Firebase Authentication and Cloud Firestore.'
    );
  }
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const analytics = analyticsInstance;

/**
 * Diagnostic helper to verify whether Firebase is connected with a live operation
 * @returns {Promise<{ configured: boolean, connected: boolean, message: string, code?: string }>}
 */
export async function verifyFirebaseConnection() {
  if (!isFirebaseConfigured() || !dbInstance) {
    return {
      configured: false,
      connected: false,
      message: 'Firebase is not initialized: VITE_FIREBASE_* environment variables are missing or incomplete.'
    };
  }

  try {
    // Attempt real read operation from Firestore metadata or test collection
    const { collection, getDocs, limit, query } = await import('firebase/firestore');
    const q = query(collection(dbInstance, '_connectivity_check'), limit(1));
    await getDocs(q);
    return {
      configured: true,
      connected: true,
      message: 'Successfully verified live connection to Cloud Firestore.'
    };
  } catch (err) {
    return {
      configured: true,
      connected: false,
      code: err.code || 'unknown',
      message: `Firebase is configured, but operation returned: ${err.message}`
    };
  }
}

export default appInstance;
