import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || (typeof window !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_API_KEY),
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || (typeof window !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: process.env.FIREBASE_PROJECT_ID || (typeof window !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || (typeof window !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || (typeof window !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: process.env.FIREBASE_APP_ID || (typeof window !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_APP_ID),
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || (typeof window !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID),
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = (() => {
  try {
    return initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    return getFirestore(app);
  }
})();

