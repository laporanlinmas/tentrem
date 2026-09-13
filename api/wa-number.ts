import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       process.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
};
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db  = getFirestore(app);

const DEFAULT = {
  number: '6282313823791',
  name: 'Regu Piket Linmas Tugurejo',
  jadwal: '24 Jam Nonstop',
  pesanWaTemplate: 'Halo Petugas Piket Linmas Desa Tugurejo, saya warga ingin meminta bantuan / informasi.',
};

function cleanWANumber(raw: string): string {
  let num = raw.replace(/^wa:\s*/i, '').replace(/\D/g, '');
  if (!num) return '';
  if (num.startsWith('0'))   return '62' + num.slice(1);
  if (!num.startsWith('62')) return '62' + num;
  return num;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const snap = await getDoc(doc(db, 'settings', 'kontak_darurat'));
    if (snap.exists()) {
      const data = snap.data();
      const piket = data?.piket;
      if (piket && piket.aktif !== false) {
        const rawNum = (piket.noWa || piket.noHp || '').toString();
        const number = cleanWANumber(rawNum);
        if (number) {
          return res.status(200).json({
            number,
            name: (piket.namaPetugas || piket.judul || DEFAULT.name).trim(),
            jadwal: (piket.jamOperasional || DEFAULT.jadwal).trim(),
            pesanWaTemplate: piket.pesanWaTemplate || DEFAULT.pesanWaTemplate,
          });
        }
      }
    }

    return res.status(200).json(DEFAULT);
  } catch (err) {
    console.error('[wa-number]', err);
    return res.status(200).json(DEFAULT);
  }
}

