import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import crypto from 'crypto';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
};
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const AUTH_SECRET = process.env.JWT_SECRET;

// In-memory rate limiting against brute force attacks
const ipAttempts = new Map<string, { count: number; lockedUntil: number }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Client IP for brute force prevention
  const forwarded = (req.headers['x-forwarded-for'] as string) || '';
  const ip = forwarded.split(',')[0].trim() || (req.socket?.remoteAddress as string) || 'unknown';
  const now = Date.now();

  const attemptData = ipAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  if (attemptData.lockedUntil > now) {
    const remainingSec = Math.ceil((attemptData.lockedUntil - now) / 1000);
    return res.status(429).json({
      valid: false,
      error: `Terlalu banyak percobaan sandi yang salah. Silakan coba lagi dalam ${remainingSec} detik.`,
      locked: true,
      remainingSec,
    });
  }

  try {
    const { passcode } = req.body || {};
    const inputPasscode = String(passcode || '').trim();

    // Fetch current security settings from Firestore
    const secDocRef = doc(db, 'settings', 'ronda_security');
    const snap = await getDoc(secDocRef);

    let secData = {
      enabled: true,
      passcode: 'linmas123',
      hint: 'Tanyakan sandi pada Komandan Regu (Danru) atau Koordinator Ronda Tugurejo.',
    };

    if (snap.exists()) {
      const data = snap.data();
      secData = {
        enabled: data.enabled !== false,
        passcode: String(data.passcode || 'linmas123').trim(),
        hint: String(data.hint || '').trim(),
      };
    } else {
      // Seed default
      await setDoc(secDocRef, {
        enabled: true,
        passcode: 'linmas123',
        hint: 'Tanyakan sandi pada Komandan Regu (Danru) atau Koordinator Ronda Tugurejo.',
        updatedAt: new Date().toISOString(),
        updatedBy: 'Sistem',
      });
    }

    // If passcode protection is disabled in admin
    if (!secData.enabled) {
      return res.status(200).json({
        valid: true,
        enabled: false,
        token: 'bypass',
        message: 'Proteksi sandi sedang dinonaktifkan oleh administrator.',
      });
    }

    if (!inputPasscode) {
      return res.status(400).json({
        valid: false,
        error: 'Sandi otentikasi wajib diisi.',
        hint: secData.hint,
      });
    }

    // Verify passcode
    if (inputPasscode === secData.passcode) {
      // Reset attempt count on success
      ipAttempts.delete(ip);

      // Generate secure signed session token valid for 12 hours
      const timestamp = Date.now();
      const signature = crypto
        .createHmac('sha256', AUTH_SECRET)
        .update(`${secData.passcode}:${timestamp}`)
        .digest('hex');

      const token = `${timestamp}.${signature}`;

      return res.status(200).json({
        valid: true,
        enabled: true,
        token,
        message: 'Otentikasi sandi berhasil.',
      });
    } else {
      // Record failed attempt
      attemptData.count += 1;
      if (attemptData.count >= 5) {
        attemptData.lockedUntil = now + 60 * 1000; // Lock for 60 seconds
        ipAttempts.set(ip, attemptData);
        return res.status(429).json({
          valid: false,
          error: '5x salah memasukkan sandi. Akses dikunci sementara selama 60 detik.',
          locked: true,
          remainingSec: 60,
          hint: secData.hint,
        });
      } else {
        ipAttempts.set(ip, attemptData);
        const sisa = 5 - attemptData.count;
        return res.status(401).json({
          valid: false,
          error: `Sandi salah. Sisa kesempatan: ${sisa} kali.`,
          remainingAttempts: sisa,
          hint: secData.hint,
        });
      }
    }
  } catch (err: any) {
    console.error('[Verify PIN Error]:', err.message);
    return res.status(500).json({ valid: false, error: 'Terjadi kesalahan sistem saat verifikasi sandi.' });
  }
}
