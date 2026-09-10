/**
 * src/lib/fcm.ts — Firebase Cloud Messaging Helper (Website Warga)
 * Digunakan untuk mengirim notifikasi push ke Admin saat warga mengirim aduan
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, getDocs, collection } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            (import.meta as any).env?.VITE_FIREBASE_API_KEY || 'AIzaSyC4dtS_MPlvlNjiCxNJ37R0X95uIznqsnc',
  authDomain:        (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || 'tentrem.firebaseapp.com',
  projectId:         (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || 'tentrem',
  storageBucket:     (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || 'tentrem.firebasestorage.app',
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '536621352207',
  appId:             (import.meta as any).env?.VITE_FIREBASE_APP_ID || '1:536621352207:web:e8d15de81269e536b4aa7a',
  measurementId:     (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || 'G-SZTE1PZ91P',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

/**
 * Kirim push notification ke admin
 */
export const sendPushToRole = async (
  role: string | string[],
  payload: { title: string; body: string; url?: string; ticket?: string }
): Promise<void> => {
  try {
    const roles = Array.isArray(role) ? role : [role];

    // Ambil token perangkat admin dari koleksi Firestore fcmTokens
    const snap = await getDocs(collection(db, 'fcmTokens'));
    const tokens: string[] = snap.docs
      .map((d) => d.data())
      .filter((t: any) => roles.includes(t.role) && t.token)
      .map((t: any) => t.token as string);

    if (tokens.length === 0) {
      console.info(`[FCM] Belum ada device admin terdaftar untuk menerima push.`);
      return;
    }

    // Panggil serverless function /api/fcm-send
    const res = await fetch('/api/fcm-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokens, payload }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('[FCM] Gagal mengirim push FCM:', err);
    } else {
      console.info(`[FCM] Push notifikasi berhasil dikirim ke ${tokens.length} device admin.`);
    }
  } catch (err) {
    console.error('[FCM] Error sendPushToRole:', err);
  }
};
