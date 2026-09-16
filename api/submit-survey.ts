import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

// ─── Firebase Init ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            process.env.FIREBASE_API_KEY            || process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.FIREBASE_AUTH_DOMAIN        || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       process.env.FIREBASE_DATABASE_URL       || process.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         process.env.FIREBASE_PROJECT_ID         || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.FIREBASE_STORAGE_BUCKET     || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.FIREBASE_APP_ID             || process.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db  = getFirestore(app);

// ─── Timestamp WIB ───────────────────────────────────────────────────────────
function timestampWIB(): string {
  const d = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  };
  const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(d);
  const get   = (type: string) => parts.find(p => p.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      nama,
      kemudahan, kegunaan, kecepatan, keakuratan, rekomendasi,
      saran,
    } = req.body;

    // Validasi wajib
    if (!nama || !String(nama).trim()) {
      return res.status(400).json({ error: 'Nama wajib diisi.' });
    }

    if (
      kemudahan   === undefined || kemudahan   === null ||
      kegunaan    === undefined || kegunaan    === null ||
      kecepatan   === undefined || kecepatan   === null ||
      keakuratan  === undefined || keakuratan  === null ||
      rekomendasi === undefined || rekomendasi === null
    ) {
      return res.status(400).json({ error: 'Semua rating wajib diisi.' });
    }

    const kemudahanNum   = Number(kemudahan);
    const kegunaanNum    = Number(kegunaan);
    const kecepatanNum   = Number(kecepatan);
    const keakuratanNum  = Number(keakuratan);
    const rekomendasiNum = Number(rekomendasi);

    const allRatings = [kemudahanNum, kegunaanNum, kecepatanNum, keakuratanNum, rekomendasiNum];
    if (allRatings.some(r => isNaN(r) || r < 1 || r > 5)) {
      return res.status(400).json({ error: 'Rating harus berupa angka antara 1 dan 5.' });
    }

    const rataRata = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
    const ts       = timestampWIB();
    const trimNama = String(nama).trim();
    const trimSaran = (saran || '').trim();

    // Simpan ke Firestore
    const colRef  = collection(db, 'survey_kepuasan');
    await addDoc(colRef, {
      nama:        trimNama,
      kemudahan:   kemudahanNum,
      kegunaan:    kegunaanNum,
      kecepatan:   kecepatanNum,
      keakuratan:  keakuratanNum,
      rekomendasi: rekomendasiNum,
      rataRata:    Math.round(rataRata * 100) / 100,
      saran:       trimSaran,
      timestamp:   ts,
      createdAt:   new Date().toISOString(),
    });

    // ── Kirim FCM Push Notification ke Admin ──────────────────────────────
    try {
      const admin = await import('firebase-admin');
      if (!admin.apps.length) {
        const rawSa = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (rawSa) {
          const sa = typeof rawSa === 'string' ? JSON.parse(rawSa) : rawSa;
          admin.initializeApp({ credential: admin.credential.cert(sa) });
        }
      }
      if (admin.apps.length) {
        const tokensSnap  = await getDocs(collection(db, 'fcmTokens'));
        const adminTokens = tokensSnap.docs
          .map((d) => d.data())
          .filter((t: any) => t.role === 'admin' && t.token)
          .map((t: any) => t.token as string);

        if (adminTokens.length > 0) {
          const notifTitle = '⭐ Survei Kepuasan Baru Masuk!';
          const notifBody  = `${trimNama} · Rata-rata ${Math.round(rataRata * 10) / 10}/5${trimSaran ? ` · "${trimSaran.slice(0, 60)}"` : ''}`;

          await admin.messaging().sendEachForMulticast({
            tokens: adminTokens,
            data: { title: notifTitle, body: notifBody, url: '/survei' },
            notification: { title: notifTitle, body: notifBody },
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
                priority: 'max',
                channelId: 'tentrem_aduan',
                defaultSound: true,
              },
            },
            webpush: {
              headers: { Urgency: 'high', TTL: '86400' },
              notification: {
                title: notifTitle,
                body: notifBody,
                icon: '/assets/icon-192.png',
                badge: '/assets/icon-192.png',
                tag: `survey-${Date.now()}`,
                renotify: true,
                requireInteraction: false,
                data: { url: '/survei' },
              } as any,
              fcmOptions: { link: '/survei' },
            },
          });
          console.info(`[submit-survey] FCM push sent to ${adminTokens.length} admin(s).`);
        }
      }
    } catch (fcmErr) {
      console.warn('[submit-survey] FCM send error (non-fatal):', fcmErr);
    }

    return res.status(200).json({ success: true });

  } catch (err: any) {
    console.error('[submit-survey] Error:', err);
    return res.status(500).json({ error: 'Gagal mengirim survei: ' + err.message });
  }
}
